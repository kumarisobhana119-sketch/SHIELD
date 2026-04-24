@echo off
echo ========================================
echo   SHIELD - Preparing for Deployment
echo ========================================
echo.

echo Creating deployment package...
echo.

echo Step 1: Checking files...
if exist backend\server.js (
    echo [OK] Backend server found
) else (
    echo [ERROR] Backend server not found!
    pause
    exit
)

if exist frontend\index.html (
    echo [OK] Frontend found
) else (
    echo [ERROR] Frontend not found!
    pause
    exit
)

if exist backend\package.json (
    echo [OK] Backend package.json found
) else (
    echo [ERROR] Backend package.json not found!
    pause
    exit
)

echo.
echo ========================================
echo   ALL FILES READY FOR DEPLOYMENT!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Upload your SHIELD folder to GitHub
echo    - Go to: https://github.com/new
echo    - Create repository: shield-safety-app
echo    - Upload all files
echo.
echo 2. Deploy on Render (Recommended)
echo    - Go to: https://render.com
echo    - Sign up with GitHub
echo    - New Web Service
echo    - Connect your repository
echo    - Build: cd backend ^&^& npm install
echo    - Start: cd backend ^&^& npm start
echo.
echo 3. Your app will be live in 3 minutes!
echo.
echo See DEPLOY_NOW.md for detailed instructions
echo.
pause
