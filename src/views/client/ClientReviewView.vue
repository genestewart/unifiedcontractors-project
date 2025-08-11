<template>
  <ClientReviewLayout>
    <div class="client-review-page">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <Card class="welcome-card">
          <template #content>
            <div class="welcome-content">
              <div class="welcome-icon">
                <i class="pi pi-home"></i>
              </div>
              <h1 class="welcome-title">Welcome to Your Project Review</h1>
              <p class="welcome-description">
                Track your construction project progress, view photos and documents, 
                and provide feedback to your construction team.
              </p>
              
              <div v-if="clientStore.currentProject" class="project-summary">
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Project Type</span>
                    <span class="summary-value">{{ clientStore.currentProject.type || 'Construction Project' }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Start Date</span>
                    <span class="summary-value">{{ formatDate(clientStore.currentProject.start_date) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Progress</span>
                    <div class="progress-container">
                      <ProgressBar 
                        :value="getProjectProgress()"
                        class="progress-bar"
                      />
                      <span class="progress-text">{{ getProjectProgress() }}%</span>
                    </div>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Last Updated</span>
                    <span class="summary-value">{{ formatDate(clientStore.currentProject.updated_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </section>

      <!-- Quick Actions -->
      <section class="actions-section">
        <div class="actions-grid">
          <Card class="action-card" @click="navigateToGallery()">
            <template #content>
              <div class="action-content">
                <div class="action-icon gallery">
                  <i class="pi pi-images"></i>
                </div>
                <h3>View Photos</h3>
                <p>Browse {{ clientStore.imageFiles.length }} project photos</p>
                <Badge 
                  v-if="clientStore.imageFiles.length" 
                  :value="clientStore.imageFiles.length"
                  severity="info"
                  class="action-badge"
                />
              </div>
            </template>
          </Card>

          <Card class="action-card" @click="navigateToDocuments()">
            <template #content>
              <div class="action-content">
                <div class="action-icon documents">
                  <i class="pi pi-file"></i>
                </div>
                <h3>View Documents</h3>
                <p>Access {{ clientStore.documentFiles.length }} project files</p>
                <Badge 
                  v-if="clientStore.documentFiles.length" 
                  :value="clientStore.documentFiles.length"
                  severity="secondary"
                  class="action-badge"
                />
              </div>
            </template>
          </Card>

          <Card class="action-card" @click="navigateToFeedback()">
            <template #content>
              <div class="action-content">
                <div class="action-icon feedback">
                  <i class="pi pi-star"></i>
                </div>
                <h3>Share Feedback</h3>
                <p>Rate your experience and leave comments</p>
              </div>
            </template>
          </Card>
        </div>
      </section>

      <!-- Recent Updates -->
      <section v-if="recentUpdates.length" class="updates-section">
        <h2 class="section-title">
          <i class="pi pi-clock"></i>
          Recent Updates
        </h2>
        
        <div class="updates-list">
          <Card 
            v-for="update in recentUpdates" 
            :key="update.id" 
            class="update-card"
          >
            <template #content>
              <div class="update-content">
                <div class="update-header">
                  <div class="update-icon" :class="update.type">
                    <i :class="getUpdateIcon(update.type)"></i>
                  </div>
                  <div class="update-info">
                    <h4 class="update-title">{{ update.title }}</h4>
                    <span class="update-date">{{ formatRelativeDate(update.date) }}</span>
                  </div>
                </div>
                <p class="update-description">{{ update.description }}</p>
                
                <!-- Update Images -->
                <div v-if="update.images && update.images.length" class="update-images">
                  <div 
                    v-for="image in update.images.slice(0, 3)" 
                    :key="image.id"
                    class="update-image"
                    @click="viewImage(image)"
                  >
                    <img 
                      :src="clientStore.getThumbnailUrl(image, 'small')" 
                      :alt="image.filename"
                      loading="lazy"
                    />
                  </div>
                  <div 
                    v-if="update.images.length > 3" 
                    class="more-images"
                    @click="navigateToGallery()"
                  >
                    <span>+{{ update.images.length - 3 }} more</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </section>

      <!-- Project Progress Timeline -->
      <section v-if="milestones.length" class="timeline-section">
        <h2 class="section-title">
          <i class="pi pi-calendar"></i>
          Project Timeline
        </h2>
        
        <div class="timeline">
          <div 
            v-for="(milestone, index) in milestones" 
            :key="index"
            class="timeline-item"
            :class="{ 
              'completed': milestone.completed, 
              'current': milestone.current,
              'future': !milestone.completed && !milestone.current 
            }"
          >
            <div class="timeline-marker">
              <i :class="getMilestoneIcon(milestone)"></i>
            </div>
            <div class="timeline-content">
              <h4 class="timeline-title">{{ milestone.title }}</h4>
              <p class="timeline-description">{{ milestone.description }}</p>
              <span class="timeline-date">{{ formatDate(milestone.date) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- File Categories Overview -->
      <section v-if="clientStore.fileCategories.length" class="categories-section">
        <h2 class="section-title">
          <i class="pi pi-folder"></i>
          File Categories
        </h2>
        
        <div class="categories-grid">
          <Card 
            v-for="category in clientStore.fileCategories" 
            :key="category.name"
            class="category-card"
            @click="navigateToCategory(category.name)"
          >
            <template #content>
              <div class="category-content">
                <div class="category-icon">
                  <i :class="category.icon"></i>
                </div>
                <h4 class="category-name">{{ category.label }}</h4>
                <span class="category-count">{{ category.count }} files</span>
                
                <!-- Preview Images -->
                <div v-if="getCategoryPreview(category).length" class="category-preview">
                  <div 
                    v-for="file in getCategoryPreview(category)" 
                    :key="file.id"
                    class="preview-image"
                  >
                    <img 
                      :src="clientStore.getThumbnailUrl(file, 'small')" 
                      :alt="file.filename"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact-section">
        <Card class="contact-card">
          <template #content>
            <div class="contact-content">
              <div class="contact-icon">
                <i class="pi pi-phone"></i>
              </div>
              <div class="contact-info">
                <h3>Have Questions?</h3>
                <p>Contact your project team anytime for updates or concerns.</p>
                <div class="contact-methods">
                  <a href="tel:+1-435-555-0123" class="contact-method">
                    <i class="pi pi-phone"></i>
                    <span>Call Us</span>
                  </a>
                  <a href="mailto:info@unifiedcontractors.com" class="contact-method">
                    <i class="pi pi-envelope"></i>
                    <span>Email Us</span>
                  </a>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </section>
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
          <span>{{ selectedImage?.filename }}</span>
        </div>
      </template>

      <div v-if="selectedImage" class="image-viewer">
        <img 
          :src="clientStore.getFileUrl(selectedImage)" 
          :alt="selectedImage.filename"
          class="viewer-image"
        />
      </div>

      <template #footer>
        <div class="viewer-actions">
          <Button
            label="Download"
            icon="pi pi-download"
            @click="downloadImage"
            severity="secondary"
          />
          <Button
            label="Close"
            @click="showImageViewer = false"
          />
        </div>
      </template>
    </Dialog>
  </ClientReviewLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '@/stores/client'
import ClientReviewLayout from '@/components/layout/ClientReviewLayout.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import ProgressBar from 'primevue/progressbar'

const props = defineProps({
  token: {
    type: String,
    required: true
  }
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const clientStore = useClientStore()

// Reactive state
const showImageViewer = ref(false)
const selectedImage = ref(null)

// Computed properties
const recentUpdates = computed(() => {
  // Generate recent updates from project files and data
  if (!clientStore.projectFiles.length) return []
  
  // Group files by creation date and create updates
  const updates = []
  const recentFiles = clientStore.projectFiles
    .filter(file => {
      const fileDate = new Date(file.created_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return fileDate > weekAgo
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  // Group by date
  const groupedByDate = {}
  recentFiles.forEach(file => {
    const date = new Date(file.created_at).toDateString()
    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }
    groupedByDate[date].push(file)
  })
  
  // Create update objects
  Object.entries(groupedByDate).forEach(([date, files]) => {
    updates.push({
      id: date,
      type: files[0].category || 'general',
      title: `${files.length} new ${files[0].category === 'progress' ? 'progress photos' : 'files'} added`,
      description: `Recent project updates with ${files.length} new files`,
      date: new Date(date),
      images: files.filter(f => f.mime_type?.startsWith('image/'))
    })
  })
  
  return updates.slice(0, 3)
})

const milestones = computed(() => {
  if (!clientStore.currentProject) return []
  
  // Generate typical construction milestones based on project status
  const projectStart = new Date(clientStore.currentProject.start_date)
  const now = new Date()
  
  return [
    {
      title: 'Project Started',
      description: 'Initial planning and preparation phase',
      date: projectStart,
      completed: true,
      current: false
    },
    {
      title: 'Foundation Work',
      description: 'Site preparation and foundation installation',
      date: new Date(projectStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      completed: clientStore.currentProject.status !== 'planning',
      current: clientStore.currentProject.status === 'in_progress' && getProjectProgress() < 30
    },
    {
      title: 'Structural Phase',
      description: 'Framing and structural components',
      date: new Date(projectStart.getTime() + 21 * 24 * 60 * 60 * 1000),
      completed: getProjectProgress() >= 50,
      current: clientStore.currentProject.status === 'in_progress' && getProjectProgress() >= 30 && getProjectProgress() < 70
    },
    {
      title: 'Finishing Phase',
      description: 'Interior and exterior finishing work',
      date: new Date(projectStart.getTime() + 45 * 24 * 60 * 60 * 1000),
      completed: getProjectProgress() >= 80,
      current: clientStore.currentProject.status === 'in_progress' && getProjectProgress() >= 70
    },
    {
      title: 'Project Completion',
      description: 'Final inspections and handover',
      date: clientStore.currentProject.end_date ? new Date(clientStore.currentProject.end_date) : new Date(projectStart.getTime() + 60 * 24 * 60 * 60 * 1000),
      completed: clientStore.currentProject.status === 'completed',
      current: false
    }
  ]
})

// Methods
const getProjectProgress = () => {
  if (!clientStore.currentProject) return 0
  
  const status = clientStore.currentProject.status
  const progressMap = {
    'planning': 10,
    'in_progress': 60,
    'on_hold': 45,
    'completed': 100,
    'cancelled': 0
  }
  
  return progressMap[status] || 0
}

const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatRelativeDate = (date) => {
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return formatDate(date.toISOString())
}

const getUpdateIcon = (type) => {
  const icons = {
    'progress': 'pi-camera',
    'documents': 'pi-file-pdf',
    'general': 'pi-info-circle',
    'materials': 'pi-box',
    'permits': 'pi-verified'
  }
  return icons[type] || 'pi-circle'
}

const getMilestoneIcon = (milestone) => {
  if (milestone.completed) return 'pi-check-circle'
  if (milestone.current) return 'pi-cog'
  return 'pi-circle'
}

const getCategoryPreview = (category) => {
  return category.files
    .filter(f => f.mime_type?.startsWith('image/'))
    .slice(0, 3)
}

const navigateToGallery = (category = null) => {
  router.push({ 
    name: 'client-gallery', 
    params: { 
      token: props.token,
      ...(category && { category })
    }
  })
}

const navigateToDocuments = () => {
  navigateToGallery('documents')
}

const navigateToCategory = (categoryName) => {
  navigateToGallery(categoryName)
}

const navigateToFeedback = () => {
  router.push({ 
    name: 'client-feedback', 
    params: { token: props.token }
  })
}

const viewImage = (image) => {
  selectedImage.value = image
  showImageViewer.value = true
}

const downloadImage = async () => {
  if (!selectedImage.value) return
  
  try {
    await clientStore.downloadFile(selectedImage.value)
    toast.add({
      severity: 'success',
      summary: 'Download Started',
      detail: 'Image download initiated',
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

// Lifecycle
onMounted(async () => {
  // Validate token and load project data
  if (props.token) {
    const isValid = await clientStore.validateToken(props.token)
    if (isValid) {
      await clientStore.loadProjectData()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Invalid Access',
        detail: 'This link has expired or is invalid',
        life: 5000
      })
      // Could redirect to help page
      setTimeout(() => {
        router.push({ name: 'client-help' })
      }, 3000)
    }
  }
})
</script>

<style scoped>
.client-review-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 1rem;
}

.welcome-card {
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.welcome-content {
  text-align: center;
  padding: 2rem 1rem;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.welcome-description {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.95;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.project-summary {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.summary-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.summary-label {
  font-size: 0.875rem;
  opacity: 0.8;
  font-weight: 500;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
}

.progress-text {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Actions Section */
.actions-section {
  margin: 2rem 0;
}

.actions-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.action-content {
  text-align: center;
  padding: 2rem 1rem;
  position: relative;
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.action-icon.gallery {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.action-icon.documents {
  background: linear-gradient(135deg, #059669, #0891b2);
  color: white;
}

.action-icon.feedback {
  background: linear-gradient(135deg, #dc2626, #ea580c);
  color: white;
}

.action-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.action-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.action-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* Updates Section */
.updates-section, .timeline-section, .categories-section, .contact-section {
  margin: 2rem 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.update-card {
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.update-content {
  padding: 0.5rem;
}

.update-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.update-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

.update-icon.progress { background: #3b82f6; }
.update-icon.documents { background: #059669; }
.update-icon.general { background: #6b7280; }
.update-icon.materials { background: #f59e0b; }
.update-icon.permits { background: #8b5cf6; }

.update-info {
  flex: 1;
}

.update-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #1e293b;
}

.update-date {
  font-size: 0.875rem;
  color: #64748b;
}

.update-description {
  color: #475569;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.update-images {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.update-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.update-image:hover {
  transform: scale(1.05);
}

.update-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-images {
  width: 60px;
  height: 60px;
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

/* Timeline Section */
.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-item.completed .timeline-marker {
  background: #22c55e;
  color: white;
}

.timeline-item.current .timeline-marker {
  background: #3b82f6;
  color: white;
  animation: pulse 2s infinite;
}

.timeline-item.future .timeline-marker {
  background: #e2e8f0;
  color: #94a3b8;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.timeline-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.timeline-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.timeline-description {
  color: #64748b;
  margin: 0 0 0.75rem 0;
  line-height: 1.6;
}

.timeline-date {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Categories Section */
.categories-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.category-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  text-align: center;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.category-content {
  padding: 1.5rem 1rem;
}

.category-icon {
  font-size: 2.5rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.category-count {
  font-size: 0.875rem;
  color: #64748b;
  display: block;
  margin-bottom: 1rem;
}

.category-preview {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.preview-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Contact Section */
.contact-card {
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.contact-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
}

.contact-icon {
  font-size: 2.5rem;
  color: #3b82f6;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
}

.contact-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.contact-info p {
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.contact-methods {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  color: #3b82f6;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid #dbeafe;
}

.contact-method:hover {
  background: #3b82f6;
  color: white;
  transform: translateY(-1px);
}

/* Image Viewer */
.image-viewer-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.viewer-header {
  font-weight: 600;
  color: #1e293b;
}

.image-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
  background: #000;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.viewer-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .client-review-page {
    gap: 1.5rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-description {
    font-size: 1rem;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-content {
    padding: 1.5rem 1rem;
  }

  .action-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .contact-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .contact-methods {
    justify-content: center;
  }

  .timeline {
    padding-left: 1.5rem;
  }

  .timeline-marker {
    left: -1.5rem;
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .update-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .update-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .contact-methods {
    flex-direction: column;
    align-items: center;
  }

  .contact-method {
    width: 100%;
    justify-content: center;
    max-width: 200px;
  }
}
</style>