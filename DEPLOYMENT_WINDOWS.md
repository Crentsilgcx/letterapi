# React Frontend - Windows Deployment Guide

## Overview

The React frontend is a Vite-based SPA that communicates with the Spring Boot backend via REST API and WebSocket.

## Build for Production

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ (comes with Node.js)

### Build Steps

1. **Open Command Prompt** in the frontend folder:
   ```cmd
   cd "C:\path\to\letterapi\letter-delivery system frontend"
   ```

2. **Configure environment** (create `.env` file):
   ```cmd
   copy .env.example .env
   notepad .env
   ```
   
   Set these for production:
   ```env
   # For same-origin deployment (frontend served by backend or reverse proxy):
   VITE_API_BASE_URL=
   VITE_WS_URL=
   
   # For cross-origin deployment (ngrok, separate hosts):
   VITE_API_BASE_URL=https://abc123.ngrok-free.app
   VITE_WS_URL=wss://abc123.ngrok-free.app/ws
   ```

3. **Build**:
   ```cmd
   build-frontend.bat
   ```
   Or manually:
   ```cmd
   npm ci
   npm run build
   ```

4. **Output**: Production files in `dist/` folder.

---

## Deployment Options

### Option A: Serve via Reverse Proxy (Recommended for Production)

Configure nginx/Apache/IIS to serve `dist/` and proxy API/WebSocket to backend.

**nginx example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/letter-delivery-system-frontend/dist;
    index index.html;

    # SPA fallback - serve index.html for all non-asset routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Spring Boot
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket
    location /ws/ {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Option B: Embed in Spring Boot JAR (Simple Deployment)

1. Copy `dist/` contents to `letterapi/src/main/resources/static/`
2. Rebuild backend: `mvn clean package -DskipTests`
3. Run JAR: `java -jar target/letter-receipt-system-1.0.0.jar`
4. Access at `http://localhost:8081/`

**Note**: This serves frontend and backend from same origin - no CORS issues, no separate `VITE_API_BASE_URL` needed.

### Option C: Static File Server (Development/Testing)

```cmd
npx serve dist -l 3000
```
Then access `http://localhost:3000` (configure `VITE_API_BASE_URL=http://localhost:8081`)

---

## Configuration for Different Scenarios

| Scenario | VITE_API_BASE_URL | VITE_WS_URL | Notes |
|----------|-------------------|-------------|-------|
| Dev (npm run dev) | (empty - uses Vite proxy) | (empty - uses Vite proxy) | Vite proxies `/api` and `/ws` to localhost:8081 |
| Same-origin (Option B) | (empty) | (empty) | Relative paths work automatically |
| Reverse proxy (Option A) | (empty) | (empty) | Proxy handles routing |
| ngrok tunnel | `https://xxx.ngrok-free.app` | `wss://xxx.ngrok-free.app/ws` | Full URLs required |
| LAN access | `http://192.168.1.100:8081` | `ws://192.168.1.100:8081/ws` | HTTP/WS for local network |

---

## Testing the Build

### Local Preview
```cmd
npx serve dist -l 3000
```
Open `http://localhost:3000` - verify API calls work (check browser DevTools Network tab).

### Production Checklist
- [ ] Build completes without errors
- [ ] `dist/index.html` exists
- [ ] `dist/assets/` contains JS/CSS bundles
- [ ] No `localhost` references in built files (search for `localhost` in `dist/`)
- [ ] API calls use correct base URL (check Network tab)
- [ ] WebSocket connects (check DevTools Console for `[STOMP] Connected`)
- [ ] Login works
- [ ] Reception dashboard loads
- [ ] Real-time notifications appear

---

## Common Issues

### "Network Error - API server may not be running"
- Backend not started on expected port
- Wrong `VITE_API_BASE_URL` in `.env`
- CORS blocked (check backend CORS config if cross-origin)

### WebSocket fails to connect
- Wrong `VITE_WS_URL` protocol (ws:// vs wss://)
- Proxy not forwarding WebSocket upgrade headers
- Firewall blocking port

### Blank page / 404 on refresh
- SPA fallback not configured in web server
- Add `try_files $uri $uri/ /index.html;` (nginx) or equivalent

### Styles/scripts not loading
- Check `base` in `vite.config.js` if deploying to subpath
- Default is root `/` - change if serving from `/app/`

---

## Updating the Frontend

1. Pull latest changes
2. Run `build-frontend.bat` again
3. Redeploy `dist/` to your web server
4. No backend restart needed (unless embedding in JAR)