import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The Spring Boot backend runs on 9090. Requests are proxied through Vite as
// same-origin traffic so the httpOnly auth cookie works during development.
const configuredBackend = process.env.VITE_API_URL || 'http://localhost:9090'
const BACKEND = configuredBackend.replace(/\/+$/, '').replace(/\/api$/, '')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/admin': { target: BACKEND, changeOrigin: true },
    },
  },
})