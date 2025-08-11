<template>
  <div class="files-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <Breadcrumb :model="breadcrumbItems" />
          <h1>File Management</h1>
          <p>Upload and manage project files</p>
        </div>
        
        <div class="header-actions">
          <Button 
            icon="pi pi-upload" 
            label="Upload Files" 
            @click="showFileUpload = true"
          />
          <Button 
            icon="pi pi-refresh" 
            label="Refresh" 
            @click="refreshFiles"
            :loading="filesStore.loading"
            severity="secondary"
            outlined
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="files-content">
      <!-- File Upload Component -->
      <FileUpload 
        v-model:visible="showFileUpload" 
        @files-uploaded="onFilesUploaded"
      />
      
      <!-- Files DataTable -->
      <Card class="files-card">
        <template #content>
          <DataTable 
            :value="filesStore.files"
            :loading="filesStore.loading"
            :paginator="true"
            :rows="filesStore.pagination.per_page"
            :totalRecords="filesStore.pagination.total"
            :lazy="true"
            @page="handlePageChange"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[10, 20, 50]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            responsiveLayout="scroll"
            class="files-table"
          >
            <!-- File Name -->
            <Column field="original_name" header="File Name" :sortable="true">
              <template #body="{ data }">
                <div class="file-item">
                  <i :class="getFileIcon(data.file_extension)"></i>
                  <div class="file-info">
                    <strong>{{ data.original_name }}</strong>
                    <small v-if="data.description">{{ data.description }}</small>
                  </div>
                </div>
              </template>
            </Column>

            <!-- Project -->
            <Column field="project" header="Project" :sortable="true">
              <template #body="{ data }">
                <div v-if="data.project" class="project-link">
                  <router-link :to="`/employee/projects/${data.project.id}`">
                    {{ data.project.name }}
                  </router-link>
                  <small>{{ data.project.client_name }}</small>
                </div>
                <span v-else class="no-project">No project</span>
              </template>
            </Column>

            <!-- Category -->
            <Column field="category" header="Category" :sortable="true">
              <template #body="{ data }">
                <Badge :value="data.category" severity="secondary" />
              </template>
            </Column>

            <!-- Size -->
            <Column field="file_size" header="Size" :sortable="true">
              <template #body="{ data }">
                {{ formatFileSize(data.file_size) }}
              </template>
            </Column>

            <!-- Upload Date -->
            <Column field="created_at" header="Uploaded" :sortable="true">
              <template #body="{ data }">
                <div class="upload-info">
                  <span>{{ formatDate(data.created_at) }}</span>
                  <small>{{ formatTime(data.created_at) }}</small>
                </div>
              </template>
            </Column>

            <!-- Actions -->
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
                  <Button 
                    icon="pi pi-pencil" 
                    @click="editFile(data)"
                    class="p-button-text p-button-sm"
                    v-tooltip="'Edit'"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    @click="deleteFile(data)"
                    class="p-button-text p-button-sm"
                    severity="danger"
                    v-tooltip="'Delete'"
                    v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              <div class="empty-state">
                <i class="pi pi-file-o empty-icon"></i>
                <h3>No files found</h3>
                <p>Upload your first file to get started.</p>
                <Button 
                  label="Upload Files" 
                  @click="showFileUpload = true"
                />
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import Breadcrumb from 'primevue/breadcrumb'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'

// Custom Components
import FileUpload from '@/components/employee/FileUpload.vue'

// Stores
const authStore = useAuthStore()
const filesStore = useFilesStore()
const toast = useToast()

// Reactive data
const showFileUpload = ref(false)

// Breadcrumb
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', route: '/employee/dashboard' },
  { label: 'Files' }
])

// Methods
const refreshFiles = async () => {
  await filesStore.fetchFiles()
}

const handlePageChange = (event) => {
  filesStore.setPage(event.page + 1)
  filesStore.setPerPage(event.rows)
  refreshFiles()
}

const onFilesUploaded = (files) => {
  showFileUpload.value = false
  refreshFiles()
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: `${files.length} file(s) uploaded successfully`,
    life: 3000
  })
}

const previewFile = (file) => {
  // Implementation for file preview
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

const editFile = (file) => {
  // Implementation for file editing
}

const deleteFile = async (file) => {
  if (confirm(`Are you sure you want to delete ${file.original_name}?`)) {
    try {
      await filesStore.deleteFile(file.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'File deleted successfully',
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete file',
        life: 3000
      })
    }
  }
}

// Utility methods
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
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

// Lifecycle
onMounted(async () => {
  document.title = 'File Management - Employee Portal'
  await refreshFiles()
})
</script>

<style scoped>
.files-view {
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

/* Files Content */
.files-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.files-card {
  margin-bottom: 2rem;
}

/* File Item */
.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-info strong {
  color: var(--text-color);
  font-size: 0.925rem;
}

.file-info small {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

/* Project Link */
.project-link {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.project-link a:hover {
  text-decoration: underline;
}

.project-link small {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.no-project {
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Upload Info */
.upload-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upload-info span {
  color: var(--text-color);
  font-size: 0.925rem;
}

.upload-info small {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

/* File Actions */
.file-actions {
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

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .files-content {
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