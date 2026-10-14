@echo off
REM ============================================================
REM Letter Receipt System - Mobile APK Build Script (Windows)
REM ============================================================
REM Builds the React Native/Expo mobile app as a standalone APK.
REM Run from the "mobile" folder.

echo.
echo ============================================================
echo Letter Receipt System - Mobile APK Build
echo ============================================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Run this script from the "mobile" folder.
    echo.
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo Create it from .env.example and set EXPO_PUBLIC_API_URL
    echo Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:8081
    echo.
    echo Continue anyway? (y/n)
    set /p choice=
    if /i not "%choice%"=="y" (
        echo Build cancelled.
        pause
        exit /b 1
    )
) else (
    echo Using .env.local configuration:
    type .env.local
    echo.
)

echo.
echo Select build method:
echo 1. EAS Cloud Build (recommended - no Android Studio needed)
echo 2. Local Build (requires Android Studio + SDK)
echo.
set /p buildChoice="Enter choice (1 or 2): "

if "%buildChoice%"=="1" goto :EAS_BUILD
if "%buildChoice%"=="2" goto :LOCAL_BUILD

echo Invalid choice.
pause
exit /b 1

:EAS_BUILD
echo.
echo ============================================================
echo EAS Cloud Build
echo ============================================================
echo.
echo Checking EAS CLI...
npx eas-cli@latest --version 2>nul
if errorlevel 1 (
    echo EAS CLI not found. Installing...
    npm install -g eas-cli
)

echo.
echo Select build profile:
echo 1. preview (unsigned, for testing)
echo 2. production (signed, for Play Store)
echo.
set /p profileChoice="Enter choice (1 or 2): "

if "%profileChoice%"=="1" set PROFILE=preview
if "%profileChoice%"=="2" set PROFILE=production

if not defined PROFILE (
    echo Invalid choice.
    pause
    exit /b 1
)

echo.
echo Starting EAS build (profile: %PROFILE%)...
echo This may take 10-20 minutes. Check expo.dev for progress.
echo.
npx eas-cli@latest build --platform android --profile %PROFILE%

echo.
echo Build submitted! Check the URL above for progress and download.
pause
exit /b 0

:LOCAL_BUILD
echo.
echo ============================================================
echo Local Build (requires Android Studio)
echo ============================================================
echo.
echo Checking Android environment...
where adb >nul 2>nul
if errorlevel 1 (
    echo WARNING: adb not found in PATH.
    echo Ensure Android Studio is installed and ANDROID_HOME is set.
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
echo Building release APK...
npx expo run:android --variant release

echo.
echo If successful, APK is at:
echo   android\app\build\outputs\apk\release\app-release.apk
pause
exit /b 0