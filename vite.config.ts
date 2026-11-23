import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' so an update never reloads a learner mid-activity (docs/SYSTEM_ARCHITECTURE.md section 7).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'EffiQuest 3D - Machine and Efficiency Laboratory',
        short_name: 'EffiQuest 3D',
        description: 'Interactive machine and efficiency laboratory for Grade 11 General Science.',
        theme_color: '#0b6e66',
        background_color: '#0b1f1d',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm}'],
        navigateFallback: '/index.html',
        // Rapier's WASM/JS bundle is large; raise the precache limit deliberately rather than skipping it silently.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
