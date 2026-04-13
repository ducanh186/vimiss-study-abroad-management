# ==========================================================
# deploy-ec2.ps1 — Deploy Vimiss to EC2 (Windows PowerShell)
# Usage:  .\deploy-ec2.ps1
# ==========================================================

$ErrorActionPreference = "Stop"

$EC2_IP   = "13.192.232.20"
$EC2_USER = "ubuntu"
$PEM_KEY  = "vim.pem"
$REMOTE_DIR = "/home/ubuntu/vimiss"
$SSH_OPTS = @("-i", $PEM_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10")

Write-Host "=== Vimiss EC2 Deployment ===" -ForegroundColor Cyan
Write-Host "Target: ${EC2_USER}@${EC2_IP}"

# ── 1. Prepare remote directory ────────────────────────────
Write-Host "`n[1/5] Preparing remote directory..." -ForegroundColor Yellow
ssh @SSH_OPTS "${EC2_USER}@${EC2_IP}" "mkdir -p ${REMOTE_DIR}/docker-data/{sqlite,storage,logs,drive}"

# ── 2. Sync files via SCP (tar + scp approach for Windows) ─
Write-Host "`n[2/5] Preparing and uploading project files..." -ForegroundColor Yellow

# Create exclude list for tar
$EXCLUDES = @(
    "--exclude=node_modules",
    "--exclude=vendor",
    "--exclude=.git",
    "--exclude=docker-data",
    "--exclude=be-neu",
    "--exclude=vim.pem",
    "--exclude=.env",
    "--exclude=storage/logs/*",
    "--exclude=storage/framework/sessions/*",
    "--exclude=storage/framework/views/*"
)

# Use tar via ssh to transfer (works with Windows OpenSSH + Git Bash tar)
$tarExe = "tar"
if (Get-Command "C:\Program Files\Git\usr\bin\tar.exe" -ErrorAction SilentlyContinue) {
    $tarExe = "C:\Program Files\Git\usr\bin\tar.exe"
}

Write-Host "    Creating archive..."
& $tarExe czf vimiss-deploy.tar.gz @EXCLUDES -C . .

Write-Host "    Uploading to EC2..."
scp @SSH_OPTS "vimiss-deploy.tar.gz" "${EC2_USER}@${EC2_IP}:/tmp/vimiss-deploy.tar.gz"

Write-Host "    Extracting on EC2..."
ssh @SSH_OPTS "${EC2_USER}@${EC2_IP}" "mkdir -p ${REMOTE_DIR} && tar xzf /tmp/vimiss-deploy.tar.gz -C ${REMOTE_DIR} && rm /tmp/vimiss-deploy.tar.gz"

# Clean up local archive
Remove-Item -Force "vimiss-deploy.tar.gz" -ErrorAction SilentlyContinue

# ── 3. Copy production env (convert CRLF → LF for Linux) ───
Write-Host "`n[3/5] Copying production env..." -ForegroundColor Yellow
$envContent = Get-Content ".env.production" -Raw
$envContent = $envContent -replace "`r`n", "`n"
[System.IO.File]::WriteAllText("$PWD/.env.production.lf", $envContent, [System.Text.UTF8Encoding]::new($false))
scp @SSH_OPTS ".env.production.lf" "${EC2_USER}@${EC2_IP}:${REMOTE_DIR}/.env.production"
Remove-Item -Force ".env.production.lf" -ErrorAction SilentlyContinue

# ── 4. Install Docker & start containers ────────────────────
Write-Host "`n[4/5] Setting up Docker and starting containers..." -ForegroundColor Yellow

$remoteScript = @'
set -e

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker $USER
  echo "Docker installed."
fi

cd /home/ubuntu/vimiss

# Ensure drive SA placeholder
mkdir -p docker-data/drive
if [ ! -f docker-data/drive/drive-sa.json ]; then
  echo '{}' > docker-data/drive/drive-sa.json
fi

# Stop existing
sudo docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build WITHOUT cache and start with production overrides
sudo docker compose -f docker-compose.prod.yml build --no-cache
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate

echo ""
echo "Waiting for containers..."
sleep 5
sudo docker compose -f docker-compose.prod.yml ps
'@

# Convert CRLF → LF so bash on EC2 doesn't choke on \r
$remoteScript = $remoteScript -replace "`r`n", "`n"
ssh @SSH_OPTS "${EC2_USER}@${EC2_IP}" $remoteScript

# ── 5. Verify ──────────────────────────────────────────────
Write-Host "`n[5/5] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://${EC2_IP}" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "`n=== Deployment successful! ===" -ForegroundColor Green
    Write-Host "HTTP Status: $($response.StatusCode)"
} catch {
    Write-Host "`nWarning: Site may still be starting up." -ForegroundColor DarkYellow
    Write-Host "Check logs: ssh -i ${PEM_KEY} ${EC2_USER}@${EC2_IP} 'cd ${REMOTE_DIR} && sudo docker compose -f docker-compose.prod.yml logs'"
}

Write-Host "`nURL: http://${EC2_IP}" -ForegroundColor Cyan
