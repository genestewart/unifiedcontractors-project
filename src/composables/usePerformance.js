import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for monitoring Core Web Vitals and performance metrics
 */
export function usePerformance() {
  const metrics = ref({
    lcp: null,      // Largest Contentful Paint
    fid: null,      // First Input Delay
    cls: null,      // Cumulative Layout Shift
    fcp: null,      // First Contentful Paint
    ttfb: null      // Time to First Byte
  })

  const isSupported = ref(false)
  let observer = null

  const initializePerformanceObserver = () => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported')
      return
    }

    isSupported.value = true

    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            metrics.value.lcp = Math.round(entry.startTime)
            break
          case 'first-input':
            metrics.value.fid = Math.round(entry.processingStart - entry.startTime)
            break
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              metrics.value.cls = (metrics.value.cls || 0) + entry.value
            }
            break
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.value.fcp = Math.round(entry.startTime)
            }
            break
          case 'navigation':
            metrics.value.ttfb = Math.round(entry.responseStart - entry.requestStart)
            break
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      observer.observe({ entryTypes: ['first-input'] })
      observer.observe({ entryTypes: ['layout-shift'] })
      observer.observe({ entryTypes: ['paint'] })
      observer.observe({ entryTypes: ['navigation'] })
    } catch (error) {
      console.warn('Some performance metrics not supported:', error)
    }
  }

  const getNavigationTiming = () => {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return null
    }

    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return null

    return {
      dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      tcp: Math.round(navigation.connectEnd - navigation.connectStart),
      request: Math.round(navigation.responseStart - navigation.requestStart),
      response: Math.round(navigation.responseEnd - navigation.responseStart),
      dom: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      load: Math.round(navigation.loadEventEnd - navigation.loadEventStart)
    }
  }

  const getResourceTiming = () => {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return []
    }

    return performance.getEntriesByType('resource')
      .filter(entry => entry.transferSize > 0)
      .map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        size: entry.transferSize,
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime)
      }))
      .sort((a, b) => b.size - a.size)
  }

  const measureComponentRender = (componentName) => {
    if (!('performance' in window)) return

    const startMark = `${componentName}-render-start`
    const endMark = `${componentName}-render-end`
    const measureName = `${componentName}-render-duration`

    return {
      start: () => performance.mark(startMark),
      end: () => {
        performance.mark(endMark)
        const measure = performance.measure(measureName, startMark, endMark)
        return Math.round(measure.duration)
      }
    }
  }

  const logPerformanceReport = () => {
    const report = {
      coreWebVitals: metrics.value,
      navigation: getNavigationTiming(),
      resources: getResourceTiming().slice(0, 10), // Top 10 largest resources
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
      } : null
    }

    console.group('🚀 Performance Report')
    console.table(report.coreWebVitals)
    console.log('Navigation Timing:', report.navigation)
    console.log('Largest Resources:', report.resources)
    if (report.memory) {
      console.log('Memory Usage:', report.memory)
    }
    console.groupEnd()

    return report
  }

  const getPerformanceGrade = () => {
    const { lcp, fid, cls } = metrics.value
    let score = 100

    // LCP scoring (< 2.5s = good, < 4s = needs improvement, > 4s = poor)
    if (lcp) {
      if (lcp > 4000) score -= 30
      else if (lcp > 2500) score -= 15
    }

    // FID scoring (< 100ms = good, < 300ms = needs improvement, > 300ms = poor)
    if (fid) {
      if (fid > 300) score -= 30
      else if (fid > 100) score -= 15
    }

    // CLS scoring (< 0.1 = good, < 0.25 = needs improvement, > 0.25 = poor)
    if (cls) {
      if (cls > 0.25) score -= 40
      else if (cls > 0.1) score -= 20
    }

    if (score >= 90) return { grade: 'A', color: 'green', description: 'Excellent' }
    if (score >= 80) return { grade: 'B', color: 'lightgreen', description: 'Good' }
    if (score >= 70) return { grade: 'C', color: 'orange', description: 'Needs Improvement' }
    return { grade: 'D', color: 'red', description: 'Poor' }
  }

  onMounted(() => {
    initializePerformanceObserver()
    
    // Log performance report after page load
    setTimeout(() => {
      if (import.meta.env.DEV) {
        logPerformanceReport()
      }
    }, 5000)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    metrics,
    isSupported,
    getNavigationTiming,
    getResourceTiming,
    measureComponentRender,
    logPerformanceReport,
    getPerformanceGrade
  }
}

/**
 * Utility function to measure function execution time
 */
export function measureExecutionTime(fn, label = 'Function') {
  return function(...args) {
    const start = performance.now()
    const result = fn.apply(this, args)
    const end = performance.now()
    
    if (import.meta.env.DEV) {
      console.log(`${label} execution time: ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}