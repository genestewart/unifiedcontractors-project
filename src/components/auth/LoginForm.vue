<template>
  <div class="login-container">
    <Card class="login-card">
      <template #header>
        <div class="login-header">
          <img :src="logoUrl" alt="Unified Contractors" class="company-logo" />
          <h1 class="login-title">Employee Portal</h1>
          <p class="login-subtitle">Sign in to access your projects and files</p>
        </div>
      </template>

      <template #content>
        <!-- Error Messages -->
        <Message 
          v-if="authStore.error" 
          severity="error" 
          :closable="false"
          class="error-message"
        >
          {{ authStore.error }}
        </Message>

        <!-- Account Lockout Warning -->
        <Message 
          v-if="authStore.isAccountLocked" 
          severity="warn" 
          :closable="false"
          class="lockout-message"
        >
          <div class="lockout-content">
            <i class="pi pi-lock"></i>
            <div>
              <strong>Account Temporarily Locked</strong>
              <p>Too many failed attempts. Please try again in {{ formatLockoutTime(authStore.lockoutTimeRemaining) }}.</p>
            </div>
          </div>
        </Message>

        <!-- Success Message -->
        <Message 
          v-if="successMessage" 
          severity="success" 
          :closable="true"
          @close="successMessage = null"
          class="success-message"
        >
          {{ successMessage }}
        </Message>

        <!-- Login Form -->
        <form @submit.prevent="handleSubmit" class="login-form" novalidate>
          <!-- Email Field -->
          <div class="field">
            <label for="email" class="field-label">
              Email Address
              <span class="required" aria-label="required">*</span>
            </label>
            <div class="input-wrapper">
              <InputText
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Enter your email address"
                :class="{ 'p-invalid': errors.email }"
                :disabled="loading || authStore.isAccountLocked"
                autocomplete="email"
                required
                aria-describedby="email-error"
                @blur="validateField('email')"
                @input="clearFieldError('email')"
              />
              <i class="pi pi-envelope input-icon"></i>
            </div>
            <small id="email-error" class="field-error" v-if="errors.email">
              {{ errors.email }}
            </small>
          </div>

          <!-- Password Field -->
          <div class="field">
            <label for="password" class="field-label">
              Password
              <span class="required" aria-label="required">*</span>
            </label>
            <div class="input-wrapper">
              <Password
                id="password"
                v-model="form.password"
                placeholder="Enter your password"
                :class="{ 'p-invalid': errors.password }"
                :disabled="loading || authStore.isAccountLocked"
                :feedback="false"
                toggleMask
                autocomplete="current-password"
                required
                aria-describedby="password-error"
                @blur="validateField('password')"
                @input="clearFieldError('password')"
              />
            </div>
            <small id="password-error" class="field-error" v-if="errors.password">
              {{ errors.password }}
            </small>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="field checkbox-field">
            <div class="flex align-items-center">
              <Checkbox 
                id="rememberMe" 
                v-model="form.rememberMe" 
                :binary="true"
                :disabled="loading || authStore.isAccountLocked"
              />
              <label for="rememberMe" class="checkbox-label">
                Keep me signed in
              </label>
            </div>
          </div>

          <!-- Submit Button -->
          <Button
            type="submit"
            label="Sign In"
            :loading="loading"
            :disabled="loading || authStore.isAccountLocked || !isFormValid"
            class="login-button"
            icon="pi pi-sign-in"
            iconPos="right"
          />

          <!-- Forgot Password Link -->
          <div class="forgot-password">
            <router-link 
              to="/employee/forgot-password" 
              class="forgot-link"
              :tabindex="loading ? -1 : 0"
            >
              Forgot your password?
            </router-link>
          </div>
        </form>
      </template>

      <template #footer>
        <div class="login-footer">
          <div class="security-notice">
            <i class="pi pi-shield security-icon"></i>
            <small class="security-text">
              Your connection is secured with 256-bit SSL encryption
            </small>
          </div>
          
          <!-- Help Links -->
          <div class="help-links">
            <small>
              Need help? Contact your administrator or call 
              <a href="tel:(555) 987-6543" class="help-link">(555) 987-6543</a>
            </small>
          </div>
        </div>
      </template>
    </Card>

    <!-- Company Info Footer -->
    <div class="company-info">
      <p>&copy; 2024 Unified Contractors. All rights reserved.</p>
      <div class="company-links">
        <router-link to="/" class="company-link">Visit Website</router-link>
        <a href="tel:(555) 987-6543" class="company-link">Call Us</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import logoUrl from '@/assets/logo.svg'

// PrimeVue Components
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'

// Composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Reactive data
const loading = ref(false)
const successMessage = ref(null)

const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: null,
  password: null
})

// Validation rules
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  }
}

// Computed properties
const isFormValid = computed(() => {
  return form.email && 
         form.password && 
         !errors.email && 
         !errors.password &&
         !authStore.isAccountLocked
})

// Methods
const validateField = (fieldName) => {
  const value = form[fieldName]
  const rules = validationRules[fieldName]

  if (!rules) return true

  // Required validation
  if (rules.required && (!value || value.trim() === '')) {
    errors[fieldName] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
    return false
  }

  // Pattern validation (email)
  if (rules.pattern && value && !rules.pattern.test(value)) {
    errors[fieldName] = rules.message
    return false
  }

  // Min length validation
  if (rules.minLength && value && value.length < rules.minLength) {
    errors[fieldName] = rules.message
    return false
  }

  // Clear error if validation passes
  errors[fieldName] = null
  return true
}

const clearFieldError = (fieldName) => {
  if (errors[fieldName]) {
    errors[fieldName] = null
  }
}

const validateForm = () => {
  let isValid = true
  
  Object.keys(validationRules).forEach(field => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  return isValid
}

const handleSubmit = async () => {
  // Validate form
  if (!validateForm()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please correct the errors below',
      life: 5000
    })
    return
  }

  loading.value = true

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
      remember_me: form.rememberMe
    })

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Login Successful',
      detail: `Welcome back, ${authStore.employeeFullName}!`,
      life: 3000
    })

    // Redirect to intended page or dashboard
    const redirectPath = route.query.redirect || '/employee/dashboard'
    router.push(redirectPath)

  } catch (error) {
    console.error('Login error:', error)
    
    // Focus on email field for retry
    setTimeout(() => {
      document.getElementById('email')?.focus()
    }, 100)
  } finally {
    loading.value = false
  }
}

const formatLockoutTime = (seconds) => {
  const minutes = Math.ceil(seconds / 60)
  return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

// Lifecycle hooks
onMounted(() => {
  // Pre-fill email if remembered
  const rememberedEmail = authStore.getRememberedEmail()
  if (rememberedEmail) {
    form.email = rememberedEmail
    form.rememberMe = true
  }

  // Handle query parameters
  if (route.query.message) {
    successMessage.value = route.query.message
    
    // Clear message from URL
    router.replace({ query: {} })
  }

  // Focus on appropriate field
  setTimeout(() => {
    if (form.email) {
      document.getElementById('password')?.focus()
    } else {
      document.getElementById('email')?.focus()
    }
  }, 100)
})

// Watch for lockout changes to reset form
watch(() => authStore.isAccountLocked, (isLocked) => {
  if (isLocked) {
    // Clear password field when locked
    form.password = ''
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--uc-primary) 0%, var(--uc-primary-dark) 100%);
  position: relative;
}

/* Background logo removed for build compatibility */

.login-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.login-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(45deg, #ffffff, #f8f9fa);
  border-bottom: 1px solid var(--surface-border);
}

.company-logo {
  height: 60px;
  width: auto;
  margin-bottom: 1rem;
}

.login-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--uc-dark);
  font-family: var(--uc-font-heading);
}

.login-subtitle {
  margin: 0;
  color: var(--uc-gray);
  font-size: 0.95rem;
}

.login-form {
  padding: 0;
}

.field {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}

.required {
  color: var(--uc-secondary);
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.input-wrapper :deep(.p-inputtext) {
  width: 100%;
  padding-right: 2.5rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.input-wrapper :deep(.p-inputtext:focus) {
  border-color: var(--uc-primary);
  box-shadow: 0 0 0 3px rgba(5, 179, 242, 0.1);
}

.input-wrapper :deep(.p-password) {
  width: 100%;
}

.input-wrapper :deep(.p-password .p-inputtext) {
  width: 100%;
  border-radius: 8px;
  font-size: 0.95rem;
}

.field-error {
  display: block;
  color: var(--red-500);
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.checkbox-field {
  margin-bottom: 2rem;
}

.checkbox-label {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-color-secondary);
}

.login-button {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background: var(--uc-primary);
  border: none;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.login-button:enabled:hover {
  background: var(--uc-primary-dark);
  transform: translateY(-1px);
}

.login-button:focus {
  box-shadow: 0 0 0 3px rgba(5, 179, 242, 0.3);
}

.forgot-password {
  text-align: center;
}

.forgot-link {
  color: var(--uc-primary);
  font-size: 0.9rem;
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  color: var(--uc-primary-dark);
  text-decoration: underline;
}

.login-footer {
  padding: 1.5rem 2rem;
  background: var(--surface-50);
  border-top: 1px solid var(--surface-border);
}

.security-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.security-icon {
  color: var(--green-500);
}

.security-text {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.help-links {
  text-align: center;
}

.help-link {
  color: var(--uc-primary);
  text-decoration: none;
  font-weight: 500;
}

.help-link:hover {
  text-decoration: underline;
}

.company-info {
  margin-top: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.company-links {
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.company-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
}

.company-link:hover {
  color: white;
  text-decoration: underline;
}

.error-message,
.success-message,
.lockout-message {
  margin-bottom: 1.5rem;
}

.lockout-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.lockout-content i {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.lockout-content strong {
  display: block;
  margin-bottom: 0.25rem;
}

.lockout-content p {
  margin: 0;
  font-size: 0.9rem;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
    justify-content: flex-start;
    padding-top: 3rem;
  }

  .login-card {
    max-width: none;
    width: 100%;
  }

  .login-header {
    padding: 1.5rem 1rem 1rem;
  }

  .company-logo {
    height: 48px;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .company-info {
    margin-top: 1rem;
  }

  .company-links {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .login-header {
    background: linear-gradient(45deg, var(--surface-0), var(--surface-100));
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .login-card {
    border: 2px solid var(--text-color);
  }

  .input-wrapper :deep(.p-inputtext) {
    border: 2px solid var(--text-color);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .login-button:enabled:hover {
    transform: none;
  }
  
  .input-wrapper :deep(.p-inputtext),
  .login-button {
    transition: none;
  }
}
</style>