<template>
  <Dialog 
    v-model:visible="visible" 
    header="Change Password"
    :modal="true" 
    :draggable="false"
    :resizable="false"
    class="password-dialog"
  >
    <form @submit.prevent="handleSubmit" class="password-form">
      <div class="form-intro">
        <div class="security-icon">
          <i class="pi pi-shield"></i>
        </div>
        <div class="intro-text">
          <h3>Update Your Password</h3>
          <p>Choose a strong password to keep your account secure.</p>
        </div>
      </div>

      <div class="form-section">
        <div class="form-field">
          <label for="currentPassword">Current Password *</label>
          <div class="password-input-wrapper">
            <Password 
              id="currentPassword"
              v-model="formData.current_password" 
              :feedback="false"
              toggleMask
              :invalid="!!errors.current_password"
              placeholder="Enter current password"
              class="w-full"
            />
          </div>
          <small v-if="errors.current_password" class="p-error">{{ errors.current_password }}</small>
        </div>
        
        <div class="form-field">
          <label for="newPassword">New Password *</label>
          <div class="password-input-wrapper">
            <Password 
              id="newPassword"
              v-model="formData.new_password" 
              :feedback="true"
              toggleMask
              :invalid="!!errors.new_password"
              placeholder="Enter new password"
              class="w-full"
              :pt="{
                meter: { class: 'password-meter' },
                meterLabel: { class: 'password-meter-label' }
              }"
            >
              <template #header>
                <div class="password-header">
                  <h4>Password Requirements</h4>
                </div>
              </template>
              <template #content="{ messages }">
                <div class="password-requirements">
                  <div 
                    v-for="(req, index) in passwordRequirements" 
                    :key="index"
                    class="requirement-item"
                    :class="{ 'requirement-met': req.test(formData.new_password) }"
                  >
                    <i :class="req.test(formData.new_password) ? 'pi pi-check' : 'pi pi-times'"></i>
                    <span>{{ req.label }}</span>
                  </div>
                </div>
              </template>
            </Password>
          </div>
          <small v-if="errors.new_password" class="p-error">{{ errors.new_password }}</small>
        </div>
        
        <div class="form-field">
          <label for="confirmPassword">Confirm New Password *</label>
          <div class="password-input-wrapper">
            <Password 
              id="confirmPassword"
              v-model="formData.new_password_confirmation" 
              :feedback="false"
              toggleMask
              :invalid="!!errors.new_password_confirmation"
              placeholder="Confirm new password"
              class="w-full"
            />
          </div>
          <small v-if="errors.new_password_confirmation" class="p-error">{{ errors.new_password_confirmation }}</small>
        </div>
      </div>

      <!-- Security Tips -->
      <div class="security-tips">
        <h4>
          <i class="pi pi-info-circle"></i>
          Security Tips
        </h4>
        <ul>
          <li>Use a unique password that you don't use elsewhere</li>
          <li>Consider using a password manager</li>
          <li>Avoid using personal information in your password</li>
          <li>Change your password regularly</li>
        </ul>
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
          label="Change Password"
          :loading="loading" 
          @click="handleSubmit"
          icon="pi pi-key"
          :disabled="!isFormValid"
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
import Password from 'primevue/password'
import Button from 'primevue/button'

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
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
}

const formData = ref({ ...defaultFormData })

// Password requirements
const passwordRequirements = [
  {
    label: 'At least 8 characters long',
    test: (password) => password.length >= 8
  },
  {
    label: 'Contains at least one uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Contains at least one lowercase letter',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Contains at least one number',
    test: (password) => /\d/.test(password)
  },
  {
    label: 'Contains at least one special character',
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
]

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isPasswordStrong = computed(() => {
  return passwordRequirements.every(req => req.test(formData.value.new_password))
})

const isFormValid = computed(() => {
  return formData.value.current_password &&
         formData.value.new_password &&
         formData.value.new_password_confirmation &&
         formData.value.new_password === formData.value.new_password_confirmation &&
         isPasswordStrong.value
})

// Methods
const validateForm = () => {
  errors.value = {}
  
  // Required fields
  if (!formData.value.current_password) {
    errors.value.current_password = 'Current password is required'
  }
  
  if (!formData.value.new_password) {
    errors.value.new_password = 'New password is required'
  } else {
    // Password strength validation
    if (!isPasswordStrong.value) {
      errors.value.new_password = 'Password does not meet security requirements'
    }
  }
  
  if (!formData.value.new_password_confirmation) {
    errors.value.new_password_confirmation = 'Password confirmation is required'
  } else if (formData.value.new_password !== formData.value.new_password_confirmation) {
    errors.value.new_password_confirmation = 'Passwords do not match'
  }
  
  // Check if new password is different from current
  if (formData.value.current_password && formData.value.new_password) {
    if (formData.value.current_password === formData.value.new_password) {
      errors.value.new_password = 'New password must be different from current password'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    await authStore.changePassword({
      current_password: formData.value.current_password,
      new_password: formData.value.new_password,
      new_password_confirmation: formData.value.new_password_confirmation
    })
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password changed successfully',
      life: 3000
    })
    
    visible.value = false
    resetForm()
    
  } catch (error) {
    console.error('Error changing password:', error)
    
    // Handle specific error cases
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    } else if (error.response?.status === 400) {
      errors.value.current_password = 'Current password is incorrect'
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to change password',
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
    resetForm()
  }
})

// Clear errors when user types
watch(() => formData.value.current_password, () => {
  if (errors.value.current_password) {
    delete errors.value.current_password
  }
})

watch(() => formData.value.new_password, () => {
  if (errors.value.new_password) {
    delete errors.value.new_password
  }
})

watch(() => formData.value.new_password_confirmation, () => {
  if (errors.value.new_password_confirmation) {
    delete errors.value.new_password_confirmation
  }
})
</script>

<style scoped>
.password-dialog {
  width: 95vw;
  max-width: 600px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Form Intro */
.form-intro {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--primary-50);
  border-radius: 12px;
  border: 1px solid var(--primary-100);
}

.security-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: var(--primary-500);
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.intro-text h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.intro-text p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.password-input-wrapper {
  position: relative;
}

/* Password Requirements */
.password-header {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.password-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.password-requirements {
  padding: 1rem;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.requirement-item i {
  width: 16px;
  font-size: 0.75rem;
}

.requirement-item:not(.requirement-met) {
  color: var(--red-500);
}

.requirement-item.requirement-met {
  color: var(--green-600);
}

.requirement-item.requirement-met i {
  color: var(--green-600);
}

/* Security Tips */
.security-tips {
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.security-tips h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.security-tips h4 i {
  color: var(--blue-500);
}

.security-tips ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-color-secondary);
}

.security-tips li {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.security-tips li:last-child {
  margin-bottom: 0;
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

/* Password Meter Styling */
:deep(.password-meter) {
  background: var(--surface-200);
  border-radius: 4px;
  height: 4px;
  overflow: hidden;
}

:deep(.password-meter .p-password-meter-weak) {
  background: var(--red-500);
}

:deep(.password-meter .p-password-meter-medium) {
  background: var(--yellow-500);
}

:deep(.password-meter .p-password-meter-strong) {
  background: var(--green-500);
}

:deep(.password-meter-label) {
  font-size: 0.75rem;
  margin-top: 0.5rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .password-dialog {
    width: 98vw;
    height: 95vh;
    margin: 1rem;
  }
  
  .form-intro {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .password-form {
    gap: 1.5rem;
  }
  
  .security-tips {
    padding: 1rem;
  }
}

/* Focus states */
:deep(.p-password input:focus) {
  box-shadow: 0 0 0 2px var(--primary-200);
}

/* Disabled button styling */
:deep(.p-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>