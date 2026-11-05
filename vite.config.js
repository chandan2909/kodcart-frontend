import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The Spring Boot backend runs on 9090 and its CORS is locked to
// http://localhost:5174 (the admin controllers have no @CrossOrigin at all),
// so every backend call is proxied through Vite as same-origin traffic.
const BACKEND = process.env.VITE_API_URL || 'http://localhost:9090'

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
