#!/usr/bin/env bash
# ==========================================================
# deploy-ec2.sh — Deploy Vimiss to EC2
# Usage:  bash deploy-ec2.sh
# ==========================================================
set -euo pipefail

EC2_IP="13.192.232.20"
EC2_USER="ubuntu"
PEM_KEY="vim.pem"
REMOTE_DIR="/home/ubuntu/vimiss"

echo "=== Vimiss EC2 Deployment ==="
echo "Target: ${EC2_USER}@${EC2_IP}"

SSH_OPTS="-i ${PEM_KEY} -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# ── 1. Ensure remote directory exists ───────────────────────
echo "[1/5] Preparing remote directory..."
ssh ${SSH_OPTS} ${EC2_USER}@${EC2_IP} "mkdir -p ${REMOTE_DIR}/docker-data/{sqlite,storage,logs,drive}"

# ── 2. Sync project files to EC2 ───────────────────────────
echo "[2/5] Syncing files to EC2 (rsync)..."
rsync -avz --progress \
  -e "ssh ${SSH_OPTS}" \
  --exclude 'node_modules' \
  --exclude 'vendor' \
  --exclude '.git' \
  --exclude 'docker-data' \
  --exclude 'be-neu' \
  --exclude 'vim.pem' \
  --exclude '.env' \
  --exclude 'storage/logs/*' \
  --exclude 'storage/framework/sessions/*' \
  --exclude 'storage/framework/views/*' \
  ./ ${EC2_USER}@${EC2_IP}:${REMOTE_DIR}/

# ── 3. Copy production env file (ensure LF line endings) ───
echo "[3/5] Copying production env..."
# Convert CRLF to LF in case the file was edited on Windows
sed 's/\r$//' .env.production > /tmp/.env.production.lf
scp ${SSH_OPTS} /tmp/.env.production.lf ${EC2_USER}@${EC2_IP}:${REMOTE_DIR}/.env.production
rm -f /tmp/.env.production.lf

# ── 4. Install Docker on EC2 if needed + build & run ───────
echo "[4/5] Setting up Docker and starting containers..."
ssh ${SSH_OPTS} ${EC2_USER}@${EC2_IP} << 'REMOTE_SCRIPT'
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
  echo "Docker installed. You may need to re-login for group changes."
fi

cd /home/ubuntu/vimiss

# Ensure drive SA placeholder exists
mkdir -p docker-data/drive
if [ ! -f docker-data/drive/drive-sa.json ]; then
  echo '{}' > docker-data/drive/drive-sa.json
fi

# Stop existing containers
sudo docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build WITHOUT cache and start with production compose
sudo docker compose -f docker-compose.prod.yml build --no-cache
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate

echo ""
echo "Waiting for containers to start..."
sleep 5
sudo docker compose -f docker-compose.prod.yml ps
REMOTE_SCRIPT

# ── 5. Verify deployment ───────────────────────────────────
echo "[5/5] Verifying deployment..."
echo ""
sleep 10

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://${EC2_IP}" 2>/dev/null || echo "000")
if [ "${HTTP_CODE}" = "200" ] || [ "${HTTP_CODE}" = "302" ]; then
  echo "=== Deployment successful! ==="
  echo "URL: http://${EC2_IP}"
else
  echo "Warning: Got HTTP ${HTTP_CODE}. Containers may still be starting."
  echo "Check with: ssh -i ${PEM_KEY} ${EC2_USER}@${EC2_IP} 'cd ${REMOTE_DIR} && sudo docker compose -f docker-compose.prod.yml logs'"
  echo "URL: http://${EC2_IP}"
fi
