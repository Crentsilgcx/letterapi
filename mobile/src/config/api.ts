/**
 * API base URL resolution.
 *
 * `10.0.2.2` is the Android *emulator* alias for the host machine's loopback
 * interface. It is only routable from an emulator. On a physical handset or
 * tablet the device has to reach the development machine over the LAN, so that
 * address will never connect.
 *
 * `EXPO_PUBLIC_API_URL` is therefore honoured in EVERY mode - including `__DEV__`
 * - instead of being ignored during development. Set it to the LAN address of
 * the machine running the backend (`mobile/.env.local`, which is git-ignored).
 * The emulator alias stays only as a last-resort developer convenience.
 */

const EMULATOR_LOOPBACK = 'http://10.0.2.2:8081';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || (__DEV__ ? EMULATOR_LOOPBACK : '')).replace(/\/+$/, '');

export const IS_EMULATOR_LOOPBACK = !configuredBaseUrl && Boolean(__DEV__);

export const API_ENDPOINTS = {
  recipientRoles: '/api/public/recipient-roles',
  createDelivery: '/api/public/deliveries',
} as const;

export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
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
