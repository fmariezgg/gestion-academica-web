import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve:{
    alias:{
      '@':fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:{
    port: 5173,
    proxy:{
      '/api':{
        target: 'http://localhost:9090',
        changeOrigin: true
      }
    }
  }
})
