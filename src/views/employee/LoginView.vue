<template>
  <div class="login-view">
    <LoginForm />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import LoginForm from '@/components/auth/LoginForm.vue'

// Set page metadata
onMounted(() => {
  document.title = 'Employee Login - Unified Contractors'
  
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription) {
    metaDescription.content = 'Secure login portal for Unified Contractors employees. Access your projects, files, and team collaboration tools.'
  }
})

onUnmounted(() => {
  // Reset title when leaving
  document.title = 'Unified Contractors'
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>