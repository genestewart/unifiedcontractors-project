/**
 * ProjectForm Component Test Suite
 * Tests project creation/editing form functionality, validation, and business logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import ProjectForm from '@/components/employee/ProjectForm.vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { createPrimeVueStubs, createPrimeVueConfig } from '@/test/utils/primevue-mocks'

// Mock PrimeVue components
const mockToast = {
  add: vi.fn()
}

vi.mock('primevue/usetoast', () => ({
  useToast: () => mockToast
}))

describe('ProjectForm', () => {
  let wrapper
  let pinia
  let projectsStore
  let authStore

  const mockProject = {
    id: 1,
    name: 'Test Project',
    description: 'A test project description',
    client_name: 'John Doe',
    client_email: 'john@example.com',
    status: 'active',
    start_date: '2024-01-15',
    end_date: '2024-06-30',
    is_public: true,
    progress_percentage: 50
  }

  const mockEmployee = {
    id: 1,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@company.com',
    role: 'project_manager',
    permissions: ['projects.create', 'projects.update']
  }

  const createWrapper = (props = {}) => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false
    })

    const primeVueStubs = createPrimeVueStubs()
    const primeVueConfig = createPrimeVueConfig()

    wrapper = mount(ProjectForm, {
      props: {
        project: null,
        visible: true,
        ...props
      },
      global: {
        plugins: [pinia],
        stubs: {
          ...primeVueStubs
        },
        ...primeVueConfig
      }
    })

    projectsStore = useProjectsStore()
    authStore = useAuthStore()
    authStore.employee = mockEmployee

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
    it('renders the project form dialog', () => {
      createWrapper()
      
      expect(wrapper.find('.p-dialog-wrapper').exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('displays all form fields', () => {
      createWrapper()
      
      expect(wrapper.find('input#projectName').exists()).toBe(true)
      expect(wrapper.find('textarea#description').exists()).toBe(true)
      expect(wrapper.find('input#clientName').exists()).toBe(true)
      expect(wrapper.find('input#clientEmail').exists()).toBe(true)
      expect(wrapper.find('select#status').exists()).toBe(true) // status dropdown
      expect(wrapper.find('input[type="date"]').exists()).toBe(true) // start date
      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true) // public checkbox
    })

    it('shows create mode header when no project provided', () => {
      createWrapper()
      
      expect(wrapper.text()).toContain('Create New Project')
    })

    it('shows edit mode header when project provided', () => {
      createWrapper({ project: mockProject })
      
      expect(wrapper.text()).toContain('Edit Project')
    })
  })

  describe('Form Initialization', () => {
    it('initializes empty form for new project', () => {
      createWrapper()
      
      expect(wrapper.vm.formData.name).toBe('')
      expect(wrapper.vm.formData.description).toBe('')
      expect(wrapper.vm.formData.client_name).toBe('')
      expect(wrapper.vm.formData.client_email).toBe('')
      expect(wrapper.vm.formData.status).toBe('pending')
      expect(wrapper.vm.formData.priority).toBe('medium')
    })

    it('populates form with project data for editing', async () => {
      createWrapper({ project: mockProject })
      await nextTick()
      
      expect(wrapper.vm.formData.name).toBe(mockProject.name)
      expect(wrapper.vm.formData.description).toBe(mockProject.description)
      expect(wrapper.vm.formData.client_name).toBe(mockProject.client_name)
      expect(wrapper.vm.formData.client_email).toBe(mockProject.client_email)
      expect(wrapper.vm.formData.status).toBe(mockProject.status)
    })

    it('updates form when project prop changes', async () => {
      createWrapper()
      
      expect(wrapper.vm.formData.name).toBe('')
      
      await wrapper.setProps({ project: mockProject })
      await nextTick()
      
      expect(wrapper.vm.formData.name).toBe(mockProject.name)
    })
  })

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      createWrapper()
      
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBe('Project name is required')
      expect(wrapper.vm.errors.client_name).toBe('Client name is required')
      expect(wrapper.vm.errors.client_email).toBe('Client email is required')
    })

    it('validates email format', async () => {
      createWrapper()
      
      const emailInput = wrapper.find('input#clientEmail')
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.client_email).toBe('Please enter a valid email address')
    })

    it('validates project name length', async () => {
      createWrapper()
      
      const nameInput = wrapper.find('input#projectName')
      await nameInput.setValue('ab') // too short
      await nameInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBe('Project name must be at least 3 characters long')
      
      const longName = 'a'.repeat(256) // too long
      await nameInput.setValue(longName)
      await nameInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBe('Project name cannot exceed 255 characters')
    })

    it('validates date range', async () => {
      createWrapper()
      
      // Set end date before start date
      await wrapper.vm.$nextTick()
      wrapper.vm.form.start_date = new Date('2024-06-01')
      wrapper.vm.form.end_date = new Date('2024-01-01')
      
      wrapper.vm.validateField('end_date')
      await nextTick()
      
      expect(wrapper.vm.errors.end_date).toBe('End date must be after start date')
    })

    it('validates progress percentage', async () => {
      createWrapper()
      
      const progressInput = wrapper.find('input[type="number"]')
      
      await progressInput.setValue(-10) // negative
      await progressInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.progress_percentage).toBe('Progress must be between 0 and 100')
      
      await progressInput.setValue(150) // over 100
      await progressInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.progress_percentage).toBe('Progress must be between 0 and 100')
    })

    it('clears validation errors on input', async () => {
      createWrapper()
      
      // Trigger validation error
      const nameInput = wrapper.find('input[placeholder*="project name"]')
      await nameInput.setValue('')
      await nameInput.trigger('blur')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBeTruthy()
      
      // Clear error by typing valid name
      await nameInput.setValue('Valid Project Name')
      await nameInput.trigger('input')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBe(null)
    })
  })

  describe('Form Submission', () => {
    it('creates new project when form is valid', async () => {
      createWrapper()
      projectsStore.createProject = vi.fn().mockResolvedValue(mockProject)
      
      // Fill form with valid data
      await wrapper.find('input[placeholder*="project name"]').setValue('New Project')
      await wrapper.find('input[placeholder*="client name"]').setValue('John Client')
      await wrapper.find('input[placeholder*="client email"]').setValue('john@client.com')
      
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(projectsStore.createProject).toHaveBeenCalledWith({
        name: 'New Project',
        description: '',
        client_name: 'John Client',
        client_email: 'john@client.com',
        status: 'planning',
        start_date: null,
        end_date: null,
        is_public: false,
        progress_percentage: 0
      })
      
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Project created successfully',
        life: 3000
      })
    })

    it('updates existing project', async () => {
      createWrapper({ project: mockProject })
      projectsStore.updateProject = vi.fn().mockResolvedValue(mockProject)
      
      await wrapper.find('input[placeholder*="project name"]').setValue('Updated Project')
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(projectsStore.updateProject).toHaveBeenCalledWith(
        mockProject.id,
        expect.objectContaining({
          name: 'Updated Project'
        })
      )
      
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: 'Project updated successfully',
        life: 3000
      })
    })

    it('emits close event after successful submission', async () => {
      createWrapper()
      projectsStore.createProject = vi.fn().mockResolvedValue(mockProject)
      
      await wrapper.find('input[placeholder*="project name"]').setValue('New Project')
      await wrapper.find('input[placeholder*="client name"]').setValue('John Client')
      await wrapper.find('input[placeholder*="client email"]').setValue('john@client.com')
      
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('projectSaved')).toBeTruthy()
    })

    it('handles submission errors gracefully', async () => {
      createWrapper()
      const error = new Error('Server error')
      projectsStore.createProject = vi.fn().mockRejectedValue(error)
      
      await wrapper.find('input[placeholder*="project name"]').setValue('New Project')
      await wrapper.find('input[placeholder*="client name"]').setValue('John Client')
      await wrapper.find('input[placeholder*="client email"]').setValue('john@client.com')
      
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save project. Please try again.',
        life: 5000
      })
    })

    it('shows loading state during submission', async () => {
      createWrapper()
      
      let resolvePromise
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })
      
      projectsStore.createProject = vi.fn().mockReturnValue(promise)
      
      await wrapper.find('input[placeholder*="project name"]').setValue('New Project')
      await wrapper.find('input[placeholder*="client name"]').setValue('John Client')
      await wrapper.find('input[placeholder*="client email"]').setValue('john@client.com')
      
      const submitPromise = wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      
      resolvePromise(mockProject)
      await submitPromise
      
      expect(wrapper.vm.loading).toBe(false)
    })
  })

  describe('Form Reset', () => {
    it('resets form to initial state', async () => {
      createWrapper({ project: mockProject })
      
      // Modify form
      await wrapper.find('input[placeholder*="project name"]').setValue('Modified Name')
      
      wrapper.vm.resetForm()
      await nextTick()
      
      expect(wrapper.vm.form.name).toBe(mockProject.name)
    })

    it('resets validation errors', async () => {
      createWrapper()
      
      // Trigger validation errors
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBeTruthy()
      
      wrapper.vm.resetForm()
      await nextTick()
      
      expect(wrapper.vm.errors.name).toBe(null)
    })
  })

  describe('Dialog Controls', () => {
    it('emits close event when cancel button clicked', async () => {
      createWrapper()
      
      await wrapper.find('button[severity="secondary"]').trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('confirms before closing with unsaved changes', async () => {
      createWrapper()
      
      // Make changes to form
      await wrapper.find('input[placeholder*="project name"]').setValue('Changed')
      
      // Mock window.confirm
      window.confirm = vi.fn().mockReturnValue(true)
      
      await wrapper.find('button[severity="secondary"]').trigger('click')
      
      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to close?'
      )
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('does not close when user cancels confirmation', async () => {
      createWrapper()
      
      await wrapper.find('input[placeholder*="project name"]').setValue('Changed')
      
      window.confirm = vi.fn().mockReturnValue(false)
      
      await wrapper.find('button[severity="secondary"]').trigger('click')
      
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('Permission Handling', () => {
    it('shows form when user has create permissions', () => {
      createWrapper()
      
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('.permission-error').exists()).toBe(false)
    })

    it('shows permission error when user lacks permissions', () => {
      authStore.employee = { ...mockEmployee, permissions: [] }
      createWrapper()
      
      expect(wrapper.find('.permission-error').exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('disables certain fields based on permissions', () => {
      authStore.employee = { ...mockEmployee, role: 'employee' }
      createWrapper()
      
      // Employees might not be able to change project visibility
      expect(wrapper.vm.canChangeVisibility).toBe(false)
    })
  })

  describe('Status Management', () => {
    it('shows appropriate status options', () => {
      createWrapper()
      
      const statusOptions = wrapper.vm.statusOptions
      expect(statusOptions).toEqual([
        { label: 'Planning', value: 'planning' },
        { label: 'Active', value: 'active' },
        { label: 'On Hold', value: 'on_hold' },
        { label: 'Completed', value: 'completed' }
      ])
    })

    it('validates status transitions', async () => {
      createWrapper({ project: { ...mockProject, status: 'completed' } })
      
      // Should not allow changing from completed back to active
      wrapper.vm.form.status = 'active'
      wrapper.vm.validateField('status')
      
      expect(wrapper.vm.errors.status).toBe('Cannot change status from completed')
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      createWrapper()
      
      expect(wrapper.find('label[for="projectName"]').exists()).toBe(true)
      expect(wrapper.find('label[for="clientName"]').exists()).toBe(true)
      expect(wrapper.find('label[for="clientEmail"]').exists()).toBe(true)
    })

    it('has proper ARIA attributes for validation errors', async () => {
      createWrapper()
      
      await wrapper.find('form').trigger('submit')
      await nextTick()
      
      expect(wrapper.find('input[aria-invalid="true"]').exists()).toBe(true)
      expect(wrapper.find('[aria-describedby]').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles null project prop gracefully', () => {
      createWrapper({ project: null })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.form.name).toBe('')
    })

    it('handles undefined project fields', () => {
      const incompleteProject = { name: 'Test', id: 1 }
      createWrapper({ project: incompleteProject })
      
      expect(wrapper.vm.form.description).toBe('')
      expect(wrapper.vm.form.client_email).toBe('')
    })

    it('handles very long input values', async () => {
      createWrapper()
      
      const longText = 'a'.repeat(1000)
      await wrapper.find('textarea[placeholder*="description"]').setValue(longText)
      
      expect(wrapper.vm.form.description).toBe(longText)
    })
  })
})