/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import { webfontDownload } from 'vite-plugin-webfont-dl'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    
    // Auto-import Vue APIs for better DX and smaller bundles
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia'
      ],
      dts: true,
      eslintrc: {
        enabled: true
      }
    }),
    
    // Auto-import Vue components
    Components({
      dts: true
    }),
    
    // Download and optimize web fonts
    webfontDownload(),
    
    // Enhanced PWA capabilities with advanced caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'robots.txt'],
      manifest: {
        name: 'Unified Contractors',
        short_name: 'UC',
        description: 'Park City Construction & Remodeling Company',
        theme_color: '#05b3f2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        // Advanced caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                // Remove auth headers from cache key
                const url = new URL(request.url)
                return url.pathname + url.search
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches
        cleanupOutdatedCaches: true
      },
      devOptions: {
        enabled: false // Disable in development for faster builds
      }
    }),
    
    // Bundle analyzer (only in analyze mode)
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  // Build optimizations
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: mode === 'development',
    
    rollupOptions: {
      output: {
        // Optimized manual chunk splitting for better caching and loading
        manualChunks: (id) => {
          // Core Vue ecosystem
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue-core'
          }
          if (id.includes('node_modules/vue-router/')) {
            return 'vue-router'
          }
          if (id.includes('node_modules/pinia/')) {
            return 'pinia'
          }
          
          // PrimeVue components - split by usage frequency
          if (id.includes('node_modules/primevue/')) {
            // Core components used everywhere
            if (/\/(button|dialog|dropdown|inputtext|progressbar|toast)/.test(id)) {
              return 'primevue-core'
            }
            // Form components
            if (/\/(checkbox|textarea|calendar|fileupload|rating|password)/.test(id)) {
              return 'primevue-forms'
            }
            // Data display components
            if (/\/(datatable|column|card|avatar|divider|breadcrumb)/.test(id)) {
              return 'primevue-data'
            }
            // Less frequently used components
            return 'primevue-misc'
          }
          
          // Utilities and icons
          if (id.includes('node_modules/lucide-vue-next/')) {
            return 'icons'
          }
          if (id.includes('node_modules/axios/')) {
            return 'http-client'
          }
          if (id.includes('node_modules/qrcode/')) {
            return 'qrcode'
          }
          if (id.includes('node_modules/lodash-es/')) {
            return 'utils'
          }
          
          // Group other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
          
          // App-specific chunks by feature area
          if (id.includes('/views/employee/')) {
            return 'employee-views'
          }
          if (id.includes('/views/client/')) {
            return 'client-views'
          }
          if (id.includes('/stores/')) {
            return 'stores'
          }
          if (id.includes('/components/employee/')) {
            return 'employee-components'
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const fileName = facadeModuleId.split('/').pop()
            if (fileName.includes('.vue')) {
              return 'views/[name]-[hash:8].js'
            }
          }
          return 'chunks/[name]-[hash:8].js'
        },
        entryFileNames: 'entry/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash:8][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash:8][extname]`
          }
          return `assets/[name]-[hash:8][extname]`
        }
      }
    },
    
    // Optimize chunk size warnings - stricter limits for better performance
    chunkSizeWarningLimit: 800,
    
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    
    // Minification settings
    minify: 'esbuild',
    
    // Enable code splitting
    cssCodeSplit: true
  },
  
  // CSS optimization
  css: {
    devSourcemap: mode === 'development'
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'primevue/config',
      'primevue/button',
      'primevue/dialog',
      'primevue/dropdown',
      'primevue/inputtext',
      'primevue/progressbar',
      'primevue/toastservice',
      'primevue/usetoast',
      'axios',
      'lucide-vue-next'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Improved server configuration for development
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'src/main.js',
        'src/test/**',
        'src/**/*.d.ts',
        'node_modules/**'
      ]
    }
  }
}))