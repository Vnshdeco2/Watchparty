import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: true, // Allow all hosts (for tunneling)
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
