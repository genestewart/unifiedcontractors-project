import { vi, beforeEach, afterEach } from 'vitest'

// Mock CSS imports
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))
vi.mock('*.sass', () => ({}))

// Mock image imports with more specific paths
vi.mock('*.svg', () => ({ default: '/mock-logo.svg' }))
vi.mock('*.png', () => ({ default: '/mock-image.png' }))
vi.mock('*.jpg', () => ({ default: '/mock-image.jpg' }))
vi.mock('*.jpeg', () => ({ default: '/mock-image.jpeg' }))
vi.mock('*.webp', () => ({ default: '/mock-image.webp' }))
vi.mock('*.gif', () => ({ default: '/mock-image.gif' }))

// Mock font imports
vi.mock('*.woff', () => '/mock-font.woff')
vi.mock('*.woff2', () => '/mock-font.woff2')
vi.mock('*.ttf', () => '/mock-font.ttf')
vi.mock('*.otf', () => '/mock-font.otf')

// Mock PrimeVue components and utilities
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  })
}))

// Mock PrimeVue configuration context
if (!globalThis.$primevue) {
  globalThis.$primevue = {
    config: {
      theme: 'aura-light-green',
      options: {},
      pt: {},
      ptOptions: {}
    },
    changeTheme: vi.fn(),
    isStylesLoaded: true,
    styled: true,
    unstyled: false
  }
}

// Enhanced Canvas mocking for device fingerprinting
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillText: vi.fn(),
  textBaseline: '',
  font: '',
  fillStyle: '',
  getImageData: vi.fn(() => ({
    data: new Array(400).fill(0)
  }))
}))

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')

// Global test configuration with enhanced stability
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Enhanced window.matchMedia mock for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    // Parse common media queries for better test simulation
    const matches = (() => {
      if (query.includes('max-width: 768px')) return window.innerWidth <= 768
      if (query.includes('max-width: 992px')) return window.innerWidth <= 992
      if (query.includes('min-width: 1200px')) return window.innerWidth >= 1200
      return false // Default to false for unknown queries
    })()
    
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  }),
})

// Enhanced IntersectionObserver mock
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = vi.fn().mockImplementation((callback, options = {}) => ({
    root: options.root || null,
    rootMargin: options.rootMargin || '0px',
    thresholds: options.thresholds || [0],
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

// Mock MutationObserver for DOM change detection
if (!globalThis.MutationObserver) {
  globalThis.MutationObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }))
}

// Mock Web APIs that might be used
if (!globalThis.File) {
  globalThis.File = vi.fn().mockImplementation((fileBits, fileName, options = {}) => ({
    name: fileName,
    size: fileBits.length || 0,
    type: options.type || '',
    lastModified: Date.now(),
    slice: vi.fn()
  }))
}

if (!globalThis.FileReader) {
  globalThis.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    abort: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null
  }))
}

// Mock Blob for file handling
if (!globalThis.Blob) {
  globalThis.Blob = vi.fn().mockImplementation((blobParts = [], options = {}) => ({
    size: blobParts.reduce((size, part) => size + (part.length || 0), 0),
    type: options.type || '',
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue(''),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
  }))
}

// Enhanced scroll behavior mocking
Object.defineProperty(window, 'scroll', {
  writable: true,
  value: vi.fn()
})

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn()
})

Object.defineProperty(window, 'scrollBy', {
  writable: true,
  value: vi.fn()
})

// Mock smooth scrolling behavior
if (typeof window.Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// Mock focus management
if (typeof window.HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.focus) {
    HTMLElement.prototype.focus = vi.fn()
  }
  if (!HTMLElement.prototype.blur) {
    HTMLElement.prototype.blur = vi.fn()
  }
}

// Mock clipboard API for copy/paste functionality
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([])
    }
  })
}

// Mock geolocation API
if (!navigator.geolocation) {
  Object.defineProperty(navigator, 'geolocation', {
    writable: true,
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    }
  })
}

// Set up consistent viewport for testing
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

// Mock getBoundingClientRect for layout calculations
if (typeof window.Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }))
}

// Suppress console warnings in tests unless needed for debugging
if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS) {
  console.warn = vi.fn()
  console.debug = vi.fn()
}

// Setup test isolation
beforeEach(() => {
  // Reset viewport to default for each test
  window.innerWidth = 1024
  window.innerHeight = 768
  
  // Clear any pending timers
  vi.clearAllTimers()
  
  // Reset all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  
  // Clear any added event listeners
  window.removeEventListener = vi.fn()
  
  // Reset any global state
  vi.restoreAllMocks()
})