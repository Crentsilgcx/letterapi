
/**
 * API base URL configuration for the Letter Delivery mobile app.
 *
 * Configure mobile/.env.local:
 * EXPO_PUBLIC_API_URL=https://YOUR-ACTIVE-NGROK-URL
 *
 * Example:
 * EXPO_PUBLIC_API_URL=https://example.ngrok-free.dev
 *
 * Do not include /api/public/deliveries in the base URL.
 */

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredBaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is missing. Set it in mobile/.env.local to your active ngrok URL."
  );
}

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, "");

if (!/^https?:\/\/[^/\s]+/i.test(API_BASE_URL)) {
  throw new Error(
    `Invalid API base URL: ${API_BASE_URL}. The URL must start with http:// or https://.`
  );
}

export const API_ENDPOINTS = {
  public: "/api/public",
  reception: "/api/reception",
  admin: "/api/admin",
  recipientRoles: "/api/public/recipient-roles",
  createDelivery: "/api/public/deliveries",
} as const;

/**
 * Always returns an absolute HTTP or HTTPS URL.
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  if (!/^https?:\/\/[^/\s]+\/\S*/i.test(url)) {
    throw new Error(`Invalid API request URL: ${url}`);
  }

  return url;
}

export const IS_EMULATOR_LOOPBACK = false;

if (__DEV__) {
  console.log("[Delivery] API base URL:", API_BASE_URL);
  console.log(
    "[Delivery] Delivery endpoint:",
    getApiUrl(API_ENDPOINTS.createDelivery)
  );
  console.log(
    "[Delivery] Recipient roles endpoint:",
    getApiUrl(API_ENDPOINTS.recipientRoles)
  );
}
