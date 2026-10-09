// Centralized configuration for API and WebSocket URLs
// Uses Vite's import.meta.env for environment variables
// Set these in .env or .env.local:
// VITE_API_BASE_URL=http://localhost:8081
// VITE_WS_URL=ws://localhost:8081/ws

const isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// WebSocket URL - defaults to same origin in production, localhost in dev
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (isDev ? 'ws://localhost:8081/ws' : (isProduction ? `ws://${window.location.host}/ws` : ''));

// API endpoint paths (used as relative paths through Vite proxy in dev)
export const API_PATHS = {
  public: '/api/public',
  reception: '/api/reception',
  admin: '/api/admin',
};

// WebSocket endpoint
export const WS_PATH = '/ws';

// Helper to build full WebSocket URL
export function getWsUrl() {
  return WS_BASE_URL;
}

// Environment info for debugging
export const ENV_INFO = {
  isDev,
  isProduction,
  wsBaseUrl: WS_BASE_URL,
};

if (isDev) {
  console.log('[Config] WebSocket URL:', WS_BASE_URL);
}