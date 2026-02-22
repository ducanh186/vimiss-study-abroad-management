import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': { target: 'http://localhost:8000', changeOrigin: false },
          '/login': { target: 'http://localhost:8000', changeOrigin: false },
          '/logout': { target: 'http://localhost:8000', changeOrigin: false },
          '/register': { target: 'http://localhost:8000', changeOrigin: false },
          '/forgot-password': { target: 'http://localhost:8000', changeOrigin: false },
          '/sanctum': { target: 'http://localhost:8000', changeOrigin: false },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
