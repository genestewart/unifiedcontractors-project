<template>
  <div class="client-layout" :class="{ 'offline': !isOnline }">
    <!-- Client Header -->
    <header class="client-header">
      <div class="header-container">
        <div class="header-content">
          <!-- Company Branding -->
          <div class="brand-section">
            <router-link to="/" class="brand-link">
              <div class="brand-logo-placeholder">
                <i class="pi pi-home"></i>
              </div>
              <div class="brand-text">
                <h1 class="brand-name">Unified Contractors</h1>
                <span class="brand-tagline">Premium Construction Services</span>
              </div>
            </router-link>
          </div>

          <!-- Project Info -->
          <div v-if="clientStore.currentProject" class="project-info">
            <div class="project-header">
              <h2 class="project-name">{{ clientStore.currentProject.name }}</h2>
              <div class="project-meta">
                <span class="project-status" :class="`status-${clientStore.currentProject.status}`">
                  <i :class="getStatusIcon(clientStore.currentProject.status)"></i>
                  {{ getStatusLabel(clientStore.currentProject.status) }}
                </span>
                <span class="project-date">
                  Started {{ formatDate(clientStore.currentProject.start_date) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Client Actions -->
          <div class="client-actions">
            <Button
              icon="pi pi-share-alt"
              severity="secondary"
              size="small"
              @click="shareProject"
              v-tooltip.bottom="'Share Project'"
              rounded
              text
            />
            <Button
              icon="pi pi-question-circle"
              severity="info"
              size="small"
              @click="showHelp = true"
              v-tooltip.bottom="'Help'"
              rounded
              text
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation Bar -->
    <nav class="client-nav" v-if="clientStore.currentProject">
      <div class="nav-container">
        <div class="nav-items">
          <router-link 
            :to="{ name: 'client-review', params: { token: $route.params.token }}"
            class="nav-item"
            active-class="active"
            exact-active-class="exact-active"
          >
            <i class="pi pi-home"></i>
            <span>Overview</span>
          </router-link>
          
          <router-link 
            :to="{ name: 'client-gallery', params: { token: $route.params.token }}"
            class="nav-item"
            active-class="active"
          >
            <i class="pi pi-images"></i>
            <span>Gallery</span>
            <Badge 
              v-if="clientStore.imageFiles.length" 
              :value="clientStore.imageFiles.length"
              severity="info"
            />
          </router-link>
          
          <router-link 
            :to="{ name: 'client-gallery', params: { token: $route.params.token, category: 'documents' }}"
            class="nav-item"
            active-class="active"
          >
            <i class="pi pi-file"></i>
            <span>Documents</span>
            <Badge 
              v-if="clientStore.documentFiles.length" 
              :value="clientStore.documentFiles.length"
              severity="secondary"
            />
          </router-link>
          
          <router-link 
            :to="{ name: 'client-feedback', params: { token: $route.params.token }}"
            class="nav-item"
            active-class="active"
          >
            <i class="pi pi-star"></i>
            <span>Feedback</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="client-main">
      <div class="main-container">
        <!-- Offline Banner -->
        <div v-if="!isOnline" class="offline-banner">
          <i class="pi pi-wifi-slash"></i>
          <span>You're offline. Some features may not be available.</span>
        </div>

        <!-- Loading State -->
        <div v-if="clientStore.loading && !clientStore.currentProject" class="loading-state">
          <ProgressSpinner size="60px" />
          <h3>Loading Project...</h3>
          <p>Please wait while we load your project information.</p>
        </div>

        <!-- Error State -->
        <div v-else-if="clientStore.error && !clientStore.currentProject" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Unable to Load Project</h3>
          <p>{{ clientStore.error }}</p>
          <div class="error-actions">
            <Button
              label="Try Again"
              icon="pi pi-refresh"
              @click="retryLoad"
              :loading="clientStore.loading"
            />
            <Button
              label="Get Help"
              icon="pi pi-question-circle"
              severity="secondary"
              @click="showHelp = true"
            />
          </div>
        </div>

        <!-- Main Content Slot -->
        <div v-else class="content-wrapper">
          <slot />
        </div>
      </div>
    </main>

    <!-- Client Footer -->
    <footer class="client-footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>Need Help?</h4>
            <p>Contact us if you have any questions about your project.</p>
            <div class="contact-info">
              <a href="tel:+1-435-555-0123" class="contact-link">
                <i class="pi pi-phone"></i>
                (435) 555-0123
              </a>
              <a href="mailto:info@unifiedcontractors.com" class="contact-link">
                <i class="pi pi-envelope"></i>
                info@unifiedcontractors.com
              </a>
            </div>
          </div>
          
          <div class="footer-section">
            <h4>Secure Access</h4>
            <p>This is a secure project review portal. Your information is protected.</p>
            <div class="security-badges">
              <span class="security-badge">
                <i class="pi pi-lock"></i>
                SSL Encrypted
              </span>
              <span class="security-badge">
                <i class="pi pi-shield"></i>
                Private Access
              </span>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 Unified Contractors. All rights reserved.</p>
          <p class="powered-by">Powered by secure project review technology</p>
        </div>
      </div>
    </footer>

    <!-- Help Dialog -->
    <Dialog
      v-model:visible="showHelp"
      header="How to Use Project Review"
      :style="{ width: '90vw', maxWidth: '600px' }"
      modal
      class="help-dialog"
    >
      <div class="help-content">
        <div class="help-section">
          <h3>
            <i class="pi pi-info-circle"></i>
            About This Portal
          </h3>
          <p>This secure portal allows you to review your construction project progress, view photos and documents, and provide feedback to your construction team.</p>
        </div>

        <div class="help-section">
          <h3>
            <i class="pi pi-eye"></i>
            Viewing Content
          </h3>
          <ul>
            <li><strong>Overview:</strong> See project summary and recent updates</li>
            <li><strong>Gallery:</strong> Browse all project photos with zoom and fullscreen</li>
            <li><strong>Documents:</strong> View plans, permits, and other project files</li>
            <li><strong>Feedback:</strong> Rate your experience and leave comments</li>
          </ul>
        </div>

        <div class="help-section">
          <h3>
            <i class="pi pi-mobile"></i>
            Mobile Tips
          </h3>
          <ul>
            <li>Pinch to zoom on photos</li>
            <li>Swipe left/right to browse images</li>
            <li>Tap and hold to download files</li>
            <li>Use the share button to send project link to family</li>
          </ul>
        </div>

        <div class="help-section">
          <h3>
            <i class="pi pi-shield"></i>
            Privacy & Security
          </h3>
          <p>Your project information is secure and private. Only you and your construction team can access this content using the unique QR code or link provided.</p>
        </div>

        <div class="help-contact">
          <h4>Still Need Help?</h4>
          <p>Contact us directly:</p>
          <div class="contact-buttons">
            <a href="tel:+1-435-555-0123" class="contact-button phone">
              <i class="pi pi-phone"></i>
              Call Us
            </a>
            <a href="mailto:info@unifiedcontractors.com" class="contact-button email">
              <i class="pi pi-envelope"></i>
              Email Us
            </a>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Close" @click="showHelp = false" />
      </template>
    </Dialog>

    <!-- Share Dialog -->
    <Dialog
      v-model:visible="showShare"
      header="Share Project"
      :style="{ width: '90vw', maxWidth: '500px' }"
      modal
    >
      <div class="share-content">
        <p>Share this project review with family members or others who should have access:</p>
        
        <div class="share-url">
          <InputText 
            :value="shareUrl" 
            readonly 
            class="share-input"
          />
          <Button
            icon="pi pi-copy"
            @click="copyShareUrl"
            v-tooltip="'Copy Link'"
          />
        </div>

        <div class="share-methods">
          <Button
            label="Copy Link"
            icon="pi pi-copy"
            @click="copyShareUrl"
            class="share-button"
          />
          <Button
            v-if="canShareNatively"
            label="Share"
            icon="pi pi-share-alt"
            @click="shareNatively"
            severity="info"
            class="share-button"
          />
        </div>

        <div class="share-warning">
          <i class="pi pi-info-circle"></i>
          <small>Only share this link with people you trust. It provides access to your project information.</small>
        </div>
      </div>

      <template #footer>
        <Button label="Close" @click="showShare = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '@/stores/client'
import { useMobileOptimization, useTouchGestures, useAdaptiveImages, optimizeAnimations } from '@/composables/useMobileOptimization'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const toast = useToast()
const clientStore = useClientStore()

// Mobile optimizations
const { deviceInfo, isMobile, isSlowConnection, shouldReduceAnimations } = useMobileOptimization()
const { getOptimalImageUrl, preloadCriticalImages } = useAdaptiveImages()
const { getAnimationConfig } = optimizeAnimations()

// Reactive state
const isOnline = ref(navigator.onLine)
const showHelp = ref(false)
const showShare = ref(false)
const headerRef = ref(null)
const showMobileMenu = ref(false)
const lastScrollY = ref(0)
const headerVisible = ref(true)
const scrollDirection = ref('up')

// Computed properties
const shareUrl = computed(() => {
  return window.location.href
})

const canShareNatively = computed(() => {
  return navigator.share !== undefined
})

// Methods
const getStatusIcon = (status) => {
  const icons = {
    'planning': 'pi-calendar',
    'in_progress': 'pi-cog',
    'on_hold': 'pi-pause',
    'completed': 'pi-check-circle',
    'cancelled': 'pi-times-circle'
  }
  return icons[status] || 'pi-info-circle'
}

const getStatusLabel = (status) => {
  const labels = {
    'planning': 'Planning',
    'in_progress': 'In Progress',
    'on_hold': 'On Hold',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const shareProject = async () => {
  try {
    // Use native sharing on mobile devices when available
    if (isMobile.value && canShareNatively.value) {
      await shareNatively()
      return
    }
    
    const url = await clientStore.shareProject('native')
    if (url !== true) {
      // Fallback to manual sharing
      showShare.value = true
    } else {
      toast.add({
        severity: 'success',
        summary: 'Shared Successfully',
        detail: 'Project link has been shared',
        life: 3000
      })
    }
  } catch (err) {
    console.error('Share failed:', err)
    showShare.value = true
  }
}

// Mobile-specific methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  
  // Prevent body scroll when menu is open
  if (showMobileMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const handleScroll = () => {
  if (!isMobile.value) return
  
  const currentScrollY = window.scrollY
  
  if (currentScrollY < 100) {
    headerVisible.value = true
    scrollDirection.value = 'up'
  } else if (currentScrollY > lastScrollY.value + 15) {
    // Scrolling down with threshold
    headerVisible.value = false
    scrollDirection.value = 'down'
    showMobileMenu.value = false
  } else if (currentScrollY < lastScrollY.value - 15) {
    // Scrolling up with threshold
    headerVisible.value = true
    scrollDirection.value = 'up'
  }
  
  lastScrollY.value = currentScrollY
}

const optimizeForMobile = async () => {
  if (!isMobile.value) return
  
  // Preload critical images only on good connections
  if (!isSlowConnection.value && clientStore.currentProject) {
    const criticalImages = clientStore.recentFiles
      ?.filter(file => file.is_image)
      ?.slice(0, 2)
      ?.map(file => getOptimalImageUrl(file.download_url)) || []
    
    if (criticalImages.length > 0) {
      preloadCriticalImages(criticalImages)
    }
  }
  
  // Add mobile-specific meta tags
  await nextTick(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes')
    }
  })
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Project link copied to clipboard',
      life: 2000
    })
    showShare.value = false
  } catch (err) {
    console.error('Copy failed:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Project link copied to clipboard',
      life: 2000
    })
    showShare.value = false
  }
}

const shareNatively = async () => {
  try {
    await navigator.share({
      title: `${clientStore.currentProject?.name || 'Project'} Review`,
      text: 'View this construction project progress',
      url: shareUrl.value
    })
    showShare.value = false
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Native share failed:', err)
    }
  }
}

const retryLoad = async () => {
  if (route.params.token) {
    await clientStore.validateToken(route.params.token)
    if (clientStore.isTokenValid) {
      await clientStore.loadProjectData()
    }
  }
}

const handleOnlineStatus = () => {
  isOnline.value = navigator.onLine
  
  if (isOnline.value) {
    toast.add({
      severity: 'success',
      summary: 'Back Online',
      detail: 'Connection restored',
      life: 2000
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Connection Lost',
      detail: 'Some features may not be available',
      life: 3000
    })
  }
}

// Touch gestures
const { isTouch } = useTouchGestures(headerRef)

// Lifecycle
onMounted(async () => {
  window.addEventListener('online', handleOnlineStatus)
  window.addEventListener('offline', handleOnlineStatus)
  
  // Mobile optimizations
  if (isMobile.value) {
    // Throttled scroll handler for better performance
    let scrollTimeout
    const throttledScroll = () => {
      if (scrollTimeout) return
      scrollTimeout = setTimeout(() => {
        handleScroll()
        scrollTimeout = null
      }, 16) // ~60fps
    }
    
    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    // Optimize for mobile after initial load
    await optimizeForMobile()
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Reset scroll position and header visibility
        headerVisible.value = true
        showMobileMenu.value = false
        document.body.style.overflow = ''
      }, 100)
    })
    
    // Prevent zoom on double tap for better UX
    document.addEventListener('gesturestart', (e) => e.preventDefault())
    document.addEventListener('gesturechange', (e) => e.preventDefault())
    document.addEventListener('gestureend', (e) => e.preventDefault())
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatus)
  window.removeEventListener('offline', handleOnlineStatus)
  
  // Clean up mobile listeners
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('orientationchange', () => {})
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Client Layout Styles */
.client-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
  /* Performance optimizations */
  will-change: scroll-position;
}

/* Mobile-specific optimizations */
.client-layout.mobile {
  /* Optimize font rendering on mobile */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeSpeed;
}

.client-layout.slow-connection {
  /* Reduce visual complexity on slow connections */
  background: #f8fafc;
}

.client-layout.reduce-animations * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Header Styles */
.client-header {
  background: #1e293b;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: transform 0.3s ease;
  /* Performance optimizations */
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Mobile header optimizations */
.client-header.mobile-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* Reduce shadow complexity on mobile */
}

.client-header.header-hidden {
  transform: translateY(-100%);
}

/* Reduce animations on slow connections */
.slow-connection .client-header {
  transition: none;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  gap: 1rem;
}

.brand-section {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.brand-logo-placeholder {
  height: 40px;
  width: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.brand-tagline {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 2px;
}

.project-info {
  flex: 1;
  text-align: center;
}

.project-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #60a5fa;
}

.project-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.project-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-planning { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.status-in_progress { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status-on_hold { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
.status-completed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.status-cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.client-actions {
  display: flex;
  gap: 0.5rem;
}

/* Navigation Styles */
.client-nav {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.nav-items {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.nav-items::-webkit-scrollbar {
  display: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  color: #1e293b;
  background: #f8fafc;
}

.nav-item.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Main Content Styles */
.client-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  flex: 1;
}

.offline-banner {
  background: #fef3c7;
  color: #92400e;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #fcd34d;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.loading-state h3, .error-state h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1e293b;
}

.error-state i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.content-wrapper {
  padding: 1.5rem 0;
}

/* Footer Styles */
.client-footer {
  background: #1e293b;
  color: white;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem 1rem 1rem;
}

.footer-content {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-bottom: 2rem;
}

.footer-section h4 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.footer-section p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
  line-height: 1.6;
}

.contact-info, .security-badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-link, .security-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: #60a5fa;
}

.security-badge {
  background: rgba(59, 130, 246, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid #334155;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
}

.powered-by {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Dialog Styles */
.help-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.help-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.help-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.help-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
}

.help-section ul {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
}

.help-section li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.help-contact {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.contact-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.contact-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.contact-button.phone {
  background: #22c55e;
  color: white;
}

.contact-button.email {
  background: #3b82f6;
  color: white;
}

.contact-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.share-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.share-url {
  display: flex;
  gap: 0.5rem;
}

.share-input {
  flex: 1;
  font-family: monospace;
  font-size: 0.875rem;
}

.share-methods {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.share-button {
  min-width: 120px;
}

.share-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fcd34d;
}

.share-warning i {
  color: #f59e0b;
  margin-top: 0.125rem;
}

/* Mobile Responsive */
/* Mobile Menu Styles */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.mobile-menu {
  background: white;
  width: 280px;
  height: 100%;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-menu-header h3 {
  margin: 0;
  color: #1e293b;
}

.mobile-menu-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-menu-item {
  display: flex;
  flex-direction: column;
}

.mobile-menu-button {
  width: 100%;
  justify-content: flex-start;
  padding: 0.75rem;
}

.offline-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
}

/* Performance optimizations */
.reduce-animations .mobile-menu {
  animation: none;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    gap: 1rem;
    /* Optimize for touch */
    min-height: 60px;
  }

  .project-info {
    text-align: center;
  }

  .project-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .brand-link {
    justify-content: center;
  }

  .client-actions {
    justify-content: center;
  }

  .nav-items {
    justify-content: flex-start;
  }

  .nav-item {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .contact-info, .security-badges {
    align-items: center;
  }

  .contact-buttons {
    flex-direction: column;
    align-items: center;
  }

  .share-methods {
    flex-direction: column;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 0 0.5rem;
  }

  .header-container, .nav-container, .footer-container {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .brand-name {
    font-size: 1.25rem;
  }

  .brand-tagline {
    display: none;
  }

  .nav-item span {
    display: none;
  }
}

/* Offline Styles */
.client-layout.offline {
  filter: saturate(0.8);
}

.client-layout.offline .client-header {
  background: #374151;
}

/* Print Styles */
@media print {
  .client-header, .client-nav, .client-footer {
    display: none !important;
  }
  
  .client-main {
    margin: 0 !important;
    padding: 0 !important;
  }
}
</style>