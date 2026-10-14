# Letter Receipt System - Complete Windows Deployment Guide

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Architecture Overview](#2-architecture-overview)
3. [Step-by-Step Deployment](#3-step-by-step-deployment)
4. [Configuration Reference](#4-configuration-reference)
5. [Testing & Verification](#5-testing--verification)
6. [Troubleshooting](#6-troubleshooting)
7. [Restarting After Reboot](#7-restarting-after-reboot)
8. [Security Checklist](#8-security-checklist)

---

## 1. Prerequisites

### Required Software (Install in Order)

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| **XAMPP** | 8.2+ (MySQL 8.4) | MySQL database | https://www.apachefriends.org/ |
| **Java JDK** | 21 (LTS) | Run Spring Boot | https://adoptium.net/ |
| **Maven** | 3.9+ | Build backend | https://maven.apache.org/ |
| **Node.js** | 18+ LTS | Build frontend/mobile | https://nodejs.org/ |
| **Git** | Latest | Version control | https://git-scm.com/ |
| **ngrok** | Latest | External tunneling | https://ngrok.com/download |
| **EAS CLI** | Latest | Mobile APK builds | `npm install -g eas-cli` |

### Verify Installation
```cmd
java -version          # Should show 21.x
mvn -version           # Should show 3.9+
node --version         # Should show 18+
npm --version          # Should show 9+
ngrok version          # Should show version
eas --version          # Should show version
```

### Windows Firewall
Allow inbound on port 8081 (backend):
```cmd
REM Run as Administrator
netsh advfirewall firewall add rule name="Letter Receipt Backend" dir=in action=allow protocol=TCP localport=8081
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        WINDOWS SERVER                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   XAMPP      │    │  Spring Boot │    │  React Frontend  │  │
│  │  MySQL:3306  │◄───│  Backend:8081│◄───│  (served by      │  │
│  │              │    │              │    │   Spring Boot)   │  │
│  └──────────────┘    └──────┬───────┘    └──────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│                    ┌──────────────┐                             │
│                    │    ngrok     │                             │
│                    │  (tunnel)    │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│              ┌────────────┼────────────┐                         │
│              ▼            ▼            ▼                         │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│       │Reception │  │ Mobile   │  │  Other   │                  │
│       │ PC (Web) │  │ APK      │  │  Devices │                  │
│       └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Spring Boot serves both API and React frontend (same origin)
- Single ngrok tunnel handles HTTP + WebSocket
- Mobile APK has backend URL embedded at build time
- MySQL only accessible locally (not exposed via ngrok)

---

## 3. Step-by-Step Deployment

### Phase 0: Prepare Project Files

```cmd
# Navigate to project root
cd C:\Users\HP\Desktop\try\letterapi

# Verify structure
dir
```

### Step 1: Start XAMPP MySQL

1. Open **XAMPP Control Panel** (as Administrator recommended)
2. Click **Start** next to **MySQL**
3. Verify: `http://localhost/phpmyadmin` opens

### Step 2: Create Database & User

**Option A: phpMyAdmin (GUI)**
1. Open `http://localhost/phpmyadmin`
2. Click **SQL** tab, run:
```sql
CREATE DATABASE IF NOT EXISTS `letter_receipt`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'letter_app'@'localhost' IDENTIFIED BY 'AdminPasswordNow123';

GRANT ALL PRIVILEGES ON `letter_receipt`.* TO 'letter_app'@'localhost';
FLUSH PRIVILEGES;
```

**Option B: Command Line**
```cmd
cd C:\xampp\mysql\bin
mysql -u root -e "CREATE DATABASE IF NOT EXISTS letter_receipt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'letter_app'@'localhost' IDENTIFIED BY 'YourStrongDbPassword123!'; GRANT ALL PRIVILEGES ON letter_receipt.* TO 'letter_app'@'localhost'; FLUSH PRIVILEGES;"
```

### Step 3: Configure Backend Environment

```cmd
cd C:\Users\HP\Desktop\try\letterapi

# Copy template
copy .env.windows .env

# Edit with your values
notepad .env
```

**Required changes in `.env`:**
```env
DB_PASSWORD=YourStrongDbPassword123!
APP_BOOTSTRAP_ADMIN_PASSWORD=YourStrongAdminPassword123!
APP_ORGANIZATION_NAME=Your Organization Name
# SESSION_COOKIE_SECURE=false (keep false for HTTP ngrok)
```

### Step 4: Build & Start Backend

```cmd
cd C:\Users\HP\Desktop\try\letterapi

# Build (first time or after changes)
mvn clean package -DskipTests

# Start
start-backend.bat
```
Or manually:
```cmd
java -jar target/letter-receipt-system-1.0.0.jar
```

**Verify backend:**
- `http://localhost:8081/actuator/health` → `{"status":"UP"}`
- `http://localhost:8081/` → Delivery kiosk loads
- Check console for Flyway migrations: "Flyway migration completed"

### Step 5: Build Frontend (Production)

```cmd
cd "C:\Users\HP\Desktop\try\letterapi\letter-delivery system frontend"

# Configure for ngrok (same-origin deployment)
copy .env.example .env
notepad .env
```

**For ngrok (same-origin - leave empty):**
```env
VITE_API_BASE_URL=
VITE_WS_URL=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongAdminPassword123!
```

**Build:**
```cmd
build-frontend.bat
```
Or manually:
```cmd
npm ci
npm run build
```

**Verify:** `dist/` folder created with `index.html` and `assets/`

### Step 6: Configure & Start ngrok

```cmd
# In a NEW Command Prompt window (keep backend running)
ngrok http 8081 --basic-auth="receptionist:ReceptionPassword123!"
```

**Note the HTTPS URL:** `https://abc123.ngrok-free.app`

### Step 7: Build Mobile APK

```cmd
cd C:\Users\HP\Desktop\try\letterapi\mobile

# Configure with ngrok URL
copy .env.example .env.local
notepad .env.local
```

**Set ngrok URL:**
```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
```

**Build via EAS (recommended):**
```cmd
npx eas-cli@latest login
npx eas-cli@latest build:configure  # First time only
npx eas-cli@latest build --platform android --profile preview
```

**Download APK** from Expo build page when complete.

---

## 4. Configuration Reference

### Backend (`letterapi/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `letter_receipt` |
| `DB_USER` | DB username | `letter_app` |
| `DB_PASSWORD` | **DB password** | `YourStrongDbPassword123!` |
| `SERVER_PORT` | Backend port | `8081` |
| `APP_BOOTSTRAP_ADMIN_USERNAME` | Admin username | `admin` |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | **Admin password** | `YourStrongAdminPassword123!` |
| `APP_BOOTSTRAP_ADMIN_DISPLAY_NAME` | Admin display name | `System Administrator` |
| `APP_ORGANIZATION_NAME` | Organization name | `Your Organization` |
| `APP_TIMEZONE` | IANA timezone | `Africa/Accra` |
| `SESSION_COOKIE_SECURE` | Secure cookies (HTTPS) | `false` (ngrok) / `true` (prod HTTPS) |
| `THYMELEAF_CACHE` | Template caching | `true` |

### Frontend (`letter-delivery system frontend/.env`)

| Variable | Description | Same-Origin | Cross-Origin (ngrok) |
|----------|-------------|-------------|---------------------|
| `VITE_API_BASE_URL` | API base URL | *(empty)* | `https://xxx.ngrok-free.app` |
| `VITE_WS_URL` | WebSocket URL | *(empty)* | `wss://xxx.ngrok-free.app/ws` |
| `ADMIN_USERNAME` | Dev proxy auth | `admin` | `admin` |
| `ADMIN_PASSWORD` | Dev proxy auth | **admin password** | **admin password** |

### Mobile (`mobile/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | **Full backend URL** | `https://abc123.ngrok-free.app` |

---

## 5. Testing & Verification

### Backend Health
```cmd
curl http://localhost:8081/actuator/health
# {"status":"UP"}
```

### Frontend (Local)
```cmd
# Test production build locally
cd "C:\Users\HP\Desktop\try\letterapi\letter-delivery system frontend"
npx serve dist -l 3000
# Open http://localhost:3000
```

### ngrok Tunnel
```cmd
# Test public URL
curl https://abc123.ngrok-free.app/actuator/health
# Open https://abc123.ngrok-free.app/ in browser
```

### Receptionist Access Test
1. Receptionist opens `https://abc123.ngrok-free.app/reception`
2. Login with admin credentials
3. Dashboard loads, notification bell works
4. Open second browser tab - submit delivery from kiosk
5. Verify real-time notification appears

### Mobile APK Test
1. Install APK on Android device
2. Open app - form loads recipient positions
3. Fill form, submit
4. Success popup shows tracking number
5. Check reception dashboard - delivery appears instantly

### Automated Smoke Test
```cmd
cd C:\Users\HP\Desktop\try\letterapi
# Backend tests (requires Docker for integration tests)
mvn test
```

---

## 6. Troubleshooting

### Backend Won't Start

| Error | Solution |
|-------|----------|
| `Communications link failure` | MySQL not running (XAMPP Control Panel → Start MySQL) |
| `Access denied for user` | Check `DB_USER`/`DB_PASSWORD` in `.env` match MySQL user |
| `Unknown database` | Run database creation SQL (Step 2) |
| `Flyway migration failed` | Check logs for specific SQL error; verify MySQL 8.x |
| `Port 8081 already in use` | Stop other process: `netstat -ano \| findstr 8081` then `taskkill /PID <pid> /F` |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Blank page / 404 on refresh | Configure SPA fallback in web server (`try_files $uri $uri/ /index.html;`) |
| API calls fail (CORS) | Use same-origin deployment; or configure CORS in Spring Boot |
| WebSocket fails | Check `VITE_WS_URL` protocol (`wss://` for HTTPS ngrok) |
| Styles/scripts 404 | Verify `dist/` deployed correctly; check `base` in vite.config.js |

### ngrok Issues

| Issue | Solution |
|-------|----------|
| `502 Bad Gateway` | Backend not running on 8081 |
| WebSocket not connecting | ngrok free tier supports WS; check `localhost:4040` inspector |
| URL changes each restart | Use reserved domain (paid) or rebuild mobile APK |

### Mobile APK Issues

| Issue | Solution |
|-------|----------|
| "Could not reach server" | Verify `EXPO_PUBLIC_API_URL` in `.env.local`; rebuild APK |
| Cleartext HTTP blocked | `usesCleartextTraffic: true` in app.json (already set) |
| Build fails | Run `npx expo-doctor`; fix dependency issues |

### Database Connection from Other Tools
```cmd
# Test with mysql client
C:\xampp\mysql\bin\mysql -u letter_app -p letter_receipt
# Enter DB_PASSWORD from .env
```

---

## 7. Restarting After Reboot

### Automated Startup (Optional)

Create `start-all.bat`:
```bat
@echo off
title Letter Receipt System - All Services

echo Starting MySQL...
net start mysql

timeout /t 5

echo Starting Backend...
cd /d C:\Users\HP\Desktop\try\letterapi
start "Backend" cmd /k start-backend.bat

timeout /t 10

echo Starting ngrok...
start "ngrok" cmd /k ngrok http 8081 --basic-auth="receptionist:ReceptionPassword123!"

echo All services starting. Check each window for status.
pause
```

### Manual Restart Order
1. **XAMPP Control Panel** → Start MySQL
2. **Backend**: `start-backend.bat` (in letterapi folder)
3. **ngrok**: `ngrok http 8081 --basic-auth="..."`
4. **Frontend**: Already embedded in backend JAR (no separate process)
5. **Mobile APK**: No server process needed (just reinstall if URL changed)

---

## 8. Security Checklist

### Before Go-Live
- [ ] **Change ALL default passwords** in `.env` files
- [ ] `DB_PASSWORD` - strong, unique
- [ ] `APP_BOOTSTRAP_ADMIN_PASSWORD` - strong, unique (min 12 chars)
- [ ] ngrok `--basic-auth` with strong credentials
- [ ] `SESSION_COOKIE_SECURE=true` if using custom domain with TLS
- [ ] MySQL root password set in XAMPP
- [ ] Windows Firewall: only port 8081 open inbound
- [ ] MySQL NOT exposed publicly (verify port 3306 not forwarded)
- [ ] phpMyAdmin NOT exposed via ngrok
- [ ] Regular database backups configured
- [ ] Admin accounts reviewed after deployment

### Ongoing
- [ ] Monitor `/actuator/health` 
- [ ] Review delivery logs weekly
- [ ] Rotate ngrok auth token periodically
- [ ] Update dependencies monthly (`mvn versions:display-dependency-updates`, `npm audit`)

---

## File Summary - What Was Created/Modified

### New Files Created
| File | Purpose |
|------|---------|
| `letterapi/.env.windows` | Windows/XAMPP environment template |
| `letterapi/DATABASE_SETUP_XAMPP.md` | MySQL setup instructions |
| `letterapi/start-backend.bat` | Windows backend startup script |
| `letterapi/NGROK_SETUP.md` | ngrok tunnel configuration guide |
| `letterapi/letter-delivery system frontend/.env.example` | Frontend environment template |
| `letterapi/letter-delivery system frontend/DEPLOYMENT_WINDOWS.md` | Frontend deployment guide |
| `letterapi/letter-delivery system frontend/build-frontend.bat` | Frontend build script |
| `letterapi/mobile/DEPLOYMENT_WINDOWS.md` | Mobile APK build guide |
| `letterapi/mobile/build-apk.bat` | Mobile APK build script |

### Modified Files
| File | Changes |
|------|---------|
| `letterapi/letter-delivery system frontend/src/config/env.js` | Added `API_BASE_URL`, `getApiUrl()`, production-ready WS URL detection |
| `letterapi/letter-delivery system frontend/src/api.js` | Uses `getApiUrl()` for cross-origin support |
| `letterapi/letter-delivery system frontend/vite.config.js` | Configurable proxy target via `VITE_API_BASE_URL` |

### Retained (Docker Files)
- `docker-compose.yml` - Backup for containerized deployment
- `Dockerfile` - Backup for containerized deployment
- `.env.example` - Original Docker environment template

---

## Support & Maintenance

### Logs Location
- Backend: Console output (or redirect to file: `java -jar app.jar > backend.log 2>&1`)
- ngrok: `http://localhost:4040` (web inspector)
- Mobile: `adb logcat | findstr Delivery`

### Backup Database
```cmd
C:\xampp\mysql\bin\mysqldump -u root -p letter_receipt > backup-%DATE%.sql
```

### Update Application
1. Pull latest code
2. Backend: `mvn clean package -DskipTests` → restart `start-backend.bat`
3. Frontend: `build-frontend.bat` → redeploy `dist/`
4. Mobile: Update `.env.local` → rebuild APK → distribute

---

## Appendix: Port Reference

| Service | Port | Protocol | Exposed Via |
|---------|------|----------|-------------|
| MySQL | 3306 | TCP | Localhost only |
| Spring Boot | 8081 | HTTP | ngrok tunnel |
| WebSocket | 8081 | WS/WSS | ngrok tunnel (same port) |
| ngrok Dashboard | 4040 | HTTP | Localhost only |
| Frontend Dev | 5173 | HTTP | Vite dev server |
| Frontend Preview | 3000 | HTTP | `npx serve` |

---

*End of Deployment Guide*