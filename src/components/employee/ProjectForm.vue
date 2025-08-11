<template>
  <Dialog 
    v-model:visible="visible" 
    :header="isEditing ? 'Edit Project' : 'Create New Project'"
    :modal="true" 
    :draggable="false"
    :resizable="false"
    class="project-form-dialog"
    @hide="resetForm"
  >
    <form @submit.prevent="handleSubmit" class="project-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h4>Basic Information</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="projectName">Project Name *</label>
            <InputText 
              id="projectName"
              v-model="formData.name" 
              :invalid="!!errors.name"
              placeholder="Enter project name"
              class="w-full"
            />
            <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="description">Description</label>
            <Textarea 
              id="description"
              v-model="formData.description" 
              rows="3"
              placeholder="Project description..."
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="clientName">Client Name *</label>
            <InputText 
              id="clientName"
              v-model="formData.client_name" 
              :invalid="!!errors.client_name"
              placeholder="Enter client name"
              class="w-full"
            />
            <small v-if="errors.client_name" class="p-error">{{ errors.client_name }}</small>
          </div>
          
          <div class="form-field">
            <label for="clientEmail">Client Email</label>
            <InputText 
              id="clientEmail"
              v-model="formData.client_email" 
              type="email"
              placeholder="client@example.com"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Project Details -->
      <div class="form-section">
        <h4>Project Details</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="status">Status *</label>
            <Dropdown 
              id="status"
              v-model="formData.status" 
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select status"
              :invalid="!!errors.status"
              class="w-full"
            />
            <small v-if="errors.status" class="p-error">{{ errors.status }}</small>
          </div>
          
          <div class="form-field">
            <label for="priority">Priority</label>
            <Dropdown 
              id="priority"
              v-model="formData.priority" 
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select priority"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="startDate">Start Date</label>
            <Calendar 
              id="startDate"
              v-model="formData.start_date" 
              dateFormat="yy-mm-dd"
              placeholder="Select start date"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="endDate">End Date</label>
            <Calendar 
              id="endDate"
              v-model="formData.end_date" 
              dateFormat="yy-mm-dd"
              placeholder="Select end date"
              :minDate="formData.start_date"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="budget">Budget</label>
            <div class="budget-input">
              <span class="currency-symbol">$</span>
              <InputNumber 
                id="budget"
                v-model="formData.budget"
                mode="decimal"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                placeholder="0.00"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Location Information -->
      <div class="form-section">
        <h4>Location</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="address">Address</label>
            <Textarea 
              id="address"
              v-model="formData.address" 
              rows="2"
              placeholder="Project address..."
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="city">City</label>
            <InputText 
              id="city"
              v-model="formData.city" 
              placeholder="City"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="state">State</label>
            <InputText 
              id="state"
              v-model="formData.state" 
              placeholder="State"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="zipCode">Zip Code</label>
            <InputText 
              id="zipCode"
              v-model="formData.zip_code" 
              placeholder="Zip code"
              class="w-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Employee Assignment -->
      <div class="form-section" v-if="authStore.hasAnyRole(['admin', 'project_manager'])">
        <h4>Team Assignment</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="employees">Assign Employees</label>
            <MultiSelect 
              id="employees"
              v-model="formData.employee_ids"
              :options="employeeOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Select employees"
              :loading="loadingEmployees"
              class="w-full"
            />
            <small class="form-help">Select team members for this project</small>
          </div>
        </div>
      </div>
      
      <!-- Notes -->
      <div class="form-section">
        <h4>Additional Notes</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="notes">Internal Notes</label>
            <Textarea 
              id="notes"
              v-model="formData.notes" 
              rows="3"
              placeholder="Internal notes and comments..."
              class="w-full"
            />
            <small class="form-help">These notes are internal and won't be visible to clients</small>
          </div>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Cancel" 
          severity="secondary" 
          @click="visible = false"
        />
        <Button 
          :label="isEditing ? 'Update Project' : 'Create Project'"
          :loading="loading" 
          @click="handleSubmit"
          icon="pi pi-check"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/services/api'

// PrimeVue Components
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import InputNumber from 'primevue/inputnumber'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:visible', 'project-created', 'project-updated'])

// Stores
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const toast = useToast()

// Reactive data
const loading = ref(false)
const loadingEmployees = ref(false)
const errors = ref({})
const employeeOptions = ref([])

// Form data with defaults
const defaultFormData = {
  name: '',
  description: '',
  client_name: '',
  client_email: '',
  status: 'pending',
  priority: 'medium',
  start_date: null,
  end_date: null,
  budget: null,
  address: '',
  city: '',
  state: '',
  zip_code: '',
  employee_ids: [],
  notes: ''
}

const formData = ref({ ...defaultFormData })

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isEditing = computed(() => !!props.project?.id)

// Options
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]

// Methods
const loadEmployees = async () => {
  if (!authStore.hasAnyRole(['admin', 'project_manager'])) return
  
  loadingEmployees.value = true
  
  try {
    const response = await apiClient.get('/employees')
    employeeOptions.value = response.data.data.map(employee => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      email: employee.email
    }))
  } catch (error) {
    console.error('Error loading employees:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load employee list',
      life: 3000
    })
  } finally {
    loadingEmployees.value = false
  }
}

const validateForm = () => {
  errors.value = {}
  
  // Required fields
  if (!formData.value.name) {
    errors.value.name = 'Project name is required'
  }
  
  if (!formData.value.client_name) {
    errors.value.client_name = 'Client name is required'
  }
  
  if (!formData.value.status) {
    errors.value.status = 'Status is required'
  }
  
  // Date validation
  if (formData.value.start_date && formData.value.end_date) {
    if (new Date(formData.value.start_date) > new Date(formData.value.end_date)) {
      errors.value.end_date = 'End date must be after start date'
    }
  }
  
  // Email validation
  if (formData.value.client_email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formData.value.client_email)) {
      errors.value.client_email = 'Invalid email format'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const projectData = {
      ...formData.value,
      // Convert dates to ISO strings
      start_date: formData.value.start_date ? 
        new Date(formData.value.start_date).toISOString().split('T')[0] : null,
      end_date: formData.value.end_date ? 
        new Date(formData.value.end_date).toISOString().split('T')[0] : null
    }
    
    let result
    
    if (isEditing.value) {
      result = await projectsStore.updateProject(props.project.id, projectData)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Project updated successfully',
        life: 3000
      })
      emit('project-updated', result)
    } else {
      result = await projectsStore.createProject(projectData)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Project created successfully',
        life: 3000
      })
      emit('project-created', result)
    }
    
    visible.value = false
    resetForm()
    
  } catch (error) {
    console.error('Error saving project:', error)
    
    // Handle validation errors
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to save project',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.value = { ...defaultFormData }
  errors.value = {}
}

const populateForm = () => {
  if (props.project) {
    formData.value = {
      name: props.project.name || '',
      description: props.project.description || '',
      client_name: props.project.client_name || '',
      client_email: props.project.client_email || '',
      status: props.project.status || 'pending',
      priority: props.project.priority || 'medium',
      start_date: props.project.start_date ? new Date(props.project.start_date) : null,
      end_date: props.project.end_date ? new Date(props.project.end_date) : null,
      budget: props.project.budget || null,
      address: props.project.address || '',
      city: props.project.city || '',
      state: props.project.state || '',
      zip_code: props.project.zip_code || '',
      employee_ids: props.project.employees?.map(emp => emp.id) || [],
      notes: props.project.notes || ''
    }
  } else {
    resetForm()
  }
}

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    populateForm()
    if (authStore.hasAnyRole(['admin', 'project_manager'])) {
      loadEmployees()
    }
  }
})

watch(() => props.project, () => {
  if (props.visible) {
    populateForm()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  if (props.visible) {
    populateForm()
  }
  if (authStore.hasAnyRole(['admin', 'project_manager'])) {
    loadEmployees()
  }
})
</script>

<style scoped>
.project-form-dialog {
  width: 95vw;
  max-width: 900px;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 1.5rem;
}

.form-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.form-section h4 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-section h4::before {
  content: '';
  width: 4px;
  height: 1.2rem;
  background: var(--primary-color);
  border-radius: 2px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-help {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-style: italic;
}

.budget-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  z-index: 2;
}

.budget-input .p-inputnumber-input {
  padding-left: 2rem !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

/* Single column for specific fields */
.form-row.single-column,
.form-field.full-width {
  grid-column: span 2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .project-form-dialog {
    width: 98vw;
    margin: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-field.full-width {
    grid-column: span 1;
  }
}

@media (max-width: 480px) {
  .project-form-dialog {
    height: 95vh;
  }
  
  .form-section {
    padding-bottom: 1rem;
  }
  
  .form-row {
    margin-bottom: 1rem;
  }
}

/* Error styling */
.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Focus states */
.p-inputtext:focus,
.p-dropdown:focus,
.p-calendar:focus,
.p-inputnumber:focus,
.p-multiselect:focus {
  box-shadow: 0 0 0 2px var(--primary-200);
}
</style>