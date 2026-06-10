import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy REST API calls to backend
      '/api': {
        target: 'http://localhost:5030',
        changeOrigin: true,
        secure: false,
      },
      // Proxy SignalR WebSocket hub (must come before /api to take priority)
      '/hubs': {
        target: 'http://localhost:5030',
        changeOrigin: true,
        ws: true,       // Enable WebSocket proxying
        secure: false,
      },
      // Health check endpoint
      '/health': {
        target: 'http://localhost:5030',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false,
    // Rolldown (Vite 8) handles chunking automatically — no manual config needed
    target: 'esnext',
  },
})
