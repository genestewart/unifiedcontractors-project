import { describe, it, expect, beforeEach } from 'vitest'
import { mountComponent, getAccessibilityViolations } from '../utils/test-utils.js'
import HeroSection from '@/components/home/HeroSection.vue'

describe('HeroSection', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mountComponent(HeroSection)
  })

  describe('Component Rendering', () => {
    it('renders the hero section correctly', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('section.hero').exists()).toBe(true)
    })

    it('has proper hero structure with background and overlay', () => {
      const heroBackground = wrapper.find('.hero-background')
      const heroOverlay = wrapper.find('.hero-overlay')

      expect(heroBackground.exists()).toBe(true)
      expect(heroOverlay.exists()).toBe(true)
    })

    it('uses proper responsive grid structure', () => {
      const container = wrapper.find('.container')
      const row = wrapper.find('.row')
      const columns = wrapper.findAll('[class*="col-"]')

      expect(container.exists()).toBe(true)
      expect(row.exists()).toBe(true)
      expect(columns.length).toBe(2) // Left content, right card
    })
  })

  describe('Hero Content', () => {
    it('displays the main hero title correctly', () => {
      const heroTitle = wrapper.find('.hero-title')
      const titleText = heroTitle.text()

      expect(heroTitle.exists()).toBe(true)
      expect(titleText).toContain('Building Dreams,')
      expect(titleText).toContain('Protecting Homes')
      
      // Check for primary text span
      const primarySpan = heroTitle.find('.text-primary')
      expect(primarySpan.exists()).toBe(true)
      expect(primarySpan.text()).toBe('Protecting Homes')
    })

    it('displays the hero subtitle with company information', () => {
      const heroSubtitle = wrapper.find('.hero-subtitle')
      const subtitleText = heroSubtitle.text()

      expect(heroSubtitle.exists()).toBe(true)
      expect(subtitleText).toContain('Park City')
      expect(subtitleText).toContain('25+ years')
      expect(subtitleText).toContain('custom homes')
      expect(subtitleText).toContain('remodeling')
      expect(subtitleText).toContain('water mitigation')
    })

    it('renders hero badges with correct content', () => {
      const heroBadges = wrapper.find('.hero-badges')
      const badges = wrapper.findAll('.badge')

      expect(heroBadges.exists()).toBe(true)
      expect(badges.length).toBe(3)

      // Check badge content
      const badgeTexts = badges.map(badge => badge.text())
      expect(badgeTexts).toContain('Licensed & Insured')
      expect(badgeTexts).toContain('Family-Owned') 
      expect(badgeTexts).toContain('25+ Years Experience')

      // Check that badges have icons
      badges.forEach(badge => {
        const icon = badge.find('[class*="pi-"]')
        expect(icon.exists()).toBe(true)
      })
    })
  })

  describe('Call to Action Buttons', () => {
    it('renders primary CTA button with correct link', () => {
      const primaryCTA = wrapper.find('.btn-primary')
      
      expect(primaryCTA.exists()).toBe(true)
      expect(primaryCTA.text()).toBe('Get Free Estimate')
      expect(primaryCTA.attributes('href')).toBe('/contact')
      expect(primaryCTA.classes()).toContain('btn-lg')
    })

    it('renders phone CTA button with correct tel link', () => {
      const phoneCTA = wrapper.find('.btn-outline')
      const phoneText = phoneCTA.text()
      
      expect(phoneCTA.exists()).toBe(true)
      expect(phoneCTA.attributes('href')).toBe('tel:435-555-0100')
      expect(phoneText).toContain('Call (435) 555-0100')
      
      // Check for phone icon
      const phoneIcon = phoneCTA.find('.pi-phone')
      expect(phoneIcon.exists()).toBe(true)
    })

    it('groups action buttons in hero-actions container', () => {
      const heroActions = wrapper.find('.hero-actions')
      const actionButtons = heroActions.findAll('a')

      expect(heroActions.exists()).toBe(true)
      expect(actionButtons.length).toBe(2)
    })
  })

  describe('Statistics Section', () => {
    it('displays company statistics correctly', () => {
      const heroStats = wrapper.find('.hero-stats')
      const stats = wrapper.findAll('.stat')

      expect(heroStats.exists()).toBe(true)
      expect(stats.length).toBe(3)
    })

    it('shows correct statistic values and labels', () => {
      const stats = wrapper.findAll('.stat')
      
      // Check first stat (Projects)
      const projectStat = stats.at(0)
      expect(projectStat.find('h3').text()).toBe('500+')
      expect(projectStat.find('p').text()).toBe('Projects Completed')

      // Check second stat (Satisfaction)
      const satisfactionStat = stats.at(1)
      expect(satisfactionStat.find('h3').text()).toBe('98%')
      expect(satisfactionStat.find('p').text()).toBe('Customer Satisfaction')

      // Check third stat (Emergency)
      const emergencyStat = stats.at(2)
      expect(emergencyStat.find('h3').text()).toBe('24/7')
      expect(emergencyStat.find('p').text()).toBe('Emergency Service')
    })
  })

  describe('Services Card', () => {
    it('renders the services card correctly', () => {
      const heroCard = wrapper.find('.hero-card')
      const cardTitle = heroCard.find('h3')

      expect(heroCard.exists()).toBe(true)
      expect(cardTitle.exists()).toBe(true)
      expect(cardTitle.text()).toBe('Our Services')
    })

    it('displays service list with icons', () => {
      const serviceList = wrapper.find('.service-list')
      const serviceItems = serviceList.findAll('li')

      expect(serviceList.exists()).toBe(true)
      expect(serviceItems.length).toBe(5)

      const expectedServices = [
        'Custom Home Construction',
        'Professional Design Services',
        'Complete Remodeling',
        'Water Damage Restoration',
        'Sump Pump Systems'
      ]

      serviceItems.forEach((item, index) => {
        const itemText = item.text()
        expect(itemText).toBe(expectedServices[index])
        
        // Each service should have an icon
        const icon = item.find('[class*="pi-"]')
        expect(icon.exists()).toBe(true)
      })
    })

    it('includes services page link', () => {
      const learnMoreLink = wrapper.find('.learn-more')
      const linkText = learnMoreLink.text()

      expect(learnMoreLink.exists()).toBe(true)
      expect(learnMoreLink.attributes('href')).toBe('/services')
      expect(linkText).toContain('View All Services')
      
      // Check for arrow icon
      const arrowIcon = learnMoreLink.find('.pi-arrow-right')
      expect(arrowIcon.exists()).toBe(true)
    })
  })

  describe('Navigation Integration', () => {
    it('contact link routes correctly', () => {
      const contactLink = wrapper.find('a[href="/contact"]')
      expect(contactLink.exists()).toBe(true)
      expect(contactLink.text()).toBe('Get Free Estimate')
    })

    it('services link routes correctly', () => {
      const servicesLink = wrapper.find('a[href="/services"]')
      expect(servicesLink.exists()).toBe(true)
      expect(servicesLink.text()).toContain('View All Services')
    })
  })

  describe('Contact Information', () => {
    it('provides clickable phone number', () => {
      const phoneLink = wrapper.find('a[href="tel:435-555-0100"]')
      
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.text()).toContain('(435) 555-0100')
    })

    it('displays consistent company information', () => {
      const heroText = wrapper.text()
      
      expect(heroText).toContain('Park City')
      expect(heroText).toContain('25+ years')
      expect(heroText).toContain('Licensed & Insured')
    })
  })

  describe('Visual Elements and Icons', () => {
    it('includes all necessary PrimeIcons', () => {
      const icons = wrapper.findAll('[class*="pi-"]')
      
      expect(icons.length).toBeGreaterThan(8) // Badges + services + phone + arrow
      
      // Check specific required icons
      expect(wrapper.find('.pi-check-circle').exists()).toBe(true) // Licensed badge
      expect(wrapper.find('.pi-star-fill').exists()).toBe(true) // Family-owned badge
      expect(wrapper.find('.pi-shield').exists()).toBe(true) // Experience badge
      expect(wrapper.find('.pi-phone').exists()).toBe(true) // Phone button
      expect(wrapper.find('.pi-arrow-right').exists()).toBe(true) // Learn more link
      expect(wrapper.find('.pi-home').exists()).toBe(true) // Custom homes service
    })

    it('has proper semantic structure for statistics', () => {
      const stats = wrapper.findAll('.stat')
      
      stats.forEach(stat => {
        const value = stat.find('h3')
        const label = stat.find('p')
        
        expect(value.exists()).toBe(true)
        expect(label.exists()).toBe(true)
        expect(value.text()).toBeTruthy()
        expect(label.text()).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const violations = await getAccessibilityViolations(wrapper)
      expect(violations).toHaveLength(0)
    })

    it('has proper heading hierarchy', () => {
      const mainHeading = wrapper.find('.hero-title')
      const cardHeading = wrapper.find('.hero-card h3')
      const statHeadings = wrapper.findAll('.stat h3')

      expect(mainHeading.exists()).toBe(true)
      expect(cardHeading.exists()).toBe(true)
      expect(statHeadings.length).toBe(3)

      // Main heading should be h1, others should be h3
      expect(mainHeading.element.tagName.toLowerCase()).toBe('h1')
      expect(cardHeading.element.tagName.toLowerCase()).toBe('h3')
    })

    it('phone link is accessible', () => {
      const phoneLink = wrapper.find('a[href="tel:435-555-0100"]')
      const phoneText = phoneLink.text()
      
      expect(phoneLink.exists()).toBe(true)
      expect(phoneText).toContain('Call') // Descriptive text
      expect(phoneText).toContain('(435) 555-0100') // Phone number
    })

    it('action buttons have appropriate styling classes', () => {
      const primaryButton = wrapper.find('.btn-primary')
      const outlineButton = wrapper.find('.btn-outline')
      
      expect(primaryButton.classes()).toContain('btn-lg')
      expect(outlineButton.element.tagName.toLowerCase()).toBe('a')
    })
  })

  describe('Responsive Design Support', () => {
    it('has proper responsive grid classes', () => {
      const contentCol = wrapper.findAll('.col-lg-6')
      
      expect(contentCol.length).toBe(2)
    })

    it('includes responsive utilities', () => {
      const row = wrapper.find('.row')
      
      expect(row.classes()).toContain('align-items-center')
      expect(row.classes()).toContain('min-vh-100')
    })

    it('structures content for mobile adaptation', () => {
      // These elements should be flexible for mobile
      const heroBadges = wrapper.find('.hero-badges')
      const heroActions = wrapper.find('.hero-actions')
      const heroStats = wrapper.find('.hero-stats')
      
      expect(heroBadges.exists()).toBe(true)
      expect(heroActions.exists()).toBe(true)
      expect(heroStats.exists()).toBe(true)
    })
  })

  describe('Content Validation', () => {
    it('displays accurate business metrics', () => {
      const statsText = wrapper.text()
      
      expect(statsText).toContain('500+') // Projects completed
      expect(statsText).toContain('98%') // Customer satisfaction
      expect(statsText).toContain('24/7') // Emergency service
    })

    it('lists comprehensive services', () => {
      const serviceTexts = wrapper.findAll('.service-list li').map(item => item.text())
      
      expect(serviceTexts).toContain('Custom Home Construction')
      expect(serviceTexts).toContain('Professional Design Services')
      expect(serviceTexts).toContain('Complete Remodeling')
      expect(serviceTexts).toContain('Water Damage Restoration')
      expect(serviceTexts).toContain('Sump Pump Systems')
    })

    it('maintains consistent branding', () => {
      const heroContent = wrapper.text()
      
      expect(heroContent).toContain('Building Dreams') // Main headline
      expect(heroContent).toContain('Protecting Homes') // Subtitle of headline
      expect(heroContent).toContain('Park City')
      expect(heroContent).toContain('Licensed & Insured')
      expect(heroContent).toContain('Family-Owned')
    })
  })
})