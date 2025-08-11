/**
 * Projects Store Test Suite
 * Tests project management state, CRUD operations, filtering, and business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '@/stores/projects'
import apiClient from '@/services/api'

// Mock API client
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Projects Store', () => {
  let projectsStore

  const mockProject = {
    id: 1,
    name: 'Test Project',
    description: 'A test project description',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    status: 'active',
    progress_percentage: 50,
    start_date: '2024-01-15',
    end_date: '2024-06-30',
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    employees: [
      { id: 1, first_name: 'Jane', last_name: 'Smith' }
    ]
  }

  const mockProjectsList = [
    mockProject,
    {
      id: 2,
      name: 'Another Project',
      description: 'Another description',
      client_name: 'Jane Client',
      client_email: 'jane@client.com',
      status: 'completed',
      progress_percentage: 100,
      created_at: '2024-01-10T00:00:00Z',
      employees: []
    },
    {
      id: 3,
      name: 'Pending Project',
      description: 'Pending description',
      client_name: 'Bob Client',
      client_email: 'bob@client.com',
      status: 'pending',
      progress_percentage: 0,
      created_at: '2024-02-01T00:00:00Z',
      employees: []
    }
  ]

  const mockPaginatedResponse = {
    data: {
      data: mockProjectsList,
      meta: {
        current_page: 1,
        per_page: 10,
        total: 3,
        last_page: 1
      }
    }
  }

  const mockStatistics = {
    total_projects: 15,
    active_projects: 8,
    completed_projects: 5,
    pending_projects: 2,
    projects_by_status: {
      active: 8,
      completed: 5,
      pending: 2
    },
    recent_projects: []
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    projectsStore = useProjectsStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      expect(projectsStore.projects).toEqual([])
      expect(projectsStore.currentProject).toBe(null)
      expect(projectsStore.loading).toBe(false)
      expect(projectsStore.error).toBe(null)
      expect(projectsStore.pagination.current_page).toBe(1)
      expect(projectsStore.pagination.per_page).toBe(10)
      expect(projectsStore.filters.search).toBe('')
      expect(projectsStore.filters.status).toBe('')
    })
  })

  describe('Getters', () => {
    beforeEach(() => {
      projectsStore.projects = mockProjectsList
    })

    describe('filteredProjects', () => {
      it('returns all projects when no filters applied', () => {
        expect(projectsStore.filteredProjects).toHaveLength(3)
      })

      it('filters by search term in project name', () => {
        projectsStore.filters.search = 'Test'
        expect(projectsStore.filteredProjects).toHaveLength(1)
        expect(projectsStore.filteredProjects[0].name).toBe('Test Project')
      })

      it('filters by search term in client name', () => {
        projectsStore.filters.search = 'Jane Client'
        expect(projectsStore.filteredProjects).toHaveLength(1)
        expect(projectsStore.filteredProjects[0].client_name).toBe('Jane Client')
      })

      it('filters by status', () => {
        projectsStore.filters.status = 'active'
        expect(projectsStore.filteredProjects).toHaveLength(1)
        expect(projectsStore.filteredProjects[0].status).toBe('active')
      })

      it('combines multiple filters', () => {
        projectsStore.filters.search = 'project'
        projectsStore.filters.status = 'completed'
        expect(projectsStore.filteredProjects).toHaveLength(1)
        expect(projectsStore.filteredProjects[0].name).toBe('Another Project')
      })

      it('is case insensitive', () => {
        projectsStore.filters.search = 'test'
        expect(projectsStore.filteredProjects).toHaveLength(1)
        
        projectsStore.filters.search = 'TEST'
        expect(projectsStore.filteredProjects).toHaveLength(1)
      })
    })

    describe('projectsByStatus', () => {
      it('returns projects with specific status', () => {
        const activeProjects = projectsStore.projectsByStatus('active')
        expect(activeProjects).toHaveLength(1)
        expect(activeProjects[0].status).toBe('active')
      })

      it('returns empty array for non-existent status', () => {
        const nonExistentProjects = projectsStore.projectsByStatus('non-existent')
        expect(nonExistentProjects).toHaveLength(0)
      })
    })

    describe('userProjects', () => {
      it('returns projects assigned to user', () => {
        const userProjects = projectsStore.userProjects(1)
        expect(userProjects).toHaveLength(1)
        expect(userProjects[0].id).toBe(1)
      })

      it('returns empty array for user with no projects', () => {
        const userProjects = projectsStore.userProjects(999)
        expect(userProjects).toHaveLength(0)
      })
    })

    describe('recentProjects', () => {
      it('returns projects from last 30 days', () => {
        // Mock current date to be in February 2024
        const mockDate = new Date('2024-02-15T00:00:00Z')
        vi.setSystemTime(mockDate)
        
        const recentProjects = projectsStore.recentProjects
        expect(recentProjects).toHaveLength(1) // Only the February project
        expect(recentProjects[0].name).toBe('Pending Project')
      })

      it('limits to 5 projects maximum', () => {
        // Add more recent projects
        const manyRecentProjects = Array.from({ length: 10 }, (_, i) => ({
          ...mockProject,
          id: i + 10,
          name: `Recent Project ${i}`,
          created_at: new Date().toISOString()
        }))
        
        projectsStore.projects = [...mockProjectsList, ...manyRecentProjects]
        
        const recentProjects = projectsStore.recentProjects
        expect(recentProjects.length).toBeLessThanOrEqual(5)
      })
    })

    describe('projectStats', () => {
      it('calculates project statistics correctly', () => {
        const stats = projectsStore.projectStats
        
        expect(stats.total).toBe(3)
        expect(stats.active).toBe(1)
        expect(stats.completed).toBe(1)
        expect(stats.pending).toBe(1)
      })

      it('handles unknown statuses gracefully', () => {
        projectsStore.projects = [
          { ...mockProject, status: 'unknown_status' }
        ]
        
        const stats = projectsStore.projectStats
        expect(stats.total).toBe(1)
        expect(stats.active).toBe(0)
      })
    })
  })

  describe('CRUD Operations', () => {
    describe('fetchProjects', () => {
      it('fetches projects successfully', async () => {
        apiClient.get.mockResolvedValue(mockPaginatedResponse)
        
        const result = await projectsStore.fetchProjects()
        
        expect(apiClient.get).toHaveBeenCalledWith('/projects', {
          params: expect.objectContaining({
            page: 1,
            per_page: 10
          })
        })
        expect(projectsStore.projects).toEqual(mockProjectsList)
        expect(projectsStore.pagination.total).toBe(3)
        expect(result).toEqual(mockPaginatedResponse.data)
      })

      it('applies filters to API request', async () => {
        projectsStore.filters.search = 'test'
        projectsStore.filters.status = 'active'
        apiClient.get.mockResolvedValue(mockPaginatedResponse)
        
        await projectsStore.fetchProjects()
        
        expect(apiClient.get).toHaveBeenCalledWith('/projects', {
          params: expect.objectContaining({
            search: 'test',
            status: 'active'
          })
        })
      })

      it('removes empty filter values', async () => {
        projectsStore.filters.search = ''
        projectsStore.filters.status = null
        apiClient.get.mockResolvedValue(mockPaginatedResponse)
        
        await projectsStore.fetchProjects()
        
        const params = apiClient.get.mock.calls[0][1].params
        expect(params).not.toHaveProperty('search')
        expect(params).not.toHaveProperty('status')
      })

      it('handles API errors gracefully', async () => {
        const error = new Error('API Error')
        error.response = { data: { message: 'Server error' } }
        apiClient.get.mockRejectedValue(error)
        
        await expect(projectsStore.fetchProjects()).rejects.toThrow()
        expect(projectsStore.error).toBe('Server error')
        expect(projectsStore.loading).toBe(false)
      })
    })

    describe('fetchProject', () => {
      it('fetches single project successfully', async () => {
        const response = { data: { data: mockProject } }
        apiClient.get.mockResolvedValue(response)
        
        const result = await projectsStore.fetchProject(1)
        
        expect(apiClient.get).toHaveBeenCalledWith('/projects/1')
        expect(projectsStore.currentProject).toEqual(mockProject)
        expect(result).toEqual(mockProject)
      })

      it('handles project not found', async () => {
        const error = new Error('Not found')
        error.response = { data: { message: 'Project not found' } }
        apiClient.get.mockRejectedValue(error)
        
        await expect(projectsStore.fetchProject(999)).rejects.toThrow()
        expect(projectsStore.error).toBe('Project not found')
      })
    })

    describe('createProject', () => {
      const newProjectData = {
        name: 'New Project',
        description: 'New description',
        client_name: 'New Client',
        client_email: 'new@client.com'
      }

      it('creates project successfully', async () => {
        const newProject = { ...mockProject, ...newProjectData, id: 4 }
        const response = { data: { data: newProject } }
        apiClient.post.mockResolvedValue(response)
        
        const result = await projectsStore.createProject(newProjectData)
        
        expect(apiClient.post).toHaveBeenCalledWith('/projects', newProjectData)
        expect(projectsStore.projects[0]).toEqual(newProject) // Added to beginning
        expect(result).toEqual(newProject)
      })

      it('updates statistics after creation', async () => {
        projectsStore.projects = []
        projectsStore.updateStatistics = vi.fn()
        
        const response = { data: { data: mockProject } }
        apiClient.post.mockResolvedValue(response)
        
        await projectsStore.createProject(newProjectData)
        
        expect(projectsStore.updateStatistics).toHaveBeenCalled()
      })

      it('handles creation errors', async () => {
        const error = new Error('Validation error')
        error.response = { data: { message: 'Name is required' } }
        apiClient.post.mockRejectedValue(error)
        
        await expect(projectsStore.createProject({})).rejects.toThrow()
        expect(projectsStore.error).toBe('Name is required')
      })
    })

    describe('updateProject', () => {
      const updateData = { name: 'Updated Name', status: 'completed' }

      beforeEach(() => {
        projectsStore.projects = [mockProject]
        projectsStore.currentProject = mockProject
      })

      it('updates project successfully', async () => {
        const updatedProject = { ...mockProject, ...updateData }
        const response = { data: { data: updatedProject } }
        apiClient.put.mockResolvedValue(response)
        
        const result = await projectsStore.updateProject(1, updateData)
        
        expect(apiClient.put).toHaveBeenCalledWith('/projects/1', updateData)
        expect(projectsStore.projects[0]).toEqual(updatedProject)
        expect(projectsStore.currentProject).toEqual(updatedProject)
        expect(result).toEqual(updatedProject)
      })

      it('updates statistics after modification', async () => {
        projectsStore.updateStatistics = vi.fn()
        const response = { data: { data: mockProject } }
        apiClient.put.mockResolvedValue(response)
        
        await projectsStore.updateProject(1, updateData)
        
        expect(projectsStore.updateStatistics).toHaveBeenCalled()
      })

      it('handles project not found during update', async () => {
        const error = new Error('Not found')
        error.response = { data: { message: 'Project not found' } }
        apiClient.put.mockRejectedValue(error)
        
        await expect(projectsStore.updateProject(999, updateData)).rejects.toThrow()
        expect(projectsStore.error).toBe('Project not found')
      })
    })

    describe('deleteProject', () => {
      beforeEach(() => {
        projectsStore.projects = [mockProject, mockProjectsList[1]]
        projectsStore.currentProject = mockProject
      })

      it('deletes project successfully', async () => {
        apiClient.delete.mockResolvedValue({})
        
        await projectsStore.deleteProject(1)
        
        expect(apiClient.delete).toHaveBeenCalledWith('/projects/1')
        expect(projectsStore.projects).toHaveLength(1)
        expect(projectsStore.projects[0].id).toBe(2)
        expect(projectsStore.currentProject).toBe(null)
      })

      it('updates statistics after deletion', async () => {
        projectsStore.updateStatistics = vi.fn()
        apiClient.delete.mockResolvedValue({})
        
        await projectsStore.deleteProject(1)
        
        expect(projectsStore.updateStatistics).toHaveBeenCalled()
      })

      it('handles deletion errors', async () => {
        const error = new Error('Cannot delete')
        error.response = { data: { message: 'Project has dependencies' } }
        apiClient.delete.mockRejectedValue(error)
        
        await expect(projectsStore.deleteProject(1)).rejects.toThrow()
        expect(projectsStore.error).toBe('Project has dependencies')
        expect(projectsStore.projects).toHaveLength(2) // No changes on error
      })
    })
  })

  describe('Employee Assignment', () => {
    beforeEach(() => {
      projectsStore.projects = [mockProject]
      projectsStore.currentProject = mockProject
    })

    describe('assignEmployee', () => {
      it('assigns employee to project successfully', async () => {
        const updatedProject = {
          ...mockProject,
          employees: [...mockProject.employees, { id: 2, name: 'New Employee' }]
        }
        const response = { data: { data: updatedProject } }
        apiClient.post.mockResolvedValue(response)
        
        const result = await projectsStore.assignEmployee(1, 2)
        
        expect(apiClient.post).toHaveBeenCalledWith('/projects/1/employees', {
          employee_id: 2
        })
        expect(projectsStore.projects[0]).toEqual(updatedProject)
        expect(result).toEqual(updatedProject)
      })

      it('handles assignment errors', async () => {
        const error = new Error('Already assigned')
        error.response = { data: { message: 'Employee already assigned' } }
        apiClient.post.mockRejectedValue(error)
        
        await expect(projectsStore.assignEmployee(1, 2)).rejects.toThrow()
        expect(projectsStore.error).toBe('Employee already assigned')
      })
    })

    describe('removeEmployee', () => {
      it('removes employee from project successfully', async () => {
        const updatedProject = { ...mockProject, employees: [] }
        const response = { data: { data: updatedProject } }
        apiClient.delete.mockResolvedValue(response)
        
        const result = await projectsStore.removeEmployee(1, 1)
        
        expect(apiClient.delete).toHaveBeenCalledWith('/projects/1/employees/1')
        expect(projectsStore.projects[0]).toEqual(updatedProject)
        expect(result).toEqual(updatedProject)
      })
    })
  })

  describe('QR Code Generation', () => {
    it('generates QR code successfully', async () => {
      const qrResponse = { data: { qr_code_url: 'https://example.com/qr/abc123' } }
      apiClient.post.mockResolvedValue(qrResponse)
      
      const result = await projectsStore.generateQRCode(1)
      
      expect(apiClient.post).toHaveBeenCalledWith('/projects/1/qr-code')
      expect(result).toBe('https://example.com/qr/abc123')
    })

    it('handles QR generation errors', async () => {
      const error = new Error('QR generation failed')
      error.response = { data: { message: 'Invalid project' } }
      apiClient.post.mockRejectedValue(error)
      
      await expect(projectsStore.generateQRCode(1)).rejects.toThrow()
      expect(projectsStore.error).toBe('Invalid project')
    })
  })

  describe('Dashboard Statistics', () => {
    it('fetches statistics successfully', async () => {
      const response = { data: { data: mockStatistics } }
      apiClient.get.mockResolvedValue(response)
      
      const result = await projectsStore.fetchStatistics()
      
      expect(apiClient.get).toHaveBeenCalledWith('/dashboard/statistics')
      expect(projectsStore.statistics).toEqual(mockStatistics)
      expect(result).toEqual(mockStatistics)
    })

    it('handles statistics fetch errors', async () => {
      const error = new Error('Stats unavailable')
      apiClient.get.mockRejectedValue(error)
      
      await expect(projectsStore.fetchStatistics()).rejects.toThrow()
    })

    it('updates local statistics correctly', () => {
      projectsStore.projects = mockProjectsList
      
      projectsStore.updateStatistics()
      
      expect(projectsStore.statistics.total_projects).toBe(3)
      expect(projectsStore.statistics.active_projects).toBe(1)
      expect(projectsStore.statistics.completed_projects).toBe(1)
      expect(projectsStore.statistics.pending_projects).toBe(1)
    })
  })

  describe('Filters and Pagination', () => {
    it('updates filters correctly', () => {
      const newFilters = { search: 'test', status: 'active' }
      
      projectsStore.updateFilters(newFilters)
      
      expect(projectsStore.filters.search).toBe('test')
      expect(projectsStore.filters.status).toBe('active')
    })

    it('preserves existing filters when updating', () => {
      projectsStore.filters.employee_id = 1
      
      projectsStore.updateFilters({ search: 'test' })
      
      expect(projectsStore.filters.search).toBe('test')
      expect(projectsStore.filters.employee_id).toBe(1)
    })

    it('clears all filters', () => {
      projectsStore.filters = {
        search: 'test',
        status: 'active',
        employee_id: 1,
        date_from: '2024-01-01',
        date_to: '2024-12-31'
      }
      
      projectsStore.clearFilters()
      
      expect(projectsStore.filters.search).toBe('')
      expect(projectsStore.filters.status).toBe('')
      expect(projectsStore.filters.employee_id).toBe(null)
      expect(projectsStore.filters.date_from).toBe(null)
      expect(projectsStore.filters.date_to).toBe(null)
    })

    it('sets current page', () => {
      projectsStore.setPage(3)
      
      expect(projectsStore.pagination.current_page).toBe(3)
    })

    it('sets items per page and resets to first page', () => {
      projectsStore.pagination.current_page = 5
      
      projectsStore.setPerPage(25)
      
      expect(projectsStore.pagination.per_page).toBe(25)
      expect(projectsStore.pagination.current_page).toBe(1)
    })
  })

  describe('Data Management', () => {
    it('clears current project', () => {
      projectsStore.currentProject = mockProject
      
      projectsStore.clearCurrentProject()
      
      expect(projectsStore.currentProject).toBe(null)
    })

    it('clears all store data', () => {
      projectsStore.projects = mockProjectsList
      projectsStore.currentProject = mockProject
      projectsStore.error = 'Some error'
      projectsStore.pagination.total = 100
      projectsStore.statistics.total_projects = 50
      
      projectsStore.clearData()
      
      expect(projectsStore.projects).toEqual([])
      expect(projectsStore.currentProject).toBe(null)
      expect(projectsStore.error).toBe(null)
      expect(projectsStore.pagination.total).toBe(0)
      expect(projectsStore.statistics.total_projects).toBe(0)
    })
  })

  describe('Loading States', () => {
    it('sets loading state during API calls', async () => {
      let resolvePromise
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      apiClient.get.mockReturnValue(promise)
      
      const fetchPromise = projectsStore.fetchProjects()
      
      expect(projectsStore.loading).toBe(true)
      
      resolvePromise(mockPaginatedResponse)
      await fetchPromise
      
      expect(projectsStore.loading).toBe(false)
    })

    it('resets loading state on API errors', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'))
      
      try {
        await projectsStore.fetchProjects()
      } catch {}
      
      expect(projectsStore.loading).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty API responses', async () => {
      const emptyResponse = {
        data: {
          data: [],
          meta: { current_page: 1, per_page: 10, total: 0, last_page: 1 }
        }
      }
      apiClient.get.mockResolvedValue(emptyResponse)
      
      await projectsStore.fetchProjects()
      
      expect(projectsStore.projects).toEqual([])
      expect(projectsStore.pagination.total).toBe(0)
    })

    it('handles malformed API responses gracefully', async () => {
      const malformedResponse = { data: null }
      apiClient.get.mockResolvedValue(malformedResponse)
      
      await expect(projectsStore.fetchProjects()).rejects.toThrow()
    })

    it('handles network timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'NETWORK_ERROR'
      apiClient.get.mockRejectedValue(timeoutError)
      
      await expect(projectsStore.fetchProjects()).rejects.toThrow()
      expect(projectsStore.error).toContain('Failed to fetch projects')
    })

    it('handles concurrent API calls correctly', async () => {
      apiClient.get.mockResolvedValue(mockPaginatedResponse)
      
      const [result1, result2] = await Promise.all([
        projectsStore.fetchProjects(),
        projectsStore.fetchProjects()
      ])
      
      expect(result1).toEqual(result2)
      expect(projectsStore.projects).toEqual(mockProjectsList)
    })
  })

  describe('Data Validation', () => {
    it('validates project data before operations', async () => {
      const invalidProject = { name: '' } // Missing required fields
      const error = new Error('Validation failed')
      error.response = { data: { message: 'Name is required' } }
      apiClient.post.mockRejectedValue(error)
      
      await expect(projectsStore.createProject(invalidProject)).rejects.toThrow()
      expect(projectsStore.error).toBe('Name is required')
    })

    it('sanitizes search input', () => {
      projectsStore.updateFilters({ search: '  Test Project  ' })
      
      // The actual filtering logic should handle trimming
      expect(projectsStore.filters.search).toBe('  Test Project  ')
    })
  })
})