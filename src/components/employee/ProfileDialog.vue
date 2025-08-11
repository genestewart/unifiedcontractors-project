<template>
  <Dialog 
    v-model:visible="visible" 
    header="Profile Settings"
    :modal="true" 
    :draggable="false"
    :resizable="false"
    class="profile-dialog"
  >
    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-container">
          <Avatar 
            :label="authStore.employeeInitials" 
            size="xlarge"
            class="user-avatar"
          />
          <div class="avatar-info">
            <h3>{{ authStore.employeeFullName }}</h3>
            <p>{{ formatRole(authStore.employee?.role) }}</p>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div class="form-section">
        <h4>Personal Information</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="firstName">First Name *</label>
            <InputText 
              id="firstName"
              v-model="formData.first_name" 
              :invalid="!!errors.first_name"
              placeholder="First name"
              class="w-full"
            />
            <small v-if="errors.first_name" class="p-error">{{ errors.first_name }}</small>
          </div>
          
          <div class="form-field">
            <label for="lastName">Last Name *</label>
            <InputText 
              id="lastName"
              v-model="formData.last_name" 
              :invalid="!!errors.last_name"
              placeholder="Last name"
              class="w-full"
            />
            <small v-if="errors.last_name" class="p-error">{{ errors.last_name }}</small>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="email">Email *</label>
            <InputText 
              id="email"
              v-model="formData.email" 
              type="email"
              :invalid="!!errors.email"
              placeholder="Email address"
              class="w-full"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>
          
          <div class="form-field">
            <label for="phone">Phone</label>
            <InputText 
              id="phone"
              v-model="formData.phone" 
              placeholder="Phone number"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Work Information -->
      <div class="form-section">
        <h4>Work Information</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="position">Position</label>
            <InputText 
              id="position"
              v-model="formData.position" 
              placeholder="Job position"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="department">Department</label>
            <InputText 
              id="department"
              v-model="formData.department" 
              placeholder="Department"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="role">Role</label>
            <InputText 
              id="role"
              :value="formatRole(authStore.employee?.role)"
              disabled
              class="w-full"
            />
            <small class="form-help">Role cannot be changed. Contact administrator.</small>
          </div>
          
          <div class="form-field">
            <label for="hireDate">Hire Date</label>
            <Calendar 
              id="hireDate"
              v-model="formData.hire_date" 
              dateFormat="yy-mm-dd"
              placeholder="Select hire date"
              :disabled="!authStore.hasRole('admin')"
              class="w-full"
            />
            <small v-if="!authStore.hasRole('admin')" class="form-help">Only administrators can modify this field.</small>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <h4>Contact Information</h4>
        
        <div class="form-row full-width">
          <div class="form-field">
            <label for="address">Address</label>
            <Textarea 
              id="address"
              v-model="formData.address" 
              rows="2"
              placeholder="Street address"
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

      <!-- Emergency Contact -->
      <div class="form-section">
        <h4>Emergency Contact</h4>
        
        <div class="form-row">
          <div class="form-field">
            <label for="emergencyName">Contact Name</label>
            <InputText 
              id="emergencyName"
              v-model="formData.emergency_contact_name" 
              placeholder="Emergency contact name"
              class="w-full"
            />
          </div>
          
          <div class="form-field">
            <label for="emergencyPhone">Contact Phone</label>
            <InputText 
              id="emergencyPhone"
              v-model="formData.emergency_contact_phone" 
              placeholder="Emergency contact phone"
              class="w-full"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="emergencyRelationship">Relationship</label>
            <InputText 
              id="emergencyRelationship"
              v-model="formData.emergency_contact_relationship" 
              placeholder="Relationship to contact"
              class="w-full"
            />
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
          :disabled="loading"
        />
        <Button 
          label="Update Profile"
          :loading="loading" 
          @click="handleSubmit"
          icon="pi pi-check"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible'])

// Stores
const authStore = useAuthStore()
const toast = useToast()

// Reactive data
const loading = ref(false)
const errors = ref({})

// Form data with defaults
const defaultFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  hire_date: null,
  address: '',
  city: '',
  state: '',
  zip_code: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: ''
}

const formData = ref({ ...defaultFormData })

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const formatRole = (role) => {
  const roleMap = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    employee: 'Employee'
  }
  return roleMap[role] || role
}

const populateForm = () => {
  const employee = authStore.employee
  if (employee) {
    formData.value = {
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      hire_date: employee.hire_date ? new Date(employee.hire_date) : null,
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      emergency_contact_relationship: employee.emergency_contact_relationship || ''
    }
  }
}

const validateForm = () => {
  errors.value = {}
  
  // Required fields
  if (!formData.value.first_name) {
    errors.value.first_name = 'First name is required'
  }
  
  if (!formData.value.last_name) {
    errors.value.last_name = 'Last name is required'
  }
  
  if (!formData.value.email) {
    errors.value.email = 'Email is required'
  } else {
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formData.value.email)) {
      errors.value.email = 'Invalid email format'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const profileData = {
      ...formData.value,
      // Convert date to ISO string
      hire_date: formData.value.hire_date ? 
        new Date(formData.value.hire_date).toISOString().split('T')[0] : null
    }
    
    await authStore.updateProfile(profileData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Profile updated successfully',
      life: 3000
    })
    
    visible.value = false
    
  } catch (error) {
    console.error('Error updating profile:', error)
    
    // Handle validation errors
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to update profile',
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

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    populateForm()
  } else {
    resetForm()
  }
})
</script>

<style scoped>
.profile-dialog {
  width: 95vw;
  max-width: 800px;
  max-height: 90vh;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  background: var(--primary-color) !important;
  color: white !important;
}

.avatar-info {
  text-align: center;
}

.avatar-info h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.avatar-info p {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

/* Form Sections */
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

.form-row.full-width {
  grid-template-columns: 1fr;
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

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

/* Error styling */
.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-dialog {
    width: 98vw;
    height: 95vh;
    margin: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-section {
    padding-bottom: 1rem;
  }
  
  .form-row {
    margin-bottom: 1rem;
  }
  
  .avatar-section {
    padding: 1rem 0;
  }
}

/* Focus states */
.p-inputtext:focus,
.p-calendar:focus,
.p-textarea:focus {
  box-shadow: 0 0 0 2px var(--primary-200);
}

/* Disabled field styling */
.p-inputtext:disabled {
  background: var(--surface-100);
  opacity: 0.6;
}
</style>