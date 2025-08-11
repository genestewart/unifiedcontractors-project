<template>
  <ClientReviewLayout>
    <div class="client-gallery-page">
      <!-- Gallery Header -->
      <div class="gallery-header">
        <div class="header-content">
          <div class="header-info">
            <h1 class="gallery-title">
              <i :class="currentCategoryIcon"></i>
              {{ currentCategoryLabel }}
            </h1>
            <p class="gallery-description">
              {{ filteredFiles.length }} {{ filteredFiles.length === 1 ? 'item' : 'items' }} 
              in {{ currentCategoryLabel.toLowerCase() }}
            </p>
          </div>
          
          <div class="header-actions">
            <Dropdown
              v-model="selectedCategory"
              :options="categoryOptions"
              option-label="label"
              option-value="value"
              placeholder="All Categories"
              @change="onCategoryChange"
              class="category-dropdown"
            />
            
            <Button
              :icon="viewMode === 'grid' ? 'pi pi-list' : 'pi pi-th-large'"
              @click="toggleViewMode"
              severity="secondary"
              size="small"
              v-tooltip="viewMode === 'grid' ? 'List View' : 'Grid View'"
            />
          </div>
        </div>
      </div>

      <!-- Gallery Content -->
      <div class="gallery-content">
        <!-- Loading State -->
        <div v-if="clientStore.loading" class="loading-state">
          <ProgressSpinner size="60px" />
          <h3>Loading Files...</h3>
        </div>

        <!-- Empty State -->
        <div v-else-if="!filteredFiles.length" class="empty-state">
          <div class="empty-icon">
            <i class="pi pi-images"></i>
          </div>
          <h3>No Files Found</h3>
          <p>There are no files in this category yet.</p>
          <Button
            label="View All Files"
            @click="viewAllFiles"
            severity="secondary"
          />
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" class="gallery-grid">
          <div
            v-for="(file, index) in filteredFiles"
            :key="file.id"
            class="gallery-item"
            :class="{ 'image-item': isImage(file), 'document-item': !isImage(file) }"
            @click="openFile(file, index)"
          >
            <!-- Image Thumbnail -->
            <div v-if="isImage(file)" class="item-thumbnail">
              <img
                :src="clientStore.getThumbnailUrl(file, 'medium')"
                :alt="file.filename"
                loading="lazy"
                @error="handleImageError"
              />
              <div class="item-overlay">
                <div class="overlay-actions">
                  <Button
                    icon="pi pi-eye"
                    rounded
                    size="small"
                    severity="info"
                    v-tooltip="'View'"
                  />
                  <Button
                    icon="pi pi-download"
                    rounded
                    size="small"
                    severity="secondary"
                    @click.stop="downloadFile(file)"
                    v-tooltip="'Download'"
                  />
                </div>
              </div>
            </div>

            <!-- Document Preview -->
            <div v-else class="item-document">
              <div class="document-icon">
                <img
                  :src="clientStore.getFileTypeIcon(file.filename)"
                  :alt="getFileExtension(file.filename)"
                  @error="handleIconError"
                />
              </div>
              <div class="document-overlay">
                <Button
                  icon="pi pi-eye"
                  rounded
                  size="small"
                  severity="info"
                  v-tooltip="'View'"
                />
              </div>
            </div>

            <!-- Item Info -->
            <div class="item-info">
              <h4 class="item-title">{{ getDisplayName(file.filename) }}</h4>
              <div class="item-meta">
                <span class="item-date">{{ clientStore.formatDate(file.created_at) }}</span>
                <span class="item-size">{{ clientStore.getFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="gallery-list">
          <div
            v-for="(file, index) in filteredFiles"
            :key="file.id"
            class="list-item"
            @click="openFile(file, index)"
          >
            <div class="list-icon">
              <img
                v-if="!isImage(file)"
                :src="clientStore.getFileTypeIcon(file.filename)"
                :alt="getFileExtension(file.filename)"
                @error="handleIconError"
              />
              <img
                v-else
                :src="clientStore.getThumbnailUrl(file, 'small')"
                :alt="file.filename"
                loading="lazy"
                @error="handleImageError"
              />
            </div>
            
            <div class="list-content">
              <h4 class="list-title">{{ getDisplayName(file.filename) }}</h4>
              <div class="list-meta">
                <span class="meta-item">
                  <i class="pi pi-calendar"></i>
                  {{ clientStore.formatDate(file.created_at) }}
                </span>
                <span class="meta-item">
                  <i class="pi pi-file"></i>
                  {{ clientStore.getFileSize(file.size) }}
                </span>
                <span v-if="file.category" class="meta-item">
                  <i class="pi pi-tag"></i>
                  {{ clientStore.getCategoryLabel(file.category) }}
                </span>
              </div>
              <p v-if="file.description" class="list-description">
                {{ file.description }}
              </p>
            </div>
            
            <div class="list-actions">
              <Button
                icon="pi pi-eye"
                size="small"
                severity="info"
                text
                v-tooltip="'View'"
              />
              <Button
                icon="pi pi-download"
                size="small"
                severity="secondary"
                text
                @click.stop="downloadFile(file)"
                v-tooltip="'Download'"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Image Viewer Modal -->
      <Dialog
        v-model:visible="showImageViewer"
        :style="{ width: '95vw', height: '95vh' }"
        modal
        maximizable
        class="image-viewer-dialog"
        :contentStyle="{ padding: 0 }"
      >
        <template #header>
          <div class="viewer-header">
            <span>{{ currentFile?.filename }}</span>
            <div class="viewer-nav">
              <span class="image-counter">{{ currentImageIndex + 1 }} of {{ imageFiles.length }}</span>
            </div>
          </div>
        </template>

        <div v-if="currentFile" class="image-viewer">
          <!-- Navigation Arrows -->
          <Button
            v-if="imageFiles.length > 1"
            icon="pi pi-chevron-left"
            class="nav-button nav-prev"
            @click="previousImage"
            :disabled="currentImageIndex === 0"
            rounded
            size="large"
          />
          
          <!-- Main Image -->
          <div class="image-container" @click="toggleFullscreen">
            <img
              :src="clientStore.getFileUrl(currentFile)"
              :alt="currentFile.filename"
              class="viewer-image"
              @load="handleImageLoad"
              @error="handleImageError"
            />
          </div>
          
          <!-- Navigation Arrows -->
          <Button
            v-if="imageFiles.length > 1"
            icon="pi pi-chevron-right"
            class="nav-button nav-next"
            @click="nextImage"
            :disabled="currentImageIndex === imageFiles.length - 1"
            rounded
            size="large"
          />
        </div>

        <template #footer>
          <div class="viewer-actions">
            <Button
              label="Download"
              icon="pi pi-download"
              @click="downloadCurrentFile"
              severity="secondary"
            />
            <Button
              v-if="imageFiles.length > 1"
              label="Slideshow"
              icon="pi pi-play"
              @click="startSlideshow"
              severity="info"
              :disabled="slideshowActive"
            />
            <Button
              label="Close"
              @click="closeViewer"
            />
          </div>
        </template>
      </Dialog>

      <!-- Document Viewer Modal -->
      <Dialog
        v-model:visible="showDocumentViewer"
        :style="{ width: '95vw', height: '95vh' }"
        modal
        maximizable
        class="document-viewer-dialog"
        :contentStyle="{ padding: 0 }"
      >
        <template #header>
          <div class="viewer-header">
            <span>{{ currentFile?.filename }}</span>
          </div>
        </template>

        <div v-if="currentFile" class="document-viewer">
          <!-- PDF Viewer -->
          <iframe
            v-if="isPDF(currentFile)"
            :src="clientStore.getFileUrl(currentFile)"
            class="pdf-viewer"
            frameborder="0"
          ></iframe>
          
          <!-- Other Document Types -->
          <div v-else class="document-preview">
            <div class="preview-icon">
              <img
                :src="clientStore.getFileTypeIcon(currentFile.filename)"
                :alt="getFileExtension(currentFile.filename)"
              />
            </div>
            <h3>{{ currentFile.filename }}</h3>
            <p>{{ clientStore.getFileSize(currentFile.size) }}</p>
            <p>Click download to view this file type</p>
          </div>
        </div>

        <template #footer>
          <div class="viewer-actions">
            <Button
              label="Download"
              icon="pi pi-download"
              @click="downloadCurrentFile"
              severity="secondary"
            />
            <Button
              label="Close"
              @click="showDocumentViewer = false"
            />
          </div>
        </template>
      </Dialog>
    </div>
  </ClientReviewLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '@/stores/client'
import ClientReviewLayout from '@/components/layout/ClientReviewLayout.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  token: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: null
  }
})

const route = useRoute()
const toast = useToast()
const clientStore = useClientStore()

// Reactive state
const viewMode = ref('grid') // 'grid' or 'list'
const selectedCategory = ref(props.category || 'all')
const showImageViewer = ref(false)
const showDocumentViewer = ref(false)
const currentFile = ref(null)
const currentImageIndex = ref(0)
const slideshowActive = ref(false)
const slideshowInterval = ref(null)

// Computed properties
const categoryOptions = computed(() => {
  const options = [
    { label: 'All Files', value: 'all' }
  ]
  
  clientStore.fileCategories.forEach(category => {
    options.push({
      label: category.label,
      value: category.name
    })
  })
  
  return options
})

const currentCategoryLabel = computed(() => {
  if (selectedCategory.value === 'all') return 'All Files'
  
  const category = clientStore.fileCategories.find(c => c.name === selectedCategory.value)
  return category?.label || 'Files'
})

const currentCategoryIcon = computed(() => {
  if (selectedCategory.value === 'all') return 'pi pi-folder'
  
  const category = clientStore.fileCategories.find(c => c.name === selectedCategory.value)
  return category?.icon || 'pi pi-file'
})

const filteredFiles = computed(() => {
  if (selectedCategory.value === 'all') {
    return clientStore.projectFiles
  }
  
  return clientStore.projectFiles.filter(file => 
    file.category === selectedCategory.value
  )
})

const imageFiles = computed(() => {
  return filteredFiles.value.filter(file => isImage(file))
})

// Methods
const isImage = (file) => {
  return file.mime_type?.startsWith('image/') || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.filename)
}

const isPDF = (file) => {
  return file.mime_type === 'application/pdf' || 
         file.filename.toLowerCase().endsWith('.pdf')
}

const getFileExtension = (filename) => {
  return filename.split('.').pop().toUpperCase()
}

const getDisplayName = (filename) => {
  // Remove file extension and format nicely
  const name = filename.replace(/\.[^/.]+$/, '')
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const onCategoryChange = () => {
  // Reset viewer state when category changes
  closeViewer()
}

const viewAllFiles = () => {
  selectedCategory.value = 'all'
}

const openFile = (file, index) => {
  currentFile.value = file
  
  if (isImage(file)) {
    // Find index in image files array for navigation
    currentImageIndex.value = imageFiles.value.findIndex(img => img.id === file.id)
    showImageViewer.value = true
  } else {
    showDocumentViewer.value = true
  }
}

const closeViewer = () => {
  showImageViewer.value = false
  showDocumentViewer.value = false
  currentFile.value = null
  stopSlideshow()
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentFile.value = imageFiles.value[currentImageIndex.value]
  }
}

const nextImage = () => {
  if (currentImageIndex.value < imageFiles.value.length - 1) {
    currentImageIndex.value++
    currentFile.value = imageFiles.value[currentImageIndex.value]
  }
}

const startSlideshow = () => {
  if (imageFiles.value.length <= 1) return
  
  slideshowActive.value = true
  slideshowInterval.value = setInterval(() => {
    if (currentImageIndex.value < imageFiles.value.length - 1) {
      nextImage()
    } else {
      currentImageIndex.value = 0
      currentFile.value = imageFiles.value[0]
    }
  }, 3000)
  
  toast.add({
    severity: 'info',
    summary: 'Slideshow Started',
    detail: 'Images will change every 3 seconds',
    life: 2000
  })
}

const stopSlideshow = () => {
  if (slideshowInterval.value) {
    clearInterval(slideshowInterval.value)
    slideshowInterval.value = null
    slideshowActive.value = false
  }
}

const toggleFullscreen = () => {
  const element = document.documentElement
  
  if (!document.fullscreenElement) {
    element.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const downloadFile = async (file) => {
  try {
    await clientStore.downloadFile(file)
    toast.add({
      severity: 'success',
      summary: 'Download Started',
      detail: `${file.filename} download initiated`,
      life: 2000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: err.message,
      life: 3000
    })
  }
}

const downloadCurrentFile = async () => {
  if (currentFile.value) {
    await downloadFile(currentFile.value)
  }
}

const handleImageLoad = () => {
  // Image loaded successfully
}

const handleImageError = (event) => {
  // Replace with a simple colored placeholder
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjFmNWY5Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iNjAiIHI9IjIwIiBmaWxsPSIjY2JkNWUxIi8+PHRleHQgeD0iNTAlIiB5PSI4MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1zaXplPSIxMiI+SW1hZ2U8L3RleHQ+PC9zdmc+'
}

const handleIconError = (event) => {
  // Replace with a generic file icon placeholder
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjOTRhM2I4IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI4Ij5GSUxFPC90ZXh0Pjwvc3ZnPg=='
}

// Touch/swipe handling for mobile
let touchStartX = 0
let touchStartY = 0

const handleTouchStart = (event) => {
  touchStartX = event.touches[0].clientX
  touchStartY = event.touches[0].clientY
}

const handleTouchEnd = (event) => {
  if (!showImageViewer.value || imageFiles.value.length <= 1) return
  
  const touchEndX = event.changedTouches[0].clientX
  const touchEndY = event.changedTouches[0].clientY
  
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY
  
  // Only handle horizontal swipes (ignore if too much vertical movement)
  if (Math.abs(deltaY) > Math.abs(deltaX)) return
  
  const minSwipeDistance = 50
  
  if (deltaX > minSwipeDistance) {
    // Swipe right - previous image
    previousImage()
  } else if (deltaX < -minSwipeDistance) {
    // Swipe left - next image
    nextImage()
  }
}

// Keyboard navigation
const handleKeyDown = (event) => {
  if (!showImageViewer.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      previousImage()
      break
    case 'ArrowRight':
      nextImage()
      break
    case 'Escape':
      closeViewer()
      break
    case ' ':
      event.preventDefault()
      if (slideshowActive.value) {
        stopSlideshow()
      } else {
        startSlideshow()
      }
      break
  }
}

// Lifecycle
onMounted(() => {
  // Add event listeners for touch and keyboard navigation
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // Clean up event listeners and slideshow
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('keydown', handleKeyDown)
  stopSlideshow()
})

// Watch for category prop changes
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    selectedCategory.value = newCategory
  }
}, { immediate: true })
</script>

<style scoped>
.client-gallery-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

/* Gallery Header */
.gallery-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-info {
  flex: 1;
}

.gallery-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.gallery-description {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-dropdown {
  min-width: 200px;
}

/* Gallery Content */
.gallery-content {
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  color: #64748b;
  text-align: center;
}

.loading-state h3 {
  margin: 1rem 0 0 0;
  color: #1e293b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

/* Grid View */
.gallery-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.gallery-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.item-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover .item-thumbnail img {
  transform: scale(1.05);
}

.item-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .item-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 0.5rem;
}

.item-document {
  position: relative;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.document-icon img {
  height: 60px;
  width: 60px;
  object-fit: contain;
}

.document-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .document-overlay {
  opacity: 1;
}

.item-info {
  padding: 1rem;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 0.875rem;
}

/* List View */
.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.list-item:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.list-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.list-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.list-description {
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.list-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Image Viewer */
.image-viewer-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  color: #1e293b;
}

.viewer-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.image-counter {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.image-viewer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
  background: #000;
}

.nav-button {
  position: absolute;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9) !important;
  color: #1e293b !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.nav-prev {
  left: 1rem;
}

.nav-next {
  right: 1rem;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.viewer-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Document Viewer */
.document-viewer-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.document-viewer {
  height: 70vh;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

.document-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #64748b;
}

.preview-icon img {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.document-preview h3 {
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .category-dropdown {
    flex: 1;
    min-width: 0;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .list-item {
    flex-direction: column;
    text-align: center;
  }

  .list-meta {
    justify-content: center;
  }

  .list-actions {
    justify-content: center;
  }

  .nav-button {
    display: none; /* Hide navigation arrows on mobile, use swipe instead */
  }

  .viewer-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-counter {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .gallery-item {
    max-width: 100%;
  }

  .list-icon {
    width: 48px;
    height: 48px;
  }

  .meta-item {
    font-size: 0.75rem;
  }

  .viewer-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

/* Touch-friendly improvements */
@media (hover: none) {
  .gallery-item:hover {
    transform: none;
  }
  
  .item-overlay, .document-overlay {
    opacity: 0.3;
  }
  
  .gallery-item:active {
    transform: scale(0.98);
  }
  
  .list-item:active {
    transform: scale(0.99);
  }
}

/* Print styles */
@media print {
  .gallery-header, .viewer-actions {
    display: none !important;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .item-overlay, .document-overlay {
    display: none !important;
  }
}
</style>