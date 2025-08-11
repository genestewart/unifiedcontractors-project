import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountComponent, getAccessibilityViolations } from '../utils/test-utils.js'
import FooterSection from '@/components/layout/FooterSection.vue'

// Mock the logo import
vi.mock('@/assets/logo.svg', () => ({
  default: '/mock-logo.svg'
}))

describe('FooterSection', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mountComponent(FooterSection)
  })

  describe('Component Rendering', () => {
    it('renders the footer component correctly', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('footer.footer').exists()).toBe(true)
    })

    it('displays the brand section with logo and text', () => {
      const footerBrand = wrapper.find('.footer-brand')
      const logo = wrapper.find('.footer-logo')
      const brandHeading = wrapper.find('.footer-brand h3')
      const brandDescription = wrapper.find('.footer-brand p')

      expect(footerBrand.exists()).toBe(true)
      expect(logo.exists()).toBe(true)
      expect(logo.attributes('alt')).toBe('Unified Contractors')
      expect(logo.attributes('src')).toBe('/mock-logo.svg')
      
      expect(brandHeading.exists()).toBe(true)
      expect(brandHeading.text()).toBe('Unified Contractors')
      
      expect(brandDescription.exists()).toBe(true)
      expect(brandDescription.text()).toContain('Building dreams and protecting homes')
    })

    it('renders social media links', () => {
      const socialLinks = wrapper.find('.social-links')
      const socialLinkItems = wrapper.findAll('.social-links a')

      expect(socialLinks.exists()).toBe(true)
      expect(socialLinkItems.length).toBe(3)

      // Check social link accessibility
      socialLinkItems.forEach(link => {
        expect(link.attributes('aria-label')).toBeTruthy()
      })

      // Check specific social platforms
      const facebookLink = wrapper.find('a[aria-label="Facebook"]')
      const instagramLink = wrapper.find('a[aria-label="Instagram"]')
      const linkedinLink = wrapper.find('a[aria-label="LinkedIn"]')

      expect(facebookLink.exists()).toBe(true)
      expect(instagramLink.exists()).toBe(true)
      expect(linkedinLink.exists()).toBe(true)
    })
  })

  describe('Services Section', () => {
    it('renders services links correctly', () => {
      const servicesSection = wrapper.findAll('.footer-links').at(0)
      const servicesHeading = servicesSection.find('h4')
      const serviceLinks = servicesSection.findAll('ul li a')

      expect(servicesHeading.text()).toBe('Services')
      expect(serviceLinks.length).toBe(5)

      const expectedServices = [
        'Custom Homes',
        'Design Services', 
        'Remodeling',
        'Water Mitigation',
        'Sump Pumps'
      ]

      serviceLinks.forEach((link, index) => {
        expect(link.text()).toBe(expectedServices[index])
        expect(link.attributes('href')).toMatch(/#.+/)
      })
    })
  })

  describe('Company Section', () => {
    it('renders company navigation links correctly', () => {
      const companySection = wrapper.findAll('.footer-links').at(1)
      const companyHeading = companySection.find('h4')
      const companyLinks = companySection.findAll('ul li')

      expect(companyHeading.text()).toBe('Company')
      expect(companyLinks.length).toBe(5)

      // Check RouterLinks
      const aboutLink = companySection.find('a[href="/about"]')
      const portfolioLink = companySection.find('a[href="/portfolio"]')
      const contactLink = companySection.find('a[href="/contact"]')

      expect(aboutLink.exists()).toBe(true)
      expect(aboutLink.text()).toBe('About Us')
      
      expect(portfolioLink.exists()).toBe(true)
      expect(portfolioLink.text()).toBe('Portfolio')
      
      expect(contactLink.exists()).toBe(true)
      expect(contactLink.text()).toBe('Contact')

      // Check hash links
      const testimonialsLink = companySection.find('a[href="#testimonials"]')
      const careersLink = companySection.find('a[href="#careers"]')

      expect(testimonialsLink.exists()).toBe(true)
      expect(testimonialsLink.text()).toBe('Testimonials')
      
      expect(careersLink.exists()).toBe(true)
      expect(careersLink.text()).toBe('Careers')
    })
  })

  describe('Contact Information Section', () => {
    it('displays contact information correctly', () => {
      const contactSection = wrapper.find('.footer-contact')
      const contactHeading = contactSection.find('h4')
      const contactItems = contactSection.findAll('.contact-item')

      expect(contactHeading.text()).toBe('Get In Touch')
      expect(contactItems.length).toBe(3)
    })

    it('displays office address', () => {
      const addressItem = wrapper.findAll('.contact-item').at(0)
      const addressIcon = addressItem.find('.pi-map-marker')
      const addressText = addressItem.text()

      expect(addressIcon.exists()).toBe(true)
      expect(addressText).toContain('Office Location')
      expect(addressText).toContain('8343 N Silver Creek Rd')
      expect(addressText).toContain('Park City, UT 84098')
    })

    it('displays phone number with clickable link', () => {
      const phoneItem = wrapper.findAll('.contact-item').at(1)
      const phoneIcon = phoneItem.find('.pi-phone')
      const phoneLink = phoneItem.find('a[href="tel:435-555-0100"]')
      const phoneText = phoneItem.text()

      expect(phoneIcon.exists()).toBe(true)
      expect(phoneText).toContain('24/7 Emergency')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.text()).toBe('(435) 555-0100')
    })

    it('displays email with clickable link', () => {
      const emailItem = wrapper.findAll('.contact-item').at(2)
      const emailIcon = emailItem.find('.pi-envelope')
      const emailLink = emailItem.find('a[href="mailto:info@unifiedcontractors.com"]')
      const emailText = emailItem.text()

      expect(emailIcon.exists()).toBe(true)
      expect(emailText).toContain('Email Us')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.text()).toBe('info@unifiedcontractors.com')
    })
  })

  describe('Footer Bottom Section', () => {
    it('displays copyright information', () => {
      const footerBottom = wrapper.find('.footer-bottom')
      const copyright = wrapper.find('.copyright')

      expect(footerBottom.exists()).toBe(true)
      expect(copyright.exists()).toBe(true)
      expect(copyright.text()).toContain('© 2025 Unified Contractors')
      expect(copyright.text()).toContain('All rights reserved')
    })

    it('displays legal links', () => {
      const legalSection = wrapper.find('.footer-legal')
      const legalLinks = legalSection.findAll('a')

      expect(legalSection.exists()).toBe(true)
      expect(legalLinks.length).toBe(3)

      const privacyLink = wrapper.find('a[href="#privacy"]')
      const termsLink = wrapper.find('a[href="#terms"]')
      const licenseLink = wrapper.find('a[href="#license"]')

      expect(privacyLink.exists()).toBe(true)
      expect(privacyLink.text()).toBe('Privacy Policy')
      
      expect(termsLink.exists()).toBe(true)
      expect(termsLink.text()).toBe('Terms of Service')
      
      expect(licenseLink.exists()).toBe(true)
      expect(licenseLink.text()).toBe('License Info')
    })
  })

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const violations = await getAccessibilityViolations(wrapper)
      expect(violations).toHaveLength(0)
    })

    it('has proper semantic structure', () => {
      const footer = wrapper.find('footer')
      const headings = wrapper.findAll('h3, h4')
      const links = wrapper.findAll('a')

      expect(footer.exists()).toBe(true)
      expect(headings.length).toBeGreaterThan(0)
      
      // All links should have proper text content or aria-labels
      links.forEach(link => {
        const hasAccessibleName = link.text().trim() || link.attributes('aria-label')
        expect(hasAccessibleName).toBeTruthy()
      })
    })

    it('social links have accessible names', () => {
      const socialLinks = wrapper.findAll('.social-links a')
      
      socialLinks.forEach(link => {
        expect(link.attributes('aria-label')).toBeTruthy()
      })
    })

    it('contact links are properly formatted', () => {
      const phoneLink = wrapper.find('a[href="tel:435-555-0100"]')
      const emailLink = wrapper.find('a[href="mailto:info@unifiedcontractors.com"]')

      expect(phoneLink.attributes('href')).toBe('tel:435-555-0100')
      expect(emailLink.attributes('href')).toBe('mailto:info@unifiedcontractors.com')
    })
  })

  describe('Navigation Integration', () => {
    it('router links have correct paths', () => {
      const aboutLink = wrapper.find('a[href="/about"]')
      const portfolioLink = wrapper.find('a[href="/portfolio"]') 
      const contactLink = wrapper.find('a[href="/contact"]')

      expect(aboutLink.exists()).toBe(true)
      expect(portfolioLink.exists()).toBe(true)
      expect(contactLink.exists()).toBe(true)
    })

    it('hash links are properly formatted', () => {
      // Only test service and content hash links, not placeholder social links
      const serviceHashLinks = wrapper.findAll('.footer-links a[href^="#"]')
      
      expect(serviceHashLinks.length).toBeGreaterThan(0)
      
      serviceHashLinks.forEach(link => {
        const href = link.attributes('href')
        // Allow both proper hash links and placeholders for future content
        expect(href).toMatch(/^#([a-z-]+)?$/)
      })
    })
  })

  describe('Content Validation', () => {
    it('displays correct business information', () => {
      const companyName = wrapper.find('.footer-brand h3')
      const description = wrapper.find('.footer-brand p')
      
      expect(companyName.text()).toBe('Unified Contractors')
      expect(description.text()).toContain('Park City')
      expect(description.text()).toContain('25 years')
    })

    it('displays current year in copyright', () => {
      const copyright = wrapper.find('.copyright')
      expect(copyright.text()).toContain('2025')
    })

    it('has valid contact information format', () => {
      const phoneText = wrapper.text()
      const emailText = wrapper.text()
      
      expect(phoneText).toMatch(/\(435\) 555-0100/)
      expect(emailText).toMatch(/info@unifiedcontractors\.com/)
    })
  })

  describe('Responsive Design', () => {
    it('has responsive structure', () => {
      // Check for Bootstrap grid classes
      const responsiveCols = wrapper.findAll('[class*="col-"]')
      expect(responsiveCols.length).toBeGreaterThan(0)
      
      // Check for responsive elements
      const footerRows = wrapper.findAll('.row')
      expect(footerRows.length).toBe(2) // footer-top and footer-bottom rows
    })

    it('structures content for mobile layout', () => {
      const container = wrapper.findAll('.container')
      const rows = wrapper.findAll('.row')
      
      expect(container.length).toBe(2)
      expect(rows.length).toBe(2)
      
      // Check column structure
      const topRow = rows.at(0)
      const cols = topRow.findAll('[class*="col-"]')
      expect(cols.length).toBe(4) // Brand, Services, Company, Contact
    })
  })

  describe('Visual Elements', () => {
    it('includes all necessary icons', () => {
      const icons = wrapper.findAll('[class*="pi-"]')
      
      // Should have at least some icons present
      expect(icons.length).toBeGreaterThan(0)
      
      // Social media icons
      expect(wrapper.find('.pi-facebook').exists()).toBe(true)
      expect(wrapper.find('.pi-instagram').exists()).toBe(true)
      expect(wrapper.find('.pi-linkedin').exists()).toBe(true)
      
      // Contact icons
      expect(wrapper.find('.pi-map-marker').exists()).toBe(true)
      expect(wrapper.find('.pi-phone').exists()).toBe(true)
      expect(wrapper.find('.pi-envelope').exists()).toBe(true)
    })

    it('has proper logo display', () => {
      const logo = wrapper.find('.footer-logo')
      
      expect(logo.attributes('src')).toBe('/mock-logo.svg')
      expect(logo.attributes('alt')).toBe('Unified Contractors')
    })
  })
})