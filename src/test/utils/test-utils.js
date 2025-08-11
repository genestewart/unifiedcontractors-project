import { mount, flushPromises } from '@vue/test-utils'
// nextTick is auto-imported globally
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

// Create a test router with minimal routes
export const createTestRouter = (routes = []) => {
  const defaultRoutes = [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/about', name: 'about', component: { template: '<div>About</div>' } },
    { path: '/services', name: 'services', component: { template: '<div>Services</div>' } },
    { path: '/contact', name: 'contact', component: { template: '<div>Contact</div>' } },
    { path: '/portfolio', name: 'portfolio', component: { template: '<div>Portfolio</div>' } }
  ]
  
  return createRouter({
    history: createWebHistory(),
    routes: routes.length > 0 ? routes : defaultRoutes
  })
}

// Create a test pinia instance
export const createTestPinia = () => {
  return createPinia()
}

// Enhanced render function with common providers (deprecated, use mountComponent instead)
export const renderWithProviders = (component, options = {}) => {
  console.warn('renderWithProviders is deprecated, please use mountComponent instead')
  return mountComponent(component, options)
}

// Helper to wait for Vue's next tick multiple times
export const waitForTicks = async (ticks = 1) => {
  for (let i = 0; i < ticks; i++) {
    await nextTick()
  }
}

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
})

export const mockProject = (overrides = {}) => ({
  id: 1,
  title: 'Test Project',
  description: 'A test project description',
  image: '/test-image.jpg',
  category: 'residential',
  ...overrides
})

// Enhanced waiting utilities for better test reliability
export const waitForAsyncUpdate = async () => {
  await flushPromises()
  await nextTick()
}

// Retry helper for flaky DOM operations
export const retryUntilTrue = async (fn, maxRetries = 10, delay = 50) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()
      if (result) return result
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  throw new Error(`Condition not met after ${maxRetries} retries`)
}

// Robust element finder with retries
export const findElementWithRetry = async (wrapper, selector, timeout = 1000) => {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const element = wrapper.find(selector)
    if (element.exists()) {
      return element
    }
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`)
}

// Mock PrimeVue components for consistent testing
export const mockPrimeVueComponents = () => {
  return {
    Button: {
      template: '<button class="p-button" v-bind="$attrs" @click="$emit(\'click\', $event)"><slot /></button>',
      emits: ['click']
    },
    InputText: {
      template: '<input class="p-inputtext" v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue'],
      emits: ['update:modelValue']
    },
    Textarea: {
      template: '<textarea class="p-inputtextarea" v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
      props: ['modelValue'],
      emits: ['update:modelValue']
    }
  }
}

// Create test environment with consistent setup
export const createTestEnvironment = (options = {}) => {
  const router = options.router || createTestRouter()
  const pinia = options.pinia || createTestPinia()
  
  // Mock global objects consistently
  globalThis.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
  
  globalThis.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
  
  // Mock matchMedia for responsive tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: options.mobileView || false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
  
  return { router, pinia }
}

// Enhanced component mounting with better error handling
export const mountComponent = (component, options = {}) => {
  const { router, pinia } = createTestEnvironment(options)
  
  const defaultGlobal = {
    plugins: [router, pinia],
    stubs: {
      RouterLink: {
        template: '<a class="router-link" :href="to" @click="$emit(\'click\', $event)"><slot /></a>',
        props: ['to'],
        emits: ['click']
      },
      RouterView: {
        template: '<div class="router-view"><slot /></div>'
      },
      ...mockPrimeVueComponents(),
      ...options.stubs
    },
    mocks: {
      $t: (key) => key, // i18n mock
      ...options.mocks
    }
  }
  
  const mergedOptions = {
    ...options,
    global: {
      ...defaultGlobal,
      ...options.global,
      plugins: [
        ...(defaultGlobal.plugins || []),
        ...(options.global?.plugins || [])
      ],
      stubs: {
        ...defaultGlobal.stubs,
        ...options.global?.stubs
      },
      mocks: {
        ...defaultGlobal.mocks,
        ...options.global?.mocks
      }
    }
  }
  
  try {
    const wrapper = mount(component, mergedOptions)
    return wrapper
  } catch (error) {
    console.error('Failed to mount component:', error)
    throw error
  }
}

// Accessibility testing helpers
export const getAccessibilityViolations = async (wrapper) => {
  const violations = []
  const element = wrapper.element
  
  // Check for missing alt text on images
  const images = element.querySelectorAll('img')
  images.forEach((img, index) => {
    if (!img.getAttribute('alt')) {
      violations.push(`Image at index ${index} is missing alt attribute`)
    }
  })
  
  // Check for missing labels on form inputs
  const inputs = element.querySelectorAll('input, textarea, select')
  inputs.forEach((input, index) => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`)
    if (!hasLabel) {
      violations.push(`Form input at index ${index} is missing accessible label`)
    }
  })
  
  // Check for missing roles on interactive elements
  const buttons = element.querySelectorAll('button')
  buttons.forEach((button, index) => {
    if (button.getAttribute('role') === 'button' && !button.getAttribute('aria-label') && !button.textContent.trim()) {
      violations.push(`Button at index ${index} has no accessible name`)
    }
  })
  
  return violations
}

// Performance testing helpers
export const measureRenderTime = async (mountFn) => {
  const startTime = performance.now()
  const wrapper = await mountFn()
  const endTime = performance.now()
  return {
    renderTime: endTime - startTime,
    wrapper
  }
}

// Network request mocking helpers
export const createMockFetch = (responses = {}) => {
  return vi.fn().mockImplementation((url) => {
    if (responses[url]) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[url])
      })
    }
    return Promise.reject(new Error(`No mock response for ${url}`))
  })
}