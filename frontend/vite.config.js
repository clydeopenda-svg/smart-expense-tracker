import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Vite handles the frontend during development.
// API requests are forwarded to the Flask backend.
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})