import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

// Development proxy configuration.
// In production, the frontend is served by the backend or reverse proxy (same-origin).
// For development, Vite proxies /api and /ws to the backend.
// The backend uses cookie-based sessions with CSRF protection.

function getBackendTarget(mode) {
  // Allow override via VITE_API_BASE_URL in frontend .env, fallback to localhost:8081
  const env = loadEnv(mode, fileURLToPath(new URL('..', import.meta.url)), 'VITE_')
  return env.VITE_API_BASE_URL || 'http://localhost:8081'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendTarget = getBackendTarget(mode)
  console.log(`[letterapi] Dev proxy target: ${backendTarget}`)

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          cookieDomainRewrite: { '*': '' }, // Preserve cookies from backend
configure: (proxy) => {
              proxy.on('error', (err) => {
                console.error('[letterapi] Proxy error:', err.message)
              })
            },
        },
        '/ws': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
          cookieDomainRewrite: { '*': '' },
        }
      }
    }
  }
})
