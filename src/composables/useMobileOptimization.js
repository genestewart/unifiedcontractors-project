import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Composable for mobile-specific optimizations
 */
export function useMobileOptimization() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const orientation = ref('portrait')
  const touchDevice = ref(false)
  const connectionSpeed = ref('4g')
  const pixelRatio = ref(1)
  const viewportWidth = ref(window.innerWidth)
  const viewportHeight = ref(window.innerHeight)

  const deviceInfo = computed(() => ({
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: !isMobile.value && !isTablet.value,
    touchDevice: touchDevice.value,
    orientation: orientation.value,
    connectionSpeed: connectionSpeed.value,
    pixelRatio: pixelRatio.value,
    viewport: {
      width: viewportWidth.value,
      height: viewportHeight.value
    }
  }))

  const isSlowConnection = computed(() => {
    return ['slow-2g', '2g', '3g'].includes(connectionSpeed.value)
  })

  const shouldReduceAnimations = computed(() => {
    return isMobile.value && isSlowConnection.value
  })

  const optimalImageSize = computed(() => {
    const baseSize = isMobile.value ? 400 : 800
    return Math.round(baseSize * pixelRatio.value)
  })

  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const width = window.innerWidth

    // Mobile detection
    isMobile.value = width <= 768 || /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    // Tablet detection
    isTablet.value = (width > 768 && width <= 1024) || /ipad|tablet|(android(?!.*mobile))/i.test(userAgent)
    
    // Touch device detection
    touchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    // Pixel ratio
    pixelRatio.value = window.devicePixelRatio || 1
    
    // Viewport dimensions
    viewportWidth.value = window.innerWidth
    viewportHeight.value = window.innerHeight
  }

  const detectOrientation = () => {
    orientation.value = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  const detectConnection = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connectionSpeed.value = connection.effectiveType || '4g'
    }
  }

  const handleResize = () => {
    detectDevice()
    detectOrientation()
  }

  const handleOrientationChange = () => {
    // Delay to allow browser to update dimensions
    setTimeout(() => {
      detectDevice()
      detectOrientation()
    }, 100)
  }

  const handleConnectionChange = () => {
    detectConnection()
  }

  onMounted(() => {
    detectDevice()
    detectOrientation()
    detectConnection()

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleOrientationChange)
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange)
    }
  })

  return {
    deviceInfo,
    isMobile,
    isTablet,
    orientation,
    touchDevice,
    connectionSpeed,
    pixelRatio,
    viewportWidth,
    viewportHeight,
    isSlowConnection,
    shouldReduceAnimations,
    optimalImageSize
  }
}

/**
 * Composable for touch gesture handling
 */
export function useTouchGestures(element) {
  const isTouch = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const deltaX = ref(0)
  const deltaY = ref(0)

  const handleTouchStart = (event) => {
    isTouch.value = true
    const touch = event.touches[0]
    startX.value = touch.clientX
    startY.value = touch.clientY
    deltaX.value = 0
    deltaY.value = 0
  }

  const handleTouchMove = (event) => {
    if (!isTouch.value) return
    
    const touch = event.touches[0]
    deltaX.value = touch.clientX - startX.value
    deltaY.value = touch.clientY - startY.value
  }

  const handleTouchEnd = (event) => {
    isTouch.value = false
    
    // Emit gesture events based on delta values
    const threshold = 50
    const absX = Math.abs(deltaX.value)
    const absY = Math.abs(deltaY.value)
    
    if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX.value > 0) {
          element.value?.dispatchEvent(new CustomEvent('swiperight', { detail: { deltaX: deltaX.value } }))
        } else {
          element.value?.dispatchEvent(new CustomEvent('swipeleft', { detail: { deltaX: deltaX.value } }))
        }
      } else {
        // Vertical swipe
        if (deltaY.value > 0) {
          element.value?.dispatchEvent(new CustomEvent('swipedown', { detail: { deltaY: deltaY.value } }))
        } else {
          element.value?.dispatchEvent(new CustomEvent('swipeup', { detail: { deltaY: deltaY.value } }))
        }
      }
    }
    
    // Reset values
    startX.value = 0
    startY.value = 0
    deltaX.value = 0
    deltaY.value = 0
  }

  onMounted(() => {
    if (element.value) {
      element.value.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.value.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.value.addEventListener('touchend', handleTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    if (element.value) {
      element.value.removeEventListener('touchstart', handleTouchStart)
      element.value.removeEventListener('touchmove', handleTouchMove)
      element.value.removeEventListener('touchend', handleTouchEnd)
    }
  })

  return {
    isTouch,
    deltaX,
    deltaY
  }
}

/**
 * Composable for performance monitoring on mobile devices
 */
export function useMobilePerformance() {
  const isLowPerformanceDevice = ref(false)
  const memoryInfo = ref(null)
  const batteryLevel = ref(1)
  const isLowBattery = ref(false)

  const detectPerformance = async () => {
    // Memory detection
    if ('memory' in performance) {
      memoryInfo.value = {
        total: performance.memory.totalJSHeapSize,
        used: performance.memory.usedJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
      
      // Consider device low-performance if it has less than 2GB RAM
      const estimatedRAM = performance.memory.jsHeapSizeLimit / (1024 * 1024 * 1024)
      isLowPerformanceDevice.value = estimatedRAM < 2
    }

    // Battery detection
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery()
        batteryLevel.value = battery.level
        isLowBattery.value = battery.level < 0.2
        
        battery.addEventListener('levelchange', () => {
          batteryLevel.value = battery.level
          isLowBattery.value = battery.level < 0.2
        })
      } catch (error) {
        console.warn('Battery API not supported')
      }
    }

    // CPU cores detection (rough performance indicator)
    if ('hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency
      if (cores <= 2) {
        isLowPerformanceDevice.value = true
      }
    }
  }

  onMounted(() => {
    detectPerformance()
  })

  return {
    isLowPerformanceDevice,
    memoryInfo,
    batteryLevel,
    isLowBattery
  }
}

/**
 * Composable for adaptive image loading based on device capabilities
 */
export function useAdaptiveImages() {
  const { deviceInfo, isSlowConnection, optimalImageSize } = useMobileOptimization()
  const { isLowPerformanceDevice, isLowBattery } = useMobilePerformance()

  const getOptimalImageUrl = (baseUrl, options = {}) => {
    const {
      sizes = [400, 800, 1200, 1600],
      quality = 85,
      format = 'webp'
    } = options

    // Reduce quality for slow connections or low battery
    let adaptiveQuality = quality
    if (isSlowConnection.value || isLowBattery.value) {
      adaptiveQuality = Math.max(60, quality - 20)
    }
    
    if (isLowPerformanceDevice.value) {
      adaptiveQuality = Math.max(50, quality - 30)
    }

    // Choose appropriate size
    let targetSize = optimalImageSize.value
    const availableSize = sizes.find(size => size >= targetSize) || sizes[sizes.length - 1]

    // Build URL with parameters
    const url = new URL(baseUrl, window.location.origin)
    url.searchParams.set('w', availableSize)
    url.searchParams.set('q', adaptiveQuality)
    
    // Use WebP if supported and requested
    if (format === 'webp' && supportsWebP()) {
      url.searchParams.set('f', 'webp')
    }

    return url.toString()
  }

  const supportsWebP = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  const preloadCriticalImages = (imageUrls) => {
    // Only preload on fast connections and good devices
    if (isSlowConnection.value || isLowPerformanceDevice.value || isLowBattery.value) {
      return
    }

    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = getOptimalImageUrl(url)
      document.head.appendChild(link)
    })
  }

  return {
    getOptimalImageUrl,
    preloadCriticalImages,
    supportsWebP
  }
}

/**
 * Utility for optimizing animations on mobile
 */
export function optimizeAnimations() {
  const { shouldReduceAnimations } = useMobileOptimization()
  const { isLowPerformanceDevice } = useMobilePerformance()

  const getAnimationConfig = (defaultConfig) => {
    if (shouldReduceAnimations.value || isLowPerformanceDevice.value) {
      return {
        ...defaultConfig,
        duration: Math.min(defaultConfig.duration || 300, 150),
        easing: 'ease-out', // Simpler easing
        reduce: true
      }
    }
    
    return defaultConfig
  }

  const shouldDisableAnimation = () => {
    return (shouldReduceAnimations.value || isLowPerformanceDevice.value) && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  return {
    getAnimationConfig,
    shouldDisableAnimation
  }
}