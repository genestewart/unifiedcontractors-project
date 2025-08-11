<template>
  <div class="forgot-password-view">
    <Card class="forgot-password-card">
      <template #header>
        <div class="forgot-password-header">
          <img :src="logoUrl" alt="Unified Contractors" class="company-logo" />
          <h1 class="forgot-password-title">Reset Password</h1>
          <p class="forgot-password-subtitle">Enter your email to receive reset instructions</p>
        </div>
      </template>

      <template #content>
        <div class="forgot-password-content">
          <p>This feature will be implemented in a future phase.</p>
          <div class="back-to-login">
            <router-link to="/employee/login" class="back-link">
              <i class="pi pi-arrow-left"></i>
              Back to Login
            </router-link>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Card from 'primevue/card'
import logoUrl from '@/assets/logo.svg'

onMounted(() => {
  document.title = 'Reset Password - Employee Portal'
})
</script>

<style scoped>
.forgot-password-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--uc-primary) 0%, var(--uc-primary-dark) 100%);
}

.forgot-password-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 16px;
}

.forgot-password-header {
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

.forgot-password-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--uc-dark);
  font-family: var(--uc-font-heading);
}

.forgot-password-subtitle {
  margin: 0;
  color: var(--uc-gray);
  font-size: 0.95rem;
}

.forgot-password-content {
  text-align: center;
  padding: 2rem;
}

.back-to-login {
  margin-top: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--uc-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.back-link:hover {
  background: var(--surface-100);
  color: var(--uc-primary-dark);
}
</style>