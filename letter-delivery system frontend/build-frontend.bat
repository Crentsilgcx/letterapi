@echo off
REM ============================================================
REM Letter Receipt System - Frontend Build Script (Windows)
REM ============================================================
REM Builds the React frontend for production deployment.
REM Run from the "letter-delivery system frontend" folder.

echo.
echo ============================================================
echo Letter Receipt System - Frontend Build
echo ============================================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Run this script from the "letter-delivery system frontend" folder.
    echo.
    pause
    exit /b 1
)

REM Check if .env exists for production config
if not exist ".env" (
    echo WARNING: .env not found in frontend folder.
    echo For production builds with custom API URL, create .env with:
    echo   VITE_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
    echo   VITE_WS_URL=wss://your-ngrok-url.ngrok-free.app/ws
    echo.
    echo Continuing with same-origin deployment (empty API base URL)...
    echo.
)

echo Installing dependencies...
npm ci
if errorlevel 1 (
    echo npm install failed!
    pause
    exit /b 1
)

echo.
echo Building production bundle...
npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Build completed successfully!
echo ============================================================
echo.
echo Output directory: dist\
echo.
echo Deployment options:
echo 1. Serve with a static file server (nginx, Apache, IIS)
echo 2. Copy dist/ contents to Spring Boot's src/main/resources/static/
echo    (requires rebuilding the backend JAR)
echo 3. Use 'npm run preview' to test locally: npx serve dist
echo.
pause