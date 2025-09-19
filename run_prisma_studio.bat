@echo off
:: This is a Windows batch script to launch Prisma Studio.

echo "Starting Prisma Studio..."

:: Execute the npx prisma studio command
npx prisma studio

echo "Prisma Studio closed."
:: The pause command keeps the window open after the script finishes
:: so you can see any output.
pause
