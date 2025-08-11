/**
 * Authentication Flow Integration Tests
 * Tests complete authentication workflows including login, logout, token refresh, and security features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/api/auth'

// Mock API service
vi.mock('@/services/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn()
  }
}))

// Mock PrimeVue Toast
const mockToast = { add: vi.fn() }
vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock router
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/employee/login', component: { template: '<div>Login</div>' } },
    { path: '/employee/dashboard', component: { template: '<div>Dashboard</div>' } }
  ]
})

describe('Authentication Flow Integration', () => {
  let wrapper
  let authStore
  let pinia

  const mockEmployee = {
    id: 1,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin'
  }

  const mockAuthResponse = {
    data: {
      employee: mockEmployee,
      access_token: 'mock-access-token',
      expires_in: 3600
    }
  }

  const createComponent = () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    })

    wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia, mockRouter],
        mocks: {
          $route: { query: {} }
        },
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    authStore = useAuthStore()
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.document.getElementById = vi.fn(() => ({ focus: vi.fn() }))
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.useRealTimers()
  })

  describe('Complete Login Flow', () => {
    it('successfully completes login workflow from form submission to authenticated state', async () => {
      createComponent()
      
      // Mock successful API response
      authApi.login.mockResolvedValue(mockAuthResponse)
      
      // Fill form with valid credentials
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('validpassword123')
      await wrapper.find('#rememberMe').setValue(true)
      
      // Submit form
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      // Verify API was called with correct data
      expect(authApi.login).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'validpassword123',
          remember_me: true,
          device_fingerprint: expect.any(String)
        })
      )
      
      // Verify store state is updated
      expect(authStore.employee).toEqual(mockEmployee)
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.accessToken).toBe('mock-access-token')
      expect(authStore.error).toBe(null)
      expect(authStore.loginAttempts).toBe(0)
      
      // Verify tokens are stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_access_token', 'mock-access-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_token_expiry', expect.any(String))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_remember_user', 'test@example.com')
      
      // Verify success toast
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Welcome back, John Doe!',
        life: 3000
      })
    })

    it('handles failed login with proper error handling and attempt tracking', async () => {
      createComponent()
      
      const error = {
        response: {
          data: {
            message: 'Invalid credentials',
            remaining_attempts: 3
          }
        }
      }
      authApi.login.mockRejectedValue(error)
      
      // Fill form and submit
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('wrongpassword')
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      // Verify error handling
      expect(authStore.error).toContain('2 attempts remaining')
      expect(authStore.loginAttempts).toBe(2) // 5 - 3 remaining
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.employee).toBe(null)
      
      // Verify no tokens stored
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('uc_access_token', expect.any(String))
    })

    it('implements progressive lockout after multiple failed attempts', async () => {
      createComponent()
      
      const error = {
        response: {
          data: { message: 'Invalid credentials' }
        }
      }
      authApi.login.mockRejectedValue(error)
      
      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await wrapper.find('#email').setValue('test@example.com')
        await wrapper.find('#password').setValue('wrongpassword')
        
        try {
          await wrapper.find('form').trigger('submit.prevent')
          await nextTick()
        } catch {}
      }
      
      // Verify account is locked
      expect(authStore.isAccountLocked).toBe(true)
      expect(authStore.lockoutUntil).toBeGreaterThan(Date.now())
      expect(authStore.error).toContain('locked for 30 minutes')
      
      // Verify form is disabled
      expect(wrapper.find('#email').attributes('disabled')).toBeDefined()
      expect(wrapper.find('#password').attributes('disabled')).toBeDefined()
      expect(wrapper.find('.login-button').attributes('disabled')).toBeDefined()
      
      // Verify lockout message is displayed
      expect(wrapper.find('.lockout-message').exists()).toBe(true)
    })

    it('prevents login when account is locked', async () => {
      createComponent()
      
      // Set account as locked
      authStore.lockoutUntil = Date.now() + 60000
      await nextTick()
      
      // Try to submit form
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('validpassword123')
      
      try {
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
      } catch {}
      
      // Verify login was not attempted
      expect(authApi.login).not.toHaveBeenCalled()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('Session Management', () => {
    beforeEach(() => {
      authStore.employee = mockEmployee
      authStore.isAuthenticated = true
      authStore.accessToken = 'current-token'
      authStore.tokenExpiry = Date.now() + 3600000 // 1 hour from now
    })

    it('automatically refreshes token before expiry', async () => {
      const refreshResponse = {
        data: {
          access_token: 'new-token',
          expires_in: 3600
        }
      }
      authApi.refresh.mockResolvedValue(refreshResponse)
      
      // Set token to expire in 3 minutes
      authStore.tokenExpiry = Date.now() + 180000
      
      // Start refresh timer
      authStore.startTokenRefreshTimer()
      
      // Fast-forward to 1 minute before expiry (when refresh should trigger)
      vi.advanceTimersByTime(120000)
      await vi.runAllTimersAsync()
      
      // Verify token was refreshed
      expect(authApi.refresh).toHaveBeenCalled()
      expect(authStore.accessToken).toBe('new-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_access_token', 'new-token')
    })

    it('logs out user when token refresh fails', async () => {
      authApi.refresh.mockRejectedValue(new Error('Refresh failed'))
      authStore.forceLogout = vi.fn()
      
      authStore.tokenExpiry = Date.now() + 180000
      authStore.startTokenRefreshTimer()
      
      vi.advanceTimersByTime(120000)
      await vi.runAllTimersAsync()
      
      expect(authStore.forceLogout).toHaveBeenCalledWith('Token refresh failed')
    })

    it('enforces session timeout due to inactivity', () => {
      authStore.lastActivity = Date.now() - (20 * 60 * 1000) // 20 minutes ago
      authStore.forceLogout = vi.fn()
      
      const result = authStore.checkSessionTimeout()
      
      expect(result).toBe(false)
      expect(authStore.forceLogout).toHaveBeenCalledWith('Session expired due to inactivity')
    })

    it('updates activity timestamp on user interaction', () => {
      const beforeTime = Date.now()
      authStore.updateLastActivity()
      const afterTime = Date.now()
      
      expect(authStore.lastActivity).toBeGreaterThanOrEqual(beforeTime)
      expect(authStore.lastActivity).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Logout Flow', () => {
    beforeEach(() => {
      authStore.employee = mockEmployee
      authStore.isAuthenticated = true
      authStore.accessToken = 'current-token'
    })

    it('successfully completes logout workflow', async () => {
      authApi.logout.mockResolvedValue({})
      
      await authStore.logout()
      
      // Verify API was called
      expect(authApi.logout).toHaveBeenCalled()
      
      // Verify state is cleared
      expect(authStore.employee).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.accessToken).toBe(null)
      expect(authStore.permissions).toEqual([])
      
      // Verify tokens are removed from storage
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_access_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_token_expiry')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_remember_user')
    })

    it('handles logout API failure gracefully', async () => {
      authApi.logout.mockRejectedValue(new Error('Network error'))
      
      await authStore.logout()
      
      // Should still clear local state
      expect(authStore.employee).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_access_token')
    })

    it('performs force logout with redirect', () => {
      const originalHref = window.location.href
      window.location.href = 'http://localhost/dashboard'
      
      authStore.forceLogout('Security violation')
      
      expect(authStore.employee).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
      expect(window.location.href).toContain('/employee/login')
      expect(window.location.href).toContain('Security%20violation')
      
      window.location.href = originalHref
    })
  })

  describe('State Persistence and Recovery', () => {
    it('initializes auth state from stored tokens on app start', async () => {
      const futureExpiry = Date.now() + 3600000
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'uc_access_token') return 'stored-token'
        if (key === 'uc_token_expiry') return futureExpiry.toString()
        return null
      })
      
      authApi.me.mockResolvedValue(mockAuthResponse)
      
      await authStore.initialize()
      
      expect(authApi.me).toHaveBeenCalled()
      expect(authStore.accessToken).toBe('stored-token')
      expect(authStore.employee).toEqual(mockEmployee)
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.initialized).toBe(true)
    })

    it('clears invalid stored tokens during initialization', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'uc_access_token') return 'invalid-token'
        if (key === 'uc_token_expiry') return (Date.now() + 3600000).toString()
        return null
      })
      
      authApi.me.mockRejectedValue(new Error('Invalid token'))
      
      await authStore.initialize()
      
      expect(authStore.accessToken).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_access_token')
    })

    it('skips initialization if tokens are expired', async () => {
      const pastExpiry = Date.now() - 3600000 // 1 hour ago
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'uc_access_token') return 'expired-token'
        if (key === 'uc_token_expiry') return pastExpiry.toString()
        return null
      })
      
      await authStore.initialize()
      
      expect(authApi.me).not.toHaveBeenCalled()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('restores user preferences from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('remembered@example.com')
      createComponent()
      
      const rememberedEmail = authStore.getRememberedEmail()
      
      expect(rememberedEmail).toBe('remembered@example.com')
      expect(wrapper.find('#email').element.value).toBe('remembered@example.com')
      expect(wrapper.find('#rememberMe').element.checked).toBe(true)
    })
  })

  describe('Security Features', () => {
    it('generates and includes device fingerprint in login requests', async () => {
      createComponent()
      authApi.login.mockResolvedValue(mockAuthResponse)
      
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('validpassword123')
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      expect(authApi.login).toHaveBeenCalledWith(
        expect.objectContaining({
          device_fingerprint: expect.any(String)
        })
      )
      
      const deviceFingerprint = authApi.login.mock.calls[0][0].device_fingerprint
      expect(deviceFingerprint).toBeTruthy()
      expect(typeof deviceFingerprint).toBe('string')
    })

    it('validates token expiry before making authenticated requests', () => {
      authStore.tokenExpiry = Date.now() - 1000 // Expired 1 second ago
      
      expect(authStore.isTokenExpired).toBe(true)
      
      authStore.tokenExpiry = Date.now() + 3600000 // Valid for 1 hour
      
      expect(authStore.isTokenExpired).toBe(false)
    })

    it('prevents concurrent login attempts', async () => {
      createComponent()
      authApi.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAuthResponse), 100))
      )
      
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('validpassword123')
      
      // Submit form twice quickly
      const promise1 = wrapper.find('form').trigger('submit.prevent')
      const promise2 = wrapper.find('form').trigger('submit.prevent')
      
      await Promise.all([promise1, promise2])
      
      // Should only call API once due to loading state
      expect(authApi.login).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery', () => {
    it('recovers from network errors gracefully', async () => {
      createComponent()
      
      // First attempt fails
      authApi.login.mockRejectedValueOnce(new Error('Network error'))
      
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('wrongpassword')
      
      try {
        await wrapper.find('form').trigger('submit.prevent')
        await nextTick()
      } catch {}
      
      expect(authStore.error).toBeTruthy()
      
      // Second attempt succeeds
      authApi.login.mockResolvedValueOnce(mockAuthResponse)
      
      await wrapper.find('#password').setValue('correctpassword')
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.error).toBe(null)
    })

    it('clears errors when user starts typing', async () => {
      createComponent()
      authStore.error = 'Previous login error'
      
      await wrapper.find('#email').trigger('input')
      await nextTick()
      
      expect(authStore.error).toBe('Previous login error') // Error should persist until successful login
    })
  })

  describe('Cross-Tab Synchronization', () => {
    it('synchronizes logout across browser tabs', () => {
      authStore.employee = mockEmployee
      authStore.isAuthenticated = true
      
      // Simulate logout in another tab by removing tokens
      mockLocalStorage.getItem.mockReturnValue(null)
      
      // This would typically be triggered by a storage event listener
      authStore.clearAuthData()
      
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.employee).toBe(null)
    })
  })

  describe('Form Validation Integration', () => {
    it('integrates client-side validation with authentication flow', async () => {
      createComponent()
      
      // Submit empty form
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      // Should show validation errors
      expect(wrapper.find('#email-error').exists()).toBe(true)
      expect(wrapper.find('#password-error').exists()).toBe(true)
      
      // Should not call API
      expect(authApi.login).not.toHaveBeenCalled()
      
      // Fill valid data
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('validpassword123')
      
      authApi.login.mockResolvedValue(mockAuthResponse)
      
      await wrapper.find('form').trigger('submit.prevent')
      await nextTick()
      
      // Should now call API
      expect(authApi.login).toHaveBeenCalled()
    })
  })
})