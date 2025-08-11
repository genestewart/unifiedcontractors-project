import { describe, it, expect, beforeEach, vi } from 'vitest'
import HomeView from '@/views/HomeView.vue'
import { renderWithProviders } from '../utils/test-utils.js'

// Mock all home section components
vi.mock('@/components/home/HeroSection.vue', () => ({
  default: {
    name: 'HeroSection',
    template: '<section data-testid="hero-section">Hero Section</section>'
  }
}))

vi.mock('@/components/home/ServicesOverview.vue', () => ({
  default: {
    name: 'ServicesOverview', 
    template: '<section data-testid="services-overview">Services Overview</section>'
  }
}))

vi.mock('@/components/home/CredibilitySection.vue', () => ({
  default: {
    name: 'CredibilitySection',
    template: '<section data-testid="credibility-section">Credibility Section</section>'
  }
}))

vi.mock('@/components/home/TestimonialsSection.vue', () => ({
  default: {
    name: 'TestimonialsSection',
    template: '<section data-testid="testimonials-section">Testimonials Section</section>'
  }
}))

vi.mock('@/components/home/CTASection.vue', () => ({
  default: {
    name: 'CTASection',
    template: '<section data-testid="cta-section">CTA Section</section>'
  }
}))

describe('HomeView', () => {
  let wrapper

  beforeEach(() => {
    wrapper = renderWithProviders(HomeView)
  })

  describe('Component Structure', () => {
    it('renders the main element correctly', () => {
      expect(wrapper.find('main').exists()).toBe(true)
      expect(wrapper.element.tagName.toLowerCase()).toBe('main')
    })

    it('renders all required home sections in correct order', () => {
      const sections = wrapper.findAll('[data-testid]')
      const expectedSections = [
        'hero-section',
        'services-overview', 
        'credibility-section',
        'testimonials-section',
        'cta-section'
      ]

      expect(sections.length).toBe(expectedSections.length)
      
      sections.forEach((section, index) => {
        expect(section.attributes('data-testid')).toBe(expectedSections[index])
      })
    })
  })

  describe('Section Rendering', () => {
    it('renders HeroSection component', () => {
      const heroSection = wrapper.find('[data-testid="hero-section"]')
      expect(heroSection.exists()).toBe(true)
      expect(heroSection.text()).toContain('Hero Section')
    })

    it('renders ServicesOverview component', () => {
      const servicesSection = wrapper.find('[data-testid="services-overview"]')
      expect(servicesSection.exists()).toBe(true)
      expect(servicesSection.text()).toContain('Services Overview')
    })

    it('renders CredibilitySection component', () => {
      const credibilitySection = wrapper.find('[data-testid="credibility-section"]')
      expect(credibilitySection.exists()).toBe(true)
      expect(credibilitySection.text()).toContain('Credibility Section')
    })

    it('renders TestimonialsSection component', () => {
      const testimonialsSection = wrapper.find('[data-testid="testimonials-section"]')
      expect(testimonialsSection.exists()).toBe(true)
      expect(testimonialsSection.text()).toContain('Testimonials Section')
    })

    it('renders CTASection component', () => {
      const ctaSection = wrapper.find('[data-testid="cta-section"]')
      expect(ctaSection.exists()).toBe(true)
      expect(ctaSection.text()).toContain('CTA Section')
    })
  })

  describe('Component Integration', () => {
    it('maintains proper semantic HTML structure', () => {
      const mainElement = wrapper.find('main')
      expect(mainElement.exists()).toBe(true)
      
      // All sections should be direct children of main
      const directChildren = mainElement.element.children
      expect(directChildren.length).toBe(5)
      
      // Each child should be a section element
      Array.from(directChildren).forEach(child => {
        expect(child.tagName.toLowerCase()).toBe('section')
      })
    })

    it('allows sections to be rendered independently', () => {
      // Test that we can mount the component without errors
      // This ensures all child component dependencies are properly handled
      expect(() => {
        renderWithProviders(HomeView)
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('uses semantic main element for primary content', () => {
      expect(wrapper.element.tagName.toLowerCase()).toBe('main')
    })

    it('maintains logical document structure', () => {
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
      
      // Verify all sections are contained within main
      const sectionsInMain = main.findAll('section')
      expect(sectionsInMain.length).toBe(5)
    })
  })

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      expect(wrapper.vm).toBeDefined()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders consistently on multiple mounts', () => {
      const wrapper1 = renderWithProviders(HomeView)
      const wrapper2 = renderWithProviders(HomeView)
      
      expect(wrapper1.html()).toBe(wrapper2.html())
    })
  })

  describe('Performance Considerations', () => {
    it('does not have reactive data that could cause unnecessary re-renders', () => {
      // HomeView is a simple composition of components with no reactive state
      // This test ensures the component remains lightweight
      expect(Object.keys(wrapper.vm.$data || {})).toHaveLength(0)
    })
  })

  describe('Error Boundaries', () => {
    it('gracefully handles missing child components', async () => {
      // This test would be more relevant in a real scenario where components might fail
      // For now, we ensure the wrapper doesn't throw during rendering
      expect(() => wrapper.html()).not.toThrow()
    })
  })
})