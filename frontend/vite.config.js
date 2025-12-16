import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://pmiexhnze6.execute-api.us-west-2.amazonaws.com',
        rewrite: (path) => path.replace(/^\/api/, ''),
      }, // Proxy API requests to your backend
    },
  },
})