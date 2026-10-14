# ngrok External Access Setup Guide

## Overview

ngrok creates secure tunnels from a public URL to your local development server. This allows:
- Receptionist to access the web app from any computer
- Mobile app (APK) to communicate with backend from any network

## Architecture Options

### Option 1: Single Tunnel (Recommended for Simplicity)
```
Internet → ngrok (HTTPS) → Spring Boot (HTTP:8081)
                                    └→ Serves React frontend (static)
                                    └→ WebSocket (/ws)
```
- One ngrok tunnel for everything
- Frontend and backend share same public origin
- No CORS issues
- Frontend: `VITE_API_BASE_URL=` (empty - same origin)
- Mobile: `EXPO_PUBLIC_API_URL=https://xxx.ngrok-free.app`

### Option 2: Separate Tunnels (Advanced)
```
Internet → ngrok (HTTPS) → React Frontend (static file server:3000)
Internet → ngrok (HTTPS) → Spring Boot (HTTP:8081)
```
- Two tunnels, two public URLs
- Requires CORS configuration on backend
- Frontend: `VITE_API_BASE_URL=https://backend-xxx.ngrok-free.app`
- Mobile: `EXPO_PUBLIC_API_URL=https://backend-xxx.ngrok-free.app`

**This guide covers Option 1 (single tunnel)** as it's simpler and matches the current architecture where Spring Boot serves the frontend.

---

## ngrok Installation & Authentication

### 1. Install ngrok
Download from https://ngrok.com/download (Windows 64-bit)
Or via package manager:
```cmd
# Scoop
scoop install ngrok

# Chocolatey
choco install ngrok

# Manual: Extract ngrok.exe to a folder in PATH (e.g., C:\tools\ngrok)
```

### 2. Authenticate (Required for Custom Domains, Reserved URLs)
```cmd
ngrok config add-authtoken YOUR_AUTHTOKEN
```
Get token from: https://dashboard.ngrok.com/get-started/your-authtoken

---

## Running ngrok

### Basic Command (HTTP + WebSocket)
```cmd
ngrok http 8081
```

### With Custom Subdomain (Requires Paid Plan)
```cmd
ngrok http 8081 --domain=your-org.ngrok.app
```

### With Basic Auth (Recommended for Security)
```cmd
ngrok http 8081 --basic-auth="receptionist:StrongPassword123"
```
- Adds HTTP Basic Auth at tunnel level
- Users prompted for credentials before reaching your app
- **Additional layer** - your app's own auth still applies

### With TLS Termination (Default)
ngrok provides HTTPS automatically. Your backend stays on HTTP.

---

## Verifying the Tunnel

After running `ngrok http 8081`, you'll see:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:8081
```

Test in browser:
1. Open `https://abc123.ngrok-free.app/actuator/health` → `{"status":"UP"}`
2. Open `https://abc123.ngrok-free.app/` → Delivery kiosk loads
3. Open `https://abc123.ngrok-free.app/reception` → Login page

---

## Configuring Applications for ngrok

### Spring Boot Backend
No code changes needed. The app receives requests with:
- `X-Forwarded-Proto: https`
- `X-Forwarded-Host: abc123.ngrok-free.app`
- `X-Forwarded-For: <client-ip>`

Spring Boot's `server.forward-headers-strategy: framework` (in application.yml) handles this automatically.

**Session cookies**: Set `SESSION_COOKIE_SECURE=true` in `.env` when using ngrok (HTTPS).

### React Frontend

**If served by Spring Boot (same origin):**
```env
# .env in letter-delivery system frontend/
VITE_API_BASE_URL=
VITE_WS_URL=
```
Leave empty - relative paths work because frontend and API share the ngrok URL.

**If served separately (Option 2):**
```env
VITE_API_BASE_URL=https://abc123.ngrok-free.app
VITE_WS_URL=wss://abc123.ngrok-free.app/ws
```
Rebuild frontend: `npm run build`

### Mobile App (APK)

Update `mobile/.env.local`:
```env
EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app
```
**Must rebuild APK** after changing this URL (embedded in bundle).

---

## WebSocket Support

ngrok **supports WebSocket** automatically on HTTP tunnels.

- Frontend connects to `wss://abc123.ngrok-free.app/ws`
- ngrok upgrades connection and forwards to `ws://localhost:8081/ws`
- No special configuration needed

**Verify WebSocket works:**
1. Open browser DevTools → Console
2. Look for: `[STOMP] Connected` or `[Config] WebSocket URL: wss://...`
3. Reception dashboard should show real-time updates

---

## Security Considerations

### ⚠️ ngrok is a Transport Tunnel, NOT Authentication
- Anyone with the ngrok URL can access your app
- **Always** keep your app's authentication enabled
- Consider adding `--basic-auth` to ngrok for extra layer

### Do NOT Expose These via ngrok
| Service | Port | Reason |
|---------|------|--------|
| MySQL | 3306 | Database credentials, data access |
| phpMyAdmin | 80/443 | Database management interface |
| XAMPP Control Panel | - | Server administration |

Only forward port **8081** (Spring Boot).

### CORS Configuration
With single-tunnel Option 1, CORS is not an issue (same origin).

If you must use separate origins, configure CORS in Spring Boot:
```java
// In SecurityConfig or WebMvcConfigurer
@Bean
WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins("https://frontend-xxx.ngrok-free.app")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
        }
    };
}
```

---

## Handling Changing ngrok URLs

### Free Tier: URL Changes Every Session
- Each `ngrok http 8081` generates new random URL (e.g., `abc123.ngrok-free.app`)
- **Frontend (same-origin)**: No change needed - works automatically
- **Mobile APK**: Must rebuild with new URL

### Strategies for Mobile App

#### 1. Rebuild APK Each Time (Free Tier)
```cmd
# Update mobile/.env.local
EXPO_PUBLIC_API_URL=https://NEW_URL.ngrok-free.app

# Rebuild
cd mobile
npx eas-cli@latest build --platform android --profile preview
```

#### 2. Use Reserved Domain (Paid ngrok Plan)
```cmd
ngrok http 8081 --domain=your-org.ngrok.app
```
- URL never changes
- APK only needs one build
- Cost: ~$10/month for basic reserved domain

#### 3. Custom Domain (Paid ngrok Plan)
```cmd
ngrok http 8081 --domain=letters.yourdomain.com
```
- Requires DNS CNAME record pointing to ngrok
- Professional appearance

---

## Complete ngrok Startup Script

Create `start-ngrok.bat` on backend server:

```bat
@echo off
echo ============================================================
echo Starting ngrok tunnel for Letter Receipt System
echo ============================================================
echo.

REM Check ngrok installed
where ngrok >nul 2>nul
if errorlevel 1 (
    echo ERROR: ngrok not found in PATH
    echo Download from https://ngrok.com/download
    pause
    exit /b 1
)

echo Starting tunnel on port 8081...
echo.
echo IMPORTANT: Share the HTTPS URL (not the http one)
echo with receptionist and mobile users.
echo.
echo Press Ctrl+C to stop tunnel.
echo.

ngrok http 8081 --basic-auth="receptionist:ChangeThisPassword123"

pause
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start tunnel | `ngrok http 8081` |
| With auth | `ngrok http 8081 --basic-auth="user:pass"` |
| Custom domain | `ngrok http 8081 --domain=xxx.ngrok.app` |
| View dashboard | `http://localhost:4040` (ngrok's local web UI) |
| Check tunnels | `ngrok api tunnels list` |

---

## Troubleshooting

### "Connection refused" / "502 Bad Gateway"
- Backend not running on port 8081
- Check `java -jar ...` is running
- Verify port: `netstat -an | findstr 8081`

### WebSocket not connecting
- Verify `wss://` protocol in frontend config
- Check ngrok dashboard (`http://localhost:4040`) for WebSocket frames
- Ensure Spring Boot WebSocket config allows all origins (`.setAllowedOriginPatterns("*")`)

### Mobile app can't connect
- Rebuild APK with new ngrok URL
- Verify `EXPO_PUBLIC_API_URL` uses `https://`
- Check ngrok dashboard for incoming requests

### CORS errors (separate origins only)
- Backend must allow frontend origin in CORS config
- Credentials: `allowCredentials(true)` for cookies
- Preflight OPTIONS must succeed

---

## ngrok Web Dashboard

While ngrok runs, open `http://localhost:4040`:
- **Inspect** tab: See all HTTP/WebSocket requests
- **Replay** tab: Resend requests for debugging
- **Metrics**: Latency, throughput, errors
- Use this to debug mobile/web connectivity issues