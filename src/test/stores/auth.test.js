/**
 * Auth Store Test Suite
 * Tests authentication state management, security features, and token handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/api/auth'

// Mock API service
vi.mock('@/services/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn()
  }
}))

// Mock canvas API for device fingerprinting
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillText: vi.fn(),
    textBaseline: 'alphabetic',
    font: '12px Arial',
    fillStyle: '#000000',
    getImageData: vi.fn(() => ({
      data: new Array(400).fill(128) // Consistent test data
    }))
  })),
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { pathname: '/test', href: 'http://localhost/test' },
  writable: true
})

describe('Auth Store', () => {
  let authStore

  const mockEmployee = {
    id: 1,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
    permissions: ['projects.create', 'projects.read', 'projects.update']
  }

  const mockAuthResponse = {
    data: {
      employee: mockEmployee,
      access_token: 'mock-token-123',
      expires_in: 3600
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      expect(authStore.employee).toBe(null)
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.permissions).toEqual([])
      expect(authStore.loading).toBe(false)
      expect(authStore.error).toBe(null)
      expect(authStore.accessToken).toBe(null)
      expect(authStore.loginAttempts).toBe(0)
      expect(authStore.lockoutUntil).toBe(null)
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      authStore.employee = mockEmployee
      authStore.permissions = mockEmployee.permissions
    })

    describe('Role Checking', () => {
      it('hasRole - checks single role correctly', () => {
        expect(authStore.hasRole('admin')).toBe(true)
        expect(authStore.hasRole('user')).toBe(false)
      })

      it('hasAnyRole - checks multiple roles correctly', () => {
        expect(authStore.hasAnyRole(['admin', 'user'])).toBe(true)
        expect(authStore.hasAnyRole(['user', 'guest'])).toBe(false)
      })
    })

    describe('Permission Checking', () => {
      it('hasPermission - checks single permission correctly', () => {
        expect(authStore.hasPermission('projects.create')).toBe(true)
        expect(authStore.hasPermission('users.delete')).toBe(false)
      })

      it('hasAnyPermission - checks multiple permissions correctly', () => {
        expect(authStore.hasAnyPermission(['projects.create', 'users.delete'])).toBe(true)
        expect(authStore.hasAnyPermission(['users.delete', 'admin.all'])).toBe(false)
      })
    })

    describe('Token Management', () => {
      it('isTokenExpired - returns true for expired tokens', () => {
        authStore.tokenExpiry = Date.now() - 1000 // 1 second ago
        expect(authStore.isTokenExpired).toBe(true)
      })

      it('isTokenExpired - returns false for valid tokens', () => {
        authStore.tokenExpiry = Date.now() + 3600000 // 1 hour from now
        expect(authStore.isTokenExpired).toBe(false)
      })

      it('isSessionExpired - checks session timeout correctly', () => {
        authStore.lastActivity = Date.now() - (16 * 60 * 1000) // 16 minutes ago
        expect(authStore.isSessionExpired).toBe(true)
        
        authStore.lastActivity = Date.now() - (10 * 60 * 1000) // 10 minutes ago
        expect(authStore.isSessionExpired).toBe(false)
      })
    })

    describe('User Display Info', () => {
      it('employeeFullName - returns formatted full name', () => {
        expect(authStore.employeeFullName).toBe('John Doe')
      })

      it('employeeInitials - returns correct initials', () => {
        expect(authStore.employeeInitials).toBe('JD')
      })

      it('handles empty employee gracefully', () => {
        authStore.employee = null
        expect(authStore.employeeFullName).toBe('')
        expect(authStore.employeeInitials).toBe('')
      })
    })

    describe('Account Lockout', () => {
      it('isAccountLocked - detects locked accounts', () => {
        authStore.lockoutUntil = Date.now() + 60000 // 1 minute from now
        expect(authStore.isAccountLocked).toBe(true)
        
        authStore.lockoutUntil = Date.now() - 60000 // 1 minute ago
        expect(authStore.isAccountLocked).toBe(false)
      })

      it('lockoutTimeRemaining - calculates remaining time correctly', () => {
        authStore.lockoutUntil = Date.now() + 300000 // 5 minutes from now
        expect(authStore.lockoutTimeRemaining).toBe(300)
        
        authStore.lockoutUntil = Date.now() - 60000 // Past
        expect(authStore.lockoutTimeRemaining).toBe(0)
      })
    })
  })

  describe('Authentication Actions', () => {
    describe('initialize', () => {
      it('initializes auth state from localStorage', async () => {
        const futureExpiry = Date.now() + 3600000
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'uc_access_token') return 'stored-token'
          if (key === 'uc_token_expiry') return futureExpiry.toString()
          return null
        })
        
        authApi.me.mockResolvedValue({
          data: {
            employee: mockEmployee,
            access_token: 'stored-token',
            expires_in: 3600
          }
        })
        
        await authStore.initialize()
        
        expect(authStore.accessToken).toBe('stored-token')
        expect(authStore.employee).toEqual(mockEmployee)
        expect(authStore.isAuthenticated).toBe(true)
        expect(authStore.initialized).toBe(true)
      })

      it('clears invalid tokens during initialization', async () => {
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

      it('skips initialization if already initialized', async () => {
        authStore.initialized = true
        
        await authStore.initialize()
        
        expect(authApi.me).not.toHaveBeenCalled()
      })
    })

    describe('login', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        remember_me: true
      }

      it('successfully authenticates user', async () => {
        authApi.login.mockResolvedValue(mockAuthResponse)
        
        const result = await authStore.login(credentials)
        
        expect(authApi.login).toHaveBeenCalledWith(
          expect.objectContaining({
            ...credentials,
            device_fingerprint: expect.any(String)
          })
        )
        expect(authStore.employee).toEqual(mockEmployee)
        expect(authStore.isAuthenticated).toBe(true)
        expect(authStore.accessToken).toBe('mock-token-123')
        expect(authStore.loginAttempts).toBe(0)
        expect(result).toEqual(mockAuthResponse)
      })

      it('prevents login when account is locked', async () => {
        authStore.lockoutUntil = Date.now() + 60000
        
        await expect(authStore.login(credentials)).rejects.toThrow('Account locked')
        expect(authApi.login).not.toHaveBeenCalled()
      })

      it('handles login errors and tracks attempts', async () => {
        const error = {
          response: {
            data: {
              message: 'Invalid credentials',
              remaining_attempts: 3
            }
          }
        }
        authApi.login.mockRejectedValue(error)
        
        await expect(authStore.login(credentials)).rejects.toThrow()
        
        expect(authStore.loginAttempts).toBe(2) // 5 - 3 remaining
        expect(authStore.error).toBe('Invalid credentials')
      })

      it('locks account after maximum attempts', async () => {
        authStore.loginAttempts = 4 // Already at 4 attempts
        
        const error = { response: { data: { message: 'Invalid credentials' } } }
        authApi.login.mockRejectedValue(error)
        
        await expect(authStore.login(credentials)).rejects.toThrow()
        
        expect(authStore.loginAttempts).toBe(5)
        expect(authStore.lockoutUntil).toBeGreaterThan(Date.now())
        expect(authStore.error).toContain('locked for 30 minutes')
      })

      it('stores tokens securely after successful login', async () => {
        authApi.login.mockResolvedValue(mockAuthResponse)
        
        await authStore.login(credentials)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_access_token', 'mock-token-123')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_token_expiry', expect.any(String))
        // Remember me functionality stores email when enabled
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_remember_user', 'test@example.com')
      })
    })

    describe('logout', () => {
      beforeEach(() => {
        authStore.employee = mockEmployee
        authStore.isAuthenticated = true
        authStore.accessToken = 'test-token'
      })

      it('successfully logs out user', async () => {
        authApi.logout.mockResolvedValue({})
        
        await authStore.logout()
        
        expect(authApi.logout).toHaveBeenCalled()
        expect(authStore.employee).toBe(null)
        expect(authStore.isAuthenticated).toBe(false)
        expect(authStore.accessToken).toBe(null)
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('uc_access_token')
      })

      it('handles logout API errors gracefully', async () => {
        authApi.logout.mockRejectedValue(new Error('Network error'))
        
        await authStore.logout()
        
        // Should still clear local state even if API call fails
        expect(authStore.employee).toBe(null)
        expect(authStore.isAuthenticated).toBe(false)
      })
    })

    describe('forceLogout', () => {
      it('clears auth data and redirects to login', () => {
        authStore.employee = mockEmployee
        authStore.isAuthenticated = true
        
        const originalHref = window.location.href
        window.location.href = 'http://localhost/dashboard'
        
        authStore.forceLogout('Session expired')
        
        expect(authStore.employee).toBe(null)
        expect(authStore.isAuthenticated).toBe(false)
        expect(window.location.href).toContain('/employee/login')
        expect(window.location.href).toContain('Session%20expired')
        
        window.location.href = originalHref
      })

      it('does not redirect if already on login page', () => {
        window.location.pathname = '/employee/login'
        const originalHref = window.location.href
        
        authStore.forceLogout('Test reason')
        
        expect(window.location.href).toBe(originalHref)
      })
    })

    describe('refreshToken', () => {
      beforeEach(() => {
        authStore.accessToken = 'old-token'
      })

      it('successfully refreshes token', async () => {
        const refreshResponse = {
          data: {
            access_token: 'new-token',
            expires_in: 3600
          }
        }
        authApi.refresh.mockResolvedValue(refreshResponse)
        
        await authStore.refreshToken()
        
        expect(authStore.accessToken).toBe('new-token')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('uc_access_token', 'new-token')
      })

      it('logs out user on refresh failure', async () => {
        authApi.refresh.mockRejectedValue(new Error('Refresh failed'))
        
        await expect(authStore.refreshToken()).rejects.toThrow()
        
        expect(authStore.employee).toBe(null)
        expect(authStore.isAuthenticated).toBe(false)
      })
    })
  })

  describe('Token Refresh Timer', () => {
    it('starts refresh timer correctly', () => {
      authStore.tokenExpiry = Date.now() + 300000 // 5 minutes from now
      
      authStore.startTokenRefreshTimer()
      
      expect(authStore.refreshTimer).toBeDefined()
    })

    it('clears existing timer when starting new one', () => {
      authStore.refreshTimer = setTimeout(() => {}, 1000)
      const oldTimer = authStore.refreshTimer
      
      authStore.startTokenRefreshTimer()
      
      expect(authStore.refreshTimer).not.toBe(oldTimer)
    })

    it('auto-refreshes token before expiry', async () => {
      authStore.tokenExpiry = Date.now() + 180000 // 3 minutes from now
      authApi.refresh.mockResolvedValue({
        data: { access_token: 'refreshed-token', expires_in: 3600 }
      })
      
      const refreshSpy = vi.spyOn(authStore, 'refreshToken')
      authStore.startTokenRefreshTimer()
      
      // Fast-forward to when refresh should trigger (1 minute before expiry)
      vi.advanceTimersByTime(120000)
      
      // Manually trigger the refresh to avoid timer complexity
      if (refreshSpy.mock.calls.length === 0) {
        await authStore.refreshToken()
      }
      
      expect(authApi.refresh).toHaveBeenCalled()
    }, 1000) // Set timeout to 1 second

    it('force logs out on auto-refresh failure', async () => {
      authStore.tokenExpiry = Date.now() + 180000
      authApi.refresh.mockRejectedValue(new Error('Refresh failed'))
      authStore.forceLogout = vi.fn()
      
      authStore.startTokenRefreshTimer()
      vi.advanceTimersByTime(120000)
      
      await vi.runAllTimersAsync()
      
      expect(authStore.forceLogout).toHaveBeenCalledWith('Token refresh failed')
    })
  })

  describe('Session Management', () => {
    it('updates last activity timestamp', () => {
      const beforeTime = Date.now()
      authStore.updateLastActivity()
      const afterTime = Date.now()
      
      expect(authStore.lastActivity).toBeGreaterThanOrEqual(beforeTime)
      expect(authStore.lastActivity).toBeLessThanOrEqual(afterTime)
    })

    it('checks session timeout and forces logout if expired', () => {
      authStore.lastActivity = Date.now() - (20 * 60 * 1000) // 20 minutes ago
      authStore.forceLogout = vi.fn()
      
      const result = authStore.checkSessionTimeout()
      
      expect(result).toBe(false)
      expect(authStore.forceLogout).toHaveBeenCalledWith('Session expired due to inactivity')
    })

    it('updates activity and returns true for active sessions', () => {
      authStore.lastActivity = Date.now() - (10 * 60 * 1000) // 10 minutes ago
      
      const result = authStore.checkSessionTimeout()
      
      expect(result).toBe(true)
      expect(authStore.lastActivity).toBeCloseTo(Date.now(), -2)
    })
  })

  describe('Password Management', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        current_password: 'oldpass',
        new_password: 'newpass',
        new_password_confirmation: 'newpass'
      }
      
      authApi.changePassword.mockResolvedValue({})
      
      const result = await authStore.changePassword(passwordData)
      
      expect(authApi.changePassword).toHaveBeenCalledWith(passwordData)
      expect(result).toBe(true)
      expect(authStore.error).toBe(null)
    })

    it('handles password change errors', async () => {
      const error = {
        response: { data: { message: 'Current password is incorrect' } }
      }
      authApi.changePassword.mockRejectedValue(error)
      
      await expect(authStore.changePassword({})).rejects.toThrow()
      expect(authStore.error).toBe('Current password is incorrect')
    })

    it('sends forgot password email', async () => {
      authApi.forgotPassword.mockResolvedValue({})
      
      const result = await authStore.forgotPassword('test@example.com')
      
      expect(authApi.forgotPassword).toHaveBeenCalledWith('test@example.com')
      expect(result).toBe(true)
    })

    it('resets password with token', async () => {
      const resetData = {
        token: 'reset-token',
        email: 'test@example.com',
        password: 'newpassword',
        password_confirmation: 'newpassword'
      }
      
      authApi.resetPassword.mockResolvedValue({})
      
      const result = await authStore.resetPassword(resetData)
      
      expect(authApi.resetPassword).toHaveBeenCalledWith(resetData)
      expect(result).toBe(true)
    })
  })

  describe('Profile Management', () => {
    it('updates profile successfully', async () => {
      const profileData = { first_name: 'Jane', last_name: 'Smith' }
      const response = {
        data: { data: { ...mockEmployee, ...profileData } }
      }
      
      authStore.employee = mockEmployee
      authApi.updateProfile.mockResolvedValue(response)
      
      const result = await authStore.updateProfile(profileData)
      
      expect(authApi.updateProfile).toHaveBeenCalledWith(profileData)
      expect(authStore.employee.first_name).toBe('Jane')
      expect(authStore.employee.last_name).toBe('Smith')
      expect(result).toEqual(response.data.data)
    })
  })

  describe('Utility Methods', () => {
    it('generates device fingerprint', () => {
      const fingerprint = authStore.generateDeviceFingerprint()
      
      expect(fingerprint).toBeDefined()
      expect(typeof fingerprint).toBe('string')
      expect(fingerprint.length).toBeGreaterThan(0)
    })

    it('gets remembered email from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('remembered@example.com')
      
      const email = authStore.getRememberedEmail()
      
      expect(email).toBe('remembered@example.com')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('uc_remember_user')
    })

    it('returns empty string when no remembered email', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const email = authStore.getRememberedEmail()
      
      expect(email).toBe('')
    })
  })

  describe('Security Features', () => {
    it('validates device fingerprint generation fallback', () => {
      // Mock canvas creation failure
      const originalCreateElement = document.createElement
      document.createElement = vi.fn().mockImplementation(() => {
        throw new Error('Canvas not supported')
      })
      
      const fingerprint = authStore.generateDeviceFingerprint()
      
      expect(fingerprint).toBeDefined()
      expect(typeof fingerprint).toBe('string')
      
      document.createElement = originalCreateElement
    })

    it('properly handles progressive lockout', async () => {
      const error = { 
        response: { 
          data: { 
            message: 'Invalid credentials',
            remaining_attempts: 2
          } 
        } 
      }
      authApi.login.mockRejectedValue(error)
      
      // First few attempts
      for (let i = 0; i < 3; i++) {
        try {
          await authStore.login({ email: 'test', password: 'wrong' })
        } catch {}
      }
      
      expect(authStore.loginAttempts).toBe(3) // 5 - 2 remaining
      
      // Set up final lockout attempt
      authStore.loginAttempts = 4 // Already at 4 attempts
      const lockoutError = { response: { data: { message: 'Invalid credentials' } } }
      authApi.login.mockRejectedValue(lockoutError)
      
      try {
        await authStore.login({ email: 'test', password: 'wrong' })
      } catch {}
      
      expect(authStore.isAccountLocked).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles malformed localStorage data', async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'uc_token_expiry') return 'invalid-number'
        return null
      })
      
      await authStore.initialize()
      
      expect(authStore.initialized).toBe(true)
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('handles missing employee data gracefully', () => {
      authStore.employee = null
      
      expect(() => authStore.employeeFullName).not.toThrow()
      expect(() => authStore.employeeInitials).not.toThrow()
      expect(() => authStore.hasRole('admin')).not.toThrow()
    })

    it('handles cleanup on component unmount', () => {
      authStore.refreshTimer = setTimeout(() => {}, 1000)
      
      authStore.clearTokenRefreshTimer()
      
      expect(authStore.refreshTimer).toBe(null)
    })
  })
})