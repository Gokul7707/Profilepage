import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 8080,
    host: true,
    open: '/hello.html',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/resume': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
