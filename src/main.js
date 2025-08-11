import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Lara from '@primevue/themes/lara'
import ToastService from 'primevue/toastservice'
import App from './App.vue'
import router from './router'

// Optimized CSS imports - load critical CSS first
import './styles/main.css'

// Enhanced lazy loading of non-critical CSS with performance optimization
const loadNonCriticalCSS = () => {
  const cssFiles = [
    {
      href: '/node_modules/primeicons/primeicons.css',
      preload: true // High priority for UI icons
    },
    {
      href: '/node_modules/bootstrap/dist/css/bootstrap-utilities.min.css',
      preload: false
    },
    {
      href: '/node_modules/bootstrap/dist/css/bootstrap-grid.min.css',
      preload: false
    }
  ]
  
  cssFiles.forEach(({ href, preload }) => {
    const link = document.createElement('link')
    
    if (preload && 'requestIdleCallback' in window) {
      // Use requestIdleCallback for non-critical resources
      requestIdleCallback(() => {
        link.rel = 'preload'
        link.as = 'style'
        link.onload = () => {
          link.rel = 'stylesheet'
        }
      })
    } else {
      // Fallback to traditional lazy loading
      link.rel = 'stylesheet'
      link.media = 'print'
      link.onload = () => {
        link.media = 'all'
        link.onload = null // Cleanup
      }
    }
    
    link.href = href
    document.head.appendChild(link)
  })
}

// Load non-critical CSS with performance optimization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNonCriticalCSS)
} else if ('requestIdleCallback' in window) {
  requestIdleCallback(loadNonCriticalCSS, { timeout: 2000 })
} else {
  setTimeout(loadNonCriticalCSS, 100)
}

const app = createApp(App)

// Performance optimized Pinia store
const pinia = createPinia()

// Enhanced performance monitoring with Web Vitals tracking
if (import.meta.env.PROD) {
  const webVitals = {
    lcp: null,
    fid: null,
    cls: 0
  }
  
  // Performance observer for monitoring Core Web Vitals
  const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const perfData = {
          domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart),
          load: Math.round(entry.loadEventEnd - entry.loadEventStart),
          ttfb: Math.round(entry.responseStart - entry.requestStart),
          fcp: null // Will be set by paint observer
        }
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_timing', {
            custom_map: { metric1: 'dom_content_loaded' },
            metric1: perfData.domContentLoaded
          })
        }
      }
      
      if (entry.entryType === 'largest-contentful-paint') {
        webVitals.lcp = Math.round(entry.startTime)
      }
      
      if (entry.entryType === 'first-input') {
        webVitals.fid = Math.round(entry.processingStart - entry.startTime)
      }
      
      if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
        webVitals.cls += entry.value
      }
      
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        const fcp = Math.round(entry.startTime)
        // Send FCP to analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_timing', {
            custom_map: { metric2: 'first_contentful_paint' },
            metric2: fcp
          })
        }
      }
    }
  })
  
  try {
    performanceObserver.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input', 'layout-shift', 'paint'] })
    
    // Report Web Vitals on page unload
    window.addEventListener('beforeunload', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'web_vitals', {
          lcp: webVitals.lcp,
          fid: webVitals.fid,
          cls: Math.round(webVitals.cls * 1000) / 1000 // Round CLS to 3 decimal places
        })
      }
    }, { capture: true })
  } catch (error) {
    console.warn('Performance monitoring not fully supported:', error)
  }
}

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      prefix: 'p',
      darkModeSelector: 'system',
      cssLayer: false
    }
  }
})
app.use(ToastService)

// Enhanced route preloading with intersection observer for better performance
const preloadedRoutes = new Set()

// Preload critical routes intelligently
router.beforeEach((to, from, next) => {
  // Enhanced preload mapping based on user journey analysis
  const preloadRoutes = {
    '/': ['/services', '/about'],
    '/services': ['/contact', '/portfolio'],
    '/about': ['/services', '/contact'],
    '/employee/login': ['/employee/dashboard'],
    '/employee/dashboard': ['/employee/projects', '/employee/files'],
    '/employee/projects': ['/employee/files', '/employee/feedback']
  }
  
  const routesToPreload = preloadRoutes[to.path]
  if (routesToPreload && 'requestIdleCallback' in window) {
    // Use requestIdleCallback to avoid blocking main thread
    requestIdleCallback(() => {
      routesToPreload.forEach(route => {
        if (!preloadedRoutes.has(route)) {
          const routeRecord = router.resolve(route)
          if (routeRecord.matched[0]?.components?.default) {
            // Preload the component
            routeRecord.matched[0].components.default().catch(() => {
              // Silently handle preload failures
            })
            preloadedRoutes.add(route)
          }
        }
      })
    }, { timeout: 3000 })
  }
  
  next()
})

// Mount app with error boundary
try {
  app.mount('#app')
  
  // Register enhanced service worker for better caching
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update notification
                if (confirm('New version available! Reload to update?')) {
                  window.location.reload()
                }
              }
            })
          }
        })
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            console.log('Update available, prompting user')
          }
        })
        
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    })
  }
  
} catch (error) {
  console.error('App mounting failed:', error)
  // Fallback error display
  document.getElementById('app').innerHTML = `
    <div style="padding: 2rem; text-align: center; color: #dc3545;">
      <h2>Application Error</h2>
      <p>The application failed to load. Please refresh the page.</p>
      <button onclick="location.reload()">Refresh Page</button>
    </div>
  `
}