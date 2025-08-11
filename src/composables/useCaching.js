import { ref, computed, onMounted } from 'vue'

/**
 * Composable for browser caching and storage management
 */
export function useCaching() {
  const isSupported = ref(false)
  const storageQuota = ref(null)
  const storageUsage = ref(null)
  const cacheNames = ref([])

  const storageInfo = computed(() => {
    if (!storageQuota.value || !storageUsage.value) return null
    
    const usedPercent = (storageUsage.value / storageQuota.value) * 100
    
    return {
      quota: formatBytes(storageQuota.value),
      used: formatBytes(storageUsage.value),
      available: formatBytes(storageQuota.value - storageUsage.value),
      usedPercent: Math.round(usedPercent * 100) / 100
    }
  })

  const initializeCaching = async () => {
    // Check for Cache API support
    isSupported.value = 'caches' in window

    if (!isSupported.value) {
      console.warn('Cache API not supported')
      return
    }

    // Get storage quota and usage
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        storageQuota.value = estimate.quota
        storageUsage.value = estimate.usage
      }
    } catch (error) {
      console.warn('Storage estimation not supported:', error)
    }

    // Get existing cache names
    try {
      cacheNames.value = await caches.keys()
    } catch (error) {
      console.error('Failed to get cache names:', error)
    }
  }

  const clearCache = async (cacheName) => {
    if (!isSupported.value) return false

    try {
      const success = await caches.delete(cacheName)
      if (success) {
        cacheNames.value = cacheNames.value.filter(name => name !== cacheName)
        await updateStorageInfo()
      }
      return success
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  }

  const clearAllCaches = async () => {
    if (!isSupported.value) return false

    try {
      const deletePromises = cacheNames.value.map(name => caches.delete(name))
      await Promise.all(deletePromises)
      cacheNames.value = []
      await updateStorageInfo()
      return true
    } catch (error) {
      console.error('Failed to clear all caches:', error)
      return false
    }
  }

  const updateStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        storageQuota.value = estimate.quota
        storageUsage.value = estimate.usage
      }
    } catch (error) {
      console.error('Failed to update storage info:', error)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  onMounted(() => {
    initializeCaching()
  })

  return {
    isSupported,
    storageQuota,
    storageUsage,
    storageInfo,
    cacheNames,
    clearCache,
    clearAllCaches,
    updateStorageInfo
  }
}

/**
 * Composable for HTTP caching headers and optimization
 */
export function useHttpCaching() {
  const cacheHeaders = {
    // Static assets (long-term caching)
    longTerm: {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'Expires': new Date(Date.now() + 31536000000).toUTCString(),
      'ETag': null // Set dynamically based on content
    },
    
    // API responses (short-term caching)
    api: {
      'Cache-Control': 'private, max-age=3600', // 1 hour
      'Expires': new Date(Date.now() + 3600000).toUTCString(),
      'ETag': null
    },
    
    // Dynamic content (conditional caching)
    dynamic: {
      'Cache-Control': 'private, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    
    // Critical resources (immediate caching)
    critical: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 day with 7 day stale
      'Expires': new Date(Date.now() + 86400000).toUTCString()
    }
  }

  const generateETag = (content) => {
    // Simple ETag generation (in production, use more robust hashing)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`
  }

  const shouldCache = (url, method = 'GET') => {
    if (method !== 'GET') return false
    
    // Don't cache authentication endpoints
    if (url.includes('/auth/') || url.includes('/login')) return false
    
    // Don't cache real-time data
    if (url.includes('/notifications') || url.includes('/live')) return false
    
    return true
  }

  const getCacheKey = (url, params = {}) => {
    const urlObj = new URL(url, window.location.origin)
    
    // Add parameters to URL for cache key
    Object.keys(params).forEach(key => {
      urlObj.searchParams.set(key, params[key])
    })
    
    return urlObj.toString()
  }

  return {
    cacheHeaders,
    generateETag,
    shouldCache,
    getCacheKey
  }
}

/**
 * Composable for resource preloading and prefetching
 */
export function useResourceOptimization() {
  const preloadedResources = ref(new Set())
  const prefetchedResources = ref(new Set())

  const preloadResource = (url, type = 'fetch', priority = 'high') => {
    if (preloadedResources.value.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    // Set resource type
    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'font':
        link.as = 'font'
        link.crossOrigin = 'anonymous'
        break
      default:
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
    }

    // Set priority if supported
    if ('fetchPriority' in link) {
      link.fetchPriority = priority
    }

    document.head.appendChild(link)
    preloadedResources.value.add(url)
  }

  const prefetchResource = (url) => {
    if (prefetchedResources.value.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    
    document.head.appendChild(link)
    prefetchedResources.value.add(url)
  }

  const preconnectToDomain = (domain) => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    link.crossOrigin = 'anonymous'
    
    document.head.appendChild(link)
  }

  const dnsPreconnect = (domain) => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    
    document.head.appendChild(link)
  }

  const preloadCriticalResources = (resources) => {
    resources.forEach(({ url, type, priority }) => {
      preloadResource(url, type, priority)
    })
  }

  const prefetchNextPageResources = (routes) => {
    // Use requestIdleCallback if available
    const prefetchFn = () => {
      routes.forEach(route => {
        prefetchResource(route)
      })
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchFn, { timeout: 2000 })
    } else {
      setTimeout(prefetchFn, 100)
    }
  }

  return {
    preloadedResources,
    prefetchedResources,
    preloadResource,
    prefetchResource,
    preconnectToDomain,
    dnsPreconnect,
    preloadCriticalResources,
    prefetchNextPageResources
  }
}

/**
 * Composable for CDN optimization
 */
export function useCDN() {
  const cdnConfig = ref({
    baseUrl: import.meta.env.VITE_CDN_URL || '',
    imageOptimization: true,
    webpSupport: null,
    avifSupport: null
  })

  const detectImageSupport = async () => {
    // Check WebP support
    const webpSupported = await new Promise(resolve => {
      const webp = new Image()
      webp.onload = webp.onerror = () => resolve(webp.height === 2)
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })

    cdnConfig.value.webpSupport = webpSupported

    // Check AVIF support
    const avifSupported = await new Promise(resolve => {
      const avif = new Image()
      avif.onload = avif.onerror = () => resolve(avif.height === 2)
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
    })

    cdnConfig.value.avifSupport = avifSupported
  }

  const getOptimizedImageUrl = (originalUrl, options = {}) => {
    if (!cdnConfig.value.baseUrl || !cdnConfig.value.imageOptimization) {
      return originalUrl
    }

    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      fit = 'cover'
    } = options

    const url = new URL(originalUrl, cdnConfig.value.baseUrl)
    
    if (width) url.searchParams.set('w', width)
    if (height) url.searchParams.set('h', height)
    if (quality !== 85) url.searchParams.set('q', quality)
    if (fit !== 'cover') url.searchParams.set('fit', fit)

    // Auto-detect best format
    if (format === 'auto') {
      if (cdnConfig.value.avifSupport) {
        url.searchParams.set('f', 'avif')
      } else if (cdnConfig.value.webpSupport) {
        url.searchParams.set('f', 'webp')
      }
    } else if (format !== 'original') {
      url.searchParams.set('f', format)
    }

    return url.toString()
  }

  const generateResponsiveSrcSet = (originalUrl, sizes = [400, 800, 1200]) => {
    return sizes.map(size => {
      const url = getOptimizedImageUrl(originalUrl, { width: size })
      return `${url} ${size}w`
    }).join(', ')
  }

  onMounted(() => {
    detectImageSupport()
  })

  return {
    cdnConfig,
    getOptimizedImageUrl,
    generateResponsiveSrcSet
  }
}