// Global test setup for enhanced CI reliability
import { vi, afterEach } from 'vitest'

// Set up global test environment
globalThis.process = globalThis.process || { env: {} }

// Configure environment variables for consistent testing
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}

// Mock global objects that might be missing in different Node.js versions
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
}

if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }))
}

// Mock performance API for consistent results across environments
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([]),
    getEntriesByName: vi.fn().mockReturnValue([]),
    navigation: {
      type: 'navigate'
    }
  }
}

// Mock requestAnimationFrame and cancelAnimationFrame
if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16) // ~60fps
  })
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id)
  })
}

// Mock requestIdleCallback for older Node.js versions
if (!globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback = vi.fn((callback) => {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50
      })
    }, 1)
  })
}

// Mock URL constructor for older environments
if (!globalThis.URL) {
  globalThis.URL = vi.fn().mockImplementation((url) => {
    const mockUrl = {
      href: url,
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      toString: () => url
    }
    return mockUrl
  })
}

// Mock fetch for consistent API testing
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    })
  )
}

// Mock FormData for form testing
if (!globalThis.FormData) {
  globalThis.FormData = vi.fn().mockImplementation(() => {
    const data = new Map()
    return {
      append: vi.fn((key, value) => data.set(key, value)),
      delete: vi.fn((key) => data.delete(key)),
      get: vi.fn((key) => data.get(key)),
      getAll: vi.fn((key) => [data.get(key)].filter(Boolean)),
      has: vi.fn((key) => data.has(key)),
      set: vi.fn((key, value) => data.set(key, value)),
      entries: vi.fn(() => data.entries()),
      keys: vi.fn(() => data.keys()),
      values: vi.fn(() => data.values()),
      forEach: vi.fn((callback) => data.forEach(callback))
    }
  })
}

// Mock localStorage and sessionStorage
const createStorage = () => {
  const storage = new Map()
  return {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    get length() { return storage.size },
    key: vi.fn((index) => Array.from(storage.keys())[index] || null)
  }
}

if (!globalThis.localStorage) {
  globalThis.localStorage = createStorage()
}

if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = createStorage()
}

// Mock CSS and DOM APIs
if (!globalThis.CSSStyleDeclaration) {
  globalThis.CSSStyleDeclaration = vi.fn()
}

if (!globalThis.getComputedStyle) {
  globalThis.getComputedStyle = vi.fn(() => ({
    getPropertyValue: vi.fn(() => ''),
    setProperty: vi.fn()
  }))
}

// Mock console methods for consistent test output
const originalConsole = { ...console }
if (process.env.CI) {
  // Reduce console noise in CI
  console.debug = vi.fn()
  console.info = vi.fn()
  
  // Keep error and warn for debugging
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.log = originalConsole.log
}

// Set up window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated  
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock scrollTo for navigation testing
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn()
})

// Mock scrollBy for scroll behavior testing
Object.defineProperty(window, 'scrollBy', {
  writable: true,
  value: vi.fn()
})

// Set up viewport properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
})

// Mock getBoundingClientRect for layout testing
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock focus methods for accessibility testing
HTMLElement.prototype.focus = vi.fn()
HTMLElement.prototype.blur = vi.fn()

// Set up test-specific timeouts for CI
if (process.env.CI) {
  // Increase default timeouts for slower CI environments
  vi.setConfig({
    testTimeout: 30000,
    hookTimeout: 30000
  })
}

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
  
  // Reset DOM
  document.body.innerHTML = ''
  
  // Clear any pending timers
  vi.clearAllTimers()
  
  // Reset localStorage/sessionStorage
  localStorage.clear()
  sessionStorage.clear()
})

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

export default {
  // Export utilities that tests might need
  mockStorage: createStorage,
  originalConsole
}