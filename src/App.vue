<template>
  <div id="app">
    <!-- Public Layout (default) -->
    <template v-if="!currentLayout || currentLayout === 'public'">
      <!-- Skip Navigation Links for Screen Readers -->
      <div class="skip-links">
        <a
          href="#main-content"
          class="skip-link"
          @click="focusMainContent"
        >
          Skip to main content
        </a>
        <a
          href="#main-navigation"
          class="skip-link"
        >
          Skip to navigation
        </a>
      </div>

      <HeaderNav id="main-navigation" />
      <RouterView id="main-content" />
      <FooterSection />
    </template>

    <!-- Minimal Layout (auth pages) -->
    <MinimalLayout v-else-if="currentLayout === 'minimal'" />

    <!-- Employee Layout (authenticated employee area) -->
    <EmployeeLayout v-else-if="currentLayout === 'employee'" />

    <!-- Client Layout (QR code access) -->
    <ClientLayout v-else-if="currentLayout === 'client'" />

    <!-- Fallback to public layout -->
    <template v-else>
      <HeaderNav id="main-navigation" />
      <RouterView id="main-content" />
      <FooterSection />
    </template>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layout Components
import HeaderNav from './components/layout/HeaderNav.vue'
import FooterSection from './components/layout/FooterSection.vue'
import MinimalLayout from './components/layout/MinimalLayout.vue'
import EmployeeLayout from './components/layout/EmployeeLayout.vue'
import ClientLayout from './components/layout/ClientLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

// Current layout state
const currentLayout = ref('public')

/**
 * Determine layout based on route meta
 */
const updateLayout = () => {
  currentLayout.value = route.meta?.layout || 'public'
}

/**
 * Focus the main content area when skip link is activated
 */
const focusMainContent = () => {
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    // Make the main content focusable
    mainContent.setAttribute('tabindex', '-1')
    mainContent.focus()
    // Remove tabindex after focus to avoid tab stops
    setTimeout(() => {
      mainContent.removeAttribute('tabindex')
    }, 100)
  }
}

// Watch route changes to update layout
watch(route, updateLayout, { immediate: true })

// Initialize auth store on app start
onMounted(async () => {
  try {
    await authStore.initialize()
  } catch (error) {
    console.error('Failed to initialize auth store:', error)
  }
})
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

/* Skip Navigation Links */
.skip-links {
  position: absolute;
  top: -100px;
  left: 0;
  width: 100%;
  z-index: 9999;
}

.skip-link {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: var(--uc-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0 0 8px 8px;
  font-weight: 600;
  text-decoration: none;
  transition: top 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.skip-link:focus {
  top: 0;
  color: white;
  outline: 2px solid var(--uc-secondary);
  outline-offset: 2px;
}

.skip-link:hover:focus {
  background: var(--uc-primary-dark);
  color: white;
}
</style>