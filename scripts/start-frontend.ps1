param(
    [string]$BackendUrl = "http://localhost:8001"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RepoRoot "frontend"

Write-Host "CONTROL TOWER mobile frontend" -ForegroundColor Cyan
Write-Host "Frontend dir: $FrontendDir"
Write-Host "Backend URL:  $BackendUrl"

Set-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps --ignore-scripts
}

Set-Content -Path ".env" -Value "EXPO_PUBLIC_BACKEND_URL=$BackendUrl"

Write-Host "Starting Expo..." -ForegroundColor Green
npx expo start --clear
