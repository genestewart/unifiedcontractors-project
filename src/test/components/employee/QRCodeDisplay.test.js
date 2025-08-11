/**
 * QRCodeDisplay Component Test Suite
 * Tests QR code generation, display, sharing functionality, and security features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import QRCodeDisplay from '@/components/employee/QRCodeDisplay.vue'
import { useProjectsStore } from '@/stores/projects'

// Mock QR code library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockedqrcode')
  }
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock PrimeVue components
const mockToast = {
  add: vi.fn()
}

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast
}))

describe('QRCodeDisplay', () => {
  let wrapper
  let pinia
  let projectsStore

  const mockProject = {
    id: 1,
    name: 'Test Project',
    client_name: 'John Doe',
    qr_code_token: 'UC_ABC123DEF_1640995200',
    qr_code_url: 'https://example.com/client/project/UC_ABC123DEF_1640995200',
    qr_code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    is_qr_code_expired: false,
    is_public: true
  }

  const createWrapper = (props = {}) => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    })

    wrapper = mount(QRCodeDisplay, {
      props: {
        project: mockProject,
        visible: true,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          Dialog: {
            template: '<div class="dialog-mock" v-if="visible"><slot /></div>',
            props: ['visible', 'modal', 'header', 'closable']
          },
          Button: {
            template: '<button :disabled="disabled" :class="severity" @click="$emit(\'click\')"><slot /></button>',
            props: ['disabled', 'severity', 'loading', 'icon'],
            emits: ['click']
          },
          Card: {
            template: '<div class="card-mock"><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          Message: {
            template: '<div class="message" :class="severity"><slot /></div>',
            props: ['severity']
          },
          ProgressSpinner: {
            template: '<div class="spinner">Loading...</div>'
          }
        }
      }
    })

    projectsStore = useProjectsStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Rendering', () => {
    it('renders the QR code dialog', () => {
      createWrapper()
      
      expect(wrapper.find('.dialog-mock').exists()).toBe(true)
      expect(wrapper.find('.qr-code-container').exists()).toBe(true)
    })

    it('shows loading spinner while generating QR code', async () => {
      createWrapper()
      
      // QR code generation is async, so initially loading
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('displays QR code image after generation', async () => {
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for QR generation
      
      expect(wrapper.find('.qr-code-image').exists()).toBe(true)
      expect(wrapper.find('.qr-code-image').attributes('src')).toBe('data:image/png;base64,mockedqrcode')
    })

    it('displays project information', () => {
      createWrapper()
      
      expect(wrapper.text()).toContain(mockProject.name)
      expect(wrapper.text()).toContain(mockProject.client_name)
    })

    it('shows QR code URL', () => {
      createWrapper()
      
      expect(wrapper.text()).toContain(mockProject.qr_code_url)
    })
  })

  describe('QR Code Generation', () => {
    it('generates QR code with correct URL', async () => {
      const QRCode = await import('qrcode')
      createWrapper()
      await nextTick()
      
      expect(QRCode.default.toDataURL).toHaveBeenCalledWith(
        mockProject.qr_code_url,
        expect.objectContaining({
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      )
    })

    it('handles QR code generation errors', async () => {
      const QRCode = await import('qrcode')
      QRCode.default.toDataURL.mockRejectedValueOnce(new Error('QR generation failed'))
      
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('Failed to generate QR code')
    })

    it('regenerates QR code when project changes', async () => {
      const QRCode = await import('qrcode')
      QRCode.default.toDataURL.mockClear()
      
      createWrapper()
      await nextTick()
      
      const newProject = { ...mockProject, qr_code_token: 'NEW_TOKEN' }
      await wrapper.setProps({ project: newProject })
      await nextTick()
      
      expect(QRCode.default.toDataURL).toHaveBeenCalledTimes(2)
    })
  })

  describe('Sharing Functionality', () => {
    it('copies URL to clipboard', async () => {
      createWrapper()
      
      await wrapper.find('.copy-url-btn').trigger('click')
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProject.qr_code_url)
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Copied',
        detail: 'URL copied to clipboard',
        life: 3000
      })
    })

    it('handles clipboard copy errors', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard failed'))
      
      createWrapper()
      
      await wrapper.find('.copy-url-btn').trigger('click')
      
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy URL to clipboard',
        life: 3000
      })
    })

    it('downloads QR code as image', async () => {
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for QR generation
      
      // Mock canvas conversion
      const mockCanvas = {
        toBlob: vi.fn((callback) => {
          callback(new Blob(['mock image data'], { type: 'image/png' }))
        })
      }
      
      global.document.createElement = vi.fn().mockReturnValue(mockCanvas)
      global.document.body.appendChild = vi.fn()
      global.document.body.removeChild = vi.fn()
      
      const mockLink = {
        click: vi.fn(),
        setAttribute: vi.fn(),
        style: {}
      }
      global.document.createElement.mockReturnValueOnce(mockLink)
      
      await wrapper.find('.download-btn').trigger('click')
      
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.png'))
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('opens email client with project link', async () => {
      createWrapper()
      
      const mockOpen = vi.fn()
      window.open = mockOpen
      
      await wrapper.find('.email-share-btn').trigger('click')
      
      const expectedSubject = encodeURIComponent(`Project Access: ${mockProject.name}`)
      const expectedBody = encodeURIComponent(`Hi ${mockProject.client_name},\n\nPlease use this link to view your project: ${mockProject.qr_code_url}`)
      
      expect(mockOpen).toHaveBeenCalledWith(
        `mailto:?subject=${expectedSubject}&body=${expectedBody}`
      )
    })
  })

  describe('QR Code Expiration', () => {
    it('shows expiration warning for expired QR codes', () => {
      const expiredProject = {
        ...mockProject,
        is_qr_code_expired: true,
        qr_code_expires_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      }
      
      createWrapper({ project: expiredProject })
      
      expect(wrapper.find('.expiration-warning').exists()).toBe(true)
      expect(wrapper.text()).toContain('expired')
    })

    it('shows expiration time for active QR codes', () => {
      createWrapper()
      
      expect(wrapper.find('.expiration-info').exists()).toBe(true)
      expect(wrapper.text()).toMatch(/expires.*in/i)
    })

    it('offers to regenerate expired QR codes', async () => {
      const expiredProject = {
        ...mockProject,
        is_qr_code_expired: true
      }
      
      createWrapper({ project: expiredProject })
      projectsStore.generateQRCode = vi.fn().mockResolvedValue('new-qr-url')
      
      await wrapper.find('.regenerate-btn').trigger('click')
      
      expect(projectsStore.generateQRCode).toHaveBeenCalledWith(mockProject.id)
    })

    it('calculates time until expiration correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      const projectWithExpiry = {
        ...mockProject,
        qr_code_expires_at: futureDate
      }
      
      createWrapper({ project: projectWithExpiry })
      
      const timeUntilExpiry = wrapper.vm.timeUntilExpiration
      expect(timeUntilExpiry).toContain('hours')
    })
  })

  describe('Project Visibility', () => {
    it('shows privacy notice for private projects', () => {
      const privateProject = {
        ...mockProject,
        is_public: false
      }
      
      createWrapper({ project: privateProject })
      
      expect(wrapper.find('.privacy-notice').exists()).toBe(true)
      expect(wrapper.text()).toContain('private')
    })

    it('disables sharing for private projects', () => {
      const privateProject = {
        ...mockProject,
        is_public: false
      }
      
      createWrapper({ project: privateProject })
      
      expect(wrapper.find('.copy-url-btn').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.email-share-btn').attributes('disabled')).toBeDefined()
    })

    it('shows public indicator for public projects', () => {
      createWrapper()
      
      expect(wrapper.find('.public-indicator').exists()).toBe(true)
      expect(wrapper.text()).toContain('publicly accessible')
    })
  })

  describe('Error Handling', () => {
    it('handles missing project gracefully', () => {
      createWrapper({ project: null })
      
      expect(wrapper.find('.no-project-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('No project selected')
    })

    it('handles missing QR code token', () => {
      const projectWithoutToken = {
        ...mockProject,
        qr_code_token: null
      }
      
      createWrapper({ project: projectWithoutToken })
      
      expect(wrapper.find('.no-token-message').exists()).toBe(true)
      expect(wrapper.text()).toContain('QR code not available')
    })

    it('shows error when QR code generation fails', async () => {
      const QRCode = await import('qrcode')
      QRCode.default.toDataURL.mockRejectedValueOnce(new Error('Generation failed'))
      
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(wrapper.find('.error-message').exists()).toBe(true)
    })
  })

  describe('Security Features', () => {
    it('validates QR code token format', () => {
      const invalidProject = {
        ...mockProject,
        qr_code_token: 'invalid-token'
      }
      
      createWrapper({ project: invalidProject })
      
      expect(wrapper.vm.isValidToken).toBe(false)
    })

    it('shows security notice for QR code access', () => {
      createWrapper()
      
      expect(wrapper.find('.security-notice').exists()).toBe(true)
      expect(wrapper.text()).toContain('secure access')
    })

    it('masks sensitive information in URLs when needed', () => {
      const sensitiveProject = {
        ...mockProject,
        qr_code_url: 'https://example.com/client/project/SENSITIVE_TOKEN'
      }
      
      createWrapper({ project: sensitiveProject, maskUrls: true })
      
      expect(wrapper.text()).toContain('***')
    })
  })

  describe('Responsive Design', () => {
    it('adjusts QR code size for mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      })
      
      createWrapper()
      await nextTick()
      
      expect(wrapper.vm.qrCodeSize).toBe(200) // Smaller for mobile
    })

    it('uses full size for desktop', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      })
      
      createWrapper()
      await nextTick()
      
      expect(wrapper.vm.qrCodeSize).toBe(256) // Full size for desktop
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text for QR code image', async () => {
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const qrImage = wrapper.find('.qr-code-image')
      expect(qrImage.attributes('alt')).toBe(`QR code for ${mockProject.name}`)
    })

    it('has keyboard navigation support', () => {
      createWrapper()
      
      const buttons = wrapper.findAll('button')
      buttons.forEach(button => {
        expect(button.attributes('tabindex')).toBeDefined()
      })
    })

    it('has proper ARIA labels', () => {
      createWrapper()
      
      expect(wrapper.find('[aria-label*="Copy URL"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label*="Download QR code"]').exists()).toBe(true)
    })

    it('announces status changes to screen readers', async () => {
      createWrapper()
      
      await wrapper.find('.copy-url-btn').trigger('click')
      
      expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true)
    })
  })

  describe('Performance', () => {
    it('debounces QR code regeneration', async () => {
      const QRCode = await import('qrcode')
      QRCode.default.toDataURL.mockClear()
      
      createWrapper()
      
      // Rapidly change project multiple times
      await wrapper.setProps({ project: { ...mockProject, id: 2 } })
      await wrapper.setProps({ project: { ...mockProject, id: 3 } })
      await wrapper.setProps({ project: { ...mockProject, id: 4 } })
      
      await new Promise(resolve => setTimeout(resolve, 300)) // Wait for debounce
      
      // Should only generate QR code once after debounce
      expect(QRCode.default.toDataURL).toHaveBeenCalledTimes(1)
    })

    it('cleans up resources on unmount', () => {
      createWrapper()
      
      wrapper.unmount()
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles extremely long project names', () => {
      const longNameProject = {
        ...mockProject,
        name: 'A'.repeat(500)
      }
      
      createWrapper({ project: longNameProject })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('A'.repeat(50)) // Should truncate
    })

    it('handles special characters in project data', () => {
      const specialProject = {
        ...mockProject,
        name: 'Project with émojis 🚀 & special chars <script>',
        client_name: 'Client & Co.'
      }
      
      createWrapper({ project: specialProject })
      
      expect(wrapper.exists()).toBe(true)
      // Should escape special characters
      expect(wrapper.html()).not.toContain('<script>')
    })

    it('handles network failures gracefully', async () => {
      const QRCode = await import('qrcode')
      QRCode.default.toDataURL.mockRejectedValueOnce(new Error('Network error'))
      
      createWrapper()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(wrapper.find('.retry-button').exists()).toBe(true)
    })
  })
})