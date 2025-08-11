// Enhanced Vitest configuration for CI/CD reliability
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: [
      './src/test/setup.js',
      './src/test/config/global-setup.js'
    ],
    
    // Test execution configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: process.env.CI ? 2 : 4, // Limit threads in CI
      }
    },
    
    // Timeout configuration for CI stability
    testTimeout: process.env.CI ? 15000 : 10000, // Longer timeout in CI
    hookTimeout: process.env.CI ? 15000 : 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'src/main.js',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        'node_modules/**',
        'dist/**',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      // Skip coverage for specific files that are hard to test
      skipFull: false,
      all: true
    },
    
    // Reporter configuration
    reporter: process.env.CI 
      ? ['verbose', 'junit', 'json']  // CI reporters
      : ['verbose'],                   // Local reporters
      
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    
    // Retry configuration for flaky tests
    retry: process.env.CI ? 2 : 0,
    
    // File watching (disabled in CI)
    watch: !process.env.CI,
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // Performance optimizations
    isolate: true,
    passWithNoTests: false,
    
    // Test file patterns
    include: [
      'src/test/**/*.{test,spec}.{js,ts}',
      'src/test/**/*.{test,spec}.{vue,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.git/**',
      '**/*.config.{js,ts}',
      'src/test/fixtures/**',
      'src/test/utils/**'
    ],
    
    // Dependency optimization
    deps: {
      inline: [
        // Inline dependencies that cause issues in tests
        '@vue/test-utils',
        'vue-router',
        'pinia'
      ]
    }
  },
  
  // Vite configuration for tests
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../', import.meta.url))
    }
  },
  
  // Define global constants for tests
  define: {
    __TEST__: true,
    __VERSION__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimization for test dependencies
  optimizeDeps: {
    include: [
      'vue',
      '@vue/test-utils',
      'vitest'
    ]
  }
})