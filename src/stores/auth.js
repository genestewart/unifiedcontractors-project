import { defineStore } from 'pinia'
import { authApi } from '@/services/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Authentication state
    employee: null,
    isAuthenticated: false,
    permissions: [],
    loading: false,
    error: null,
    
    // Token management
    accessToken: null,
    tokenExpiry: null,
    refreshTimer: null,
    
    // Security features
    sessionTimeout: 15 * 60 * 1000, // 15 minutes
    lastActivity: null,
    initialized: false,
    
    // Login tracking
    loginAttempts: 0,
    lockoutUntil: null
  }),

  getters: {
    // Role checking
    hasRole: (state) => (role) => {
      return state.employee?.role === role
    },

    hasAnyRole: (state) => (roles) => {
      return roles.includes(state.employee?.role)
    },

    // Permission checking
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },

    hasAnyPermission: (state) => (permissions) => {
      return permissions.some(permission => 
        state.permissions.includes(permission)
      )
    },

    // Token management
    isTokenExpired: (state) => {
      if (!state.tokenExpiry) return true
      return Date.now() >= state.tokenExpiry
    },

    isSessionExpired: (state) => {
      if (!state.lastActivity) return false
      return Date.now() - state.lastActivity > state.sessionTimeout
    },

    // User display info
    employeeFullName: (state) => {
      if (!state.employee) return ''
      return `${state.employee.first_name} ${state.employee.last_name}`
    },

    employeeInitials: (state) => {
      if (!state.employee) return ''
      return `${state.employee.first_name[0]}${state.employee.last_name[0]}`
    },

    // Account lockout status
    isAccountLocked: (state) => {
      return state.lockoutUntil && Date.now() < state.lockoutUntil
    },

    lockoutTimeRemaining: (state) => {
      if (!state.lockoutUntil) return 0
      const remaining = state.lockoutUntil - Date.now()
      return Math.max(0, Math.ceil(remaining / 1000)) // seconds
    }
  },

  actions: {
    // Initialize authentication state
    async initialize() {
      if (this.initialized) return
      
      try {
        this.loading = true
        
        // Check for existing session
        const token = localStorage.getItem('uc_access_token')
        const tokenExpiry = localStorage.getItem('uc_token_expiry')
        
        if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
          this.accessToken = token
          this.tokenExpiry = parseInt(tokenExpiry)
          
          // Validate token and get user data
          const response = await authApi.me()
          this.setAuthData(response.data)
          this.startTokenRefreshTimer()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.clearAuthData()
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    // Login action
    async login(credentials) {
      this.loading = true
      this.error = null

      // Check if account is locked
      if (this.isAccountLocked) {
        this.error = `Account locked. Try again in ${Math.ceil(this.lockoutTimeRemaining / 60)} minutes.`
        this.loading = false
        throw new Error(this.error)
      }

      try {
        const response = await authApi.login({
          ...credentials,
          device_fingerprint: this.generateDeviceFingerprint()
        })

        // Reset login attempts on successful login
        this.loginAttempts = 0
        this.lockoutUntil = null

        this.setAuthData(response.data)
        this.startTokenRefreshTimer()
        this.updateLastActivity()

        // Store tokens securely
        this.storeTokens(response.data, credentials.remember_me)

        return response
      } catch (error) {
        this.handleLoginError(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Handle login errors and lockout logic
    handleLoginError(error) {
      const errorData = error.response?.data

      // Increment login attempts
      this.loginAttempts++

      if (errorData?.remaining_attempts !== undefined) {
        this.loginAttempts = 5 - errorData.remaining_attempts
      }

      // Implement progressive lockout
      if (this.loginAttempts >= 5) {
        this.lockoutUntil = Date.now() + (30 * 60 * 1000) // 30 minutes
        this.error = 'Too many failed attempts. Account locked for 30 minutes.'
      } else if (this.loginAttempts >= 3) {
        this.error = `Login failed. ${5 - this.loginAttempts} attempts remaining before lockout.`
      } else {
        this.error = errorData?.message || 'Login failed. Please check your credentials.'
      }
    },

    // Token refresh
    async refreshToken() {
      try {
        const response = await authApi.refresh()
        
        this.accessToken = response.data.access_token
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
        
        // Update stored tokens
        localStorage.setItem('uc_access_token', this.accessToken)
        localStorage.setItem('uc_token_expiry', this.tokenExpiry.toString())
        
        this.startTokenRefreshTimer()
        this.updateLastActivity()
        
        return response
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
        throw error
      }
    },

    // Logout
    async logout() {
      try {
        if (this.accessToken) {
          await authApi.logout()
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuthData()
      }
    },

    // Force logout (for security reasons)
    forceLogout(reason = 'Session expired') {
      console.warn('Force logout:', reason)
      this.clearAuthData()
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/employee/login') {
        window.location.href = `/employee/login?message=${encodeURIComponent(reason)}`
      }
    },

    // Set authentication data
    setAuthData(data) {
      this.employee = data.employee
      this.isAuthenticated = true
      this.permissions = data.employee.permissions || []
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000)
      this.error = null
    },

    // Clear authentication data
    clearAuthData() {
      this.employee = null
      this.isAuthenticated = false
      this.permissions = []
      this.accessToken = null
      this.tokenExpiry = null
      this.error = null
      this.lastActivity = null
      
      this.clearTokenRefreshTimer()
      this.clearStoredTokens()
    },

    // Token management
    startTokenRefreshTimer() {
      this.clearTokenRefreshTimer()
      
      // Refresh token 2 minutes before expiry
      const refreshTime = (this.tokenExpiry - Date.now()) - 120000
      
      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken().catch(error => {
            console.error('Auto token refresh failed:', error)
            this.forceLogout('Token refresh failed')
          })
        }, refreshTime)
      }
    },

    clearTokenRefreshTimer() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    // Session management
    updateLastActivity() {
      this.lastActivity = Date.now()
    },

    checkSessionTimeout() {
      if (this.isSessionExpired) {
        this.forceLogout('Session expired due to inactivity')
        return false
      }
      this.updateLastActivity()
      return true
    },

    // Password management
    async changePassword(passwordData) {
      this.loading = true
      this.error = null

      try {
        await authApi.changePassword(passwordData)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to change password'
        throw error
      } finally {
        this.loading = false
      }
    },

    async forgotPassword(email) {
      this.loading = true
      this.error = null

      try {
        await authApi.forgotPassword(email)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send password reset email'
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPassword(resetData) {
      this.loading = true
      this.error = null

      try {
        await authApi.resetPassword(resetData)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to reset password'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Profile management
    async updateProfile(profileData) {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.updateProfile(profileData)
        this.employee = { ...this.employee, ...response.data.data }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update profile'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Utility methods
    generateDeviceFingerprint() {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Device fingerprint', 2, 2)
        
        const fingerprint = {
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          canvas: canvas.toDataURL(),
          userAgent: navigator.userAgent.slice(0, 200)
        }
        
        return btoa(JSON.stringify(fingerprint))
      } catch (error) {
        console.warn('Failed to generate device fingerprint:', error)
        return btoa(JSON.stringify({
          timestamp: Date.now(),
          random: Math.random().toString(36).substr(2, 9)
        }))
      }
    },

    storeTokens(data, rememberMe = false) {
      localStorage.setItem('uc_access_token', data.access_token)
      localStorage.setItem('uc_token_expiry', this.tokenExpiry.toString())
      
      // Store user preferences
      if (rememberMe) {
        localStorage.setItem('uc_remember_user', data.employee.email)
      }
    },

    clearStoredTokens() {
      localStorage.removeItem('uc_access_token')
      localStorage.removeItem('uc_token_expiry')
      localStorage.removeItem('uc_remember_user')
    },

    // Get remembered email
    getRememberedEmail() {
      return localStorage.getItem('uc_remember_user') || ''
    }
  }
})