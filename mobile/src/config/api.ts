/**
 * API base URL resolution for mobile app.
 *
 * Set EXPO_PUBLIC_API_URL in mobile/.env.local to your LAN IP:
 * EXPO_PUBLIC_API_URL=http://192.168.1.100:8081
 * 
 * For development with Android emulator, it falls back to 10.0.2.2:8081
 * For production/internal server, set EXPO_PUBLIC_API_URL to the server IP.
 */

const EMULATOR_LOOPBACK = 'http://10.0.2.2:8081';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || (__DEV__ ? EMULATOR_LOOPBACK : '')).replace(/\/+$/, '');

export const IS_EMULATOR_LOOPBACK = !configuredBaseUrl && Boolean(__DEV__);

export const API_ENDPOINTS = {
  public: '/api/public',
  reception: '/api/reception',
  admin: '/api/admin',
  recipientRoles: '/api/public/recipient-roles',
  createDelivery: '/api/public/deliveries',
} as const;

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

if (__DEV__) {
  console.log('[Delivery] API base URL:', API_BASE_URL || '(empty - set EXPO_PUBLIC_API_URL)');

  if (IS_EMULATOR_LOOPBACK) {
    console.warn(
      '[Delivery] EXPO_PUBLIC_API_URL is not set - falling back to the Android emulator loopback.\n' +
        '[Delivery] That address only works in an emulator. On a physical device set\n' +
        '[Delivery]   EXPO_PUBLIC_API_URL=http://<pc-lan-ip>:8081\n' +
        '[Delivery] in mobile/.env.local and reload the app.'
    );
  }
}