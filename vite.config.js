import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // локально: фронт на :3000, прокси-сервер на :8787 (npm run dev:server)
      '/api': 'http://localhost:8787'
    }
  },
  preview: {
    port: process.env.PORT || 3000,
    host: true,
    allowedHosts: ['autoassistantai-production.up.railway.app']
  }
})
