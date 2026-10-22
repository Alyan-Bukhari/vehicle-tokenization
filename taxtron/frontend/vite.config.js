import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: loadEnv(mode,process.cwd(),'').VITE_API_TARGET || 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
}))
