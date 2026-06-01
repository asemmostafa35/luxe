# ============================================================
# Luxe Fashion - Windows Setup Script (PowerShell)
# شغّل هذا الملف بـ: Right Click > Run with PowerShell
# أو من PowerShell: .\setup-windows.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Luxe Fashion - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Check Node.js ────────────────────────────────────────────────────
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org (choose LTS version)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ─── Step 2: Install Backend ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/6] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm install --silent
Write-Host "  ✓ Backend packages installed" -ForegroundColor Green

# ─── Step 3: Generate Prisma Client ───────────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "  ✓ Prisma client generated" -ForegroundColor Green

# ─── Step 4: Install Frontend ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm install --silent
Write-Host "  ✓ Frontend packages installed" -ForegroundColor Green

# ─── Step 5: Check PostgreSQL ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Checking PostgreSQL..." -ForegroundColor Yellow
$pgPaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin"
)
$pgFound = $false
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        Write-Host "  ✓ PostgreSQL found at: $path" -ForegroundColor Green
        $pgFound = $true
        $env:PATH = "$path;$env:PATH"
        break
    }
}
if (-not $pgFound) {
    Write-Host "  ⚠ PostgreSQL not found in common paths" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "  After installing, run this script again" -ForegroundColor Yellow
}

# ─── Step 6: Run Migrations ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Setting up database..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"

Write-Host ""
Write-Host "  ⚠ Make sure you have:" -ForegroundColor Yellow
Write-Host "    1. PostgreSQL installed and running" -ForegroundColor White
Write-Host "    2. Edited backend\.env and set YOUR_PASSWORD to your PostgreSQL password" -ForegroundColor White
Write-Host ""

$answer = Read-Host "  Have you set the DATABASE_URL in backend\.env? (y/n)"
if ($answer -eq "y" -or $answer -eq "Y") {
    Write-Host "  Running database migrations..." -ForegroundColor Yellow
    npx prisma db push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Database tables created" -ForegroundColor Green
        Write-Host "  Running seed data..." -ForegroundColor Yellow
        npx ts-node prisma/seed.ts
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Demo data inserted" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ Migration failed - check your DATABASE_URL in backend\.env" -ForegroundColor Red
    }
} else {
    Write-Host "  Skipping database setup - run manually later:" -ForegroundColor Yellow
    Write-Host "    cd backend" -ForegroundColor White
    Write-Host "    npx prisma db push" -ForegroundColor White
    Write-Host "    npx ts-node prisma/seed.ts" -ForegroundColor White
}

# ─── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the project:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "    cd backend" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "    cd frontend" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin panel: http://localhost:3000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin login:" -ForegroundColor Yellow
Write-Host "    Email:    admin@luxefashion.com" -ForegroundColor White
Write-Host "    Password: Admin@123" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to close"
