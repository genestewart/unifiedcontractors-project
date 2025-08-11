<template>
  <div class="profile-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <Breadcrumb :model="breadcrumbItems" />
          <h1>Profile Settings</h1>
          <p>Manage your profile and account settings</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="profile-content">
      <!-- Profile Overview Card -->
      <Card class="profile-overview">
        <template #content>
          <div class="profile-header">
            <Avatar 
              :label="authStore.employeeInitials" 
              size="xlarge"
              class="user-avatar"
            />
            <div class="profile-info">
              <h2>{{ authStore.employeeFullName }}</h2>
              <p class="user-role">{{ formatRole(authStore.employee?.role) }}</p>
              <p class="user-email">{{ authStore.employee?.email }}</p>
              
              <div class="profile-actions">
                <Button 
                  label="Edit Profile" 
                  icon="pi pi-user-edit"
                  @click="showProfileDialog = true"
                />
                <Button 
                  label="Change Password" 
                  icon="pi pi-key"
                  @click="showPasswordDialog = true"
                  severity="secondary"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Account Information -->
      <Card class="account-info">
        <template #title>
          <div class="card-header">
            <i class="pi pi-info-circle"></i>
            <span>Account Information</span>
          </div>
        </template>
        <template #content>
          <div class="info-grid">
            <div class="info-item">
              <label>Employee ID</label>
              <span>{{ authStore.employee?.id }}</span>
            </div>
            
            <div class="info-item">
              <label>Role</label>
              <Badge 
                :value="formatRole(authStore.employee?.role)" 
                :severity="getRoleSeverity(authStore.employee?.role)"
              />
            </div>
            
            <div class="info-item">
              <label>Status</label>
              <Badge value="Active" severity="success" />
            </div>
            
            <div class="info-item">
              <label>Member Since</label>
              <span>{{ formatDate(authStore.employee?.created_at) }}</span>
            </div>
            
            <div class="info-item" v-if="authStore.employee?.phone">
              <label>Phone</label>
              <span>{{ authStore.employee?.phone }}</span>
            </div>
            
            <div class="info-item" v-if="authStore.employee?.department">
              <label>Department</label>
              <span>{{ authStore.employee?.department }}</span>
            </div>
          </div>
        </template>
      </Card>

      <!-- Security Settings -->
      <Card class="security-settings">
        <template #title>
          <div class="card-header">
            <i class="pi pi-shield"></i>
            <span>Security Settings</span>
          </div>
        </template>
        <template #content>
          <div class="security-content">
            <div class="security-item">
              <div class="security-info">
                <h4>Password</h4>
                <p>Last changed: {{ getPasswordLastChanged() }}</p>
              </div>
              <Button 
                label="Change Password" 
                icon="pi pi-key"
                @click="showPasswordDialog = true"
                outlined
              />
            </div>
            
            <Divider />
            
            <div class="security-item">
              <div class="security-info">
                <h4>Session Management</h4>
                <p>Manage your active sessions and login activity</p>
              </div>
              <Button 
                label="View Sessions" 
                icon="pi pi-clock"
                @click="showSessionInfo"
                outlined
                disabled
              />
            </div>
            
            <Divider />
            
            <div class="security-item">
              <div class="security-info">
                <h4>Account Security</h4>
                <p>Two-factor authentication and security preferences</p>
              </div>
              <Button 
                label="Security Settings" 
                icon="pi pi-cog"
                @click="showSecuritySettings"
                outlined
                disabled
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Activity Summary -->
      <Card class="activity-summary">
        <template #title>
          <div class="card-header">
            <i class="pi pi-chart-bar"></i>
            <span>Activity Summary</span>
          </div>
        </template>
        <template #content>
          <div class="activity-stats">
            <div class="stat-item">
              <div class="stat-icon projects">
                <i class="pi pi-briefcase"></i>
              </div>
              <div class="stat-info">
                <span class="stat-number">{{ userStats.projects || 0 }}</span>
                <span class="stat-label">Projects</span>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon files">
                <i class="pi pi-file"></i>
              </div>
              <div class="stat-info">
                <span class="stat-number">{{ userStats.files || 0 }}</span>
                <span class="stat-label">Files Uploaded</span>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon logins">
                <i class="pi pi-sign-in"></i>
              </div>
              <div class="stat-info">
                <span class="stat-number">{{ userStats.logins || 0 }}</span>
                <span class="stat-label">Logins This Month</span>
              </div>
            </div>
            
            <div class="stat-item">
              <div class="stat-icon last-login">
                <i class="pi pi-clock"></i>
              </div>
              <div class="stat-info">
                <span class="stat-number">{{ getLastLoginTime() }}</span>
                <span class="stat-label">Last Login</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Dialogs -->
    <ProfileDialog 
      v-model:visible="showProfileDialog" 
    />
    
    <PasswordDialog 
      v-model:visible="showPasswordDialog" 
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Breadcrumb from 'primevue/breadcrumb'
import Divider from 'primevue/divider'

// Custom Components
import ProfileDialog from '@/components/employee/ProfileDialog.vue'
import PasswordDialog from '@/components/employee/PasswordDialog.vue'

// Stores
const authStore = useAuthStore()
const toast = useToast()

// Reactive data
const showProfileDialog = ref(false)
const showPasswordDialog = ref(false)

const breadcrumbItems = ref([
  { label: 'Dashboard', icon: 'pi pi-home', route: '/employee/dashboard' },
  { label: 'Profile Settings' }
])

const userStats = reactive({
  projects: 0,
  files: 0,
  logins: 0,
  lastLogin: null
})

// Methods
const formatRole = (role) => {
  const roleMap = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    employee: 'Employee'
  }
  return roleMap[role] || role
}

const getRoleSeverity = (role) => {
  const severityMap = {
    admin: 'danger',
    project_manager: 'warning',
    employee: 'info'
  }
  return severityMap[role] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getPasswordLastChanged = () => {
  // This would typically come from the API
  return 'Unknown'
}

const getLastLoginTime = () => {
  // This would typically come from the API
  return 'Today'
}

const showSessionInfo = () => {
  toast.add({
    severity: 'info',
    summary: 'Coming Soon',
    detail: 'Session management features will be available in a future update',
    life: 3000
  })
}

const showSecuritySettings = () => {
  toast.add({
    severity: 'info',
    summary: 'Coming Soon',
    detail: 'Advanced security settings will be available in a future update',
    life: 3000
  })
}

const loadUserStats = async () => {
  // This would typically fetch from the API
  // For now, using placeholder data
  userStats.projects = 5
  userStats.files = 23
  userStats.logins = 12
  userStats.lastLogin = new Date()
}

// Lifecycle
onMounted(async () => {
  document.title = 'Profile Settings - Employee Portal'
  await loadUserStats()
})
</script>

<style scoped>
.profile-view {
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
  max-width: 1200px;
  margin: 0 auto;
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

/* Profile Content */
.profile-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.profile-overview {
  grid-column: span 2;
}

/* Profile Header */
.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}

.user-avatar {
  background: var(--primary-color) !important;
  color: white !important;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 2rem;
  font-weight: 600;
}

.user-role {
  margin: 0 0 0.25rem 0;
  color: var(--primary-color);
  font-size: 1.1rem;
  font-weight: 500;
}

.user-email {
  margin: 0 0 2rem 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.profile-actions {
  display: flex;
  gap: 1rem;
}

/* Card Headers */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

/* Account Information */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.info-item label {
  font-weight: 500;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-item span {
  color: var(--text-color);
  font-weight: 500;
  font-size: 1rem;
}

/* Security Settings */
.security-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.security-info {
  flex: 1;
}

.security-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.security-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.925rem;
}

/* Activity Summary */
.activity-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.projects {
  background: var(--blue-100);
  color: var(--blue-600);
}

.stat-icon.files {
  background: var(--green-100);
  color: var(--green-600);
}

.stat-icon.logins {
  background: var(--orange-100);
  color: var(--orange-600);
}

.stat-icon.last-login {
  background: var(--purple-100);
  color: var(--purple-600);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .profile-overview {
    grid-column: span 1;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-content {
    padding: 0 1rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
  
  .profile-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .security-item {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 1rem;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style>