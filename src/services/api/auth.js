import apiClient from './index.js'

export const authApi = {
  /**
   * Login with email and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Employee email
   * @param {string} credentials.password - Password
   * @param {boolean} credentials.remember_me - Remember me option
   * @param {string} credentials.device_fingerprint - Device fingerprint
   * @returns {Promise<Object>} Login response with user data and tokens
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.remember_me || false,
        device_fingerprint: credentials.device_fingerprint
      })
      return response
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New access token data
   */
  async refresh() {
    try {
      const response = await apiClient.post('/auth/refresh')
      return response
    } catch (error) {
      console.error('Token refresh API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Logout current session
   * @param {Object} options - Logout options
   * @param {boolean} options.logout_all_devices - Logout from all devices
   * @returns {Promise<Object>} Logout response
   */
  async logout(options = {}) {
    try {
      const response = await apiClient.post('/auth/logout', {
        logout_all_devices: options.logout_all_devices || false
      })
      return response
    } catch (error) {
      console.error('Logout API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async me() {
    try {
      const response = await apiClient.get('/auth/me')
      return response
    } catch (error) {
      console.error('Get profile API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Request password reset
   * @param {string} email - Employee email
   * @returns {Promise<Object>} Password reset response
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email
      })
      return response
    } catch (error) {
      console.error('Forgot password API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Reset password with token
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.email - Employee email
   * @param {string} resetData.token - Reset token from email
   * @param {string} resetData.password - New password
   * @param {string} resetData.password_confirmation - Password confirmation
   * @returns {Promise<Object>} Password reset response
   */
  async resetPassword(resetData) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email: resetData.email,
        token: resetData.token,
        password: resetData.password,
        password_confirmation: resetData.password_confirmation
      })
      return response
    } catch (error) {
      console.error('Reset password API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Change current password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.current_password - Current password
   * @param {string} passwordData.password - New password
   * @param {string} passwordData.password_confirmation - Password confirmation
   * @returns {Promise<Object>} Password change response
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.patch('/auth/change-password', passwordData)
      return response
    } catch (error) {
      console.error('Change password API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Profile update response
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.patch('/auth/profile', profileData)
      return response
    } catch (error) {
      console.error('Update profile API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Get user sessions
   * @returns {Promise<Object>} User sessions data
   */
  async getSessions() {
    try {
      const response = await apiClient.get('/auth/sessions')
      return response
    } catch (error) {
      console.error('Get sessions API error:', error.response?.data || error.message)
      throw error
    }
  },

  /**
   * Terminate specific session
   * @param {string} sessionId - Session ID to terminate
   * @returns {Promise<Object>} Session termination response
   */
  async terminateSession(sessionId) {
    try {
      const response = await apiClient.delete(`/auth/sessions/${sessionId}`)
      return response
    } catch (error) {
      console.error('Terminate session API error:', error.response?.data || error.message)
      throw error
    }
  }
}