// Enhanced Service Worker for Unified Contractors
// This provides advanced caching, offline support, and performance optimizations

const CACHE_NAME = 'unified-contractors-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'
const API_CACHE = 'api-cache-v1'
const IMAGE_CACHE = 'image-cache-v1'

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// URL patterns and their caching strategies
const CACHING_RULES = [
  {
    pattern: /\.(js|css|woff2?|eot|ttf|otf)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: RUNTIME_CACHE,
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: IMAGE_CACHE,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: API_CACHE,
    maxAge: 24 * 60 * 60, // 24 hours
    maxEntries: 100
  }
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching essential files')
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other essential resources here
      ])
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (event.request.url.includes('extension://')) {
    return
  }

  const requestUrl = new URL(event.request.url)
  
  // Apply caching strategy based on URL pattern
  const rule = CACHING_RULES.find(rule => rule.pattern.test(event.request.url))
  
  if (rule) {
    event.respondWith(handleRequest(event.request, rule))
  } else {
    // Default strategy for other requests
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})

// Handle requests based on caching strategy
async function handleRequest(request, rule) {
  const cache = await caches.open(rule.cacheName)
  const cachedResponse = await cache.match(request)

  switch (rule.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cachedResponse || fetchAndCache(request, cache, rule)
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      try {
        const networkResponse = await fetchAndCache(request, cache, rule)
        return networkResponse
      } catch (error) {
        return cachedResponse || new Response('Offline', { status: 503 })
      }
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      if (cachedResponse) {
        // Return cached response and update cache in background
        fetchAndCache(request, cache, rule).catch(console.error)
        return cachedResponse
      }
      return fetchAndCache(request, cache, rule)
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request)
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cachedResponse || new Response('Not cached', { status: 404 })
    
    default:
      return fetch(request)
  }
}

// Fetch and cache helper function
async function fetchAndCache(request, cache, rule) {
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      // Clone the response as it can only be consumed once
      const responseToCache = response.clone()
      
      // Cache management
      if (rule.maxEntries) {
        await limitCacheEntries(cache, rule.maxEntries)
      }
      
      await cache.put(request, responseToCache)
    }
    
    return response
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error
  }
}

// Limit cache entries to prevent unlimited growth
async function limitCacheEntries(cache, maxEntries) {
  const keys = await cache.keys()
  
  if (keys.length >= maxEntries) {
    // Delete oldest entries (FIFO)
    const entriesToDelete = keys.length - maxEntries + 1
    const keysToDelete = keys.slice(0, entriesToDelete)
    
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Handle background sync
async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync offline form submissions
  console.log('Performing background sync')
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received')
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Project',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Unified Contractors', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(event.data.payload)
      })
    )
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync', event.tag)
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

// Sync content in background
async function syncContent() {
  try {
    // Check for updates and sync critical content
    console.log('Syncing content in background')
    
    const cache = await caches.open(API_CACHE)
    const cachedResponses = await cache.keys()
    
    // Refresh critical API endpoints
    const criticalEndpoints = ['/api/projects/recent', '/api/user/profile']
    
    for (const endpoint of criticalEndpoints) {
      const matchingRequest = cachedResponses.find(req => req.url.includes(endpoint))
      if (matchingRequest) {
        try {
          const response = await fetch(matchingRequest)
          if (response.ok) {
            await cache.put(matchingRequest, response.clone())
          }
        } catch (error) {
          console.error('Failed to sync:', endpoint, error)
        }
      }
    }
  } catch (error) {
    console.error('Content sync failed:', error)
  }
}

// Network status change handler
self.addEventListener('online', () => {
  console.log('Service Worker: Back online')
  // Trigger sync of pending offline actions
})

self.addEventListener('offline', () => {
  console.log('Service Worker: Gone offline')
})