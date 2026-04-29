import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'LinguaLeap',
        short_name: 'LinguaLeap',
        description: 'Learn survival Spanish for travel — designed for kids!',
        theme_color: '#FFD93D',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/es\/.*\.json$/,
            handler: 'CacheFirst',
            options: { cacheName: 'lingualeap-phrase-data', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
})
