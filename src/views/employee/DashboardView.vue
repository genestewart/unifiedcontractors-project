<template>
  <div class="dashboard-view">
    <!-- Header with breadcrumb and user info -->
    <div class="dashboard-header">
      <Breadcrumb :model="breadcrumbItems" class="dashboard-breadcrumb" />
      
      <div class="header-actions">
        <div class="user-profile-section">
          <Avatar 
            :label="authStore.employeeInitials" 
            class="user-avatar"
            size="large"
            shape="circle"
          />
          <div class="user-details">
            <span class="user-name">{{ authStore.employeeFullName }}</span>
            <span class="user-role">{{ formatRole(authStore.employee?.role) }}</span>
          </div>
        </div>
        
        <div class="quick-actions">
          <Button 
            icon="pi pi-plus" 
            label="New Project" 
            @click="showNewProject = true"
            v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
            class="p-button-sm"
          />
          <Button 
            icon="pi pi-upload" 
            label="Upload Files" 
            @click="showFileUpload = true"
            class="p-button-sm p-button-secondary"
          />
          <Button 
            icon="pi pi-cog" 
            @click="showUserMenu = !showUserMenu"
            class="p-button-sm p-button-text"
            aria-label="User menu"
          />
        </div>
      </div>
    </div>

    <!-- Main dashboard content -->
    <div class="dashboard-content">
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <Card class="stat-card stat-card-primary">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon">
                <i class="pi pi-briefcase"></i>
              </div>
              <div class="stat-details">
                <h3>{{ projectsStore.statistics.active_projects || 0 }}</h3>
                <p>Active Projects</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card stat-card-success">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-details">
                <h3>{{ projectsStore.statistics.completed_projects || 0 }}</h3>
                <p>Completed</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card stat-card-info">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon">
                <i class="pi pi-file"></i>
              </div>
              <div class="stat-details">
                <h3>{{ filesStore.fileStats.total || 0 }}</h3>
                <p>Total Files</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="stat-card stat-card-warning">
          <template #content>
            <div class="stat-content">
              <div class="stat-icon">
                <i class="pi pi-star"></i>
              </div>
              <div class="stat-details">
                <h3>{{ feedbackStore.statistics.average_rating || '0.0' }}</h3>
                <p>Avg. Rating</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-main">
        <!-- Left Column -->
        <div class="dashboard-left">
          <!-- Recent Projects -->
          <Card class="dashboard-section">
            <template #title>
              <div class="section-header">
                <h3>Recent Projects</h3>
                <Button 
                  label="View All" 
                  class="p-button-text p-button-sm"
                  @click="$router.push('/employee/projects')"
                />
              </div>
            </template>
            <template #content>
              <DataTable 
                :value="recentProjects"
                :loading="projectsStore.loading"
                class="recent-projects-table"
              >
                <Column field="name" header="Project">
                  <template #body="{ data }">
                    <div class="project-info">
                      <strong>{{ data.name }}</strong>
                      <small class="project-client">{{ data.client_name }}</small>
                    </div>
                  </template>
                </Column>
                <Column field="status" header="Status">
                  <template #body="{ data }">
                    <Badge 
                      :value="data.status" 
                      :severity="getStatusSeverity(data.status)"
                    />
                  </template>
                </Column>
                <Column field="updated_at" header="Last Updated">
                  <template #body="{ data }">
                    {{ formatDate(data.updated_at) }}
                  </template>
                </Column>
                <Column>
                  <template #body="{ data }">
                    <Button 
                      icon="pi pi-eye" 
                      class="p-button-text p-button-sm"
                      @click="viewProject(data.id)"
                    />
                  </template>
                </Column>
                
                <template #empty>
                  <div class="empty-state">
                    <i class="pi pi-briefcase"></i>
                    <p>No recent projects</p>
                  </div>
                </template>
              </DataTable>
            </template>
          </Card>

          <!-- File Activity -->
          <Card class="dashboard-section" v-if="authStore.hasAnyRole(['admin', 'project_manager'])">
            <template #title>
              <div class="section-header">
                <h3>Recent File Activity</h3>
                <Button 
                  label="Manage Files" 
                  class="p-button-text p-button-sm"
                  @click="$router.push('/employee/files')"
                />
              </div>
            </template>
            <template #content>
              <div class="file-activity-list">
                <div 
                  v-for="file in recentFiles" 
                  :key="file.id"
                  class="file-activity-item"
                >
                  <div class="file-icon">
                    <i :class="getFileIcon(file.file_extension)"></i>
                  </div>
                  <div class="file-details">
                    <strong>{{ file.original_name }}</strong>
                    <small>{{ file.category }} • {{ formatFileSize(file.file_size) }}</small>
                  </div>
                  <div class="file-date">
                    {{ formatDate(file.created_at) }}
                  </div>
                </div>
                
                <div v-if="!recentFiles.length" class="empty-state">
                  <i class="pi pi-file"></i>
                  <p>No recent files</p>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Right Column -->
        <div class="dashboard-right">
          <!-- Quick Navigation -->
          <Card class="dashboard-section navigation-card">
            <template #title>
              <h3>Quick Navigation</h3>
            </template>
            <template #content>
              <div class="navigation-grid">
                <router-link to="/employee/projects" class="nav-item">
                  <i class="pi pi-briefcase"></i>
                  <span>Projects</span>
                </router-link>
                
                <router-link to="/employee/files" class="nav-item">
                  <i class="pi pi-file"></i>
                  <span>Files</span>
                </router-link>
                
                <router-link to="/employee/feedback" class="nav-item">
                  <i class="pi pi-comment"></i>
                  <span>Feedback</span>
                </router-link>
                
                <router-link 
                  to="/employee/reports" 
                  class="nav-item"
                  v-if="authStore.hasAnyRole(['admin', 'project_manager'])"
                >
                  <i class="pi pi-chart-bar"></i>
                  <span>Reports</span>
                </router-link>
              </div>
            </template>
          </Card>

          <!-- Pending Feedback -->
          <Card class="dashboard-section" v-if="authStore.hasAnyRole(['admin', 'project_manager'])">
            <template #title>
              <div class="section-header">
                <h3>Pending Feedback</h3>
                <Badge 
                  :value="pendingFeedbackCount" 
                  severity="warning"
                  v-if="pendingFeedbackCount > 0"
                />
              </div>
            </template>
            <template #content>
              <div class="feedback-list">
                <div 
                  v-for="feedback in pendingFeedback" 
                  :key="feedback.id"
                  class="feedback-item"
                >
                  <div class="feedback-rating">
                    <Rating :model-value="feedback.rating" :readonly="true" :cancel="false" />
                  </div>
                  <div class="feedback-details">
                    <strong>{{ feedback.client_name }}</strong>
                    <p>{{ truncateText(feedback.comment, 60) }}</p>
                    <small>{{ feedback.project?.name }}</small>
                  </div>
                  <Button 
                    icon="pi pi-arrow-right" 
                    class="p-button-text p-button-sm"
                    @click="viewFeedback(feedback.id)"
                  />
                </div>
                
                <div v-if="!pendingFeedback.length" class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <p>All feedback reviewed</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- System Notifications -->
          <Card class="dashboard-section notifications-card" v-if="notifications.length">
            <template #title>
              <h3>Notifications</h3>
            </template>
            <template #content>
              <div class="notifications-list">
                <div 
                  v-for="notification in notifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="`notification-${notification.type}`"
                >
                  <div class="notification-icon">
                    <i :class="notification.icon"></i>
                  </div>
                  <div class="notification-content">
                    <p>{{ notification.message }}</p>
                    <small>{{ formatDate(notification.created_at) }}</small>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- User Menu Overlay -->
    <OverlayPanel ref="userMenuOverlay" v-model:visible="showUserMenu" class="user-menu">
      <div class="user-menu-content">
        <div class="user-menu-header">
          <Avatar :label="authStore.employeeInitials" size="large" />
          <div>
            <strong>{{ authStore.employeeFullName }}</strong>
            <p>{{ authStore.employee?.email }}</p>
          </div>
        </div>
        
        <Divider />
        
        <div class="user-menu-items">
          <Button 
            icon="pi pi-user" 
            label="Profile Settings" 
            class="p-button-text user-menu-item"
            @click="showProfileDialog = true; showUserMenu = false"
          />
          <Button 
            icon="pi pi-key" 
            label="Change Password" 
            class="p-button-text user-menu-item"
            @click="showPasswordDialog = true; showUserMenu = false"
          />
          <Button 
            icon="pi pi-sign-out" 
            label="Logout" 
            class="p-button-text user-menu-item logout-btn"
            @click="handleLogout"
            :loading="loading"
          />
        </div>
      </div>
    </OverlayPanel>

    <!-- Dialogs -->
    <ProjectForm 
      v-model:visible="showNewProject" 
      @project-created="onProjectCreated"
    />
    
    <FileUpload 
      v-model:visible="showFileUpload" 
      @files-uploaded="onFilesUploaded"
    />
    
    <ProfileDialog 
      v-model:visible="showProfileDialog" 
    />
    
    <PasswordDialog 
      v-model:visible="showPasswordDialog" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useFilesStore } from '@/stores/files'
import { useFeedbackStore } from '@/stores/feedback'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import Breadcrumb from 'primevue/breadcrumb'
import Avatar from 'primevue/avatar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Badge from 'primevue/badge'
import Rating from 'primevue/rating'
import OverlayPanel from 'primevue/overlaypanel'
import Divider from 'primevue/divider'

// Custom Components (will be created)
import ProjectForm from '@/components/employee/ProjectForm.vue'
import FileUpload from '@/components/employee/FileUpload.vue'
import ProfileDialog from '@/components/employee/ProfileDialog.vue'
import PasswordDialog from '@/components/employee/PasswordDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const filesStore = useFilesStore()
const feedbackStore = useFeedbackStore()
const toast = useToast()

const loading = ref(false)
const showNewProject = ref(false)
const showFileUpload = ref(false)
const showUserMenu = ref(false)
const showProfileDialog = ref(false)
const showPasswordDialog = ref(false)
const userMenuOverlay = ref(null)

// Breadcrumb items
const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home' }
])

// Sample notifications (in real app, these would come from API)
const notifications = ref([
  {
    id: 1,
    type: 'info',
    icon: 'pi pi-info-circle',
    message: 'Welcome to the new dashboard interface!',
    created_at: new Date().toISOString()
  }
])

// Computed properties
const recentProjects = computed(() => {
  return projectsStore.recentProjects.slice(0, 5)
})

const recentFiles = computed(() => {
  return filesStore.files
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
})

const pendingFeedback = computed(() => {
  return feedbackStore.pendingFeedback.slice(0, 3)
})

const pendingFeedbackCount = computed(() => {
  return feedbackStore.pendingFeedback.length
})

// Methods
const handleLogout = async () => {
  loading.value = true
  
  try {
    await authStore.logout()
    toast.add({
      severity: 'success',
      summary: 'Logged Out',
      detail: 'You have been successfully logged out',
      life: 3000
    })
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    toast.add({
      severity: 'error',
      summary: 'Logout Failed',
      detail: 'There was an error logging out',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const formatRole = (role) => {
  const roleMap = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    employee: 'Employee'
  }
  return roleMap[role] || role
}

const formatDate = (dateString) => {
  if (!dateString) return ''
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

const getStatusSeverity = (status) => {
  const severityMap = {
    active: 'success',
    pending: 'warning',
    completed: 'info',
    on_hold: 'secondary'
  }
  return severityMap[status] || 'secondary'
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

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const viewProject = (projectId) => {
  router.push(`/employee/projects/${projectId}`)
}

const viewFeedback = (feedbackId) => {
  router.push(`/employee/feedback/${feedbackId}`)
}

const onProjectCreated = (project) => {
  showNewProject.value = false
  toast.add({
    severity: 'success',
    summary: 'Project Created',
    detail: `Project "${project.name}" has been created successfully`,
    life: 3000
  })
  // Refresh projects data
  loadDashboardData()
}

const onFilesUploaded = (files) => {
  showFileUpload.value = false
  toast.add({
    severity: 'success',
    summary: 'Files Uploaded',
    detail: `${files.length} file(s) uploaded successfully`,
    life: 3000
  })
  // Refresh files data
  loadDashboardData()
}

const loadDashboardData = async () => {
  try {
    // Load data in parallel for better performance
    await Promise.allSettled([
      projectsStore.fetchProjects({ per_page: 10 }),
      projectsStore.fetchStatistics(),
      filesStore.fetchFiles({ per_page: 10 }),
      feedbackStore.fetchFeedback({ per_page: 10 }),
      feedbackStore.fetchStatistics()
    ])
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load dashboard data',
      life: 5000
    })
  }
}

// Auto-refresh data every 5 minutes
let refreshInterval

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadDashboardData()
    }
  }, 5 * 60 * 1000) // 5 minutes
}

onMounted(async () => {
  document.title = 'Employee Dashboard - Project Management'
  await loadDashboardData()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background: var(--surface-ground, #f8f9fa);
}

/* Header Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid var(--surface-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-breadcrumb {
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
}

.user-role {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
}

/* Main Content */
.dashboard-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  font-size: 1.5rem;
}

.stat-card-primary .stat-icon {
  background: var(--primary-50);
  color: var(--primary-500);
}

.stat-card-success .stat-icon {
  background: var(--green-50);
  color: var(--green-500);
}

.stat-card-info .stat-icon {
  background: var(--blue-50);
  color: var(--blue-500);
}

.stat-card-warning .stat-icon {
  background: var(--yellow-50);
  color: var(--yellow-500);
}

.stat-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-details p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

/* Main Dashboard Layout */
.dashboard-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.dashboard-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

/* Recent Projects Table */
.recent-projects-table {
  border: none;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.project-client {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* File Activity */
.file-activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.file-activity-item:hover {
  background: var(--surface-100);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 1.25rem;
  color: var(--primary-500);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-details strong {
  color: var(--text-color);
  font-size: 0.875rem;
}

.file-details small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.file-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Navigation Grid */
.navigation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  text-decoration: none;
  color: var(--text-color);
  background: var(--surface-50);
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.nav-item:hover {
  background: var(--primary-50);
  color: var(--primary-600);
  border-color: var(--primary-200);
  text-decoration: none;
}

.nav-item i {
  font-size: 1.5rem;
}

.nav-item span {
  font-weight: 500;
  font-size: 0.875rem;
}

/* Feedback List */
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.feedback-rating {
  flex-shrink: 0;
}

.feedback-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feedback-details strong {
  color: var(--text-color);
  font-size: 0.875rem;
}

.feedback-details p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
}

.feedback-details small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

/* Notifications */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.notification-info {
  background: var(--blue-50);
  border-left-color: var(--blue-500);
}

.notification-warning {
  background: var(--yellow-50);
  border-left-color: var(--yellow-500);
}

.notification-success {
  background: var(--green-50);
  border-left-color: var(--green-500);
}

.notification-error {
  background: var(--red-50);
  border-left-color: var(--red-500);
}

.notification-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
}

.notification-content p {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-color);
}

.notification-content small {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Empty States */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* User Menu */
.user-menu {
  width: 300px;
}

.user-menu-content {
  padding: 1rem;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-menu-header strong {
  display: block;
  color: var(--text-color);
}

.user-menu-header p {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.user-menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-menu-item {
  justify-content: flex-start !important;
  padding: 0.75rem 1rem !important;
  text-align: left;
  border-radius: 6px !important;
}

.user-menu-item:hover {
  background: var(--surface-hover) !important;
}

.logout-btn:hover {
  background: var(--red-50) !important;
  color: var(--red-600) !important;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-main {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .user-profile-section {
    order: 2;
  }
  
  .quick-actions {
    order: 1;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .user-profile-section {
    gap: 0.5rem;
  }
  
  .user-details {
    display: none;
  }
  
  .quick-actions {
    flex-wrap: wrap;
  }
}
</style>