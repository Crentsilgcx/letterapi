 @echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM Letter Receipt System - Windows Startup Script
REM ============================================================
REM Loads environment variables from .env and starts Spring Boot.
REM Run from the letterapi project directory.
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo Letter Receipt System - Backend Startup
echo ============================================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Copy .env.windows to .env and configure your settings.
    echo.
    pause
    exit /b 1
)

REM Load environment variables from .env
echo Loading environment from .env ...

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" (
        set "%%A=%%B"
    )
)

REM Set defaults if variables are missing
if not defined DB_HOST set "DB_HOST=localhost"
if not defined DB_PORT set "DB_PORT=3306"
if not defined DB_NAME set "DB_NAME=letter_receipt"
if not defined DB_USER set "DB_USER=letter_app"
if not defined SERVER_PORT set "SERVER_PORT=8081"
if not defined APP_TIMEZONE set "APP_TIMEZONE=Africa/Accra"

REM Validate database password
if not defined DB_PASSWORD (
    echo.
    echo ERROR: DB_PASSWORD is missing or empty in .env
    echo Set DB_PASSWORD to your actual MySQL account password.
    echo.
    pause
    exit /b 1
)

REM Display configuration without revealing passwords
echo.
echo Configuration:
echo   DB_HOST=!DB_HOST!
echo   DB_PORT=!DB_PORT!
echo   DB_NAME=!DB_NAME!
echo   DB_USER=!DB_USER!
echo   SERVER_PORT=!SERVER_PORT!
echo   APP_TIMEZONE=!APP_TIMEZONE!
echo   DB_PASSWORD=********
echo.

REM Check Java
where java >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java was not found in PATH.
    echo Install/configure Java 21 and try again.
    echo.
    pause
    exit /b 1
)

REM Check Maven and build the application
echo Building application...
call mvn clean package -DskipTests

if errorlevel 1 (
    echo.
    echo ERROR: Maven build failed.
    pause
    exit /b 1
)

REM Verify JAR exists
if not exist "target\letter-receipt-system-1.0.0.jar" (
    echo ERROR: Application JAR was not created.
    pause
    exit /b 1
)

REM Start Spring Boot
echo.
echo Starting Spring Boot application on port !SERVER_PORT! ...
echo Press Ctrl+C to stop.
echo.

java -jar "target\letter-receipt-system-1.0.0.jar"

echo.
echo Application stopped.
pause

endlocal