<template>
  <Dialog 
    v-model:visible="visible" 
    header="Client Feedback Management"
    :modal="true" 
    :draggable="false"
    :resizable="false"
    class="feedback-dialog"
  >
    <div class="feedback-container">
      <!-- Filters and Actions -->
      <div class="feedback-header">
        <div class="filters-section">
          <div class="filter-row">
            <div class="filter-field">
              <label>Search</label>
              <InputText 
                v-model="feedbackStore.filters.search"
                placeholder="Search feedback, client name, or project..."
                @input="debouncedSearch"
                class="search-input"
              />
            </div>
            
            <div class="filter-field">
              <label>Project</label>
              <Dropdown 
                v-model="feedbackStore.filters.project_id"
                :options="projectOptions"
                optionLabel="name"
                optionValue="id"
                placeholder="All Projects"
                showClear
                @change="handleFilterChange"
                class="project-filter"
              />
            </div>
            
            <div class="filter-field">
              <label>Status</label>
              <Dropdown 
                v-model="feedbackStore.filters.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Status"
                showClear
                @change="handleFilterChange"
              />
            </div>
            
            <div class="filter-field">
              <label>Rating</label>
              <Dropdown 
                v-model="feedbackStore.filters.rating"
                :options="ratingOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Ratings"
                showClear
                @change="handleFilterChange"
              />
            </div>
          </div>
          
          <div class="actions-row">
            <Button 
              icon="pi pi-refresh" 
              label="Refresh" 
              @click="refreshFeedback"
              :loading="feedbackStore.loading"
              class="p-button-outlined"
            />
            
            <Button 
              icon="pi pi-download" 
              label="Export" 
              @click="exportFeedback"
              severity="secondary"
              class="p-button-outlined"
              v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
            />
            
            <Button 
              icon="pi pi-filter-slash" 
              label="Clear Filters" 
              @click="clearFilters"
              severity="secondary"
              class="p-button-text"
            />
          </div>
        </div>
      </div>

      <!-- Feedback Statistics -->
      <div class="feedback-stats" v-if="feedbackStore.feedback.length > 0">
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-number">{{ feedbackStore.statistics.total_feedback || 0 }}</div>
              <div class="stat-label">Total Feedback</div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-number">{{ feedbackStore.statistics.average_rating || '0.0' }}</div>
              <div class="stat-label">Avg. Rating</div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-number">{{ pendingCount }}</div>
              <div class="stat-label">Pending</div>
            </div>
          </template>
        </Card>
        
        <Card class="stat-card">
          <template #content>
            <div class="stat-content">
              <div class="stat-number">{{ resolvedCount }}</div>
              <div class="stat-label">Resolved</div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Feedback List -->
      <div class="feedback-content">
        <DataTable 
          :value="feedbackStore.filteredFeedback"
          :loading="feedbackStore.loading"
          :paginator="true"
          :rows="feedbackStore.pagination.per_page"
          :totalRecords="feedbackStore.pagination.total"
          :lazy="true"
          @page="handlePageChange"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 20, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          responsiveLayout="scroll"
          class="feedback-table"
        >
          <!-- Client Column -->
          <Column field="client_name" header="Client" :sortable="true">
            <template #body="{ data }">
              <div class="client-info">
                <div class="client-avatar">
                  <Avatar 
                    :label="getClientInitials(data.client_name)" 
                    size="normal"
                    class="client-avatar-icon"
                  />
                </div>
                <div class="client-details">
                  <strong>{{ data.client_name }}</strong>
                  <small>{{ data.client_email }}</small>
                </div>
              </div>
            </template>
          </Column>

          <!-- Project Column -->
          <Column field="project" header="Project" :sortable="true">
            <template #body="{ data }">
              <div class="project-info" v-if="data.project">
                <strong>{{ data.project.name }}</strong>
                <small>{{ data.project.client_name }}</small>
              </div>
              <span v-else class="no-project">No project</span>
            </template>
          </Column>

          <!-- Rating Column -->
          <Column field="rating" header="Rating" :sortable="true">
            <template #body="{ data }">
              <div class="rating-display">
                <Rating 
                  :model-value="data.rating" 
                  :readonly="true" 
                  :cancel="false"
                  class="feedback-rating"
                />
                <Badge 
                  :value="data.rating + '/5'" 
                  :severity="getRatingSeverity(data.rating)"
                  class="rating-badge"
                />
              </div>
            </template>
          </Column>

          <!-- Comment Column -->
          <Column field="comment" header="Feedback" class="comment-column">
            <template #body="{ data }">
              <div class="comment-content">
                <p>{{ truncateText(data.comment, 100) }}</p>
                <Button 
                  v-if="data.comment && data.comment.length > 100"
                  label="Read More" 
                  class="p-button-text p-button-sm read-more-btn"
                  @click="showFeedbackDetail(data)"
                />
              </div>
            </template>
          </Column>

          <!-- Status Column -->
          <Column field="status" header="Status" :sortable="true">
            <template #body="{ data }">
              <div class="status-container">
                <Badge 
                  :value="formatStatus(data.status)" 
                  :severity="getStatusSeverity(data.status)"
                />
                <small class="status-date">{{ formatDate(data.updated_at) }}</small>
              </div>
            </template>
          </Column>

          <!-- Actions Column -->
          <Column header="Actions" class="actions-column">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-text p-button-sm"
                  @click="showFeedbackDetail(data)"
                  v-tooltip="'View Details'"
                />
                
                <Button 
                  icon="pi pi-reply" 
                  class="p-button-text p-button-sm"
                  @click="showResponseDialog(data)"
                  v-tooltip="'Respond'"
                  :disabled="data.status === 'resolved'"
                />
                
                <Dropdown 
                  v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
                  :options="statusUpdateOptions"
                  optionLabel="label"
                  optionValue="value"
                  @change="(event) => updateFeedbackStatus(data, event.value)"
                  placeholder="Update Status"
                  class="status-dropdown"
                >
                  <template #trigger>
                    <Button 
                      icon="pi pi-cog" 
                      class="p-button-text p-button-sm"
                      v-tooltip="'Update Status'"
                    />
                  </template>
                </Dropdown>
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-comment empty-icon"></i>
              <h3>No feedback found</h3>
              <p>No client feedback matches your current filters.</p>
            </div>
          </template>

          <template #loading>
            <div class="loading-state">
              <ProgressSpinner />
              <p>Loading feedback...</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Feedback Detail Dialog -->
    <Dialog 
      v-model:visible="showDetailDialog" 
      :header="`Feedback from ${selectedFeedback?.client_name}`"
      :modal="true"
      class="feedback-detail-dialog"
    >
      <div v-if="selectedFeedback" class="feedback-detail">
        <div class="feedback-detail-header">
          <div class="client-info">
            <Avatar 
              :label="getClientInitials(selectedFeedback.client_name)" 
              size="large"
            />
            <div class="client-details">
              <h3>{{ selectedFeedback.client_name }}</h3>
              <p>{{ selectedFeedback.client_email }}</p>
              <small>{{ formatDate(selectedFeedback.created_at) }}</small>
            </div>
          </div>
          
          <div class="feedback-meta">
            <div class="rating-display">
              <Rating 
                :model-value="selectedFeedback.rating" 
                :readonly="true" 
                :cancel="false"
              />
              <span class="rating-text">{{ selectedFeedback.rating }}/5 Stars</span>
            </div>
            
            <Badge 
              :value="formatStatus(selectedFeedback.status)" 
              :severity="getStatusSeverity(selectedFeedback.status)"
              class="status-badge"
            />
          </div>
        </div>
        
        <Divider />
        
        <div class="feedback-content">
          <h4>Feedback Comment</h4>
          <p class="feedback-comment">{{ selectedFeedback.comment }}</p>
          
          <div v-if="selectedFeedback.project" class="project-context">
            <h4>Project Context</h4>
            <div class="project-details">
              <strong>{{ selectedFeedback.project.name }}</strong>
              <p>{{ selectedFeedback.project.description }}</p>
            </div>
          </div>
          
          <div v-if="selectedFeedback.response" class="feedback-response">
            <h4>Our Response</h4>
            <div class="response-content">
              <p>{{ selectedFeedback.response }}</p>
              <small>Responded on {{ formatDate(selectedFeedback.response_date) }}</small>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Close" 
          @click="showDetailDialog = false"
        />
        <Button 
          label="Respond" 
          @click="showResponseDialog(selectedFeedback)"
          :disabled="selectedFeedback?.status === 'resolved'"
          v-if="!selectedFeedback?.response"
        />
      </template>
    </Dialog>

    <!-- Response Dialog -->
    <Dialog 
      v-model:visible="showResponseForm" 
      header="Respond to Feedback"
      :modal="true"
      class="response-dialog"
    >
      <form @submit.prevent="submitResponse" class="response-form">
        <div class="form-field">
          <label for="response">Your Response *</label>
          <Textarea 
            id="response"
            v-model="responseData.message"
            rows="6"
            placeholder="Enter your response to the client's feedback..."
            :invalid="!!responseErrors.message"
            class="w-full"
          />
          <small v-if="responseErrors.message" class="p-error">{{ responseErrors.message }}</small>
        </div>
        
        <div class="form-field">
          <label for="responseStatus">Update Status</label>
          <Dropdown 
            id="responseStatus"
            v-model="responseData.status"
            :options="statusOptions.filter(opt => opt.value !== 'pending')"
            optionLabel="label"
            optionValue="value"
            placeholder="Select new status"
            class="w-full"
          />
        </div>
      </form>
      
      <template #footer>
        <Button 
          label="Cancel" 
          severity="secondary"
          @click="showResponseForm = false"
        />
        <Button 
          label="Send Response" 
          @click="submitResponse"
          :loading="submittingResponse"
          :disabled="!responseData.message.trim()"
        />
      </template>
    </Dialog>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Close" 
          @click="visible = false"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFeedbackStore } from '@/stores/feedback'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'

// PrimeVue Components
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Rating from 'primevue/rating'
import Avatar from 'primevue/avatar'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'

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
const feedbackStore = useFeedbackStore()
const projectsStore = useProjectsStore()
const toast = useToast()

// Reactive data
const projectOptions = ref([])
const selectedFeedback = ref(null)
const showDetailDialog = ref(false)
const showResponseForm = ref(false)
const submittingResponse = ref(false)
const responseData = ref({
  message: '',
  status: 'under_review'
})
const responseErrors = ref({})

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const pendingCount = computed(() => {
  return feedbackStore.feedback.filter(f => f.status === 'pending').length
})

const resolvedCount = computed(() => {
  return feedbackStore.feedback.filter(f => f.status === 'resolved').length
})

// Options
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Archived', value: 'archived' }
]

const statusUpdateOptions = [
  { label: 'Mark as Under Review', value: 'under_review' },
  { label: 'Mark as Resolved', value: 'resolved' },
  { label: 'Archive', value: 'archived' }
]

const ratingOptions = [
  { label: '5 Stars', value: 5 },
  { label: '4 Stars', value: 4 },
  { label: '3 Stars', value: 3 },
  { label: '2 Stars', value: 2 },
  { label: '1 Star', value: 1 }
]

// Methods
const loadProjects = async () => {
  try {
    await projectsStore.fetchProjects({ per_page: 100 })
    projectOptions.value = projectsStore.projects.map(project => ({
      id: project.id,
      name: project.name,
      client_name: project.client_name
    }))
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

const refreshFeedback = async () => {
  try {
    await feedbackStore.fetchFeedback()
    await feedbackStore.fetchStatistics()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh feedback',
      life: 3000
    })
  }
}

const handleFilterChange = () => {
  feedbackStore.setPage(1)
  refreshFeedback()
}

const debouncedSearch = debounce(() => {
  handleFilterChange()
}, 500)

const handlePageChange = (event) => {
  feedbackStore.setPage(event.page + 1)
  feedbackStore.setPerPage(event.rows)
  refreshFeedback()
}

const clearFilters = () => {
  feedbackStore.clearFilters()
  refreshFeedback()
}

const exportFeedback = async () => {
  try {
    await feedbackStore.exportFeedback()
    toast.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Feedback data has been exported',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Export Failed',
      detail: 'Failed to export feedback data',
      life: 3000
    })
  }
}

const showFeedbackDetail = (feedback) => {
  selectedFeedback.value = feedback
  showDetailDialog.value = true
}

const showResponseDialog = (feedback) => {
  selectedFeedback.value = feedback
  responseData.value = {
    message: '',
    status: 'under_review'
  }
  responseErrors.value = {}
  showDetailDialog.value = false
  showResponseForm.value = true
}

const submitResponse = async () => {
  if (!responseData.value.message.trim()) {
    responseErrors.value.message = 'Response message is required'
    return
  }

  submittingResponse.value = true
  responseErrors.value = {}

  try {
    await feedbackStore.submitResponse(selectedFeedback.value.id, {
      response: responseData.value.message,
      status: responseData.value.status
    })

    toast.add({
      severity: 'success',
      summary: 'Response Sent',
      detail: 'Your response has been sent to the client',
      life: 3000
    })

    showResponseForm.value = false
    refreshFeedback()

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send response',
      life: 3000
    })
  } finally {
    submittingResponse.value = false
  }
}

const updateFeedbackStatus = async (feedback, newStatus) => {
  try {
    await feedbackStore.updateFeedbackStatus(feedback.id, newStatus)
    toast.add({
      severity: 'success',
      summary: 'Status Updated',
      detail: `Feedback marked as ${formatStatus(newStatus).toLowerCase()}`,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update status',
      life: 3000
    })
  }
}

// Utility methods
const getClientInitials = (name) => {
  if (!name) return 'C'
  const parts = name.split(' ')
  return parts.length > 1 
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    under_review: 'Under Review',
    resolved: 'Resolved',
    archived: 'Archived'
  }
  return statusMap[status] || status
}

const getStatusSeverity = (status) => {
  const severityMap = {
    pending: 'warning',
    under_review: 'info',
    resolved: 'success',
    archived: 'secondary'
  }
  return severityMap[status] || 'secondary'
}

const getRatingSeverity = (rating) => {
  if (rating >= 4) return 'success'
  if (rating >= 3) return 'warning'
  return 'danger'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Watchers
watch(() => props.visible, async (newValue) => {
  if (newValue) {
    await loadProjects()
    await refreshFeedback()
  }
})

// Lifecycle
onMounted(() => {
  if (props.visible) {
    loadProjects()
    refreshFeedback()
  }
})
</script>

<style scoped>
.feedback-dialog {
  width: 98vw;
  max-width: 1200px;
  height: 90vh;
}

.feedback-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

/* Header and Filters */
.feedback-header {
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-field label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.actions-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Statistics */
.feedback-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  text-align: center;
}

/* Feedback Content */
.feedback-content {
  flex: 1;
  overflow: hidden;
}

.feedback-table {
  height: 100%;
}

/* Table Columns */
.client-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.client-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.client-details strong {
  color: var(--text-color);
  font-size: 0.875rem;
}

.client-details small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-info strong {
  color: var(--text-color);
  font-size: 0.875rem;
}

.project-info small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.no-project {
  color: var(--text-color-secondary);
  font-style: italic;
}

.rating-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.rating-badge {
  font-size: 0.75rem;
}

.comment-content {
  max-width: 300px;
}

.comment-content p {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 0.875rem;
  line-height: 1.4;
}

.read-more-btn {
  font-size: 0.75rem !important;
  padding: 0.25rem 0.5rem !important;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-date {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.status-dropdown {
  min-width: 120px;
}

/* Empty and Loading States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

/* Detail Dialog */
.feedback-detail-dialog {
  width: 95vw;
  max-width: 700px;
}

.feedback-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.feedback-detail .client-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.feedback-detail .client-details h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
}

.feedback-detail .client-details p {
  margin: 0.25rem 0;
  color: var(--text-color-secondary);
}

.feedback-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.rating-text {
  margin-left: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

.feedback-comment {
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
  margin: 1rem 0;
}

.project-context {
  margin: 2rem 0;
}

.project-details {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.project-details strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.project-details p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.feedback-response {
  background: var(--green-50);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--green-200);
  margin-top: 2rem;
}

.response-content p {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  line-height: 1.6;
}

.response-content small {
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Response Dialog */
.response-dialog {
  width: 95vw;
  max-width: 600px;
}

.response-form {
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
}

/* Responsive */
@media (max-width: 1024px) {
  .filter-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .feedback-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .feedback-dialog {
    width: 98vw;
    height: 95vh;
    margin: 1rem;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .feedback-stats {
    grid-template-columns: 1fr;
  }
  
  .feedback-detail-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .feedback-meta {
    align-items: flex-start;
  }
}
</style>