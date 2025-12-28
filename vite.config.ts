import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: '.',
        filename: 'service-worker.js',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        devOptions: {
          enabled: true,
          type: 'module'
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          id: '/',
          name: 'Marcenaria Pro',
          short_name: 'MarcenariaPro',
          description: 'Gestão Inteligente para Marcenarias',
          theme_color: '#475569',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['business', 'productivity', 'utilities'],
          scope: '/',
          display_override: ['window-controls-overlay', 'standalone'],
          launch_handler: {
            client_mode: 'navigate-existing'
          },
          prefer_related_applications: false,
          iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
          screenshots: [
            {
              src: '/screenshots/home.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Tela Inicial'
            },
            {
              src: '/screenshots/orcamento.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Criar Orçamento'
            },
            {
              src: '/screenshots/desktop.png',
              sizes: '1024x1024',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard Desktop'
            }
          ],
          shortcuts: [
            {
              name: 'Novo Orçamento',
              short_name: 'Orçar',
              description: 'Criar novo orçamento rápido',
              url: '/',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            }
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },

      })
    ],
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
