/**
 * API base URL configuration for the Letter Delivery mobile app.
 *
 * Configure the API URL in the mobile/.env file:
 *
 * EXPO_PUBLIC_API_URL=http://10.55.100.195:8081
 *
 * For an Android emulator, use:
 * EXPO_PUBLIC_API_URL=http://10.0.2.2:8081
 *
 * If your server computer or network changes, update the IP in .env.
 */

import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  // 1. Read the API URL from .env or .env.local.
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Check Expo configuration as a secondary source.
  const configUrl = Constants.expoConfig?.extra?.API_URL;

  if (typeof configUrl === 'string' && configUrl.trim()) {
    return configUrl.trim().replace(/\/+$/, '');
  }

  // 3. Fail clearly rather than silently connecting to the wrong server.
  throw new Error(
    'API URL is not configured. Add EXPO_PUBLIC_API_URL to your mobile/.env file.'
  );
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * API endpoints.
 * Keep these paths aligned with your existing backend routes.
 * Use RELATIVE paths only - getApiUrl() will prepend the base URL.
 */
export const API_ENDPOINTS = {
  public: "/api/public",
  reception: "/api/reception",
  admin: "/api/admin",
  recipientRoles: "/api/public/recipient-roles",
  createDelivery: "/api/public/deliveries",
};

/**
 * Builds and validates a complete API URL.
 * If the input path is already an absolute URL (starts with http:// or https://),
 * it is returned as-is to prevent double-prefixing.
 */
export const getApiUrl = (path: string): string => {
  // If path is already an absolute URL, return it directly
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('The API URL must use HTTP or HTTPS.');
      }
      return path;
    } catch {
      throw new Error(`Invalid API URL: ${path}`);
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const url = `${API_BASE_URL}${normalizedPath}`;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('The API URL must use HTTP or HTTPS.');
    }

    return url;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP or HTTPS')) {
      throw error;
    }

    throw new Error(`Invalid API URL: ${url}`);
  }
};

/**
 * True when running on an Android emulator rather than a physical device.
 * `Constants.platform?.android` is an Android manifest object when the app runs on Android,
 * so we check whether that platform is present instead of comparing it to a boolean.
 */
export const IS_EMULATOR_LOOPBACK =
  Constants.platform?.android !== undefined && Constants.isDevice === false;

// Development diagnostics.
if (__DEV__) {
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] Platform:', Constants.platform);
  console.log('[API Config] Physical device:', Constants.isDevice);
  console.log('[API Config] Create delivery URL:', API_ENDPOINTS.createDelivery);
}