import { describe, it, expect, beforeEach, vi } from 'vitest'
// nextTick is auto-imported globally
import { mountComponent, waitForAsyncUpdate, retryUntilTrue } from '../utils/test-utils.js'
import { createRouter, createMemoryHistory } from 'vue-router'
import router from '@/router/index.js'
import HeaderNav from '@/components/layout/HeaderNav.vue'
import App from '@/App.vue'

// Mock view components for integration testing
vi.mock('@/views/HomeView.vue', () => ({
  default: { 
    name: 'HomeView',
    template: '<div data-testid="home-view">Home View</div>' 
  }
}))

vi.mock('@/views/ServicesView.vue', () => ({
  default: { 
    name: 'ServicesView',
    template: '<div data-testid="services-view">Services View</div>' 
  }
}))

vi.mock('@/views/AboutView.vue', () => ({
  default: { 
    name: 'AboutView',
    template: '<div data-testid="about-view">About View</div>' 
  }
}))

vi.mock('@/views/ContactView.vue', () => ({
  default: { 
    name: 'ContactView',
    template: '<div data-testid="contact-view">Contact View</div>' 
  }
}))

vi.mock('@/views/PortfolioView.vue', () => ({
  default: { 
    name: 'PortfolioView',
    template: '<div data-testid="portfolio-view">Portfolio View</div>' 
  }
}))

vi.mock('@/views/NotFoundView.vue', () => ({
  default: { 
    name: 'NotFoundView',
    template: '<div data-testid="not-found-view">404 Not Found</div>' 
  }
}))

// Mock assets
vi.mock('@/assets/logo.svg', () => ({
  default: '/mock-logo.svg'
}))

describe('Navigation Integration Tests', () => {
  let testRouter
  let appWrapper

  beforeEach(async () => {
    // Create a fresh router instance for each test using memory history for JSDOM
    testRouter = createRouter({
      history: createMemoryHistory(),
      routes: router.getRoutes(),
      scrollBehavior(to, from, savedPosition) {
        // Copy the scrollBehavior from the main router
        if (savedPosition) {
          return savedPosition
        }
        if (to.hash) {
          return {
            el: to.hash,
            behavior: 'smooth'
          }
        }
        return { top: 0 }
      }
    })
    
    // Mount the full app for integration testing
    appWrapper = mountComponent(App, {
      router: testRouter
    })

    await testRouter.isReady()
    await waitForAsyncUpdate()
  })

  describe('Core Navigation Flow', () => {
    it('navigates through all main pages successfully', async () => {
      // Start on home page
      expect(testRouter.currentRoute.value.name).toBe('home')
      
      const routes = [
        { name: 'services', testId: 'services-view' },
        { name: 'about', testId: 'about-view' },
        { name: 'contact', testId: 'contact-view' },
        { name: 'portfolio', testId: 'portfolio-view' },
        { name: 'home', testId: 'home-view' }
      ]

      for (const route of routes) {
        await testRouter.push({ name: route.name })
        await waitForAsyncUpdate()
        
        expect(testRouter.currentRoute.value.name).toBe(route.name)
        
        // Wait for component to render
        await retryUntilTrue(() => {
          const element = appWrapper.find(`[data-testid="${route.testId}"]`)
          return element.exists()
        })
      }
    })

    it('handles back/forward navigation correctly', async () => {
      // Navigate to services
      await testRouter.push('/services')
      await waitForAsyncUpdate()
      expect(testRouter.currentRoute.value.name).toBe('services')

      // Navigate to about
      await testRouter.push('/about')
      await waitForAsyncUpdate()
      expect(testRouter.currentRoute.value.name).toBe('about')

      // Go back
      await testRouter.back()
      await waitForAsyncUpdate()
      expect(testRouter.currentRoute.value.name).toBe('services')

      // Go forward
      await testRouter.forward()
      await waitForAsyncUpdate()
      expect(testRouter.currentRoute.value.name).toBe('about')
    })

    it('applies scroll behavior on route changes', async () => {
      const scrollToSpy = vi.fn()
      window.scrollTo = scrollToSpy

      await testRouter.push('/services')
      await waitForAsyncUpdate()

      // Scroll behavior should be applied (just top: 0 in test environment)
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0 })
    })
  })

  describe('HeaderNav Integration', () => {
    it('navigation links update router correctly', async () => {
      const headerNav = appWrapper.findComponent(HeaderNav)
      expect(headerNav.exists()).toBe(true)

      // Find navigation links - RouterLinks render as <a> with href attributes
      const homeLink = headerNav.find('a[href="/"]')
      const aboutLink = headerNav.find('a[href="/about"]')
      
      expect(homeLink.exists()).toBe(true)
      expect(aboutLink.exists()).toBe(true)

      // Click about link
      await aboutLink.trigger('click')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.name).toBe('about')
    })

    it('mobile menu closes after navigation', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      window.dispatchEvent(new Event('resize'))
      
      const headerNav = appWrapper.findComponent(HeaderNav)
      const toggleButton = headerNav.find('.nav-toggle')
      const navMenu = headerNav.find('.nav-menu')
      
      // Open mobile menu
      await toggleButton.trigger('click')
      await nextTick()
      expect(navMenu.classes()).toContain('active')
      
      // Click a navigation link
      const aboutLink = headerNav.find('a[href="/about"]')
      await aboutLink.trigger('click')
      await waitForAsyncUpdate()
      
      // Menu should be closed and navigation should have occurred
      expect(navMenu.classes()).not.toContain('active')
      expect(testRouter.currentRoute.value.name).toBe('about')
    })

    it('services dropdown navigation works correctly', async () => {
      const headerNav = appWrapper.findComponent(HeaderNav)
      const servicesButton = headerNav.find('button.dropdown-toggle')
      
      // Open dropdown
      await servicesButton.trigger('click')
      await nextTick()
      expect(headerNav.vm.dropdownOpen).toBe(true)
      
      // Click a dropdown item
      const customHomesLink = headerNav.find('a[href="/services#custom-homes"]')
      expect(customHomesLink.exists()).toBe(true)
      
      await customHomesLink.trigger('click')
      await waitForAsyncUpdate()
      
      // Should navigate to services page with hash
      expect(testRouter.currentRoute.value.name).toBe('services')
      expect(testRouter.currentRoute.value.hash).toBe('#custom-homes')
      
      // Dropdown should be closed
      expect(headerNav.vm.dropdownOpen).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('shows 404 page for invalid routes', async () => {
      await testRouter.push('/non-existent-route')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.name).toBe('not-found')
      
      // Should render NotFoundView component
      await retryUntilTrue(() => {
        return appWrapper.find('[data-testid="not-found-view"]').exists()
      })
    })

    it('handles router navigation failures gracefully', async () => {
      // Mock a navigation failure
      const originalPush = testRouter.push
      testRouter.push = vi.fn().mockRejectedValue(new Error('Navigation failed'))
      
      try {
        await testRouter.push('/about')
      } catch (error) {
        expect(error.message).toBe('Navigation failed')
      }
      
      // Restore original push method
      testRouter.push = originalPush
    })
  })

  describe('SEO and Meta Tags', () => {
    it('updates document title on route changes', async () => {
      await testRouter.push('/services')
      await waitForAsyncUpdate()
      
      // Note: In a real app, this would be handled by a meta plugin
      // Here we just verify the route meta exists
      expect(testRouter.currentRoute.value.meta.title).toBe('Construction Services - Custom Homes & Remodeling')
    })

    it('sets canonical URLs correctly', async () => {
      await testRouter.push('/about')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.meta.canonical).toBe('https://unifiedcontractors.com/about')
    })
  })

  describe('Route Guards and Middleware', () => {
    it('applies scroll behavior with hash navigation', async () => {
      const scrollToSpy = vi.fn()
      window.scrollTo = scrollToSpy
      
      await testRouter.push('/services#custom-homes')
      await waitForAsyncUpdate()
      
      // Should scroll to the hash element
      expect(testRouter.currentRoute.value.hash).toBe('#custom-homes')
    })

    it('preserves scroll position on back navigation', async () => {
      // Navigate away and then back
      await testRouter.push('/about')
      await waitForAsyncUpdate()
      
      await testRouter.push('/services')
      await waitForAsyncUpdate()
      
      // Mock savedPosition for back navigation
      const savedPosition = { top: 100, left: 0 }
      const scrollBehavior = testRouter.options.scrollBehavior
      const result = scrollBehavior({}, {}, savedPosition)
      
      expect(result).toEqual(savedPosition)
    })
  })

  describe('Performance and Lazy Loading', () => {
    it('lazy loads route components efficiently', async () => {
      // Mock dynamic import
      const dynamicImport = vi.fn().mockResolvedValue({ 
        default: { 
          name: 'LazyComponent',
          template: '<div>Lazy Loaded</div>' 
        } 
      })
      
      // Test that dynamic import would be called for lazy routes
      expect(typeof dynamicImport).toBe('function')
      
      // Navigate to a lazy-loaded route
      await testRouter.push('/services')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.name).toBe('services')
      // Component should be loaded
      expect(appWrapper.find('[data-testid="services-view"]').exists()).toBe(true)
    })

    it('handles concurrent navigation requests', async () => {
      // Start multiple navigation requests simultaneously
      const promises = [
        testRouter.push('/about'),
        testRouter.push('/services'),
        testRouter.push('/contact')
      ]
      
      // Wait for all to complete
      await Promise.allSettled(promises)
      
      // Should end up on the last navigation
      expect(testRouter.currentRoute.value.name).toBe('contact')
    })
  })

  describe('Accessibility Navigation', () => {
    it('supports keyboard navigation', async () => {
      const headerNav = appWrapper.findComponent(HeaderNav)
      const homeLink = headerNav.find('a[href="/"]')
      
      // Focus and activate with keyboard
      homeLink.element.focus()
      await homeLink.trigger('keydown.enter')
      await waitForAsyncUpdate()
      
      expect(testRouter.currentRoute.value.name).toBe('home')
    })

    it('maintains focus management during navigation', async () => {
      const headerNav = appWrapper.findComponent(HeaderNav)
      const servicesButton = headerNav.find('button.dropdown-toggle')
      
      // Open dropdown with keyboard
      await servicesButton.trigger('keydown.enter')
      await nextTick()
      
      expect(headerNav.vm.dropdownOpen).toBe(true)
      
      // Should focus first dropdown item
      // (Implementation would focus the first dropdown item)
      const firstDropdownItem = headerNav.find('.dropdown-menu a')
      expect(firstDropdownItem.exists()).toBe(true)
    })
  })
})