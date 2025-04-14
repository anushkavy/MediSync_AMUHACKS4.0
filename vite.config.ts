import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  optimizeDeps: {
    include: ['firebase/firestore'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173/', // Your local API server
        changeOrigin: true,
      },
    },
  },
})
