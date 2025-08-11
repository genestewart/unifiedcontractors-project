import axios from 'axios'

// Create separate axios instance for client (public) API calls
// This instance doesn't include authentication headers since client access is token-based
const clientApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // No cookies needed for public client access
})

// Response interceptor to handle errors
clientApiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }
    
    // Log client API errors for debugging
    console.error('Client API error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    })

    return Promise.reject(error)
  }
)

// Client API methods
export const clientApi = {
  // Validate QR token and get project information
  async validateToken(token) {
    try {
      const response = await clientApiClient.get(`/client/validate-token/${token}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token validation failed')
    }
  },

  // Get project files for client access
  async getProjectFiles(token) {
    try {
      const response = await clientApiClient.get(`/client/project-files/${token}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load project files')
    }
  },

  // Get specific file for client viewing
  async getFile(token, fileId) {
    try {
      const response = await clientApiClient.get(`/client/file/${token}/${fileId}`, {
        responseType: 'blob' // For file download
      })
      return response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load file')
    }
  },

  // Get file thumbnail
  async getThumbnail(token, fileId, size = 'medium') {
    try {
      const response = await clientApiClient.get(`/client/thumbnail/${token}/${fileId}/${size}`, {
        responseType: 'blob'
      })
      return response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load thumbnail')
    }
  },

  // Download file
  async downloadFile(token, fileId) {
    try {
      const response = await clientApiClient.get(`/client/download/${token}/${fileId}`, {
        responseType: 'blob'
      })
      return response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download file')
    }
  },

  // Submit client feedback
  async submitFeedback(feedbackData) {
    try {
      const response = await clientApiClient.post('/client/submit-feedback', feedbackData, {
        headers: {
          'Content-Type': 'multipart/form-data' // For file uploads
        }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit feedback')
    }
  },

  // Track token usage for analytics
  async trackTokenUsage(usageData) {
    try {
      const response = await clientApiClient.post('/client/track-usage', usageData)
      return response.data
    } catch (error) {
      // Non-critical error, don't throw
      console.warn('Failed to track token usage:', error)
      return null
    }
  },

  // Get project progress/updates (if needed)
  async getProjectUpdates(token) {
    try {
      const response = await clientApiClient.get(`/client/project-updates/${token}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load project updates')
    }
  }
}

export default clientApiClient