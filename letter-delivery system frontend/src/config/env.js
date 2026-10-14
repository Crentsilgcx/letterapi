// Centralized configuration for API and WebSocket URLs
// Uses Vite's import.meta.env for environment variables
// Set these in .env or .env.local:
// VITE_API_BASE_URL=https://your-ngrok-url.ngrok-free.app (production, different origin)
// VITE_WS_URL=wss://your-ngrok-url.ngrok-free.app/ws (production, different origin)
// Leave empty for same-origin deployment (frontend served by backend or reverse proxy)

const isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API base URL - empty for same-origin, full URL for cross-origin deployments (ngrok, separate hosts)
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// WebSocket URL - defaults to same origin in production, localhost in dev
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (isDev ? 'ws://localhost:8081/ws' : (isProduction ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws` : ''));

// API endpoint paths (relative paths for same-origin, will be prefixed with API_BASE_URL if set)
export const API_PATHS = {
  public: '/api/public',
  reception: '/api/reception',
  admin: '/api/admin',
};

// WebSocket endpoint path
export const WS_PATH = '/ws';

// Build full API URL (handles both same-origin and cross-origin)
export function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// Build full WebSocket URL
export function getWsUrl() {
  return WS_BASE_URL;
}

// Environment info for debugging
export const ENV_INFO = {
  isDev,
  isProduction,
  apiBaseUrl: API_BASE_URL,
  wsBaseUrl: WS_BASE_URL,
};

if (isDev) {
  console.log('[Config] API Base URL:', API_BASE_URL || '(same-origin)');
  console.log('[Config] WebSocket URL:', WS_BASE_URL);
}