<template>
  <div class="feedback-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <Breadcrumb :model="breadcrumbItems" />
          <h1>Client Feedback</h1>
          <p>View and respond to client feedback</p>
        </div>
        
        <div class="header-actions">
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            @click="refreshFeedback"
            :loading="feedbackStore.loading"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="feedback-content">
      <ClientFeedbackList 
        :visible="true" 
        @update:visible="() => {}"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFeedbackStore } from '@/stores/feedback'

// PrimeVue Components
import Button from 'primevue/button'
import Breadcrumb from 'primevue/breadcrumb'

// Custom Components
import ClientFeedbackList from '@/components/employee/ClientFeedbackList.vue'

// Stores
const feedbackStore = useFeedbackStore()

// Reactive data
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', route: '/employee/dashboard' },
  { label: 'Client Feedback' }
])

// Methods
const refreshFeedback = async () => {
  await feedbackStore.fetchFeedback()
}

// Lifecycle
onMounted(async () => {
  document.title = 'Client Feedback - Employee Portal'
  await refreshFeedback()
})
</script>

<style scoped>
.feedback-view {
  min-height: 100vh;
  background: var(--surface-ground);
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid var(--surface-border);
  padding: 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-info h1 {
  margin: 0.5rem 0;
  color: var(--text-color);
  font-size: 2rem;
  font-weight: 600;
}

.header-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Feedback Content */
.feedback-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .feedback-content {
    padding: 0 1rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>