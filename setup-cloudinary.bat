@echo off
echo 🌤️ Cloudinary Setup for AxomClash
echo =================================
echo.
echo This script will help you set up Cloudinary for photo uploads.
echo.
echo Before running this script:
echo 1. Sign up at https://cloudinary.com (FREE)
echo 2. Get your credentials from the dashboard
echo 3. Create a .env file in the backend folder with your credentials
echo.
echo Press any key to continue...
pause >nul

cd backend
echo.
echo 🚀 Running Cloudinary setup...
node scripts/setupCloudinary.js

echo.
echo Setup complete! Press any key to exit...
pause >nul
