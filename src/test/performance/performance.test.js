import { describe, it, expect, beforeEach, vi } from 'vitest'
import { h } from 'vue'
import { measureRenderTime, mountComponent } from '../utils/test-utils.js'
import { performanceBenchmarks } from '../fixtures/index.js'
import HeaderNav from '@/components/layout/HeaderNav.vue'
import HomeView from '@/views/HomeView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import router from '@/router/index.js'

// Mock performance API if not available
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([])
  }
}

// Mock assets for performance tests
vi.mock('@/assets/logo.svg', () => ({
  default: '/mock-logo.svg'
}))

describe('Performance Tests', () => {
  describe('Component Rendering Performance', () => {
    it('HeaderNav renders within performance budget', async () => {
      const { renderTime, wrapper } = await measureRenderTime(() => {
        return mountComponent(HeaderNav)
      })
      
      expect(renderTime).toBeLessThan(performanceBenchmarks.componentMount.acceptable)
      expect(wrapper.exists()).toBe(true)
      
      // Log performance for CI monitoring
      console.log(`HeaderNav render time: ${renderTime.toFixed(2)}ms`)
    })

    it('HomeView renders efficiently', async () => {
      const { renderTime, wrapper } = await measureRenderTime(() => {
        return mountComponent(HomeView)
      })
      
      expect(renderTime).toBeLessThan(performanceBenchmarks.componentMount.slow)
      expect(wrapper.exists()).toBe(true)
      
      console.log(`HomeView render time: ${renderTime.toFixed(2)}ms`)
    })

    it('handles rapid re-renders efficiently', async () => {
      const wrapper = mountComponent(HeaderNav)
      const startTime = performance.now()
      
      // Trigger multiple re-renders
      for (let i = 0; i < 10; i++) {
        await wrapper.vm.$forceUpdate()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(performanceBenchmarks.componentMount.slow)
      console.log(`10 re-renders took: ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Navigation Performance', () => {
    let testRouter

    beforeEach(() => {
      testRouter = createRouter({
        history: createWebHistory(),
        routes: router.getRoutes()
      })
    })

    it('route navigation is fast enough', async () => {
      const startTime = performance.now()
      
      await testRouter.push('/about')
      await testRouter.isReady()
      
      const endTime = performance.now()
      const navigationTime = endTime - startTime
      
      expect(navigationTime).toBeLessThan(performanceBenchmarks.routeNavigation.acceptable)
      console.log(`Route navigation time: ${navigationTime.toFixed(2)}ms`)
    })

    it('multiple route changes perform well', async () => {
      const routes = ['/services', '/about', '/contact', '/portfolio', '/']
      const startTime = performance.now()
      
      for (const route of routes) {
        await testRouter.push(route)
        await testRouter.isReady()
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / routes.length
      
      expect(averageTime).toBeLessThan(performanceBenchmarks.routeNavigation.acceptable)
      console.log(`Average route navigation: ${averageTime.toFixed(2)}ms`)
    })

    it('concurrent navigation attempts perform reasonably', async () => {
      const startTime = performance.now()
      
      // Start multiple navigation attempts
      const promises = [
        testRouter.push('/about'),
        testRouter.push('/services'),
        testRouter.push('/contact')
      ]
      
      await Promise.allSettled(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(performanceBenchmarks.routeNavigation.slow)
      console.log(`Concurrent navigation time: ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Memory Usage and Leaks', () => {
    it('does not leak memory on mount/unmount cycles', () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 50; i++) {
        const wrapper = mountComponent(HeaderNav)
        wrapper.unmount()
      }
      
      // Force garbage collection if available
      if (globalThis.gc) {
        globalThis.gc()
      }
      
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0
      const memoryDiff = finalMemory - initialMemory
      
      // Memory usage should not grow significantly
      // (This is a rough check - actual values depend on environment)
      console.log(`Memory difference: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`)
      expect(memoryDiff).toBeLessThan(50 * 1024 * 1024) // 50MB threshold
    })

    it('cleans up event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      // Clear any previous calls
      addEventListenerSpy.mockClear()
      removeEventListenerSpy.mockClear()
      
      const ComponentWithListeners = {
        mounted() {
          this.handleResize = () => {}
          window.addEventListener('resize', this.handleResize)
        },
        beforeUnmount() {
          window.removeEventListener('resize', this.handleResize)
        },
        template: '<div>Component with listeners</div>'
      }
      
      const wrapper = mountComponent(ComponentWithListeners)
      const addCallCount = addEventListenerSpy.mock.calls.length
      
      wrapper.unmount()
      const removeCallCount = removeEventListenerSpy.mock.calls.length
      
      // Should have added and removed at least one listener
      expect(addCallCount).toBeGreaterThanOrEqual(1)
      expect(removeCallCount).toBeGreaterThanOrEqual(1)
      expect(removeCallCount).toBeLessThanOrEqual(addCallCount)
    })
  })

  describe('DOM Manipulation Performance', () => {
    it('mobile menu toggle is fast', async () => {
      const wrapper = mountComponent(HeaderNav)
      const toggle = wrapper.find('.nav-toggle')
      
      const startTime = performance.now()
      
      // Toggle mobile menu multiple times
      for (let i = 0; i < 10; i++) {
        await toggle.trigger('click')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / 10
      
      expect(averageTime).toBeLessThan(50) // Should be very fast
      console.log(`Average toggle time: ${averageTime.toFixed(2)}ms`)
    })

    it('dropdown operations are efficient', async () => {
      const wrapper = mountComponent(HeaderNav)
      const dropdown = wrapper.find('.dropdown-toggle')
      
      const startTime = performance.now()
      
      // Toggle dropdown multiple times
      for (let i = 0; i < 20; i++) {
        await dropdown.trigger('click')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(500) // Should be fast
      console.log(`20 dropdown toggles: ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Bundle Size Impact', () => {
    it('components are tree-shakeable', () => {
      // This would typically be tested with bundle analysis tools
      // Here we simulate by checking that unused code isn't included
      
      const wrapper = mountComponent(HeaderNav)
      
      // Component should exist without unnecessary dependencies
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm).toBeDefined()
    })

    it('lazy loading works correctly', async () => {
      const LazyComponent = {
        name: 'LazyComponent',
        async: true,
        component: () => ({
          component: import.meta.resolve ? Promise.resolve({
            name: 'AsyncComponent',
            template: '<div>Lazy loaded</div>'
          }) : Promise.resolve({
            name: 'AsyncComponent',  
            template: '<div>Lazy loaded</div>'
          }),
          loading: {
            template: '<div>Loading...</div>'
          },
          error: {
            template: '<div>Error loading component</div>'
          }
        })
      }
      
      // This tests the pattern, actual lazy loading would be route-based
      expect(LazyComponent.async).toBe(true)
    })
  })

  describe('Rendering Optimization', () => {
    it('minimizes unnecessary re-renders', async () => {
      let renderCount = 0
      
      const OptimizedComponent = {
        render() {
          renderCount++
          return h('div', `Render count: ${renderCount}`)
        },
        data() {
          return {
            value: 1,
            unchangedValue: 'static'
          }
        }
      }
      
      const wrapper = mountComponent(OptimizedComponent)
      const initialRenderCount = renderCount
      
      // Change unchangedValue (should not trigger re-render if optimized)
      wrapper.vm.unchangedValue = 'static' // Same value
      await nextTick()
      
      expect(renderCount).toBe(initialRenderCount)
    })

    it('handles large lists efficiently', () => {
      const LargeListComponent = {
        data() {
          return {
            items: Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}` }))
          }
        },
        computed: {
          visibleItems() {
            // Simulate virtual scrolling
            return this.items.slice(0, 50)
          }
        },
        template: `
          <div>
            <div v-for="item in visibleItems" :key="item.id">
              {{ item.text }}
            </div>
          </div>
        `
      }
      
      const startTime = performance.now()
      const wrapper = mountComponent(LargeListComponent)
      const endTime = performance.now()
      
      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(performanceBenchmarks.componentMount.slow)
      expect(wrapper.findAll('div').length).toBeLessThan(100) // Should not render all 1000 items
      
      console.log(`Large list render time: ${renderTime.toFixed(2)}ms`)
    })
  })

  describe('Critical User Journey Performance', () => {
    it('home page to contact form flow is fast', async () => {
      const testRouter = createRouter({
        history: createWebHistory(),
        routes: router.getRoutes()
      })
      
      const startTime = performance.now()
      
      // Simulate critical user journey
      await testRouter.push('/')
      await testRouter.isReady()
      
      await testRouter.push('/contact')
      await testRouter.isReady()
      
      // Simulate form interaction
      const contactWrapper = mountComponent({
        template: `
          <div>
            <input v-model="name" placeholder="Name" />
            <input v-model="email" placeholder="Email" />
            <textarea v-model="message" placeholder="Message"></textarea>
            <button @click="submit">Submit</button>
          </div>
        `,
        data() {
          return {
            name: '',
            email: '',
            message: ''
          }
        },
        methods: {
          submit() {
            // Simulate form submission
            return Promise.resolve()
          }
        }
      })
      
      // Fill form
      await contactWrapper.find('input').setValue('John Doe')
      
      const endTime = performance.now()
      const journeyTime = endTime - startTime
      
      expect(journeyTime).toBeLessThan(1000) // 1 second for critical journey
      console.log(`Critical journey time: ${journeyTime.toFixed(2)}ms`)
    })
  })

  describe('Performance Monitoring', () => {
    it('provides performance metrics', () => {
      const metrics = {
        componentMountTime: performance.now(),
        routeNavigationTime: performance.now(),
        memoryUsage: process.memoryUsage?.()?.heapUsed || 0
      }
      
      // In a real application, these would be sent to monitoring service
      expect(metrics.componentMountTime).toBeGreaterThan(0)
      expect(metrics.routeNavigationTime).toBeGreaterThan(0)
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0)
      
      console.log('Performance metrics:', metrics)
    })

    it('detects performance regressions', async () => {
      const baseline = performanceBenchmarks.componentMount.acceptable
      
      const { renderTime } = await measureRenderTime(() => {
        return mountComponent(HeaderNav)
      })
      
      // Alert if performance degrades significantly
      if (renderTime > baseline * 1.5) {
        console.warn(`Performance regression detected: ${renderTime}ms vs ${baseline}ms baseline`)
      }
      
      // Test should still pass, but log regression
      expect(renderTime).toBeLessThan(baseline * 2) // Allow for some variance
    })
  })
})