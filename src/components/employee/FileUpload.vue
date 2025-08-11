<template>
  <Dialog 
    v-model:visible="visible" 
    header="Upload Files"
    :modal="true" 
    :draggable="false"
    :resizable="false"
    class="file-upload-dialog"
    @hide="resetUpload"
  >
    <div class="file-upload-container">
      <!-- Project Selection -->
      <div class="upload-section">
        <h4>Select Project</h4>
        <Dropdown 
          v-model="selectedProject"
          :options="projectOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Select a project"
          :loading="loadingProjects"
          :invalid="!selectedProject && showErrors"
          class="w-full"
          @change="onProjectChange"
        >
          <template #option="{ option }">
            <div class="project-option">
              <strong>{{ option.name }}</strong>
              <small>{{ option.client_name }}</small>
            </div>
          </template>
        </Dropdown>
        <small v-if="!selectedProject && showErrors" class="p-error">Please select a project</small>
      </div>

      <!-- File Upload Area -->
      <div class="upload-section">
        <h4>Upload Files</h4>
        <FileUpload 
          ref="fileUploadRef"
          :multiple="true"
          :fileLimit="20"
          :maxFileSize="maxFileSize"
          :accept="acceptedFormats"
          :customUpload="true"
          @uploader="handleFileUpload"
          @select="onFileSelect"
          @remove="onFileRemove"
          @error="onUploadError"
          class="custom-file-upload"
        >
          <template #header="{ chooseCallback, clearCallback, files }">
            <div class="upload-header">
              <div class="upload-actions">
                <Button 
                  @click="chooseCallback()" 
                  icon="pi pi-plus" 
                  label="Choose Files"
                  class="p-button-outlined"
                />
                <Button 
                  @click="clearCallback()" 
                  icon="pi pi-times" 
                  label="Clear All"
                  severity="secondary"
                  :disabled="!files || files.length === 0"
                  class="p-button-outlined"
                />
              </div>
              <div class="upload-info">
                <span class="file-count">{{ files?.length || 0 }} file(s) selected</span>
                <small>Max {{ formatFileSize(maxFileSize) }} per file</small>
              </div>
            </div>
          </template>

          <template #content="{ files, removeFileCallback }">
            <div class="upload-content">
              <!-- Drop Area -->
              <div v-if="!files || files.length === 0" class="drop-area">
                <div class="drop-content">
                  <i class="pi pi-cloud-upload drop-icon"></i>
                  <h3>Drop files here or click to browse</h3>
                  <p>Supported formats: Images, PDFs, Documents</p>
                  <p>Maximum file size: {{ formatFileSize(maxFileSize) }}</p>
                </div>
              </div>

              <!-- File List -->
              <div v-if="files && files.length > 0" class="file-list">
                <div 
                  v-for="(file, index) in files" 
                  :key="file.name + file.size"
                  class="file-item"
                >
                  <div class="file-preview">
                    <img 
                      v-if="isImage(file)"
                      :src="getFilePreview(file)"
                      :alt="file.name"
                      class="file-thumbnail"
                    />
                    <div v-else class="file-icon">
                      <i :class="getFileIcon(file.name)"></i>
                    </div>
                  </div>
                  
                  <div class="file-details">
                    <div class="file-info">
                      <strong class="file-name">{{ file.name }}</strong>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                    
                    <div class="file-meta">
                      <div class="file-meta-row">
                        <label>Category:</label>
                        <Dropdown 
                          v-model="fileMetadata[index].category"
                          :options="categoryOptions"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Select category"
                          class="category-dropdown"
                        />
                      </div>
                      
                      <div class="file-meta-row">
                        <label>Description:</label>
                        <InputText 
                          v-model="fileMetadata[index].description"
                          placeholder="File description (optional)"
                          class="description-input"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div class="file-actions">
                    <Button 
                      @click="removeFileCallback(index)"
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      aria-label="Remove file"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #empty>
            <div class="empty-content">
              <i class="pi pi-file-o empty-icon"></i>
              <p>Drag and drop files here or click to browse.</p>
            </div>
          </template>
        </FileUpload>
      </div>

      <!-- Enhanced Upload Progress -->
      <div v-if="uploading" class="upload-section">
        <h4>Upload Progress</h4>
        <div class="upload-progress">
          <div class="progress-header">
            <span>Uploading {{ completedUploads }} of {{ totalFiles }} files</span>
            <div class="progress-stats">
              <span>{{ Math.round(uploadProgress) }}%</span>
              <small v-if="uploadSpeed">{{ uploadSpeed }}</small>
            </div>
          </div>
          <ProgressBar 
            :value="uploadProgress" 
            :showValue="false"
            class="upload-progress-bar"
          />
          
          <!-- Individual file progress -->
          <div v-if="currentUploadItems.length > 0" class="current-uploads">
            <div 
              v-for="item in currentUploadItems" 
              :key="item.id"
              class="current-upload-item"
            >
              <div class="upload-item-header">
                <span class="filename">{{ item.file.name }}</span>
                <div class="upload-actions">
                  <small class="upload-size">{{ formatFileSize(item.uploadedBytes) }} / {{ formatFileSize(item.totalBytes) }}</small>
                  <Button 
                    v-if="item.status === 'uploading'"
                    icon="pi pi-times" 
                    size="small" 
                    severity="danger"
                    text
                    @click="cancelUpload(item.id)"
                  />
                </div>
              </div>
              <div class="upload-item-progress">
                <ProgressBar 
                  :value="item.progress" 
                  :showValue="false"
                  class="small-progress-bar"
                />
                <div class="upload-status">
                  <i :class="getStatusIcon(item.status)"></i>
                  <small>{{ getStatusText(item.status) }}</small>
                  <small v-if="item.compressionRatio < 1" class="compression-info">
                    ({{ Math.round((1 - item.compressionRatio) * 100) }}% compressed)
                  </small>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Overall stats -->
          <div v-if="overallStats" class="upload-stats">
            <small>
              Total: {{ formatFileSize(overallStats.totalBytes) }} • 
              Uploaded: {{ formatFileSize(overallStats.uploadedBytes) }}
              <span v-if="overallStats.compressionSavings > 0">
                • Saved {{ formatFileSize(overallStats.compressionSavings) }} via compression
              </span>
            </small>
          </div>
        </div>
      </div>

      <!-- Upload Results -->
      <div v-if="uploadResults.length > 0" class="upload-section">
        <h4>Upload Results</h4>
        <div class="upload-results">
          <div 
            v-for="result in uploadResults" 
            :key="result.filename"
            class="result-item"
            :class="`result-${result.status}`"
          >
            <i :class="result.status === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
            <div class="result-details">
              <strong>{{ result.filename }}</strong>
              <small>{{ result.message }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Cancel" 
          severity="secondary" 
          @click="visible = false"
          :disabled="uploading"
        />
        <Button 
          label="Upload Files"
          :loading="uploading" 
          @click="startUpload"
          :disabled="!canUpload"
          icon="pi pi-upload"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Dialog from 'primevue/dialog'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: [String, Number],
    default: null
  }
})

// Emits
const emit = defineEmits(['update:visible', 'files-uploaded'])

// Stores
const projectsStore = useProjectsStore()
const filesStore = useFilesStore()
const toast = useToast()

// Refs
const fileUploadRef = ref()
const selectedProject = ref(props.projectId)
const loadingProjects = ref(false)
const projectOptions = ref([])
const selectedFiles = ref([])
const fileMetadata = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const completedUploads = ref(0)
const totalFiles = ref(0)
const currentUploadFile = ref('')
const uploadResults = ref([])
const uploadSpeed = ref('')
const currentUploadItems = ref([])
const overallStats = ref(null)
const uploadStartTime = ref(null)
const showErrors = ref(false)

// Constants
const maxFileSize = 50 * 1024 * 1024 // 50MB
const acceptedFormats = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.dwg,.zip,.rar'

// Computed
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const canUpload = computed(() => {
  return selectedProject.value && 
         selectedFiles.value.length > 0 && 
         !uploading.value
})

const categoryOptions = [
  { label: 'Blueprints', value: 'blueprints' },
  { label: 'Documents', value: 'documents' },
  { label: 'Images', value: 'images' },
  { label: 'Reports', value: 'reports' },
  { label: 'Contracts', value: 'contracts' },
  { label: 'Invoices', value: 'invoices' },
  { label: 'Other', value: 'other' }
]

// Methods
const loadProjects = async () => {
  loadingProjects.value = true
  
  try {
    await projectsStore.fetchProjects({ per_page: 100 })
    projectOptions.value = projectsStore.projects.map(project => ({
      id: project.id,
      name: project.name,
      client_name: project.client_name
    }))
  } catch (error) {
    console.error('Error loading projects:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load projects',
      life: 3000
    })
  } finally {
    loadingProjects.value = false
  }
}

const onProjectChange = () => {
  showErrors.value = false
}

const onFileSelect = (event) => {
  selectedFiles.value = event.files
  
  // Initialize metadata for each file
  fileMetadata.value = event.files.map(file => ({
    category: filesStore.getFileCategory(file.name),
    description: ''
  }))
}

const onFileRemove = (event) => {
  // Update metadata array when files are removed
  const remainingFiles = event.files
  fileMetadata.value = fileMetadata.value.filter((_, index) => 
    index < remainingFiles.length
  )
}

const onUploadError = (event) => {
  toast.add({
    severity: 'error',
    summary: 'Upload Error',
    detail: event.error,
    life: 5000
  })
}

const handleFileUpload = (event) => {
  // This is called by PrimeVue, but we handle upload manually
  // in startUpload method
}

const startUpload = async () => {
  if (!selectedProject.value) {
    showErrors.value = true
    return
  }

  if (selectedFiles.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Files',
      detail: 'Please select files to upload',
      life: 3000
    })
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  completedUploads.value = 0
  totalFiles.value = selectedFiles.value.length
  uploadResults.value = []
  uploadStartTime.value = Date.now()
  currentUploadItems.value = []
  overallStats.value = {
    totalBytes: selectedFiles.value.reduce((sum, file) => sum + file.size, 0),
    uploadedBytes: 0,
    compressionSavings: 0
  }

  try {
    // Prepare file metadata
    const filesWithMetadata = selectedFiles.value.map((file, index) => ({
      file,
      metadata: fileMetadata.value[index]
    }))

    // Use the enhanced filesStore upload method
    const results = await filesStore.uploadFiles(
      selectedFiles.value,
      selectedProject.value,
      {
        category: fileMetadata.value[0]?.category,
        description: fileMetadata.value[0]?.description,
        onProgress: updateUploadProgress
      }
    )

    // Process results
    uploadResults.value = results.map(result => ({
      filename: result.original_filename || result.filename,
      status: 'success',
      message: 'Uploaded successfully'
    }))

    // Add failed uploads from store queue
    const failedUploads = filesStore.uploadQueue.filter(item => item.status === 'error')
    uploadResults.value.push(...failedUploads.map(item => ({
      filename: item.file.name,
      status: 'error',
      message: item.error
    })))

    const successCount = uploadResults.value.filter(r => r.status === 'success').length
    const failCount = uploadResults.value.filter(r => r.status === 'error').length

    if (successCount > 0) {
      toast.add({
        severity: 'success',
        summary: 'Upload Complete',
        detail: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        life: 5000
      })

      emit('files-uploaded', uploadResults.value.filter(r => r.status === 'success'))
    }

  } catch (error) {
    console.error('Upload error:', error)
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: error.message || 'An error occurred during upload',
      life: 5000
    })
  } finally {
    uploading.value = false
    currentUploadFile.value = ''
    uploadSpeed.value = ''
    currentUploadItems.value = []
  }
}

const resetUpload = () => {
  selectedFiles.value = []
  fileMetadata.value = []
  uploadProgress.value = 0
  completedUploads.value = 0
  totalFiles.value = 0
  currentUploadFile.value = ''
  uploadResults.value = []
  uploadSpeed.value = ''
  currentUploadItems.value = []
  overallStats.value = null
  uploadStartTime.value = null
  showErrors.value = false
  
  // Clear upload queue
  filesStore.clearUploadQueue()
  
  if (fileUploadRef.value) {
    fileUploadRef.value.clear()
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const isImage = (file) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return imageTypes.includes(file.type)
}

const getFilePreview = (file) => {
  if (isImage(file)) {
    return URL.createObjectURL(file)
  }
  return null
}

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    pdf: 'pi pi-file-pdf',
    doc: 'pi pi-file-word',
    docx: 'pi pi-file-word',
    xls: 'pi pi-file-excel',
    xlsx: 'pi pi-file-excel',
    txt: 'pi pi-file',
    dwg: 'pi pi-file',
    zip: 'pi pi-file-import',
    rar: 'pi pi-file-import'
  }
  return iconMap[extension] || 'pi pi-file'
}

// Enhanced progress tracking
const updateUploadProgress = () => {
  const queue = filesStore.uploadQueue
  if (queue.length === 0) return

  currentUploadItems.value = queue.filter(item => 
    item.status === 'uploading' || item.status === 'pending'
  )

  const totalProgress = queue.reduce((sum, item) => sum + item.progress, 0)
  uploadProgress.value = totalProgress / queue.length

  const completed = queue.filter(item => item.status === 'completed').length
  completedUploads.value = completed

  // Calculate upload speed
  if (uploadStartTime.value) {
    const elapsed = (Date.now() - uploadStartTime.value) / 1000 // seconds
    const uploadedBytes = queue.reduce((sum, item) => sum + item.uploadedBytes, 0)
    const speed = uploadedBytes / elapsed // bytes per second
    
    if (speed > 0) {
      uploadSpeed.value = formatTransferSpeed(speed)
    }
  }

  // Update overall stats
  if (overallStats.value) {
    overallStats.value.uploadedBytes = queue.reduce((sum, item) => sum + item.uploadedBytes, 0)
    overallStats.value.compressionSavings = queue.reduce((sum, item) => {
      if (item.compressionRatio < 1) {
        const originalSize = item.totalBytes / item.compressionRatio
        return sum + (originalSize - item.totalBytes)
      }
      return sum
    }, 0)
  }
}

const formatTransferSpeed = (bytesPerSecond) => {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }
}

const getStatusIcon = (status) => {
  const iconMap = {
    pending: 'pi pi-clock',
    uploading: 'pi pi-spinner pi-spin',
    completed: 'pi pi-check-circle',
    error: 'pi pi-times-circle',
    cancelled: 'pi pi-ban'
  }
  return iconMap[status] || 'pi pi-question-circle'
}

const getStatusText = (status) => {
  const textMap = {
    pending: 'Pending',
    uploading: 'Uploading',
    completed: 'Complete',
    error: 'Failed',
    cancelled: 'Cancelled'
  }
  return textMap[status] || 'Unknown'
}

const cancelUpload = (uploadId) => {
  filesStore.cancelUpload(uploadId)
  toast.add({
    severity: 'info',
    summary: 'Upload Cancelled',
    detail: 'File upload has been cancelled',
    life: 3000
  })
}

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    loadProjects()
    selectedProject.value = props.projectId
    resetUpload()
    
    // Start progress monitoring
    const progressInterval = setInterval(updateUploadProgress, 500)
    
    // Cleanup interval when dialog closes
    const unwatch = watch(() => props.visible, (visible) => {
      if (!visible) {
        clearInterval(progressInterval)
        unwatch()
      }
    })
  }
})

watch(() => filesStore.uploadQueue, () => {
  updateUploadProgress()
}, { deep: true })

watch(() => props.projectId, (newValue) => {
  selectedProject.value = newValue
})

// Lifecycle
onMounted(() => {
  if (props.visible) {
    loadProjects()
  }
})
</script>

<style scoped>
.file-upload-dialog {
  width: 95vw;
  max-width: 1000px;
  max-height: 90vh;
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-section h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-section h4::before {
  content: '';
  width: 4px;
  height: 1.2rem;
  background: var(--primary-color);
  border-radius: 2px;
}

.project-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-option strong {
  color: var(--text-color);
}

.project-option small {
  color: var(--text-color-secondary);
}

/* File Upload Customization */
.custom-file-upload {
  border: 2px dashed var(--surface-border);
  border-radius: 12px;
  background: var(--surface-50);
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.upload-actions {
  display: flex;
  gap: 0.5rem;
}

.upload-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.file-count {
  font-weight: 500;
  color: var(--text-color);
}

.upload-info small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* Drop Area */
.drop-area {
  padding: 3rem 2rem;
  text-align: center;
  border-radius: 8px;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.drop-icon {
  font-size: 4rem;
  color: var(--primary-color);
  opacity: 0.7;
}

.drop-content h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 500;
}

.drop-content p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

/* File List */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: var(--primary-200);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-preview {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-100);
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 1.5rem;
  color: var(--primary-500);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  color: var(--text-color);
  font-size: 0.875rem;
  word-break: break-word;
}

.file-size {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-meta-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-meta-row label {
  min-width: 80px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.category-dropdown {
  min-width: 150px;
}

.description-input {
  flex: 1;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}

/* Enhanced Upload Progress */
.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.progress-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.upload-progress-bar {
  height: 12px;
  border-radius: 6px;
}

.current-uploads {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.current-upload-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
}

.upload-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filename {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-size {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

.upload-item-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.small-progress-bar {
  height: 6px;
  border-radius: 3px;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.upload-status i {
  flex-shrink: 0;
}

.compression-info {
  color: var(--green-600);
  font-weight: 500;
}

.upload-stats {
  padding: 0.75rem;
  background: var(--surface-100);
  border-radius: 6px;
  text-align: center;
}

.current-upload {
  color: var(--text-color-secondary);
}

/* Upload Results */
.upload-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.result-success {
  background: var(--green-50);
  color: var(--green-700);
}

.result-error {
  background: var(--red-50);
  color: var(--red-700);
}

.result-item i {
  flex-shrink: 0;
  font-size: 1rem;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-details strong {
  font-weight: 500;
}

.result-details small {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Empty Content */
.empty-content {
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-content p {
  margin: 0;
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
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .file-upload-dialog {
    width: 98vw;
    height: 95vh;
    margin: 1rem;
  }
  
  .upload-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .file-item {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .file-meta-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .file-meta-row label {
    min-width: auto;
  }
}
</style>