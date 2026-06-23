$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$venvActivate = Join-Path $backendPath ".venv\Scripts\Activate.ps1"

Write-Host "Starting CONTROL TOWER Mobile backend..." -ForegroundColor Cyan
Set-Location $backendPath

if (!(Test-Path $venvActivate)) {
    Write-Host "Python virtual environment not found. Creating .venv..." -ForegroundColor Yellow
    python -m venv .venv
}

. $venvActivate

if (!(Test-Path "requirements.local.txt")) {
    Write-Host "Creating requirements.local.txt without Emergent private dependency..." -ForegroundColor Yellow
    Get-Content requirements.txt | Where-Object { $_ -notmatch "emergentintegrations" } | Set-Content requirements.local.txt
}

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
pip install -r requirements.local.txt

$env:MONGO_URL = if ($env:MONGO_URL) { $env:MONGO_URL } else { "mongodb://localhost:27017" }
$env:DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "control_tower_mobile" }
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev-secret-change-later" }
$env:JWT_REFRESH_SECRET = if ($env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET } else { "dev-refresh-secret-change-later" }

Write-Host "Backend env:" -ForegroundColor Cyan
Write-Host "  MONGO_URL=$env:MONGO_URL"
Write-Host "  DB_NAME=$env:DB_NAME"
Write-Host "  JWT_SECRET=(set)"
Write-Host "  JWT_REFRESH_SECRET=(set)"
Write-Host ""
Write-Host "MongoDB must be running as a Windows service before startup completes." -ForegroundColor Yellow
Write-Host "Starting Uvicorn at http://localhost:8001 ..." -ForegroundColor Cyan

uvicorn server:app --host 0.0.0.0 --port 8001
