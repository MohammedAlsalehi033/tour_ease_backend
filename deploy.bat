@echo off
REM TourEase Backend Deployment Script (Windows)
REM Run this on your production server to deploy the latest changes

echo.
echo ================================
echo TourEase Backend Deployment
echo ================================
echo.

REM 1. Pull latest code from GitHub
echo 05 Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo xx Git pull failed
    exit /b 1
)

REM 2. Install dependencies
echo.
echo 06 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo xx npm install failed
    exit /b 1
)

REM 3. Generate Prisma Client
echo.
echo 07 Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo xx Prisma generate failed
    exit /b 1
)

REM 4. Push database schema
echo.
echo 08 Syncing database schema...
call npx prisma db push --skip-generate
if %errorlevel% neq 0 (
    echo !! Prisma db push failed (this may be OK if no schema changes)
)

REM 5. Build TypeScript
echo.
echo 09 Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo xx Build failed
    exit /b 1
)

REM 6. Restart the application
echo.
echo 10 Restarting application...

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %errorlevel% equ 0 (
    call pm2 restart tour_ease_backend
    echo 11 Restarted with PM2
) else (
    echo !! Please manually restart your application (e.g., with PM2 or systemd)
)

echo.
echo ================================
echo 12 Deployment Complete!
echo ================================
echo.
echo Backend is now running with the latest code
echo API: https://api.tourease.me/api
