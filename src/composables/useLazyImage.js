import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for lazy loading images with Intersection Observer
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image (optional)
 * @param {Object} options - Intersection Observer options
 * @returns {Object} - Reactive refs and methods
 */
export function useLazyImage(src, placeholder = '', options = {}) {
  const imageRef = ref(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const isError = ref(false)
  const currentSrc = ref(placeholder)
  const progress = ref(0)

  const defaultOptions = {
    root: null,
    rootMargin: '100px', // Increased for better preloading
    threshold: 0.1,
    enableWebP: true,
    retryAttempts: 2,
    fadeInDuration: 300
  }

  const observerOptions = { ...defaultOptions, ...options }
  let observer = null

  const checkWebPSupport = () => {
    return new Promise((resolve) => {
      if (!observerOptions.enableWebP) {
        resolve(false)
        return
      }
      
      const webp = new Image()
      webp.onload = webp.onerror = () => resolve(webp.height === 2)
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  const getOptimizedSrc = async (originalSrc) => {
    const supportsWebP = await checkWebPSupport()
    
    if (supportsWebP && !originalSrc.includes('.webp') && !originalSrc.includes('.svg')) {
      // Try WebP version
      const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      return { primary: webpSrc, fallback: originalSrc }
    }
    
    return { primary: originalSrc, fallback: originalSrc }
  }

  const loadImage = async () => {
    if (isLoading.value) return
    
    isLoading.value = true
    isError.value = false
    progress.value = 0
    
    try {
      const { primary, fallback } = await getOptimizedSrc(src)
      
      return new Promise((resolve, reject) => {
        let retryCount = 0
        
        const tryLoad = (imageSrc) => {
          const img = new Image()
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            if (progress.value < 90) {
              progress.value += Math.random() * 20
            }
          }, 100)
          
          img.onload = () => {
            clearInterval(progressInterval)
            progress.value = 100
            currentSrc.value = imageSrc
            isLoaded.value = true
            isLoading.value = false
            
            // Add fade-in effect
            if (imageRef.value && observerOptions.fadeInDuration > 0) {
              imageRef.value.style.opacity = '0'
              imageRef.value.style.transition = `opacity ${observerOptions.fadeInDuration}ms ease`
              
              requestAnimationFrame(() => {
                if (imageRef.value) {
                  imageRef.value.style.opacity = '1'
                }
              })
            }
            
            resolve(img)
          }
          
          img.onerror = () => {
            clearInterval(progressInterval)
            
            // Try fallback if primary fails
            if (imageSrc === primary && primary !== fallback) {
              tryLoad(fallback)
              return
            }
            
            // Retry logic
            if (retryCount < observerOptions.retryAttempts) {
              retryCount++
              setTimeout(() => tryLoad(imageSrc), 1000 * retryCount)
              return
            }
            
            isError.value = true
            isLoading.value = false
            reject(new Error(`Failed to load image after ${observerOptions.retryAttempts} retries: ${src}`))
          }
          
          // Set loading priority
          img.loading = 'lazy'
          img.decoding = 'async'
          
          // Add srcset support for responsive images
          if (src.includes('srcset=')) {
            const [baseSrc, srcsetParams] = src.split('?srcset=')
            img.srcset = srcsetParams
            img.src = baseSrc
          } else {
            img.src = imageSrc
          }
        }
        
        tryLoad(primary)
      })
    } catch (error) {
      isError.value = true
      isLoading.value = false
      throw error
    }
  }

  const handleIntersection = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoaded.value && !isLoading.value && !isError.value) {
        loadImage().catch((error) => {
          console.warn(`Failed to lazy load image: ${src}`, error)
          
          // Try to show a broken image icon or maintain placeholder
          if (imageRef.value && !placeholder) {
            imageRef.value.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' fill=\'%23ccc\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\' /%3E%3C/svg%3E")'
            imageRef.value.style.backgroundRepeat = 'no-repeat'
            imageRef.value.style.backgroundPosition = 'center'
            imageRef.value.style.backgroundSize = '48px'
          }
        })
        
        // Unobserve after loading starts
        if (observer && imageRef.value) {
          observer.unobserve(imageRef.value)
        }
      }
    })
  }

  onMounted(() => {
    if ('IntersectionObserver' in window && imageRef.value) {
      observer = new IntersectionObserver(handleIntersection, observerOptions)
      observer.observe(imageRef.value)
    } else {
      // Fallback for browsers without Intersection Observer
      loadImage()
    }
  })

  onUnmounted(() => {
    if (observer && imageRef.value) {
      observer.unobserve(imageRef.value)
      observer = null
    }
  })

  // Cleanup function
  const cleanup = () => {
    if (observer && imageRef.value) {
      observer.unobserve(imageRef.value)
      observer.disconnect()
      observer = null
    }
  }

  return {
    imageRef,
    currentSrc,
    isLoaded,
    isLoading,
    isError,
    progress,
    loadImage,
    cleanup
  }
}

/**
 * Utility function to generate responsive image URLs
 * @param {string} baseUrl - Base image URL
 * @param {Array} sizes - Array of width sizes
 * @returns {string} - Srcset string
 */
export function generateSrcSet(baseUrl, sizes = [320, 640, 768, 1024, 1280, 1920]) {
  return sizes
    .map(size => {
      const url = baseUrl.includes('?') 
        ? `${baseUrl}&w=${size}` 
        : `${baseUrl}?w=${size}`
      return `${url} ${size}w`
    })
    .join(', ')
}

/**
 * Utility function to optimize image loading based on connection speed
 */
export function getOptimalImageQuality() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  
  if (!connection) return 'high'
  
  const effectiveType = connection.effectiveType
  const saveData = connection.saveData
  
  if (saveData) return 'low'
  
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low'
    case '3g':
      return 'medium'
    case '4g':
    default:
      return 'high'
  }
}

/**
 * Enhanced preload critical images with priority hints
 * @param {Array} imageUrls - Array of image URLs to preload
 * @param {Object} options - Preload options
 */
export function preloadImages(imageUrls, options = {}) {
  const { priority = 'high', crossorigin = 'anonymous' } = options
  
  imageUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    
    // Set fetch priority for modern browsers
    if ('fetchPriority' in link) {
      link.fetchPriority = priority
    }
    
    if (crossorigin) {
      link.crossOrigin = crossorigin
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Create optimized placeholder with progressive blur effect
 */
export function createOptimizedPlaceholder(width, height, color = '#f5f5f5') {
  const canvas = document.createElement('canvas')
  canvas.width = 40 // Small size for blur effect
  canvas.height = 40
  
  const ctx = canvas.getContext('2d')
  
  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, 40, 40)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, adjustBrightness(color, -10))
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 40, 40)
  
  return canvas.toDataURL('image/webp', 0.1)
}

/**
 * Utility to adjust color brightness
 */
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}