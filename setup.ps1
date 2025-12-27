# =====================================================
# KatzAI Setup Script for Windows
# =====================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  KatzAI - Retail AI Assistant Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js 20+" -ForegroundColor Red
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version 2>&1
    Write-Host "[OK] pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "[WARN] pnpm is not installed. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Check Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

Write-Host ""
Write-Host "Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "[CREATED] .env file - Please update with your API keys!" -ForegroundColor Yellow
} else {
    Write-Host "[EXISTS] .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting database containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
Push-Location apps/api
npx prisma migrate dev --name init
Pop-Location

Write-Host ""
Write-Host "Seeding demo data..." -ForegroundColor Yellow
Push-Location apps/api
npx prisma db seed
Pop-Location

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Cyan
Write-Host "  Manager: manager@demo-store.com / Demo123!" -ForegroundColor White
Write-Host "  Employee: employee@demo-store.com / Demo123!" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env with your ANTHROPIC_API_KEY and OPENAI_API_KEY" -ForegroundColor White
Write-Host "  2. Start the API:         pnpm dev:api" -ForegroundColor White
Write-Host "  3. Start the Admin:       pnpm dev:admin" -ForegroundColor White
Write-Host "  4. Start the Mobile App:  pnpm dev:mobile" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  API:    http://localhost:3001" -ForegroundColor White
Write-Host "  Admin:  http://localhost:3000" -ForegroundColor White
Write-Host "  Mobile: Use Expo Go app on your device" -ForegroundColor White
Write-Host ""
