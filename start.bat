@echo off
echo ========================================
echo   SHIELD Safety App - Starting Server
echo ========================================
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Starting SHIELD backend server...
echo Server will be available at http://localhost:3000
echo.

call npm start
