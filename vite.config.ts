import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://1slabs.my.id',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://1slabs.my.id',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
