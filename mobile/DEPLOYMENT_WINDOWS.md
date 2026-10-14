# Mobile App - Windows Deployment Guide (Standalone APK)

## Overview

The mobile app is a React Native/Expo application that submits letter deliveries to the Spring Boot backend. For production, it must be built as a standalone APK (not dependent on Expo Go).

## Prerequisites

### Development Machine
- Node.js 18+ (LTS)
- npm 9+
- Git
- **EAS CLI**: `npm install -g eas-cli` (or use `npx eas-cli@latest`)

### For Local Builds (Optional)
- Android Studio with Android SDK
- JDK 17+
- `ANDROID_HOME` environment variable set

### For Cloud Builds (Recommended - EAS)
- Expo account (free at expo.dev)
- No Android Studio required

---

## Configuration

### 1. Set Backend API URL

Create `.env.local` in the `mobile/` folder:

```cmd
cd mobile
copy .env.example .env.local
notepad .env.local
```

Set the **LAN IP** of your backend server (the Windows machine running Spring Boot):

```env
# Find your LAN IP: run `ipconfig` in Command Prompt
# Look for "IPv4 Address" under your active network adapter (e.g., 192.168.1.100)
EXPO_PUBLIC_API_URL=http://192.168.1.100:8081
```

**Important**: 
- Use `http://` (not `https://`) for local LAN - the APK has `usesCleartextTraffic: true` configured
- The device running the APK must be on the **same network** as the backend server
- For ngrok: `EXPO_PUBLIC_API_URL=https://abc123.ngrok-free.app` (requires HTTPS)

### 2. Verify app.json Configuration

The `app.json` already includes:
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true
    }
  },
  "plugins": [
    "expo-font",
    [
      "expo-build-properties",
      { "android": { "usesCleartextTraffic": true } }
    ]
  ]
}
```
This allows HTTP connections on Android 9+ (required for local LAN deployment).

---

## Building the APK

### Option A: EAS Cloud Build (Recommended)

**No Android Studio required.** Builds run on Expo's servers.

1. **Login to Expo**:
   ```cmd
   cd mobile
   npx eas-cli@latest login
   ```

2. **Configure project** (first time only):
   ```cmd
   npx eas-cli@latest build:configure
   ```
   - Select "Android"
   - Creates `eas.json` with build profiles

3. **Build APK**:
   ```cmd
   # Preview build (unsigned, for testing)
   npx eas-cli@latest build --platform android --profile preview
   
   # Production build (signed, for Play Store)
   npx eas-cli@latest build --platform android --profile production
   ```

4. **Download APK**:
   - Build completes → Expo provides download link
   - Or check `expo.dev/accounts/[username]/projects/[project]/builds`

### Option B: Local Build (Requires Android Studio)

```cmd
cd mobile
npx expo run:android --variant release
```
- Generates `android/app/build/outputs/apk/release/app-release.apk`
- Must have Android SDK, JDK 17, `ANDROID_HOME` configured

---

## Installing the APK

### On Physical Android Device

1. **Enable "Install unknown apps"**:
   - Settings → Apps → Special access → Install unknown apps
   - Allow your browser/file manager to install apps

2. **Transfer APK**:
   - Download from EAS build page
   - Or copy via USB/ADB: `adb install app-release.apk`

3. **Install**: Tap APK file → Install

### On Emulator
```cmd
adb install path\to\app-release.apk
```

---

## Testing the APK

1. **Start backend** on Windows server (see backend guide)
2. **Verify backend accessible** from device:
   - Phone browser: `http://192.168.1.100:8081/actuator/health` → should show `{"status":"UP"}`
3. **Launch app** on device
4. **Fill delivery form** → Submit
5. **Verify**:
   - Success popup shows tracking number
   - Delivery appears in reception dashboard
   - Check logs: `adb logcat | grep -i delivery` (if USB debugging)

---

## Updating the APK

### When to Rebuild
| Change | Rebuild Required? |
|--------|-------------------|
| `EXPO_PUBLIC_API_URL` changed | **YES** (URL embedded in bundle) |
| App code/logic changed | **YES** |
| Backend API contract changed | **YES** (if breaking) |
| Backend URL same, only data changed | NO |
| Server IP changed | **YES** |

### Rebuild Process
1. Update `.env.local` with new URL
2. Run build command again
3. Distribute new APK to users

### Over-the-Air Updates (Alternative)
For non-breaking changes, use EAS Update:
```cmd
npx eas-cli@latest update --branch production --message "Bug fix"
```
Users get update on next app launch (no reinstall).

---

## Network Configuration

### Windows Firewall
Allow inbound connections to port 8081:
```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="Letter Receipt Backend" dir=in action=allow protocol=TCP localport=8081
```

### Verify LAN Connectivity
From device (phone):
- Browser: `http://<PC_IP>:8081/actuator/health` → `{"status":"UP"}`
- If fails: check firewall, same WiFi, correct IP

### ngrok for External Access
If device not on same LAN:
1. Run ngrok on backend PC: `ngrok http 8081`
2. Update `.env.local`: `EXPO_PUBLIC_API_URL=https://xxx.ngrok-free.app`
3. Rebuild APK
4. Device can be anywhere with internet

---

## Troubleshooting

### "Could not reach the server"
- Wrong IP in `EXPO_PUBLIC_API_URL`
- Device not on same network
- Windows Firewall blocking port 8081
- Backend not running

### "Network request failed" / Timeout
- Backend slow to respond (check logs)
- Increase timeout in `api.ts` if needed
- Cleartext HTTP blocked (verify `usesCleartextTraffic: true`)

### Build fails on EAS
- Check `eas.json` configuration
- Run `npx expo-doctor` to diagnose dependency issues
- Ensure `package.json` has correct Expo SDK version

### APK installs but crashes on launch
- Check `adb logcat` for errors
- Common: missing fonts, native module mismatch
- Run `npx expo install --fix` and rebuild

---

## Security Notes

- **APK contains the API URL** - anyone with the APK can see the backend address
- **No authentication in mobile app** - delivery submission is public (by design)
- **Use ngrok HTTPS** for external access - encrypts traffic
- **Rate limiting** on backend protects against spam (`APP_RATE_LIMIT_PUBLIC_POST`)
- **Idempotency keys** prevent duplicate deliveries

---

## File Checklist for Deployment

```
mobile/
├── .env.local              # YOUR CONFIG - DO NOT COMMIT
├── app.json                # ✓ Configured for cleartext HTTP
├── src/config/api.ts       # ✓ Reads EXPO_PUBLIC_API_URL
├── eas.json                # Created by eas build:configure
└── package.json            # ✓ Expo SDK 57
```