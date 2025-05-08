import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DewList',
        short_name: 'DewList',
        start_url: '/',
        display: 'standalone',
        background_color: '#1C222C', // dark mode bg
        theme_color: '#4C6CA8',      // your brand blue
        description: 'A focused task drip for ADHD brains',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ]
})
