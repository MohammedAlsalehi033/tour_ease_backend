#!/bin/bash

# TourEase Backend Deployment Script
# Run this on your production server to deploy the latest changes

echo "================================"
echo "TourEase Backend Deployment"
echo "================================"

# 1. Pull latest code from GitHub
echo ""
echo "📥 Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

# 2. Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

# 3. Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    exit 1
fi

# 4. Push database schema
echo ""
echo "🗄️  Syncing database schema..."
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
    echo "⚠️  Prisma db push failed (this may be OK if no schema changes)"
fi

# 5. Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# 6. Restart the application
echo ""
echo "🚀 Restarting application..."

# If using PM2
if command -v pm2 &> /dev/null; then
    pm2 restart tour_ease_backend
    echo "✅ Restarted with PM2"
# If using systemd
elif command -v systemctl &> /dev/null; then
    sudo systemctl restart tour_ease_backend
    echo "✅ Restarted with systemd"
else
    echo "⚠️  Please manually restart your application"
fi

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "Backend is now running with the latest code"
echo "API: https://api.tourease.me/api"
