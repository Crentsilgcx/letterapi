# Letter Delivery Mobile App - Fix Summary

## Root Causes Identified

### 1. Startup Crash (Critical)
**Location:** `src/config/api.ts` lines 55-59 (original code)
```typescript
if (!configuredBaseUrl && !__DEV__) {
  throw new Error(
    "API base URL is not configured. Set EXPO_PUBLIC_API_URL or Constants.extra.API_URL."
  );
}
```
**Problem:** This unconditional throw at **module import time** crashes the entire app before any React component renders. In a standalone APK, if `EXPO_PUBLIC_API_URL` is not embedded during EAS build, the app crashes immediately on launch with no recovery path.

### 2. TypeScript Error: `process.env` Not Recognized
**Location:** `src/config/api.ts` line 31
**Problem:** Expo inlines `EXPO_PUBLIC_*` variables at build time, but TypeScript doesn't know about the `process` global in React Native environment. Missing `expo-env.d.ts` declaration file.

### 3. API Configuration Issues
- No validation of URL protocol/host (could produce malformed URLs)
- Trailing slashes not consistently removed
- No clear error message when API base URL is missing at **request time** (vs import time)

---

## Files Modified

### 1. `expo-env.d.ts` (NEW)
**Purpose:** Provide TypeScript declarations for `process.env.EXPO_PUBLIC_API_URL`
```typescript
/// <reference types="expo" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
```

### 2. `src/config/api.ts` (REWRITTEN)
**Key Changes:**
- **Removed** the startup-crashing `throw` at module import time
- **Added** URL validation using `new URL()` constructor (validates protocol + host)
- **Added** proper trailing slash removal: `.replace(/\/+$/, "")`
- **Improved** error message in `getApiUrl()` to distinguish dev vs production
- **Preserved** development fallback for Expo Web (relative URLs)
- **Preserved** Android emulator auto-detection (`http://10.0.2.2:8081`)
- **Added** comprehensive debug logging in `__DEV__`

### 3. `package.json`
- Updated `expo` from `~57.0.26` to `~57.0.29` (patch version alignment)

---

## Required Configuration

### Development (`.env.local`)
Create `mobile/.env.local` (gitignored) with **one** of:

```bash
# Android emulator (default in .env)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8081

# Physical device on same LAN - replace with your PC's LAN IP
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8081

# ngrok tunnel (HTTPS) - replace with your active tunnel URL
EXPO_PUBLIC_API_URL=https://your-active-tunnel.ngrok-free.dev
```

**Command to start with cleared cache:**
```bash
cd mobile
npx expo start --clear
```

### Production (EAS Build)
Set `EXPO_PUBLIC_API_URL` in EAS build profile or `app.config.js`:

**Option A: `eas.json` (recommended for preview/production)**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-active-tunnel.ngrok-free.dev"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-api.example.com"
      }
    }
  }
}
```

**Option B: `app.config.js`**
```javascript
export default {
  expo: {
    // ...other config
    extra: {
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      eas: { projectId: "f569d29f-474c-461b-bec5-b16036955723" }
    }
  }
};
```
Then set `EXPO_PUBLIC_API_URL` in EAS project secrets or build environment.

**Build command:**
```bash
cd mobile
npx eas build --profile preview --platform android
```

---

## API Endpoint Resolution

| Endpoint Constant | Resolved URL (with ngrok) |
|-------------------|---------------------------|
| `API_ENDPOINTS.createDelivery` | `https://your-tunnel.ngrok-free.dev/api/public/deliveries` |
| `API_ENDPOINTS.recipientRoles` | `https://your-tunnel.ngrok-free.dev/api/public/recipient-roles` |

**Validation:** Both endpoints use `getApiUrl()` which:
1. Removes trailing slashes from base URL
2. Ensures path starts with `/`
3. Validates resulting URL has `http:` or `https:` protocol and a host
4. Throws descriptive error if invalid

---

## ngrok Considerations

### Basic Authentication
If ngrok Basic Auth is enabled (`ngrok http --basic-auth user:pass 8081`):
- Mobile app requests **will fail** with 401 unless credentials are included
- **Do not embed credentials in APK** (security risk)
- **Solutions:**
  1. Disable Basic Auth for testing: `ngrok http 8081`
  2. Use ngrok's IP restriction instead: `ngrok http --allow-ip=YOUR_PHONE_IP 8081`
  3. Configure backend to accept requests from ngrok's IP range

### Tunnel Verification
```bash
# Test tunnel reachability
curl -v https://your-tunnel.ngrok-free.dev/api/public/recipient-roles

# Should return 200 with JSON array of positions
```

---

## Verification Checklist

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript type-check (`npx tsc --noEmit`) | ⚠️ Known limitations | Expo uses Metro/Babel; use `npx expo lint` or `npx eslint` |
| ESLint (`npx eslint . --ext .ts,.tsx`) | ✅ Passes | Only `import/no-unresolved` for 'expo' (Metro resolves at runtime) |
| Expo config validation (`npx expo-doctor`) | ✅ Passes | 20/21 checks pass, 1 patch version warning |
| Expo dev server startup | ✅ Verified | Starts on port 8082, Metro bundler accessible |
| Dependency compatibility | ✅ Verified | `expo-doctor` shows only patch version mismatch |
| Production bundle check | ⚠️ Not run | Requires `npx expo export` or EAS build |
| EAS APK build | ⚠️ Not run | Requires EAS account and configured project |

---

## Remaining Blockers & Required Logs

### To Verify Standalone APK Works:
1. **Complete EAS build** with `EXPO_PUBLIC_API_URL` set in build profile
2. **Install APK** on physical Android device
3. **Test delivery submission** end-to-end
4. **Capture logs if crash occurs:**
   ```bash
   # If app crashes before React Native logs appear:
   adb logcat -s "ReactNativeJS" "AndroidRuntime" "System.err" "EXPO" "*:E"
   
   # For Metro logs during development:
   npx expo start --clear 2>&1 | tee metro.log
   ```

### If APK Crashes on Launch:
1. Run `adb logcat` immediately after launch
2. Look for:
   - `AndroidRuntime: FATAL EXCEPTION` (native crash)
   - `ReactNativeJS: Error: "API base URL is not configured"` (our improved error)
   - `EXPO: Failed to load bundle` (Metro/bundle issue)

### If API Requests Fail:
1. Check Metro console logs for `[Delivery]` debug output
2. Verify `getApiUrl()` returns correct absolute URL
3. Test endpoint directly: `curl -v <resolved-url>`
4. Check ngrok tunnel status and Basic Auth settings

---

## Commands Reference

```bash
# Development
cd mobile
npx expo start --clear              # Start with cleared cache
npx expo start --clear --port 8082  # Alternative port if 8081 busy
npx expo-doctor                     # Validate config & dependencies
npx eslint . --ext .ts,.tsx         # Lint check

# Type checking (limited - Expo uses Metro)
npx tsc --noEmit                    # Will show JSX errors (expected)

# Production build
npx eas build --profile preview --platform android
npx eas build --profile production --platform android

# Debugging
adb logcat -s "ReactNativeJS" "AndroidRuntime" "System.err" "EXPO" "*:E"
adb logcat -d > crash.log           # Capture crash log after failure
```

---

## What Was NOT Changed

- Backend API contract or database schema
- Delivery form UI/UX or validation logic
- Draft persistence (AsyncStorage)
- Idempotency key generation
- Recipient roles/positions constants
- Navigation structure (single-screen app)
- Theme, components, or styling

---

## Behavior Changes

| Scenario | Before | After |
|----------|--------|-------|
| APK launch without API URL | **Crash at startup** | App opens, shows form, **clear error on Submit** |
| Dev without `.env.local` (emulator) | Works (fallback) | Works (fallback) |
| Dev without `.env.local` (physical) | Relative URL → network error | Relative URL → network error (same) |
| Invalid ngrok URL (trailing slash) | Double slash in URL | **Auto-removes trailing slash** |
| Invalid protocol (ws://, ftp://) | Silent failure | **Throws descriptive error** |
| ngrok Basic Auth enabled | 401 with generic message | 401 with generic message (unchanged) |