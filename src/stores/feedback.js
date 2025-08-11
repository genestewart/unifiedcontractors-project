import { defineStore } from 'pinia'
import apiClient from '@/services/api'

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedback: [],
    currentFeedback: null,
    loading: false,
    error: null,
    
    // Pagination
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1
    },
    
    // Filters
    filters: {
      search: '',
      project_id: null,
      status: '',
      rating: null,
      date_from: null,
      date_to: null
    },
    
    // Feedback statistics
    statistics: {
      total_feedback: 0,
      average_rating: 0,
      by_status: {},
      by_rating: {},
      recent_feedback: []
    }
  }),

  getters: {
    // Filter feedback
    filteredFeedback: (state) => {
      let filtered = [...state.feedback]
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(feedback =>
          feedback.comment?.toLowerCase().includes(search) ||
          feedback.client_name?.toLowerCase().includes(search) ||
          feedback.project?.name?.toLowerCase().includes(search)
        )
      }
      
      if (state.filters.project_id) {
        filtered = filtered.filter(feedback => feedback.project_id === state.filters.project_id)
      }
      
      if (state.filters.status) {
        filtered = filtered.filter(feedback => feedback.status === state.filters.status)
      }
      
      if (state.filters.rating) {
        filtered = filtered.filter(feedback => feedback.rating === state.filters.rating)
      }
      
      return filtered
    },

    // Feedback by project
    feedbackByProject: (state) => (projectId) => {
      return state.feedback.filter(feedback => feedback.project_id === projectId)
    },

    // Feedback by status
    feedbackByStatus: (state) => (status) => {
      return state.feedback.filter(feedback => feedback.status === status)
    },

    // Feedback by rating
    feedbackByRating: (state) => (rating) => {
      return state.feedback.filter(feedback => feedback.rating === rating)
    },

    // Recent feedback (last 7 days)
    recentFeedback: (state) => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      return state.feedback
        .filter(feedback => new Date(feedback.created_at) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    },

    // Pending feedback (requiring response)
    pendingFeedback: (state) => {
      return state.feedback.filter(feedback => 
        feedback.status === 'pending' || feedback.status === 'under_review'
      )
    },

    // High priority feedback (low ratings)
    highPriorityFeedback: (state) => {
      return state.feedback
        .filter(feedback => feedback.rating <= 2 && feedback.status === 'pending')
        .sort((a, b) => a.rating - b.rating)
    },

    // Feedback statistics
    feedbackStats: (state) => {
      const stats = {
        total: state.feedback.length,
        by_status: {},
        by_rating: {},
        average_rating: 0
      }

      let totalRating = 0
      let ratedCount = 0

      state.feedback.forEach(feedback => {
        // By status
        if (!stats.by_status[feedback.status]) {
          stats.by_status[feedback.status] = 0
        }
        stats.by_status[feedback.status]++

        // By rating
        if (feedback.rating) {
          if (!stats.by_rating[feedback.rating]) {
            stats.by_rating[feedback.rating] = 0
          }
          stats.by_rating[feedback.rating]++
          totalRating += feedback.rating
          ratedCount++
        }
      })

      stats.average_rating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0

      return stats
    }
  },

  actions: {
    // Fetch feedback with pagination and filters
    async fetchFeedback(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = {
          page: options.page || this.pagination.current_page,
          per_page: options.per_page || this.pagination.per_page,
          ...this.filters,
          ...options.filters
        }

        // Clean empty values
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })

        const response = await apiClient.get('/feedback', { params })
        
        this.feedback = response.data.data
        this.pagination = {
          current_page: response.data.meta.current_page,
          per_page: response.data.meta.per_page,
          total: response.data.meta.total,
          last_page: response.data.meta.last_page
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch feedback'
        console.error('Fetch feedback error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single feedback
    async fetchSingleFeedback(id) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.get(`/feedback/${id}`)
        this.currentFeedback = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch feedback'
        console.error('Fetch feedback error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Submit feedback response
    async submitResponse(feedbackId, responseData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.post(`/feedback/${feedbackId}/response`, responseData)
        const updatedFeedback = response.data.data
        
        const index = this.feedback.findIndex(f => f.id === feedbackId)
        if (index !== -1) {
          this.feedback[index] = updatedFeedback
        }
        
        if (this.currentFeedback?.id === feedbackId) {
          this.currentFeedback = updatedFeedback
        }
        
        this.updateStatistics()
        return updatedFeedback
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to submit response'
        console.error('Submit response error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update feedback status
    async updateFeedbackStatus(feedbackId, status) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.patch(`/feedback/${feedbackId}/status`, { status })
        const updatedFeedback = response.data.data
        
        const index = this.feedback.findIndex(f => f.id === feedbackId)
        if (index !== -1) {
          this.feedback[index] = updatedFeedback
        }
        
        if (this.currentFeedback?.id === feedbackId) {
          this.currentFeedback = updatedFeedback
        }
        
        this.updateStatistics()
        return updatedFeedback
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update status'
        console.error('Update status error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Mark feedback as resolved
    async resolveFeedback(feedbackId, resolutionNotes = '') {
      return this.updateFeedbackStatus(feedbackId, 'resolved', { resolution_notes: resolutionNotes })
    },

    // Archive feedback
    async archiveFeedback(feedbackId) {
      return this.updateFeedbackStatus(feedbackId, 'archived')
    },

    // Delete feedback (admin only)
    async deleteFeedback(id) {
      this.loading = true
      this.error = null

      try {
        await apiClient.delete(`/feedback/${id}`)
        
        this.feedback = this.feedback.filter(f => f.id !== id)
        if (this.currentFeedback?.id === id) {
          this.currentFeedback = null
        }
        
        this.updateStatistics()
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete feedback'
        console.error('Delete feedback error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch feedback statistics
    async fetchStatistics() {
      try {
        const response = await apiClient.get('/feedback/statistics')
        this.statistics = response.data.data
        return this.statistics
      } catch (error) {
        console.error('Fetch feedback statistics error:', error)
        throw error
      }
    },

    // Export feedback to CSV
    async exportFeedback(filters = {}) {
      try {
        const params = { ...this.filters, ...filters, export: 'csv' }
        
        const response = await apiClient.get('/feedback/export', {
          params,
          responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `feedback_export_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to export feedback'
        console.error('Export feedback error:', error)
        throw error
      }
    },

    // Bulk update feedback status
    async bulkUpdateStatus(feedbackIds, status) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.patch('/feedback/bulk-status', {
          feedback_ids: feedbackIds,
          status
        })
        
        // Update local feedback items
        feedbackIds.forEach(id => {
          const index = this.feedback.findIndex(f => f.id === id)
          if (index !== -1) {
            this.feedback[index] = {
              ...this.feedback[index],
              status,
              updated_at: new Date().toISOString()
            }
          }
        })
        
        this.updateStatistics()
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to bulk update status'
        console.error('Bulk update error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },

    // Clear filters
    clearFilters() {
      this.filters = {
        search: '',
        project_id: null,
        status: '',
        rating: null,
        date_from: null,
        date_to: null
      }
    },

    // Set current page
    setPage(page) {
      this.pagination.current_page = page
    },

    // Set items per page
    setPerPage(perPage) {
      this.pagination.per_page = perPage
      this.pagination.current_page = 1 // Reset to first page
    },

    // Update local statistics
    updateStatistics() {
      const stats = this.feedbackStats
      this.statistics = {
        ...this.statistics,
        total_feedback: stats.total,
        average_rating: parseFloat(stats.average_rating),
        by_status: stats.by_status,
        by_rating: stats.by_rating,
        recent_feedback: this.recentFeedback
      }
    },

    // Clear current feedback
    clearCurrentFeedback() {
      this.currentFeedback = null
    },

    // Clear all data
    clearData() {
      this.feedback = []
      this.currentFeedback = null
      this.error = null
      this.pagination = {
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
      }
      this.statistics = {
        total_feedback: 0,
        average_rating: 0,
        by_status: {},
        by_rating: {},
        recent_feedback: []
      }
    },

    // Format rating display
    formatRating(rating) {
      const ratingLabels = {
        1: 'Poor',
        2: 'Fair', 
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
      }
      
      return ratingLabels[rating] || 'Not Rated'
    },

    // Get rating color
    getRatingColor(rating) {
      const colors = {
        1: 'red',
        2: 'orange',
        3: 'yellow',
        4: 'blue',
        5: 'green'
      }
      
      return colors[rating] || 'gray'
    }
  }
})