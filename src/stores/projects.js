import { defineStore } from 'pinia'
import apiClient from '@/services/api'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    
    // Pagination and filtering
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1
    },
    
    filters: {
      search: '',
      status: '',
      employee_id: null,
      date_from: null,
      date_to: null
    },
    
    // Dashboard statistics
    statistics: {
      total_projects: 0,
      active_projects: 0,
      completed_projects: 0,
      pending_projects: 0,
      projects_by_status: {},
      recent_projects: []
    }
  }),

  getters: {
    // Project filtering
    filteredProjects: (state) => {
      let filtered = [...state.projects]
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(project =>
          project.name.toLowerCase().includes(search) ||
          project.description?.toLowerCase().includes(search) ||
          project.client_name?.toLowerCase().includes(search)
        )
      }
      
      if (state.filters.status) {
        filtered = filtered.filter(project => project.status === state.filters.status)
      }
      
      return filtered
    },

    // Projects by status
    projectsByStatus: (state) => (status) => {
      return state.projects.filter(project => project.status === status)
    },

    // User's projects
    userProjects: (state) => (userId) => {
      return state.projects.filter(project =>
        project.employees?.some(emp => emp.id === userId)
      )
    },

    // Recent projects (last 30 days)
    recentProjects: (state) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return state.projects
        .filter(project => new Date(project.created_at) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    },

    // Project statistics
    projectStats: (state) => {
      const stats = {
        total: state.projects.length,
        active: 0,
        completed: 0,
        pending: 0,
        on_hold: 0
      }

      state.projects.forEach(project => {
        if (stats.hasOwnProperty(project.status)) {
          stats[project.status]++
        }
      })

      return stats
    }
  },

  actions: {
    // Fetch projects with pagination and filters
    async fetchProjects(options = {}) {
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

        const response = await apiClient.get('/projects', { params })
        
        this.projects = response.data.data
        this.pagination = {
          current_page: response.data.meta.current_page,
          per_page: response.data.meta.per_page,
          total: response.data.meta.total,
          last_page: response.data.meta.last_page
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch projects'
        console.error('Fetch projects error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single project
    async fetchProject(id) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.get(`/projects/${id}`)
        this.currentProject = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch project'
        console.error('Fetch project error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new project
    async createProject(projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.post('/projects', projectData)
        const newProject = response.data.data
        
        this.projects.unshift(newProject)
        this.updateStatistics()
        
        return newProject
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create project'
        console.error('Create project error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update project
    async updateProject(id, projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.put(`/projects/${id}`, projectData)
        const updatedProject = response.data.data
        
        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = updatedProject
        }
        
        if (this.currentProject?.id === id) {
          this.currentProject = updatedProject
        }
        
        this.updateStatistics()
        return updatedProject
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update project'
        console.error('Update project error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete project
    async deleteProject(id) {
      this.loading = true
      this.error = null

      try {
        await apiClient.delete(`/projects/${id}`)
        
        this.projects = this.projects.filter(p => p.id !== id)
        if (this.currentProject?.id === id) {
          this.currentProject = null
        }
        
        this.updateStatistics()
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete project'
        console.error('Delete project error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Assign employee to project
    async assignEmployee(projectId, employeeId) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.post(`/projects/${projectId}/employees`, {
          employee_id: employeeId
        })
        
        // Update project in local state
        const projectIndex = this.projects.findIndex(p => p.id === projectId)
        if (projectIndex !== -1 && response.data.data) {
          this.projects[projectIndex] = response.data.data
        }
        
        if (this.currentProject?.id === projectId) {
          this.currentProject = response.data.data
        }
        
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to assign employee'
        console.error('Assign employee error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Remove employee from project
    async removeEmployee(projectId, employeeId) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.delete(`/projects/${projectId}/employees/${employeeId}`)
        
        // Update project in local state
        const projectIndex = this.projects.findIndex(p => p.id === projectId)
        if (projectIndex !== -1 && response.data.data) {
          this.projects[projectIndex] = response.data.data
        }
        
        if (this.currentProject?.id === projectId) {
          this.currentProject = response.data.data
        }
        
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to remove employee'
        console.error('Remove employee error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Generate QR code for project
    async generateQRCode(projectId) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.post(`/projects/${projectId}/qr-code`)
        return response.data.qr_code_url
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to generate QR code'
        console.error('Generate QR code error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch dashboard statistics
    async fetchStatistics() {
      try {
        const response = await apiClient.get('/dashboard/statistics')
        this.statistics = response.data.data
        return this.statistics
      } catch (error) {
        console.error('Fetch statistics error:', error)
        throw error
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
        status: '',
        employee_id: null,
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
      const stats = this.projectStats
      this.statistics = {
        ...this.statistics,
        total_projects: stats.total,
        active_projects: stats.active,
        completed_projects: stats.completed,
        pending_projects: stats.pending,
        recent_projects: this.recentProjects
      }
    },

    // Clear current project
    clearCurrentProject() {
      this.currentProject = null
    },

    // Clear all data
    clearData() {
      this.projects = []
      this.currentProject = null
      this.error = null
      this.pagination = {
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
      }
      this.statistics = {
        total_projects: 0,
        active_projects: 0,
        completed_projects: 0,
        pending_projects: 0,
        projects_by_status: {},
        recent_projects: []
      }
    }
  }
})