import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    allowedHosts: ['unaesthetic-evan-hardheartedly.ngrok-free.dev']
  },
  server: {
    allowedHosts: ['unaesthetic-evan-hardheartedly.ngrok-free.dev']
  }
});
