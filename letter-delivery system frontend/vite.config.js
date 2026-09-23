import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'

// The project .env (shared with docker compose) holds the admin login. Staff API calls get
// it added here, so it always matches the server and never ships in the browser bundle.
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

function staffAuthHeader(mode) {
  // Re-read on every request so a changed .env applies without restarting Vite.
  const env = loadEnv(mode, projectRoot, '')
  const username = env.ADMIN_USERNAME || env.APP_BOOTSTRAP_ADMIN_USERNAME || 'admin'
  const password = env.ADMIN_PASSWORD || env.APP_BOOTSTRAP_ADMIN_PASSWORD
  if (!password) return null
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (!staffAuthHeader(mode)) {
    console.warn(`[letterapi] No ADMIN_PASSWORD found in ${projectRoot}.env - reception/admin API calls will be rejected.`)
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (!/^\/api\/(reception|admin)(\/|$)/.test(req.url)) return
              const auth = staffAuthHeader(mode)
              if (auth) proxyReq.setHeader('Authorization', auth)
            })
          },
        },
        '/ws': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          ws: true,
        }
      }
    }
  }
})
