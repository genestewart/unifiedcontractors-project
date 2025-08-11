<template>
  <div class="project-detail-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <Breadcrumb :model="breadcrumbItems" />
          <div class="project-header" v-if="currentProject">
            <div class="project-title">
              <h1>{{ currentProject.name }}</h1>
              <Badge 
                :value="formatStatus(currentProject.status)" 
                :severity="getStatusSeverity(currentProject.status)"
                class="status-badge"
              />
            </div>
            <div class="project-meta">
              <div class="meta-item">
                <i class="pi pi-user"></i>
                <span>{{ currentProject.client_name }}</span>
              </div>
              <div class="meta-item" v-if="currentProject.address">
                <i class="pi pi-map-marker"></i>
                <span>{{ currentProject.city }}, {{ currentProject.state }}</span>
              </div>
              <div class="meta-item" v-if="currentProject.budget">
                <i class="pi pi-dollar"></i>
                <span>${{ formatNumber(currentProject.budget) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <Button 
            icon="pi pi-pencil" 
            label="Edit Project" 
            @click="showEditProject = true"
            v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
          />
          <Button 
            icon="pi pi-upload" 
            label="Upload Files" 
            @click="showFileUpload = true"
            severity="secondary"
          />
          <Button 
            icon="pi pi-qrcode" 
            label="QR Code" 
            @click="generateQR"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    </div>

    <div class="project-content" v-if="currentProject">
      <div class="content-grid">
        <!-- Left Column -->
        <div class="main-content">
          <!-- Project Overview -->
          <Card class="project-overview">
            <template #title>
              <div class="card-header">
                <i class="pi pi-info-circle"></i>
                <span>Project Overview</span>
              </div>
            </template>
            <template #content>
              <div class="overview-content">
                <div class="description" v-if="currentProject.description">
                  <h4>Description</h4>
                  <p>{{ currentProject.description }}</p>
                </div>
                
                <div class="timeline-section">
                  <h4>Timeline</h4>
                  <div class="timeline-grid">
                    <div class="timeline-item">
                      <label>Start Date</label>
                      <span>{{ formatDate(currentProject.start_date) || 'Not set' }}</span>
                    </div>
                    <div class="timeline-item">
                      <label>End Date</label>
                      <span>{{ formatDate(currentProject.end_date) || 'Not set' }}</span>
                    </div>
                    <div class="timeline-item" v-if="currentProject.start_date && currentProject.end_date">
                      <label>Duration</label>
                      <span>{{ calculateDuration() }} days</span>
                    </div>
                  </div>
                </div>
                
                <div class="location-section" v-if="currentProject.address">
                  <h4>Location</h4>
                  <div class="location-details">
                    <p>{{ currentProject.address }}</p>
                    <p>{{ currentProject.city }}, {{ currentProject.state }} {{ currentProject.zip_code }}</p>
                  </div>
                </div>
                
                <div class="notes-section" v-if="currentProject.notes">
                  <h4>Internal Notes</h4>
                  <div class="notes-content">
                    <p>{{ currentProject.notes }}</p>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Project Files -->
          <Card class="project-files">
            <template #title>
              <div class="card-header">
                <i class="pi pi-file"></i>
                <span>Project Files</span>
                <Badge :value="projectFiles.length" class="files-count" />
              </div>
            </template>
            <template #content>
              <DataTable 
                :value="projectFiles"
                :loading="filesStore.loading"
                responsiveLayout="scroll"
                class="files-table"
              >
                <Column field="original_name" header="File Name">
                  <template #body="{ data }">
                    <div class="file-item">
                      <i :class="getFileIcon(data.file_extension)"></i>
                      <span>{{ data.original_name }}</span>
                    </div>
                  </template>
                </Column>
                
                <Column field="category" header="Category">
                  <template #body="{ data }">
                    <Badge :value="data.category" severity="secondary" />
                  </template>
                </Column>
                
                <Column field="file_size" header="Size">
                  <template #body="{ data }">
                    {{ formatFileSize(data.file_size) }}
                  </template>
                </Column>
                
                <Column field="created_at" header="Uploaded">
                  <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                  </template>
                </Column>
                
                <Column header="Actions">
                  <template #body="{ data }">
                    <div class="file-actions">
                      <Button 
                        icon="pi pi-eye" 
                        @click="previewFile(data)"
                        class="p-button-text p-button-sm"
                        v-tooltip="'Preview'"
                        v-if="isPreviewable(data)"
                      />
                      <Button 
                        icon="pi pi-download" 
                        @click="downloadFile(data)"
                        class="p-button-text p-button-sm"
                        v-tooltip="'Download'"
                      />
                    </div>
                  </template>
                </Column>

                <template #empty>
                  <div class="empty-files">
                    <i class="pi pi-file-o empty-icon"></i>
                    <p>No files uploaded yet</p>
                    <Button 
                      label="Upload First File" 
                      @click="showFileUpload = true"
                      text
                    />
                  </div>
                </template>
              </DataTable>
            </template>
          </Card>
        </div>

        <!-- Right Column -->
        <div class="sidebar-content">
          <!-- Project Team -->
          <Card class="project-team">
            <template #title>
              <div class="card-header">
                <i class="pi pi-users"></i>
                <span>Team Members</span>
              </div>
            </template>
            <template #content>
              <div class="team-list">
                <div 
                  v-for="employee in currentProject.employees || []" 
                  :key="employee.id"
                  class="team-member"
                >
                  <Avatar 
                    :label="getEmployeeInitials(employee)"
                    size="large"
                    class="member-avatar"
                  />
                  <div class="member-info">
                    <strong>{{ employee.first_name }} {{ employee.last_name }}</strong>
                    <small>{{ employee.email }}</small>
                    <small v-if="employee.role">{{ formatRole(employee.role) }}</small>
                  </div>
                </div>
                
                <div v-if="!(currentProject.employees || []).length" class="no-team">
                  <i class="pi pi-users empty-icon"></i>
                  <p>No team members assigned</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Client Information -->
          <Card class="client-info">
            <template #title>
              <div class="card-header">
                <i class="pi pi-user"></i>
                <span>Client Information</span>
              </div>
            </template>
            <template #content>
              <div class="client-details">
                <div class="client-item">
                  <label>Name</label>
                  <span>{{ currentProject.client_name }}</span>
                </div>
                
                <div class="client-item" v-if="currentProject.client_email">
                  <label>Email</label>
                  <a :href="`mailto:${currentProject.client_email}`">
                    {{ currentProject.client_email }}
                  </a>
                </div>
                
                <div class="client-item" v-if="currentProject.phone">
                  <label>Phone</label>
                  <a :href="`tel:${currentProject.phone}`">
                    {{ currentProject.phone }}
                  </a>
                </div>
              </div>
            </template>
          </Card>

          <!-- Recent Activity -->
          <Card class="recent-activity">
            <template #title>
              <div class="card-header">
                <i class="pi pi-clock"></i>
                <span>Recent Activity</span>
              </div>
            </template>
            <template #content>
              <div class="activity-list">
                <!-- This would be populated with actual activity data -->
                <div class="activity-item">
                  <div class="activity-icon">
                    <i class="pi pi-file-plus"></i>
                  </div>
                  <div class="activity-details">
                    <p>Project created</p>
                    <small>{{ formatDate(currentProject.created_at) }}</small>
                  </div>
                </div>
                
                <div v-if="currentProject.updated_at !== currentProject.created_at" class="activity-item">
                  <div class="activity-icon">
                    <i class="pi pi-pencil"></i>
                  </div>
                  <div class="activity-details">
                    <p>Project updated</p>
                    <small>{{ formatDate(currentProject.updated_at) }}</small>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="projectsStore.loading" class="loading-state">
      <ProgressSpinner />
      <p>Loading project details...</p>
    </div>

    <!-- Dialogs -->
    <ProjectForm 
      v-model:visible="showEditProject" 
      :project="currentProject"
      @project-updated="onProjectUpdated"
    />
    
    <FileUpload 
      v-model:visible="showFileUpload" 
      :projectId="currentProject?.id"
      @files-uploaded="onFilesUploaded"
    />

    <!-- QR Code Dialog -->
    <Dialog 
      v-model:visible="showQRCode" 
      header="Client Review QR Code"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '800px' }"
      class="qr-code-dialog"
    >
      <QRCodeDisplay 
        v-if="currentProject && showQRCode" 
        :project="currentProject" 
        @qr-generated="onQRGenerated"
        @qr-regenerated="onQRRegenerated"
      />
    </Dialog>

    <!-- File Preview Dialog -->
    <Dialog 
      v-model:visible="showFilePreview" 
      :header="previewFile?.original_name"
      :modal="true"
      class="file-preview-dialog"
    >
      <div v-if="previewFile" class="file-preview-content">
        <img 
          v-if="isImage(previewFile)"
          :src="getPreviewUrl(previewFile)"
          :alt="previewFile.original_name"
          class="preview-image"
        />
        <iframe 
          v-else-if="previewFile.file_extension === 'pdf'"
          :src="getPreviewUrl(previewFile)"
          class="preview-pdf"
        ></iframe>
        <div v-else class="unsupported-preview">
          <i class="pi pi-file"></i>
          <p>Preview not available for this file type</p>
          <Button 
            label="Download" 
            @click="downloadFile(previewFile)"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Breadcrumb from 'primevue/breadcrumb'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

// Custom Components
import ProjectForm from '@/components/employee/ProjectForm.vue'
import FileUpload from '@/components/employee/FileUpload.vue'
import QRCodeDisplay from '@/components/employee/QRCodeDisplay.vue'

// Props
const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
})

// Stores and utilities
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const filesStore = useFilesStore()
const toast = useToast()

// Reactive data
const showEditProject = ref(false)
const showFileUpload = ref(false)
const showFilePreview = ref(false)
const showQRCode = ref(false)
const selectedFile = ref(null)

// Computed
const currentProject = computed(() => projectsStore.currentProject)

const projectFiles = computed(() => {
  return filesStore.filesByProject(Number(props.id))
})

const breadcrumbItems = computed(() => [
  { label: 'Dashboard', icon: 'pi pi-home', route: '/employee/dashboard' },
  { label: 'Projects', route: '/employee/projects' },
  { label: currentProject.value?.name || 'Loading...' }
])

// Methods
const loadProject = async () => {
  try {
    await projectsStore.fetchProject(props.id)
    await filesStore.fetchFiles({ project_id: props.id })
  } catch (error) {
    console.error('Error loading project:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load project details',
      life: 3000
    })
  }
}

const generateQR = () => {
  showQRCode.value = true
}

const onQRGenerated = (data) => {
  console.log('QR Code generated:', data)
  // QR code has been generated and displayed
}

const onQRRegenerated = (data) => {
  console.log('QR Code regenerated:', data)
  toast.add({
    severity: 'info',
    summary: 'QR Code Updated',
    detail: 'A new QR code has been generated for client access',
    life: 3000
  })
}

const onProjectUpdated = (project) => {
  showEditProject.value = false
  loadProject()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Project updated successfully',
    life: 3000
  })
}

const onFilesUploaded = (files) => {
  showFileUpload.value = false
  loadProject()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${files.length} file(s) uploaded successfully`,
    life: 3000
  })
}

const previewFile = (file) => {
  selectedFile.value = file
  showFilePreview.value = true
}

const downloadFile = async (file) => {
  try {
    await filesStore.downloadFile(file.id, file.original_name)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to download file',
      life: 3000
    })
  }
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getEmployeeInitials = (employee) => {
  return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
}

const formatRole = (role) => {
  const roleMap = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    employee: 'Employee'
  }
  return roleMap[role] || role
}

const calculateDuration = () => {
  if (!currentProject.value?.start_date || !currentProject.value?.end_date) return 0
  const start = new Date(currentProject.value.start_date)
  const end = new Date(currentProject.value.end_date)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

const getFileIcon = (extension) => {
  const iconMap = {
    pdf: 'pi pi-file-pdf',
    doc: 'pi pi-file-word',
    docx: 'pi pi-file-word',
    xls: 'pi pi-file-excel',
    xlsx: 'pi pi-file-excel',
    jpg: 'pi pi-image',
    jpeg: 'pi pi-image',
    png: 'pi pi-image',
    gif: 'pi pi-image'
  }
  return iconMap[extension?.toLowerCase()] || 'pi pi-file'
}

const isPreviewable = (file) => {
  const previewableTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf']
  return previewableTypes.includes(file.file_extension?.toLowerCase())
}

const isImage = (file) => {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif']
  return imageTypes.includes(file.file_extension?.toLowerCase())
}

const getPreviewUrl = (file) => {
  return filesStore.getPreviewUrl(file)
}

// Watchers
watch(() => props.id, (newId) => {
  if (newId) {
    loadProject()
  }
})

// Lifecycle
onMounted(async () => {
  document.title = 'Project Details - Employee Portal'
  await loadProject()
})
</script>

<style scoped>
.project-detail-view {
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

.project-header {
  margin-top: 1rem;
}

.project-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.project-title h1 {
  margin: 0;
  color: var(--text-color);
  font-size: 2rem;
  font-weight: 600;
}

.project-meta {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.925rem;
}

.meta-item i {
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Content Grid */
.project-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

/* Card Headers */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  color: var(--primary-color);
}

.files-count {
  margin-left: auto;
}

/* Overview Content */
.overview-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.overview-content h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
  display: inline-block;
}

.description p {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.timeline-item label {
  font-weight: 500;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.timeline-item span {
  color: var(--text-color);
  font-weight: 500;
}

.location-details {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.location-details p {
  margin: 0;
  color: var(--text-color);
}

.notes-content {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.notes-content p {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
}

/* Files Table */
.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-item i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.file-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-files .empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Team List */
.team-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.member-avatar {
  background: var(--primary-color) !important;
  flex-shrink: 0;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-info strong {
  color: var(--text-color);
  font-size: 0.925rem;
}

.member-info small {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.no-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  text-align: center;
}

/* Client Information */
.client-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.client-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.client-item label {
  font-weight: 500;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.client-item span,
.client-item a {
  color: var(--text-color);
  font-weight: 500;
  text-decoration: none;
}

.client-item a:hover {
  color: var(--primary-color);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--primary-100);
  color: var(--primary-600);
  border-radius: 50%;
  font-size: 1rem;
  flex-shrink: 0;
}

.activity-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-details p {
  margin: 0;
  color: var(--text-color);
  font-size: 0.925rem;
}

.activity-details small {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
  text-align: center;
  gap: 1rem;
}

/* File Preview */
.file-preview-dialog {
  width: 90vw;
  max-width: 800px;
  height: 80vh;
}

.file-preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-pdf {
  width: 100%;
  height: 600px;
  border: none;
}

.unsupported-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.unsupported-preview i {
  font-size: 3rem;
}

/* QR Code Dialog */
.qr-code-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.qr-code-dialog .p-dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: none;
}

.qr-code-dialog .p-dialog-content {
  padding: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .project-meta {
    gap: 1rem;
  }
  
  .timeline-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .project-content {
    padding: 0 1rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .project-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .qr-code-dialog {
    width: 95vw !important;
    max-width: none !important;
  }
}
</style>