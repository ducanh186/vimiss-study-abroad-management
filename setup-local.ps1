[CmdletBinding()]
param(
    [switch]$FreshDatabase,
    [switch]$Seed,
    [switch]$SkipToolInstall,
    [switch]$Start
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectRoot

function Write-Step {
    param([string]$Message)
    Write-Host ''
    Write-Host "==> $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Tool {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $FilePath $($Arguments -join ' ')"
    }
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $knownPaths = @(
        "$env:ProgramFiles\Git\cmd",
        "$env:ProgramFiles\nodejs",
        "$env:ProgramFiles\PHP",
        "$env:ProgramData\ComposerSetup\bin",
        "$env:APPDATA\Composer\vendor\bin",
        "$env:LOCALAPPDATA\Microsoft\WindowsApps"
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

    $env:Path = (@($machinePath, $userPath) + $knownPaths) -join ';'
}

function Ensure-Winget {
    Refresh-Path
    if (Test-Command 'winget') {
        Write-Info 'winget is already installed.'
        return
    }

    Write-Info 'Installing winget.'

    $installerPath = Join-Path $env:TEMP 'Microsoft.DesktopAppInstaller.msixbundle'
    $previousProgressPreference = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'

    try {
        Invoke-WebRequest -Uri 'https://aka.ms/getwinget' -OutFile $installerPath -UseBasicParsing
    } finally {
        $ProgressPreference = $previousProgressPreference
    }

    try {
        Add-AppxPackage -Path $installerPath -ErrorAction Stop
    } catch {
        throw "Could not install winget automatically. Install App Installer from Microsoft Store or run this script as an administrator. Error: $($_.Exception.Message)"
    }

    Refresh-Path
    if (-not (Test-Command 'winget')) {
        throw 'winget was installed, but it is not available in PATH. Open a new PowerShell window and run this script again.'
    }
}

function Install-WingetPackage {
    param(
        [string]$Command,
        [string]$PackageId,
        [string]$DisplayName
    )

    Refresh-Path
    if (Test-Command $Command) {
        Write-Info "$DisplayName is already installed."
        return
    }

    if (-not (Test-Command 'winget')) {
        Ensure-Winget
    }

    Write-Info "Installing $DisplayName with winget."
    Invoke-Tool winget install --id $PackageId --exact --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path

    if (-not (Test-Command $Command)) {
        throw "$DisplayName was installed, but '$Command' is not available in PATH. Open a new PowerShell window and run this script again."
    }
}

function Get-PhpIniPath {
    $iniOutput = & php --ini 2>&1
    $loadedLine = $iniOutput | Where-Object { $_ -match '^Loaded Configuration File:\s*(.+)$' } | Select-Object -First 1

    if ($loadedLine -and $loadedLine -match '^Loaded Configuration File:\s*(.+)$') {
        $loadedPath = $Matches[1].Trim()
        if ($loadedPath -and $loadedPath -ne '(none)' -and (Test-Path -LiteralPath $loadedPath)) {
            return $loadedPath
        }
    }

    $phpPath = (Get-Command php).Source
    $phpDir = Split-Path -Parent $phpPath
    $targetIni = Join-Path $phpDir 'php.ini'

    if (Test-Path -LiteralPath $targetIni) {
        return $targetIni
    }

    $sourceIni = Join-Path $phpDir 'php.ini-development'
    if (-not (Test-Path -LiteralPath $sourceIni)) {
        $sourceIni = Join-Path $phpDir 'php.ini-production'
    }

    if (-not (Test-Path -LiteralPath $sourceIni)) {
        throw "Could not find php.ini or a php.ini template near $phpPath."
    }

    Copy-Item -LiteralPath $sourceIni -Destination $targetIni
    return $targetIni
}

function Get-PhpModules {
    return @(& php -m 2>$null | ForEach-Object { $_.Trim().ToLowerInvariant() })
}

function Enable-PhpExtension {
    param(
        [string]$PhpIniPath,
        [string]$Extension
    )

    $content = Get-Content -LiteralPath $PhpIniPath -Raw
    $escapedExtension = [regex]::Escape($Extension)
    $patterns = @(
        "(?m)^\s*;\s*extension\s*=\s*$escapedExtension\s*$",
        "(?m)^\s*;\s*extension\s*=\s*php_$escapedExtension\.dll\s*$",
        "(?m)^\s*extension\s*=\s*php_$escapedExtension\.dll\s*$"
    )

    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $content = [regex]::Replace($content, $pattern, "extension=$Extension", 1)
            Set-Content -LiteralPath $PhpIniPath -Value $content -Encoding ASCII
            return
        }
    }

    if ($content -notmatch "(?m)^\s*extension\s*=\s*$escapedExtension\s*$") {
        Add-Content -LiteralPath $PhpIniPath -Value "`nextension=$Extension" -Encoding ASCII
    }
}

function Ensure-PhpExtensions {
    $requiredExtensions = @(
        'bcmath',
        'curl',
        'fileinfo',
        'mbstring',
        'openssl',
        'pdo_sqlite',
        'sqlite3'
    )

    $modules = Get-PhpModules
    $missing = $requiredExtensions | Where-Object { $modules -notcontains $_ }

    if ($missing.Count -eq 0) {
        Write-Info 'Required PHP extensions are enabled.'
        return
    }

    $phpIniPath = Get-PhpIniPath
    Write-Info "Updating PHP configuration: $phpIniPath"

    foreach ($extension in $missing) {
        Enable-PhpExtension -PhpIniPath $phpIniPath -Extension $extension
    }

    $modules = Get-PhpModules
    $stillMissing = $requiredExtensions | Where-Object { $modules -notcontains $_ }

    if ($stillMissing.Count -gt 0) {
        throw "Missing PHP extensions after php.ini update: $($stillMissing -join ', '). Check $phpIniPath."
    }

    Write-Info 'Required PHP extensions are enabled.'
}

function Set-DotEnvValue {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    $line = "$Key=$Value"
    $content = Get-Content -LiteralPath $Path -Raw
    $pattern = "(?m)^$([regex]::Escape($Key))=.*$"

    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $line, 1)
    } else {
        $content = $content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine
    }

    Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
}

function Ensure-EnvironmentFile {
    $envPath = Join-Path $ProjectRoot '.env'
    $envExamplePath = Join-Path $ProjectRoot '.env.example'

    if (-not (Test-Path -LiteralPath $envPath)) {
        if (-not (Test-Path -LiteralPath $envExamplePath)) {
            throw '.env.example is missing.'
        }

        Copy-Item -LiteralPath $envExamplePath -Destination $envPath
        Write-Info 'Created .env from .env.example.'
    }

    $databasePath = (Join-Path $ProjectRoot 'database\database.sqlite').Replace('\', '/')

    Set-DotEnvValue -Path $envPath -Key 'APP_ENV' -Value 'local'
    Set-DotEnvValue -Path $envPath -Key 'APP_DEBUG' -Value 'true'
    Set-DotEnvValue -Path $envPath -Key 'APP_URL' -Value 'http://localhost:8000'
    Set-DotEnvValue -Path $envPath -Key 'DB_CONNECTION' -Value 'sqlite'
    Set-DotEnvValue -Path $envPath -Key 'DB_DATABASE' -Value $databasePath
    Set-DotEnvValue -Path $envPath -Key 'SESSION_DRIVER' -Value 'file'
    Set-DotEnvValue -Path $envPath -Key 'SESSION_DOMAIN' -Value 'localhost'
    Set-DotEnvValue -Path $envPath -Key 'SESSION_SECURE_COOKIE' -Value 'false'
    Set-DotEnvValue -Path $envPath -Key 'SESSION_SAME_SITE' -Value 'lax'
    Set-DotEnvValue -Path $envPath -Key 'SANCTUM_STATEFUL_DOMAINS' -Value 'localhost:8000,localhost:5173,127.0.0.1:8000,127.0.0.1:5173'
    Set-DotEnvValue -Path $envPath -Key 'FRONTEND_URL' -Value 'http://localhost:5173'
    Set-DotEnvValue -Path $envPath -Key 'MAIL_MAILER' -Value 'log'

    return $databasePath
}

function Ensure-ApplicationKey {
    $envPath = Join-Path $ProjectRoot '.env'
    $content = Get-Content -LiteralPath $envPath -Raw

    if ($content -match '(?m)^APP_KEY=.+$') {
        Write-Info 'APP_KEY is already set.'
        return
    }

    Invoke-Tool php artisan key:generate --ansi
}

function Ensure-LocalDirectories {
    $paths = @(
        'bootstrap\cache',
        'storage\app',
        'storage\framework\cache\data',
        'storage\framework\sessions',
        'storage\framework\views',
        'storage\logs',
        'database'
    )

    foreach ($relativePath in $paths) {
        $fullPath = Join-Path $ProjectRoot $relativePath
        if (-not (Test-Path -LiteralPath $fullPath)) {
            New-Item -ItemType Directory -Path $fullPath | Out-Null
        }
    }
}

function Start-LocalServers {
    $escapedRoot = $ProjectRoot.Replace("'", "''")
    $apiCommand = "Set-Location -LiteralPath '$escapedRoot'; php artisan serve --host=127.0.0.1 --port=8000"
    $viteCommand = "Set-Location -LiteralPath '$escapedRoot'; npm run dev -- --host 127.0.0.1"

    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $apiCommand)
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $viteCommand)

    Write-Info 'Started API server at http://localhost:8000'
    Write-Info 'Started Vite server at http://localhost:5173'
}

Write-Step 'Checking tools'
if (-not $SkipToolInstall) {
    Ensure-Winget
    Install-WingetPackage -Command 'git' -PackageId 'Git.Git' -DisplayName 'Git'
    Install-WingetPackage -Command 'php' -PackageId 'PHP.PHP' -DisplayName 'PHP'
    Install-WingetPackage -Command 'composer' -PackageId 'Composer.Composer' -DisplayName 'Composer'
    Install-WingetPackage -Command 'node' -PackageId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'
} else {
    foreach ($command in @('git', 'php', 'composer', 'node', 'npm')) {
        if (-not (Test-Command $command)) {
            throw "Missing command: $command"
        }
    }
}

Refresh-Path

Write-Step 'Checking PHP extensions'
Ensure-PhpExtensions

Write-Step 'Preparing environment'
Ensure-LocalDirectories
$databasePath = Ensure-EnvironmentFile
$databaseWasEmpty = (-not (Test-Path -LiteralPath $databasePath)) -or ((Get-Item -LiteralPath $databasePath -ErrorAction SilentlyContinue).Length -eq 0)

if (-not (Test-Path -LiteralPath $databasePath)) {
    New-Item -ItemType File -Path $databasePath | Out-Null
}

Write-Step 'Installing PHP dependencies'
Invoke-Tool composer install

Write-Step 'Installing Node dependencies'
if (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package-lock.json')) {
    Invoke-Tool npm ci
} else {
    Invoke-Tool npm install
}

Write-Step 'Configuring Laravel'
Ensure-ApplicationKey
Invoke-Tool php artisan config:clear --ansi

if ($FreshDatabase) {
    Invoke-Tool php artisan migrate:fresh --seed --force
} else {
    Invoke-Tool php artisan migrate --force
    if ($Seed -or $databaseWasEmpty) {
        Invoke-Tool php artisan db:seed --force
    }
}

Write-Step 'Building frontend assets'
Invoke-Tool npm run build

Write-Step 'Setup complete'
Write-Info 'Use this command to start the app later: composer run dev'
Write-Info 'API URL: http://localhost:8000'
Write-Info 'Vite URL: http://localhost:5173'

if ($Start) {
    Write-Step 'Starting local servers'
    Start-LocalServers
}
