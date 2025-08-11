<template>
  <div class="projects-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <Breadcrumb :model="breadcrumbItems" />
          <h1>Projects</h1>
          <p>Manage and monitor all construction projects</p>
        </div>
        
        <div class="header-actions">
          <Button 
            icon="pi pi-plus" 
            label="New Project" 
            @click="showNewProject = true"
            v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
          />
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            @click="refreshProjects"
            :loading="projectsStore.loading"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <Card class="filters-card">
      <template #content>
        <div class="filters-section">
          <div class="search-field">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText 
                v-model="projectsStore.filters.search"
                placeholder="Search projects..."
                @input="debouncedSearch"
                class="search-input"
              />
            </span>
          </div>
          
          <div class="filter-fields">
            <Dropdown 
              v-model="projectsStore.filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Status"
              showClear
              @change="handleFilterChange"
            />
            
            <Calendar 
              v-model="dateRange"
              selectionMode="range"
              :manualInput="false"
              placeholder="Date Range"
              @date-select="handleDateRangeChange"
              showIcon
            />
            
            <Button 
              icon="pi pi-filter-slash" 
              label="Clear" 
              @click="clearFilters"
              text
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Projects DataTable -->
    <Card class="projects-card">
      <template #content>
        <DataTable 
          :value="projectsStore.projects"
          :loading="projectsStore.loading"
          :paginator="true"
          :rows="projectsStore.pagination.per_page"
          :totalRecords="projectsStore.pagination.total"
          :lazy="true"
          @page="handlePageChange"
          @sort="handleSort"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 20, 50]"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
          responsiveLayout="scroll"
          class="projects-table"
          selectionMode="single"
          @row-select="viewProject"
        >
          <!-- Project Name -->
          <Column field="name" header="Project" :sortable="true">
            <template #body="{ data }">
              <div class="project-name-cell">
                <div class="project-main">
                  <strong>{{ data.name }}</strong>
                  <div class="project-meta">
                    <small>Client: {{ data.client_name }}</small>
                    <small v-if="data.address">{{ data.city }}, {{ data.state }}</small>
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <!-- Status -->
          <Column field="status" header="Status" :sortable="true">
            <template #body="{ data }">
              <Badge 
                :value="formatStatus(data.status)" 
                :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>

          <!-- Budget -->
          <Column field="budget" header="Budget" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.budget" class="budget-amount">
                ${{ formatNumber(data.budget) }}
              </span>
              <span v-else class="no-budget">Not set</span>
            </template>
          </Column>

          <!-- Dates -->
          <Column field="start_date" header="Timeline" :sortable="true">
            <template #body="{ data }">
              <div class="timeline-cell">
                <div v-if="data.start_date || data.end_date" class="date-range">
                  <div>
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(data.start_date) || 'Not set' }}</span>
                  </div>
                  <div class="end-date">
                    <i class="pi pi-flag"></i>
                    <span>{{ formatDate(data.end_date) || 'Not set' }}</span>
                  </div>
                </div>
                <span v-else class="no-dates">No timeline set</span>
              </div>
            </template>
          </Column>

          <!-- Team -->
          <Column header="Team">
            <template #body="{ data }">
              <div class="team-avatars">
                <Avatar 
                  v-for="(employee, index) in (data.employees || []).slice(0, 3)" 
                  :key="employee.id"
                  :label="getEmployeeInitials(employee)"
                  size="normal"
                  :style="{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 10 - index }"
                  class="team-avatar"
                  v-tooltip="`${employee.first_name} ${employee.last_name}`"
                />
                <Avatar 
                  v-if="(data.employees || []).length > 3"
                  :label="`+${(data.employees || []).length - 3}`"
                  size="normal"
                  style="margin-left: -8px;"
                  class="team-avatar team-avatar-more"
                />
                <span v-if="!(data.employees || []).length" class="no-team">No team assigned</span>
              </div>
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button 
                  icon="pi pi-eye" 
                  @click="viewProject(data)"
                  class="p-button-text p-button-sm"
                  v-tooltip="'View Details'"
                />
                
                <Button 
                  icon="pi pi-pencil" 
                  @click="editProject(data)"
                  class="p-button-text p-button-sm"
                  v-tooltip="'Edit Project'"
                  v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
                />
                
                <Button 
                  icon="pi pi-upload" 
                  @click="uploadFiles(data)"
                  class="p-button-text p-button-sm"
                  v-tooltip="'Upload Files'"
                />

                <Button 
                  icon="pi pi-qrcode" 
                  @click="generateQR(data)"
                  class="p-button-text p-button-sm"
                  v-tooltip="'Generate QR Code'"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-briefcase empty-icon"></i>
              <h3>No projects found</h3>
              <p>No projects match your current filters.</p>
              <Button 
                label="Create First Project" 
                @click="showNewProject = true"
                v-if="authStore.hasAnyRole(['admin', 'project_manager']) && !projectsStore.filters.search"
              />
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Dialogs -->
    <ProjectForm 
      v-model:visible="showNewProject" 
      @project-created="onProjectCreated"
    />
    
    <ProjectForm 
      v-model:visible="showEditProject" 
      :project="selectedProject"
      @project-updated="onProjectUpdated"
    />
    
    <FileUpload 
      v-model:visible="showFileUpload" 
      :projectId="selectedProject?.id"
      @files-uploaded="onFilesUploaded"
    />

    <!-- QR Code Dialog -->
    <Dialog 
      v-model:visible="showQRDialog" 
      header="Project QR Code"
      :modal="true"
      class="qr-dialog"
    >
      <div v-if="qrCodeUrl" class="qr-content">
        <div class="qr-code-container">
          <img :src="qrCodeUrl" alt="Project QR Code" class="qr-code-image" />
        </div>
        <p>Scan this QR code to quickly access project details</p>
        <div class="qr-actions">
          <Button 
            label="Download" 
            icon="pi pi-download"
            @click="downloadQR"
          />
          <Button 
            label="Print" 
            icon="pi pi-print"
            @click="printQR"
            severity="secondary"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Badge from 'primevue/badge'
import Avatar from 'primevue/avatar'
import Breadcrumb from 'primevue/breadcrumb'
import Dialog from 'primevue/dialog'

// Custom Components
import ProjectForm from '@/components/employee/ProjectForm.vue'
import FileUpload from '@/components/employee/FileUpload.vue'

// Stores and utilities
const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const toast = useToast()

// Reactive data
const showNewProject = ref(false)
const showEditProject = ref(false)
const showFileUpload = ref(false)
const showQRDialog = ref(false)
const selectedProject = ref(null)
const dateRange = ref(null)
const qrCodeUrl = ref('')

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', route: '/employee/dashboard' },
  { label: 'Projects' }
])

// Options
const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

// Methods
const refreshProjects = async () => {
  await projectsStore.fetchProjects()
}

const debouncedSearch = debounce(() => {
  handleFilterChange()
}, 500)

const handleFilterChange = () => {
  projectsStore.setPage(1)
  refreshProjects()
}

const handlePageChange = (event) => {
  projectsStore.setPage(event.page + 1)
  projectsStore.setPerPage(event.rows)
  refreshProjects()
}

const handleSort = (event) => {
  // Handle sorting if needed
  refreshProjects()
}

const handleDateRangeChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    projectsStore.updateFilters({
      date_from: dateRange.value[0].toISOString().split('T')[0],
      date_to: dateRange.value[1].toISOString().split('T')[0]
    })
  } else {
    projectsStore.updateFilters({
      date_from: null,
      date_to: null
    })
  }
  handleFilterChange()
}

const clearFilters = () => {
  dateRange.value = null
  projectsStore.clearFilters()
  refreshProjects()
}

const viewProject = (project) => {
  router.push(`/employee/projects/${project.id}`)
}

const editProject = (project) => {
  selectedProject.value = project
  showEditProject.value = true
}

const uploadFiles = (project) => {
  selectedProject.value = project
  showFileUpload.value = true
}

const generateQR = async (project) => {
  selectedProject.value = project
  try {
    qrCodeUrl.value = await projectsStore.generateQRCode(project.id)
    showQRDialog.value = true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to generate QR code',
      life: 3000
    })
  }
}

const downloadQR = () => {
  if (qrCodeUrl.value) {
    const link = document.createElement('a')
    link.href = qrCodeUrl.value
    link.download = `project-${selectedProject.value?.id}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const printQR = () => {
  if (qrCodeUrl.value) {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Project QR Code</title></head>
        <body style="text-align: center; padding: 20px;">
          <h2>${selectedProject.value?.name}</h2>
          <img src="${qrCodeUrl.value}" alt="QR Code" />
          <p>Project QR Code</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}

const onProjectCreated = (project) => {
  showNewProject.value = false
  refreshProjects()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `Project "${project.name}" created successfully`,
    life: 3000
  })
}

const onProjectUpdated = (project) => {
  showEditProject.value = false
  selectedProject.value = null
  refreshProjects()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `Project "${project.name}" updated successfully`,
    life: 3000
  })
}

const onFilesUploaded = (files) => {
  showFileUpload.value = false
  selectedProject.value = null
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${files.length} file(s) uploaded successfully`,
    life: 3000
  })
}

// Utility methods
const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getStatusSeverity = (status) => {
  const severityMap = {
    active: 'success',
    pending: 'warning',
    completed: 'info',
    on_hold: 'secondary',
    cancelled: 'danger'
  }
  return severityMap[status] || 'secondary'
}

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number)
}

const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getEmployeeInitials = (employee) => {
  return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
}

// Lifecycle
onMounted(async () => {
  document.title = 'Projects - Employee Portal'
  await refreshProjects()
})
</script>

<style scoped>
.projects-view {
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

/* Filters Card */
.filters-card {
  max-width: 1400px;
  margin: 2rem auto 0;
}

.filters-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-field {
  flex: 1;
}

.search-input {
  width: 100%;
}

.filter-fields {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Projects Card */
.projects-card {
  max-width: 1400px;
  margin: 1rem auto 2rem;
}

/* Table Styles */
.project-name-cell {
  max-width: 300px;
}

.project-main strong {
  display: block;
  color: var(--text-color);
  font-size: 0.925rem;
  margin-bottom: 0.25rem;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.project-meta small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.budget-amount {
  font-weight: 500;
  color: var(--green-600);
}

.no-budget,
.no-dates,
.no-team {
  color: var(--text-color-secondary);
  font-style: italic;
  font-size: 0.825rem;
}

.timeline-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.timeline-cell > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
}

.end-date {
  color: var(--text-color-secondary);
}

.team-avatars {
  display: flex;
  align-items: center;
}

.team-avatar {
  border: 2px solid white;
  background: var(--primary-color) !important;
}

.team-avatar-more {
  background: var(--surface-300) !important;
  color: var(--text-color) !important;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Empty State */
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
  margin: 0 0 1rem 0;
  font-size: 0.925rem;
}

/* QR Code Dialog */
.qr-dialog {
  width: 400px;
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.qr-code-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-image {
  max-width: 200px;
  width: 100%;
}

.qr-actions {
  display: flex;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-fields {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
  }
  
  .projects-card,
  .filters-card {
    margin-left: 1rem;
    margin-right: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-fields {
    flex-direction: column;
  }
}
</style>