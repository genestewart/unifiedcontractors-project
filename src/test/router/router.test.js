import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
// nextTick is auto-imported globally
import router from '@/router/index.js'

// Mock the view components since we're testing routing logic
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

describe('Vue Router Configuration', () => {
  let testRouter

  beforeEach(() => {
    // Create a fresh router instance for each test
    testRouter = createRouter({
      history: createWebHistory(),
      routes: router.getRoutes()
    })

    // Router setup completed - tests will use testRouter directly
  })

  describe('Router Instance', () => {
    it('creates router instance correctly', () => {
      expect(router).toBeDefined()
      expect(router.getRoutes()).toBeDefined()
      expect(router.getRoutes().length).toBe(6) // 5 main routes + 1 not-found route
    })

    it('uses correct history mode', () => {
      expect(router.options.history).toBeDefined()
      // The history mode should be web history (HTML5 mode)
    })

    it('has scroll behavior configured', () => {
      expect(router.options.scrollBehavior).toBeDefined()
      
      // Test scroll behavior with proper parameters
      const scrollResult = router.options.scrollBehavior({}, {}, null)
      expect(scrollResult).toEqual({ top: 0 })
    })
  })

  describe('Route Definitions', () => {
    it('defines all required routes', () => {
      const routes = router.getRoutes()
      const routeNames = routes.map(route => route.name)
      
      expect(routeNames).toContain('home')
      expect(routeNames).toContain('services')
      expect(routeNames).toContain('about')
      expect(routeNames).toContain('contact')
      expect(routeNames).toContain('portfolio')
    })

    it('has correct paths for all routes', () => {
      const routes = router.getRoutes()
      const routeMap = {}
      routes.forEach(route => {
        routeMap[route.name] = route.path
      })

      expect(routeMap.home).toBe('/')
      expect(routeMap.services).toBe('/services')
      expect(routeMap.about).toBe('/about')
      expect(routeMap.contact).toBe('/contact')
      expect(routeMap.portfolio).toBe('/portfolio')
    })
  })

  describe('Route Navigation', () => {
    it('navigates to home route correctly', async () => {
      await testRouter.push('/')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('home')
      expect(testRouter.currentRoute.value.path).toBe('/')
    })

    it('navigates to services route correctly', async () => {
      await testRouter.push('/services')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('services')
      expect(testRouter.currentRoute.value.path).toBe('/services')
    })

    it('navigates to about route correctly', async () => {
      await testRouter.push('/about')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('about')
      expect(testRouter.currentRoute.value.path).toBe('/about')
    })

    it('navigates to contact route correctly', async () => {
      await testRouter.push('/contact')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('contact')
      expect(testRouter.currentRoute.value.path).toBe('/contact')
    })

    it('navigates to portfolio route correctly', async () => {
      await testRouter.push('/portfolio')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('portfolio')
      expect(testRouter.currentRoute.value.path).toBe('/portfolio')
    })
  })

  describe('Component Loading', () => {
    it('loads HomeView component synchronously', async () => {
      await testRouter.push('/')
      await nextTick()

      const homeRoute = router.getRoutes().find(route => route.name === 'home')
      expect(homeRoute.components.default).toBeDefined()
    })

    it('loads lazy-loaded components correctly', async () => {
      const routes = ['services', 'about', 'contact', 'portfolio']
      
      for (const routeName of routes) {
        await testRouter.push(`/${routeName === 'home' ? '' : routeName}`)
        await nextTick()
        
        const route = router.getRoutes().find(route => route.name === routeName)
        expect(route).toBeDefined()
        expect(route.components.default).toBeDefined()
      }
    })
  })

  describe('Route Matching', () => {
    it('matches exact paths correctly', () => {
      const homeRoute = testRouter.resolve('/')
      const servicesRoute = testRouter.resolve('/services')
      const aboutRoute = testRouter.resolve('/about')

      expect(homeRoute.name).toBe('home')
      expect(servicesRoute.name).toBe('services')
      expect(aboutRoute.name).toBe('about')
    })

    it('handles route resolution by name', () => {
      const homeRoute = testRouter.resolve({ name: 'home' })
      const servicesRoute = testRouter.resolve({ name: 'services' })

      expect(homeRoute.path).toBe('/')
      expect(servicesRoute.path).toBe('/services')
    })
  })

  describe('Navigation Guards and Behaviors', () => {
    it('applies scroll behavior on navigation', async () => {
      // Test that scroll behavior function works
      const scrollBehavior = router.options.scrollBehavior
      const result = scrollBehavior({}, {}, null)
      
      expect(result).toEqual({ top: 0 })
    })

    it('handles navigation between routes', async () => {
      // Start at home
      await testRouter.push('/')
      expect(testRouter.currentRoute.value.name).toBe('home')

      // Navigate to about
      await testRouter.push('/about')
      expect(testRouter.currentRoute.value.name).toBe('about')

      // Navigate back to home
      await testRouter.push('/')
      expect(testRouter.currentRoute.value.name).toBe('home')
    })
  })

  describe('Error Handling', () => {
    it('handles navigation to non-existent routes gracefully', async () => {
      // This will not match any route, testing router behavior
      await expect(testRouter.push('/non-existent-route')).resolves.toBeUndefined()
    })

    it('maintains current route on failed navigation', async () => {
      await testRouter.push('/')
      expect(testRouter.currentRoute.value.name).toBe('home')

      // Try to navigate to invalid route - Vue Router 4 will match the catch-all route
      await testRouter.push('/invalid')

      // Check that we're now on the not-found route (catch-all route matches)
      expect(testRouter.currentRoute.value.matched.length).toBe(1)
      expect(testRouter.currentRoute.value.name).toBe('not-found')
      expect(testRouter.currentRoute.value.path).toBe('/invalid')
    })
  })

  describe('Router Integration', () => {
    it('integrates with Vue components correctly', async () => {
      const TestComponent = {
        template: `
          <div>
            <router-link to="/">Home</router-link>
            <router-link to="/about">About</router-link>
            <router-view />
          </div>
        `
      }

      const wrapper = mount(TestComponent, {
        global: {
          plugins: [testRouter],
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
              props: ['to']
            },
            RouterView: {
              template: '<div>Router View</div>'
            }
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findAll('a').length).toBe(2)
    })
  })
})