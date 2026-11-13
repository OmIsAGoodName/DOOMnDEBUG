import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@contracts': path.resolve(__dirname, '../contracts'),
      '@fixtures': path.resolve(__dirname, '../fixtures'),
      '@assets': path.resolve(__dirname, '../assets'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

