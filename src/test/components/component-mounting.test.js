import { describe, it, expect, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue' // nextTick is auto-imported globally
import { renderWithProviders } from '../utils/test-utils.js'

// Example component for testing various mounting scenarios
const SimpleComponent = {
  name: 'SimpleComponent',
  props: {
    message: {
      type: String,
      default: 'Hello World'
    },
    count: {
      type: Number,
      default: 0
    }
  },
  emits: ['click', 'update'],
  setup(props, { emit }) {
    const internalCount = ref(props.count)
    
    const handleClick = () => {
      internalCount.value++
      emit('click', internalCount.value)
      emit('update', { count: internalCount.value, timestamp: Date.now() })
    }

    return {
      internalCount,
      handleClick
    }
  },
  template: `
    <div class="simple-component">
      <h1 data-testid="message">{{ message }}</h1>
      <p data-testid="count">Count: {{ internalCount }}</p>
      <button data-testid="click-button" @click="handleClick">
        Click me
      </button>
    </div>
  `
}

// Component with router dependency
const RouterComponent = {
  name: 'RouterComponent',
  template: `
    <div>
      <router-link to="/" data-testid="home-link">Home</router-link>
      <router-link to="/about" data-testid="about-link">About</router-link>
      <p data-testid="current-route">Current: {{ $route.name }}</p>
    </div>
  `
}

// Component with slot usage
const SlotComponent = {
  name: 'SlotComponent',
  template: `
    <div class="slot-component">
      <header data-testid="header">
        <slot name="header">Default Header</slot>
      </header>
      <main data-testid="content">
        <slot>Default Content</slot>
      </main>
      <footer data-testid="footer">
        <slot name="footer">Default Footer</slot>
      </footer>
    </div>
  `
}

describe('Component Mounting Examples', () => {
  describe('Basic Mounting Techniques', () => {
    it('demonstrates basic mount vs shallowMount', () => {
      const wrapper = mount(SimpleComponent, {
        props: { message: 'Test Message' }
      })

      const shallowWrapper = shallowMount(SimpleComponent, {
        props: { message: 'Test Message' }
      })

      // Both should render the component
      expect(wrapper.exists()).toBe(true)
      expect(shallowWrapper.exists()).toBe(true)
      
      // Both should have the same basic structure for simple components
      expect(wrapper.find('[data-testid="message"]').text()).toBe('Test Message')
      expect(shallowWrapper.find('[data-testid="message"]').text()).toBe('Test Message')
    })

    it('mounts component with props', () => {
      const wrapper = mount(SimpleComponent, {
        props: {
          message: 'Custom Message',
          count: 5
        }
      })

      expect(wrapper.find('[data-testid="message"]').text()).toBe('Custom Message')
      expect(wrapper.find('[data-testid="count"]').text()).toBe('Count: 5')
    })

    it('mounts component with global plugins using renderWithProviders', () => {
      const wrapper = renderWithProviders(RouterComponent)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="home-link"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="about-link"]').exists()).toBe(true)
    })
  })

  describe('Props and Data Testing', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(SimpleComponent, {
        props: { message: 'Test', count: 3 }
      })
    })

    it('accesses component props correctly', () => {
      expect(wrapper.props('message')).toBe('Test')
      expect(wrapper.props('count')).toBe(3)
    })

    it('updates props reactively', async () => {
      await wrapper.setProps({ message: 'Updated Message' })
      
      expect(wrapper.find('[data-testid="message"]').text()).toBe('Updated Message')
    })

    it('accesses component internal state', () => {
      expect(wrapper.vm.internalCount).toBe(3)
    })
  })

  describe('Event Testing', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(SimpleComponent)
    })

    it('triggers and captures custom events', async () => {
      const button = wrapper.find('[data-testid="click-button"]')
      
      await button.trigger('click')
      
      // Check emitted events
      const emittedClicks = wrapper.emitted('click')
      const emittedUpdates = wrapper.emitted('update')
      
      expect(emittedClicks).toHaveLength(1)
      expect(emittedClicks[0]).toEqual([1])
      
      expect(emittedUpdates).toHaveLength(1)
      expect(emittedUpdates[0][0]).toMatchObject({ count: 1 })
      expect(emittedUpdates[0][0].timestamp).toBeDefined()
    })

    it('tests multiple event emissions', async () => {
      const button = wrapper.find('[data-testid="click-button"]')
      
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')
      
      const emittedClicks = wrapper.emitted('click')
      expect(emittedClicks).toHaveLength(3)
      expect(emittedClicks[0]).toEqual([1])
      expect(emittedClicks[1]).toEqual([2])
      expect(emittedClicks[2]).toEqual([3])
    })
  })

  describe('Slot Testing', () => {
    it('renders default slot content', () => {
      const wrapper = mount(SlotComponent)
      
      expect(wrapper.find('[data-testid="header"]').text()).toBe('Default Header')
      expect(wrapper.find('[data-testid="content"]').text()).toBe('Default Content')
      expect(wrapper.find('[data-testid="footer"]').text()).toBe('Default Footer')
    })

    it('renders custom slot content', () => {
      const wrapper = mount(SlotComponent, {
        slots: {
          default: '<p>Custom Content</p>',
          header: '<h1>Custom Header</h1>',
          footer: '<small>Custom Footer</small>'
        }
      })
      
      expect(wrapper.find('[data-testid="header"]').html()).toContain('Custom Header')
      expect(wrapper.find('[data-testid="content"]').html()).toContain('Custom Content')
      expect(wrapper.find('[data-testid="footer"]').html()).toContain('Custom Footer')
    })

    it('renders complex slot content with components', () => {
      const CustomButton = {
        template: '<button class="custom-btn">Custom Button</button>'
      }

      const wrapper = mount(SlotComponent, {
        slots: {
          default: CustomButton
        },
        global: {
          components: { CustomButton }
        }
      })
      
      expect(wrapper.find('.custom-btn').exists()).toBe(true)
    })
  })

  describe('Router Integration Testing', () => {
    it('tests router-dependent components', async () => {
      const wrapper = renderWithProviders(RouterComponent)
      
      // Check initial state
      expect(wrapper.find('[data-testid="home-link"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="about-link"]').exists()).toBe(true)
      
      // The current route should be accessible
      expect(wrapper.vm.$route).toBeDefined()
    })

    it('navigates between routes in tests', async () => {
      const testRouter = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
          { path: '/about', name: 'about', component: { template: '<div>About</div>' } }
        ]
      })

      const routerWrapper = mount(RouterComponent, {
        global: {
          plugins: [testRouter],
          stubs: {
            RouterLink: {
              template: '<a><slot /></a>',
              props: ['to']
            }
          }
        }
      })

      // Navigate to about page
      await testRouter.push('/about')
      await nextTick()

      expect(testRouter.currentRoute.value.name).toBe('about')
      expect(routerWrapper.exists()).toBe(true)
    })
  })

  describe('Advanced Mounting Scenarios', () => {
    it('mounts with custom global properties', () => {
      const wrapper = mount(SimpleComponent, {
        global: {
          config: {
            globalProperties: {
              $customProperty: 'test-value'
            }
          }
        }
      })

      expect(wrapper.vm.$.appContext.config.globalProperties.$customProperty).toBe('test-value')
    })

    it('mounts with mocked global components', () => {
      const wrapper = mount(SimpleComponent, {
        global: {
          stubs: {
            'custom-component': {
              template: '<div class="mocked-component">Mocked</div>'
            }
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('mounts with provide/inject', () => {
      const ParentComponent = {
        provide: {
          message: 'Provided Message'
        },
        template: '<child-component />'
      }

      const ChildComponent = {
        inject: ['message'],
        template: '<div data-testid="injected">{{ message }}</div>'
      }

      const wrapper = mount(ParentComponent, {
        global: {
          components: {
            ChildComponent
          }
        }
      })

      expect(wrapper.find('[data-testid="injected"]').text()).toBe('Provided Message')
    })
  })

  describe('Async Component Testing', () => {
    it('handles async component updates', async () => {
      const wrapper = mount(SimpleComponent)
      const button = wrapper.find('[data-testid="click-button"]')

      // Initial state
      expect(wrapper.find('[data-testid="count"]').text()).toBe('Count: 0')

      // Trigger click and wait for updates
      await button.trigger('click')
      await nextTick()

      // Check updated state
      expect(wrapper.find('[data-testid="count"]').text()).toBe('Count: 1')
    })

    it('waits for multiple async operations', async () => {
      const wrapper = mount(SimpleComponent)
      const button = wrapper.find('[data-testid="click-button"]')

      // Multiple rapid clicks
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')
      await nextTick()

      expect(wrapper.find('[data-testid="count"]').text()).toBe('Count: 3')
      expect(wrapper.emitted('click')).toHaveLength(3)
    })
  })

  describe('Testing Best Practices', () => {
    it('demonstrates proper test isolation', () => {
      const wrapper1 = mount(SimpleComponent, { props: { count: 1 } })
      const wrapper2 = mount(SimpleComponent, { props: { count: 2 } })

      // Each wrapper should have independent state
      expect(wrapper1.vm.internalCount).toBe(1)
      expect(wrapper2.vm.internalCount).toBe(2)
    })

    it('cleans up properly after tests', () => {
      const wrapper = mount(SimpleComponent)
      
      // Component should be properly mounted
      expect(wrapper.exists()).toBe(true)
      
      // Wrapper provides cleanup methods
      expect(typeof wrapper.unmount).toBe('function')
    })

    it('uses data-testid for reliable element selection', () => {
      const wrapper = mount(SimpleComponent)
      
      // Prefer data-testid over class or tag selectors
      expect(wrapper.find('[data-testid="message"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="count"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="click-button"]').exists()).toBe(true)
    })
  })
})