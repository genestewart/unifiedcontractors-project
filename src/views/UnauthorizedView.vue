<template>
  <div class="unauthorized-view">
    <Card class="unauthorized-card">
      <template #header>
        <div class="unauthorized-header">
          <div class="unauthorized-icon">
            <i class="pi pi-lock"></i>
          </div>
          <h1 class="unauthorized-title">Access Denied</h1>
          <p class="unauthorized-subtitle">You don't have permission to access this resource</p>
        </div>
      </template>

      <template #content>
        <div class="unauthorized-content">
          <p class="unauthorized-message">
            Your current role does not have the necessary permissions to view this page. 
            Please contact your administrator if you believe this is an error.
          </p>

          <div class="unauthorized-actions">
            <Button 
              label="Go to Dashboard" 
              icon="pi pi-home" 
              @click="goToDashboard"
              v-if="authStore.isAuthenticated"
            />
            <Button 
              label="Login" 
              icon="pi pi-sign-in" 
              @click="goToLogin"
              v-else
            />
            <Button 
              label="Go Home" 
              icon="pi pi-arrow-left" 
              severity="secondary"
              @click="goHome"
            />
          </div>

          <div class="help-section">
            <h3>Need Help?</h3>
            <p>Contact your system administrator or call <a href="tel:(555) 987-6543">(555) 987-6543</a></p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const goToDashboard = () => {
  router.push('/employee/dashboard')
}

const goToLogin = () => {
  router.push('/employee/login')
}

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  document.title = 'Access Denied - Unified Contractors'
})
</script>

<style scoped>
.unauthorized-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.unauthorized-card {
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 16px;
}

.unauthorized-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(45deg, #ffffff, #f8f9fa);
  border-bottom: 1px solid var(--surface-border);
}

.unauthorized-icon {
  width: 80px;
  height: 80px;
  background: var(--red-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.unauthorized-icon i {
  font-size: 2rem;
  color: var(--red-500);
}

.unauthorized-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  font-family: var(--uc-font-heading);
}

.unauthorized-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.unauthorized-content {
  padding: 2rem;
  text-align: center;
}

.unauthorized-message {
  margin-bottom: 2rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.unauthorized-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.help-section {
  padding-top: 2rem;
  border-top: 1px solid var(--surface-border);
}

.help-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.help-section p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.help-section a {
  color: var(--uc-primary);
  text-decoration: none;
  font-weight: 500;
}

.help-section a:hover {
  text-decoration: underline;
}

@media (min-width: 768px) {
  .unauthorized-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>