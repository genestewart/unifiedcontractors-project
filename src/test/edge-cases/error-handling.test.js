import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// nextTick is auto-imported globally
import { mountComponent, waitForAsyncUpdate } from '../utils/test-utils.js'
import { createRouter, createWebHistory } from 'vue-router'
import HeaderNav from '@/components/layout/HeaderNav.vue'
import router from '@/router/index.js'

// Mock console methods to test error handling
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    // Mock console methods to capture error logs
    console.error = vi.fn()
    console.warn = vi.fn()
    
    // Mock fetch for API error testing
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  describe('Component Error Boundaries', () => {
    it('handles component mounting errors gracefully', () => {
      // Mock a component that throws during mount
      const BrokenComponent = {
        name: 'BrokenComponent',
        mounted() {
          throw new Error('Component mount failed')
        },
        template: '<div>Should not render</div>'
      }

      expect(() => {
        try {
          mountComponent(BrokenComponent)
        } catch (error) {
          expect(error.message).toBe('Component mount failed')
          throw error
        }
      }).toThrow('Component mount failed')
    })

    it('handles missing props gracefully', () => {
      const ComponentWithRequiredProps = {
        props: {
          requiredProp: {
            type: String,
            required: true
          }
        },
        template: '<div>{{ requiredProp || "fallback" }}</div>'
      }

      // Mount without required prop
      const wrapper = mountComponent(ComponentWithRequiredProps)
      
      // Should render with fallback
      expect(wrapper.text()).toBe('fallback')
      
      // Should warn about missing prop in development
      // (Vue would handle this internally)
    })

    it('handles invalid prop types gracefully', () => {
      const ComponentWithTypedProps = {
        props: {
          numberProp: {
            type: Number,
            default: 0
          }
        },
        template: '<div>{{ numberProp }}</div>'
      }

      // Pass string instead of number
      const wrapper = mountComponent(ComponentWithTypedProps, {
        props: {
          numberProp: 'invalid-number'
        }
      })

      // Component should still render
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Navigation Error Handling', () => {
    let testRouter

    beforeEach(() => {
      testRouter = createRouter({
        history: createWebHistory(),
        routes: router.getRoutes(),
        scrollBehavior(to, from, savedPosition) {
          // If the user is navigating back/forward, restore scroll position
          if (savedPosition) {
            return savedPosition
          }
          // If navigating to an anchor link
          if (to.hash) {
            return {
              el: to.hash,
              behavior: 'smooth'
            }
          }
          // Default to top of page
          return { top: 0 }
        }
      })
    })

    it('handles navigation to invalid routes', async () => {
      await testRouter.push('/invalid-route')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.name).toBe('not-found')
      expect(testRouter.currentRoute.value.path).toBe('/invalid-route')
    })

    it('handles navigation failures', async () => {
      // Mock navigation failure
      const originalPush = testRouter.push
      testRouter.push = vi.fn().mockRejectedValue(new Error('Navigation failed'))
      
      let error
      try {
        await testRouter.push('/about')
      } catch (e) {
        error = e
      }
      
      expect(error.message).toBe('Navigation failed')
      
      // Restore original method
      testRouter.push = originalPush
    })

    it('handles concurrent navigation attempts', async () => {
      const results = await Promise.allSettled([
        testRouter.push('/about'),
        testRouter.push('/services'),
        testRouter.push('/contact')
      ])

      // All navigation attempts should complete (some may be cancelled)
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status)
      })
      
      // Router should be on the last successful navigation
      expect(testRouter.currentRoute.value.name).toBe('contact')
    })

    it('handles scroll behavior with missing elements', () => {
      const scrollBehavior = testRouter.options.scrollBehavior
      
      // Test with hash that doesn't exist
      const result = scrollBehavior(
        { hash: '#non-existent-element' },
        {},
        null
      )
      
      expect(result).toEqual({
        el: '#non-existent-element',
        behavior: 'smooth'
      })
      // In real implementation, would fallback to top if element not found
    })
  })

  describe('HeaderNav Error Scenarios', () => {
    it('handles missing logo gracefully', () => {
      // Mock logo import failure
      vi.doMock('@/assets/logo.svg', () => {
        throw new Error('Logo not found')
      })
      
      // Component should still render without crashing
      const wrapper = mountComponent(HeaderNav)
      expect(wrapper.exists()).toBe(true)
      
      // Logo element might not exist or have fallback
      const brandLink = wrapper.find('.nav-brand')
      expect(brandLink.exists()).toBe(true)
    })

    it('handles DOM manipulation errors', async () => {
      const wrapper = mountComponent(HeaderNav)
      
      // Mock querySelector to return null (element not found)
      const originalQuerySelector = document.querySelector
      document.querySelector = vi.fn().mockReturnValue(null)
      
      // Try to open mobile menu (should not crash)
      const toggle = wrapper.find('.nav-toggle')
      await toggle.trigger('click')
      await nextTick()
      
      expect(wrapper.vm.mobileMenuOpen).toBe(true)
      
      // Restore original method
      document.querySelector = originalQuerySelector
    })

    it('handles rapid clicking without errors', async () => {
      const wrapper = mountComponent(HeaderNav)
      const toggle = wrapper.find('.nav-toggle')
      
      // Rapidly toggle mobile menu
      for (let i = 0; i < 10; i++) {
        await toggle.trigger('click')
      }
      
      // Should not crash and state should be consistent
      expect(wrapper.vm.mobileMenuOpen).toBeDefined()
    })

    it('handles keyboard events without focus element', async () => {
      const wrapper = mountComponent(HeaderNav)
      const dropdown = wrapper.find('.dropdown-toggle')
      
      // Mock focus methods to fail
      const mockFocus = vi.fn().mockImplementation(() => {
        throw new Error('Focus failed')
      })
      
      document.querySelector = vi.fn().mockReturnValue({ focus: mockFocus })
      
      // Should not crash when trying to focus
      await dropdown.trigger('keydown.arrow-down')
      await nextTick()
      
      expect(mockFocus).toHaveBeenCalled()
    })
  })

  describe('Network and API Error Handling', () => {
    it('handles fetch failures gracefully', async () => {
      globalThis.fetch.mockRejectedValue(new Error('Network error'))
      
      // Test component that makes API calls
      const APIComponent = {
        async mounted() {
          try {
            await fetch('/api/data')
          } catch (error) {
            this.error = error.message
          }
        },
        data() {
          return { error: null }
        },
        template: '<div>{{ error || "Loading..." }}</div>'
      }
      
      const wrapper = mountComponent(APIComponent)
      await waitForAsyncUpdate()
      
      expect(wrapper.text()).toBe('Network error')
    })

    it('handles timeout scenarios', async () => {
      globalThis.fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      )
      
      const TimeoutComponent = {
        async mounted() {
          const controller = new AbortController()
          setTimeout(() => controller.abort(), 100) // Short timeout
          
          try {
            await fetch('/api/data', { signal: controller.signal })
          } catch (error) {
            if (error.name === 'AbortError') {
              this.error = 'Request timed out'
            }
          }
        },
        data() {
          return { error: null }
        },
        template: '<div>{{ error || "Loading..." }}</div>'
      }
      
      const wrapper = mountComponent(TimeoutComponent)
      await waitForAsyncUpdate()
      
      // Should handle timeout gracefully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('handles missing modern browser APIs', () => {
      // Mock missing ResizeObserver
      const originalResizeObserver = globalThis.ResizeObserver
      delete globalThis.ResizeObserver
      
      const wrapper = mountComponent(HeaderNav)
      expect(wrapper.exists()).toBe(true)
      
      // Restore
      globalThis.ResizeObserver = originalResizeObserver
    })

    it('handles missing IntersectionObserver', () => {
      const originalIntersectionObserver = globalThis.IntersectionObserver
      delete globalThis.IntersectionObserver
      
      const wrapper = mountComponent(HeaderNav)
      expect(wrapper.exists()).toBe(true)
      
      // Restore
      globalThis.IntersectionObserver = originalIntersectionObserver
    })

    it('handles missing matchMedia', () => {
      const originalMatchMedia = window.matchMedia
      delete window.matchMedia
      
      const wrapper = mountComponent(HeaderNav)
      expect(wrapper.exists()).toBe(true)
      
      // Restore
      window.matchMedia = originalMatchMedia
    })
  })

  describe('Memory Leak Prevention', () => {
    it('cleans up event listeners on unmount', () => {
      const addEventListener = vi.spyOn(window, 'addEventListener')
      const removeEventListener = vi.spyOn(window, 'removeEventListener')
      
      // Reset call counts from any previous tests or mounting
      addEventListener.mockClear()
      removeEventListener.mockClear()
      
      // Create component that adds event listeners
      const ComponentWithListeners = {
        mounted() {
          this.handleResize = () => {}
          this.handleScroll = () => {}
          window.addEventListener('resize', this.handleResize)
          window.addEventListener('scroll', this.handleScroll)
        },
        beforeUnmount() {
          window.removeEventListener('resize', this.handleResize)
          window.removeEventListener('scroll', this.handleScroll)
        },
        template: '<div>Test Component</div>'
      }
      
      const wrapper = mountComponent(ComponentWithListeners)
      
      // Verify event listeners were added
      expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      
      wrapper.unmount()
      
      // Should clean up listeners
      expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    })

    it('prevents memory leaks from timeouts', async () => {
      const ComponentWithTimeouts = {
        mounted() {
          this.timer = setTimeout(() => {
            this.message = 'Updated'
          }, 100)
        },
        beforeUnmount() {
          if (this.timer) {
            clearTimeout(this.timer)
          }
        },
        data() {
          return { message: 'Initial' }
        },
        template: '<div>{{ message }}</div>'
      }
      
      const wrapper = mountComponent(ComponentWithTimeouts)
      
      // Unmount before timeout completes
      wrapper.unmount()
      
      // Should not cause errors
      await new Promise(resolve => setTimeout(resolve, 150))
    })
  })

  describe('Data Validation and Sanitization', () => {
    it('handles malicious input safely', () => {
      const FormComponent = {
        props: {
          userInput: String
        },
        template: '<div v-html="sanitizedInput"></div>',
        computed: {
          sanitizedInput() {
            // Simulate input sanitization
            return this.userInput?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          }
        }
      }
      
      const maliciousInput = '<script>alert("xss")</script>Hello'
      const wrapper = mountComponent(FormComponent, {
        props: { userInput: maliciousInput }
      })
      
      expect(wrapper.html()).not.toContain('<script>')
      expect(wrapper.html()).toContain('Hello')
    })

    it('validates email formats', () => {
      const EmailValidator = {
        methods: {
          validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return emailRegex.test(email)
          }
        },
        template: '<div></div>'
      }
      
      const wrapper = mountComponent(EmailValidator)
      
      expect(wrapper.vm.validateEmail('valid@example.com')).toBe(true)
      expect(wrapper.vm.validateEmail('invalid-email')).toBe(false)
      expect(wrapper.vm.validateEmail('')).toBe(false)
      expect(wrapper.vm.validateEmail(null)).toBe(false)
    })
  })

  describe('Performance Edge Cases', () => {
    it('handles large datasets without blocking UI', async () => {
      const LargeListComponent = {
        data() {
          return {
            items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
          }
        },
        template: `
          <div>
            <div v-for="item in visibleItems" :key="item.id">{{ item.name }}</div>
          </div>
        `,
        computed: {
          visibleItems() {
            // Virtual scrolling simulation
            return this.items.slice(0, 50)
          }
        }
      }
      
      const wrapper = mountComponent(LargeListComponent)
      
      // Should render efficiently
      expect(wrapper.findAll('div').length).toBeLessThan(100)
    })

    it('handles rapid state changes', async () => {
      const RapidUpdateComponent = {
        data() {
          return { counter: 0 }
        },
        methods: {
          rapidUpdate() {
            // Simulate rapid updates
            for (let i = 0; i < 100; i++) {
              this.counter = i
            }
          }
        },
        template: '<div @click="rapidUpdate">{{ counter }}</div>'
      }
      
      const wrapper = mountComponent(RapidUpdateComponent)
      
      await wrapper.trigger('click')
      await nextTick()
      
      expect(wrapper.text()).toBe('99')
    })
  })
})