# KatzAI Local Development Startup Script
# Run this from the project root: .\start-dev.ps1

Write-Host "🚀 Starting KatzAI Development Environment" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes
Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Check if we're in the right directory
if (-not (Test-Path ".\apps\api\src\index.ts")) {
    Write-Host "❌ Error: Please run this script from the KatzAI root directory" -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".\apps\api\.env")) {
    Write-Host "❌ Error: apps/api/.env not found. Copy from .env.example" -ForegroundColor Red
    exit 1
}

# Start API server in background
Write-Host "Starting API server (port 3001)..." -ForegroundColor Green
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location ".\apps\api"
    npx tsx src/index.ts
}

# Wait for API to be ready
Write-Host "Waiting for API to start..." -ForegroundColor Yellow
$attempts = 0
$maxAttempts = 30
while ($attempts -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ API server ready!" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 1
        $attempts++
    }
}

if ($attempts -eq $maxAttempts) {
    Write-Host "❌ API server failed to start. Check the logs:" -ForegroundColor Red
    Receive-Job $apiJob
    exit 1
}

# Start Frontend
Write-Host "Starting Frontend (port 3000)..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location ".\apps\admin"
    npx next dev
}

# Wait for frontend
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KatzAI is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  API:      http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  Login credentials:" -ForegroundColor Yellow
Write-Host "  Employee: employee@demo-store.com / Demo123!" -ForegroundColor Gray
Write-Host "  Manager:  manager@demo-store.com / Demo123!" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Process "http://localhost:3000"

# Keep script running and show logs
try {
    while ($true) {
        # Check if jobs are still running
        if ($apiJob.State -eq 'Failed') {
            Write-Host "API server crashed:" -ForegroundColor Red
            Receive-Job $apiJob
        }
        if ($frontendJob.State -eq 'Failed') {
            Write-Host "Frontend crashed:" -ForegroundColor Red
            Receive-Job $frontendJob
        }
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host "`nShutting down..." -ForegroundColor Yellow
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Goodbye!" -ForegroundColor Cyan
}
