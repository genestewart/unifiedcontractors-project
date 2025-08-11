<template>
  <div class="minimal-layout">
    <!-- Skip Navigation Links -->
    <div class="skip-links">
      <a
        href="#main-content"
        class="skip-link"
        @click="focusMainContent"
      >
        Skip to main content
      </a>
    </div>

    <!-- Main Content -->
    <main id="main-content" class="main-content" role="main">
      <router-view />
    </main>

    <!-- Toast Container -->
    <Toast position="top-center" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Toast from 'primevue/toast'

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

onMounted(() => {
  // Set page class for styling
  document.body.classList.add('minimal-page')
  
  // Cleanup on unmount
  return () => {
    document.body.classList.remove('minimal-page')
  }
})
</script>

<style scoped>
.minimal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* Global styles for minimal layout pages */
:global(body.minimal-page) {
  overflow-x: hidden;
}

:global(body.minimal-page #app) {
  min-height: 100vh;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    align-items: flex-start;
    padding-top: 2rem;
  }
}
</style>