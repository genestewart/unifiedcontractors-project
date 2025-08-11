<template>
  <main class="not-found-page">
    <div class="container">
      <div class="not-found-content">
        <div class="error-code">
          404
        </div>
        <h1>Page Not Found</h1>
        <p class="lead">
          Sorry, the page you are looking for could not be found.
        </p>
        <div class="error-actions">
          <RouterLink
            to="/"
            class="btn-primary"
          >
            Go Home
          </RouterLink>
          <RouterLink
            to="/contact"
            class="btn-outline"
          >
            Contact Us
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSEO } from '@/composables/useSEO'

const { setMeta } = useSEO()

onMounted(() => {
  setMeta({
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found.',
    noindex: true,
    nofollow: true
  })
})
</script>

<style scoped>
.not-found-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  color: var(--uc-primary);
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-content h1 {
  color: var(--uc-dark);
  margin-bottom: 1rem;
}

.lead {
  color: var(--uc-gray);
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-outline {
  background: transparent;
  color: var(--uc-primary);
  border: 2px solid var(--uc-primary);
  padding: 0.75rem 2rem;
  border-radius: var(--uc-radius);
  font-weight: 600;
  transition: all 0.3s;
  display: inline-block;
}

.btn-outline:hover {
  background: var(--uc-primary);
  color: white;
  transform: translateY(-2px);
}
</style>