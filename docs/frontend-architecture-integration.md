# Frontend Architecture Integration Guide
## Vue 3 + PrimeVue Integration for Employee Login & QR Code Project Review System

### Overview
This document provides comprehensive frontend architecture integration guidelines for seamlessly incorporating the Employee Login System and QR Code Project Review features into the existing Vue 3 + Vite + PrimeVue + Pinia application. The integration maintains the current performance standards while adding new functionality.

## Current Architecture Analysis

### Existing Structure
The current application demonstrates excellent architectural patterns:
- **Vue 3 Composition API** with `<script setup>` syntax
- **Performance-optimized** with lazy loading and preloading
- **PrimeVue** as the primary UI framework with Lara theme
- **Pinia** for state management
- **Comprehensive testing** with Vitest and extensive coverage
- **Accessibility compliance** with WCAG 2.1 AA standards
- **SEO optimization** with proper meta tags and sitemap

### Integration Strategy
The new features will integrate as additional modules without disrupting the existing public website functionality.

## Router Configuration Enhancement

### Updated Router Structure
```javascript
// src/router/index.js - Enhanced configuration
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import existing routes
import HomeView from '../views/HomeView.vue'

// Import new route modules
import { employeeRoutes } from './modules/employee-routes'
import { clientRoutes } from './modules/client-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Existing public website routes
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Park City Construction & Remodeling Company',
        description: 'Unified Contractors is Park City\'s premier construction company with 25+ years of experience.',
        canonical: 'https://unifiedcontractors.com/',
        requiresAuth: false,
        layout: 'public'
      }
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('../views/ServicesView.vue'),
      meta: {
        title: 'Construction Services - Custom Homes & Remodeling',
        description: 'Complete construction services in Park City, UT. Custom home building, design services, remodeling.',
        canonical: 'https://unifiedcontractors.com/services',
        requiresAuth: false,
        layout: 'public'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'About Us - Family-Owned Construction Company',
        description: 'Learn about Unified Contractors, Park City\'s trusted family-owned construction company.',
        canonical: 'https://unifiedcontractors.com/about',
        requiresAuth: false,
        layout: 'public'
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
      meta: {
        title: 'Contact Us - Free Construction Estimates',
        description: 'Get your free construction estimate today. Contact Unified Contractors for custom homes and remodeling.',
        canonical: 'https://unifiedcontractors.com/contact',
        requiresAuth: false,
        layout: 'public'
      }
    },
    {
      path: '/portfolio',
      name: 'portfolio',
      component: () => import('../views/PortfolioView.vue'),
      meta: {
        title: 'Our Work - Construction Portfolio & Gallery',
        description: 'View our portfolio of custom homes, remodeling projects, and construction work in Park City, Utah.',
        canonical: 'https://unifiedcontractors.com/portfolio',
        requiresAuth: false,
        layout: 'public'
      }
    },

    // Employee system routes
    ...employeeRoutes,

    // Client QR access routes
    ...clientRoutes,

    // Unauthorized access route
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('../views/UnauthorizedView.vue'),
      meta: {
        title: 'Access Denied',
        description: 'You do not have permission to access this resource',
        layout: 'minimal',
        noindex: true
      }
    },

    // 404 catch-all route (must be last)
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Page Not Found',
        description: 'The page you are looking for could not be found.',
        layout: 'public',
        noindex: true
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0 }
  }
})

// Enhanced route guards with authentication and authorization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Handle guest-only routes (login page when already authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'employee-dashboard' })
    return
  }

  // Handle authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ 
      name: 'employee-login', 
      query: { redirect: to.fullPath } 
    })
    return
  }

  // Handle role-based access
  if (to.meta.roles && !authStore.hasAnyRole(to.meta.roles)) {
    next({ name: 'unauthorized' })
    return
  }

  // Handle permission-based access
  if (to.meta.permissions) {
    const hasPermission = to.meta.permissions.some(permission => 
      authStore.hasPermission(permission)
    )
    
    if (!hasPermission) {
      next({ name: 'unauthorized' })
      return
    }
  }

  // Preload likely next routes for better performance
  const preloadRoutes = {
    '/': ['/services', '/about'],
    '/services': ['/contact', '/portfolio'],
    '/employee/login': ['/employee/dashboard'],
    '/employee/dashboard': ['/employee/projects', '/employee/files']
  }
  
  const routesToPreload = preloadRoutes[to.path]
  if (routesToPreload) {
    routesToPreload.forEach(route => {
      const routeRecord = router.resolve(route)
      if (routeRecord.matched[0]?.components?.default) {
        routeRecord.matched[0].components.default()
      }
    })
  }

  next()
})

export default router
```

### Employee Routes Module
```javascript
// src/router/modules/employee-routes.js
export const employeeRoutes = [
  {
    path: '/employee',
    name: 'employee',
    redirect: '/employee/login',
    meta: {
      layout: 'employee',
      requiresAuth: false
    }
  },
  {
    path: '/employee/login',
    name: 'employee-login',
    component: () => import('../../views/employee/LoginView.vue'),
    meta: {
      title: 'Employee Login - Unified Contractors',
      description: 'Secure login portal for Unified Contractors employees',
      layout: 'minimal',
      requiresAuth: false,
      requiresGuest: true,
      noindex: true
    }
  },
  {
    path: '/employee/forgot-password',
    name: 'employee-forgot-password',
    component: () => import('../../views/employee/ForgotPasswordView.vue'),
    meta: {
      title: 'Reset Password - Employee Portal',
      description: 'Request password reset for employee account',
      layout: 'minimal',
      requiresAuth: false,
      noindex: true
    }
  },
  {
    path: '/employee/reset-password/:token',
    name: 'employee-reset-password',
    component: () => import('../../views/employee/ResetPasswordView.vue'),
    props: true,
    meta: {
      title: 'Set New Password - Employee Portal',
      description: 'Set new password for employee account',
      layout: 'minimal',
      requiresAuth: false,
      noindex: true
    }
  },
  {
    path: '/employee/dashboard',
    name: 'employee-dashboard',
    component: () => import('../../views/employee/DashboardView.vue'),
    meta: {
      title: 'Employee Dashboard - Project Management',
      description: 'Employee dashboard for project management and file uploads',
      layout: 'employee',
      requiresAuth: true,
      roles: ['employee', 'project_manager', 'admin', 'super_admin'],
      noindex: true
    }
  },
  {
    path: '/employee/projects',
    name: 'employee-projects',
    component: () => import('../../views/employee/ProjectsView.vue'),
    meta: {
      title: 'Projects - Employee Portal',
      description: 'Manage and view assigned projects',
      layout: 'employee',
      requiresAuth: true,
      roles: ['employee', 'project_manager', 'admin', 'super_admin'],
      noindex: true
    }
  },
  {
    path: '/employee/projects/create',
    name: 'employee-project-create',
    component: () => import('../../views/employee/ProjectCreateView.vue'),
    meta: {
      title: 'Create Project - Employee Portal',
      description: 'Create new construction project',
      layout: 'employee',
      requiresAuth: true,
      roles: ['project_manager', 'admin', 'super_admin'],
      permissions: ['projects.create'],
      noindex: true
    }
  },
  {
    path: '/employee/projects/:id',
    name: 'employee-project-detail',
    component: () => import('../../views/employee/ProjectDetailView.vue'),
    props: route => ({ 
      id: parseInt(route.params.id, 10) || null 
    }),
    meta: {
      title: 'Project Details - Employee Portal',
      description: 'View and manage project details, files, and progress',
      layout: 'employee',
      requiresAuth: true,
      roles: ['employee', 'project_manager', 'admin', 'super_admin'],
      noindex: true
    }
  },
  {
    path: '/employee/projects/:id/edit',
    name: 'employee-project-edit',
    component: () => import('../../views/employee/ProjectEditView.vue'),
    props: route => ({ 
      id: parseInt(route.params.id, 10) || null 
    }),
    meta: {
      title: 'Edit Project - Employee Portal',
      description: 'Edit project information and settings',
      layout: 'employee',
      requiresAuth: true,
      roles: ['project_manager', 'admin', 'super_admin'],
      permissions: ['projects.update'],
      noindex: true
    }
  }
  // Additional employee routes...
]
```

### Client Routes Module
```javascript
// src/router/modules/client-routes.js
export const clientRoutes = [
  {
    path: '/client',
    name: 'client',
    redirect: '/client/access'
  },
  {
    path: '/client/access',
    name: 'client-access',
    component: () => import('../../views/client/AccessView.vue'),
    meta: {
      title: 'Project Access - Unified Contractors',
      description: 'Access your project information using QR code',
      layout: 'client',
      requiresAuth: false,
      noindex: true
    }
  },
  {
    path: '/client/project/:token',
    name: 'client-project-view',
    component: () => import('../../views/client/ProjectView.vue'),
    props: true,
    meta: {
      title: 'Project Gallery - Unified Contractors',
      description: 'View your construction project progress and files',
      layout: 'client',
      requiresAuth: false,
      noindex: true
    }
  },
  {
    path: '/client/project/:token/feedback',
    name: 'client-feedback',
    component: () => import('../../views/client/FeedbackView.vue'),
    props: true,
    meta: {
      title: 'Project Feedback - Unified Contractors',
      description: 'Provide feedback on your construction project',
      layout: 'client',
      requiresAuth: false,
      noindex: true
    }
  }
]
```

## Pinia Store Architecture

### Authentication Store
```javascript
// src/stores/auth.js
import { defineStore } from 'pinia'
import { authApi } from '@/services/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Authentication state
    employee: null,
    isAuthenticated: false,
    permissions: [],
    loading: false,
    error: null,
    
    // Token management
    accessToken: null,
    tokenExpiry: null,
    refreshTimer: null,
    
    // Security features
    sessionTimeout: 15 * 60 * 1000, // 15 minutes
    lastActivity: null,
    initialized: false
  }),

  getters: {
    // Role checking
    hasRole: (state) => (role) => {
      return state.employee?.role === role
    },

    hasAnyRole: (state) => (roles) => {
      return roles.includes(state.employee?.role)
    },

    // Permission checking
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },

    hasAnyPermission: (state) => (permissions) => {
      return permissions.some(permission => 
        state.permissions.includes(permission)
      )
    },

    // Token management
    isTokenExpired: (state) => {
      if (!state.tokenExpiry) return true
      return Date.now() >= state.tokenExpiry
    },

    isSessionExpired: (state) => {
      if (!state.lastActivity) return false
      return Date.now() - state.lastActivity > state.sessionTimeout
    },

    // User display info
    employeeFullName: (state) => {
      if (!state.employee) return ''
      return `${state.employee.first_name} ${state.employee.last_name}`
    },

    employeeInitials: (state) => {
      if (!state.employee) return ''
      return `${state.employee.first_name[0]}${state.employee.last_name[0]}`
    }
  },

  actions: {
    // Initialize authentication state
    async initialize() {
      try {
        this.loading = true
        
        // Check for existing session
        const token = localStorage.getItem('uc_access_token')
        const tokenExpiry = localStorage.getItem('uc_token_expiry')
        
        if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
          this.accessToken = token
          this.tokenExpiry = parseInt(tokenExpiry)
          
          // Validate token and get user data
          const response = await authApi.me()
          this.setAuthData(response.data)
          this.startTokenRefreshTimer()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.clearAuthData()
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    // Login action
    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.login({
          ...credentials,
          device_fingerprint: this.generateDeviceFingerprint()
        })

        this.setAuthData(response.data)
        this.startTokenRefreshTimer()
        this.updateLastActivity()

        // Store tokens securely
        this.storeTokens(response.data)

        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Token refresh
    async refreshToken() {
      try {
        const response = await authApi.refresh()
        
        this.accessToken = response.data.access_token
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000)
        
        // Update stored tokens
        localStorage.setItem('uc_access_token', this.accessToken)
        localStorage.setItem('uc_token_expiry', this.tokenExpiry.toString())
        
        this.startTokenRefreshTimer()
        this.updateLastActivity()
        
        return response
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
        throw error
      }
    },

    // Logout
    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuthData()
      }
    },

    // Set authentication data
    setAuthData(data) {
      this.employee = data.employee
      this.isAuthenticated = true
      this.permissions = data.employee.permissions || []
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000)
    },

    // Clear authentication data
    clearAuthData() {
      this.employee = null
      this.isAuthenticated = false
      this.permissions = []
      this.accessToken = null
      this.tokenExpiry = null
      this.error = null
      this.lastActivity = null
      
      this.clearTokenRefreshTimer()
      this.clearStoredTokens()
    },

    // Token management
    startTokenRefreshTimer() {
      this.clearTokenRefreshTimer()
      
      // Refresh token 2 minutes before expiry
      const refreshTime = (this.tokenExpiry - Date.now()) - 120000
      
      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken()
        }, refreshTime)
      }
    },

    clearTokenRefreshTimer() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    // Session management
    updateLastActivity() {
      this.lastActivity = Date.now()
    },

    checkSessionTimeout() {
      if (this.isSessionExpired) {
        this.logout()
        return false
      }
      return true
    },

    // Utility methods
    generateDeviceFingerprint() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
      
      const fingerprint = {
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvas: canvas.toDataURL(),
        userAgent: navigator.userAgent.slice(0, 200)
      }
      
      return btoa(JSON.stringify(fingerprint))
    },

    storeTokens(data) {
      localStorage.setItem('uc_access_token', data.access_token)
      localStorage.setItem('uc_token_expiry', this.tokenExpiry.toString())
    },

    clearStoredTokens() {
      localStorage.removeItem('uc_access_token')
      localStorage.removeItem('uc_token_expiry')
    }
  }
})
```

### Projects Store
```javascript
// src/stores/projects.js
import { defineStore } from 'pinia'
import { projectsApi } from '@/services/api/projects'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    // Project data
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    
    // Pagination and filtering
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      total: 0
    },
    filters: {
      status: null,
      search: '',
      assignedTo: null,
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    
    // Statistics
    statistics: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      avgProgress: 0
    }
  }),

  getters: {
    // Filtered and sorted projects
    filteredProjects: (state) => {
      let filtered = [...state.projects]
      
      if (state.filters.status) {
        filtered = filtered.filter(p => p.status === state.filters.status)
      }
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.client_name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
        )
      }
      
      return filtered
    },

    // Project statistics
    projectsByStatus: (state) => {
      return state.projects.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1
        return acc
      }, {})
    },

    // Recent projects
    recentProjects: (state) => {
      return [...state.projects]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5)
    },

    // High priority projects
    urgentProjects: (state) => {
      const now = new Date()
      return state.projects.filter(project => {
        if (!project.end_date) return false
        const endDate = new Date(project.end_date)
        const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
        return daysUntilEnd <= 7 && project.status === 'active'
      })
    }
  },

  actions: {
    // Fetch projects with filtering and pagination
    async fetchProjects(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = {
          page: options.page || this.pagination.currentPage,
          per_page: options.perPage || this.pagination.perPage,
          ...this.filters,
          ...options.filters
        }

        const response = await projectsApi.getProjects(params)
        
        this.projects = response.data.data
        this.pagination = response.data.pagination
        
        // Update statistics
        this.updateStatistics()

      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch projects'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single project
    async fetchProject(id) {
      this.loading = true
      this.error = null

      try {
        const response = await projectsApi.getProject(id)
        this.currentProject = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new project
    async createProject(projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await projectsApi.createProject(projectData)
        
        // Add to projects list if it matches current filters
        if (this.shouldIncludeProject(response.data.data)) {
          this.projects.unshift(response.data.data)
          this.pagination.total += 1
        }
        
        this.updateStatistics()
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update project
    async updateProject(id, projectData) {
      this.loading = true
      this.error = null

      try {
        const response = await projectsApi.updateProject(id, projectData)
        
        // Update in projects list
        const index = this.projects.findIndex(p => p.id === id)
        if (index !== -1) {
          this.projects[index] = { ...this.projects[index], ...response.data.data }
        }
        
        // Update current project if it's the same
        if (this.currentProject?.id === id) {
          this.currentProject = { ...this.currentProject, ...response.data.data }
        }
        
        this.updateStatistics()
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete project
    async deleteProject(id) {
      this.loading = true
      this.error = null

      try {
        await projectsApi.deleteProject(id)
        
        // Remove from projects list
        this.projects = this.projects.filter(p => p.id !== id)
        this.pagination.total -= 1
        
        // Clear current project if it's the deleted one
        if (this.currentProject?.id === id) {
          this.currentProject = null
        }
        
        this.updateStatistics()
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete project'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
      this.pagination.currentPage = 1 // Reset to first page
    },

    // Clear filters
    clearFilters() {
      this.filters = {
        status: null,
        search: '',
        assignedTo: null,
        sortBy: 'created_at',
        sortOrder: 'desc'
      }
      this.pagination.currentPage = 1
    },

    // Utility methods
    shouldIncludeProject(project) {
      // Check if project matches current filters
      if (this.filters.status && project.status !== this.filters.status) {
        return false
      }
      
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase()
        if (
          !project.name.toLowerCase().includes(search) &&
          !project.client_name.toLowerCase().includes(search) &&
          !project.description?.toLowerCase().includes(search)
        ) {
          return false
        }
      }
      
      return true
    },

    updateStatistics() {
      this.statistics = {
        totalProjects: this.projects.length,
        activeProjects: this.projects.filter(p => p.status === 'active').length,
        completedProjects: this.projects.filter(p => p.status === 'completed').length,
        avgProgress: this.projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / (this.projects.length || 1)
      }
    }
  }
})
```

## PrimeVue Component Integration

### Theme Customization for New Features
```javascript
// src/assets/themes/employee-theme.js
export const employeeTheme = {
  semantic: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',  // Primary brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    }
  },
  components: {
    // Employee portal specific overrides
    menubar: {
      background: '{primary.50}',
      borderColor: '{primary.200}',
      itemFocusBackground: '{primary.100}'
    },
    card: {
      shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px'
    },
    button: {
      paddingX: '1.25rem',
      paddingY: '0.75rem',
      borderRadius: '6px'
    }
  }
}
```

### Layout Components

#### Employee Layout Component
```vue
<!-- src/components/layout/EmployeeLayout.vue -->
<template>
  <div class="employee-layout">
    <!-- Top Navigation -->
    <Menubar :model="menuItems" class="employee-navbar">
      <template #start>
        <router-link to="/" class="logo-link">
          <img src="/logo.svg" alt="Unified Contractors" class="logo" />
        </router-link>
      </template>
      
      <template #end>
        <div class="user-menu">
          <!-- Notifications -->
          <Button 
            icon="pi pi-bell" 
            severity="secondary" 
            text 
            rounded
            :badge="notificationCount > 0 ? notificationCount.toString() : null"
            @click="toggleNotifications"
            aria-label="Notifications"
          />
          
          <!-- User Profile Dropdown -->
          <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
          <Button
            :label="employeeInitials"
            severity="secondary"
            rounded
            @click="toggleUserMenu"
            class="user-avatar"
            :aria-label="`User menu for ${employeeFullName}`"
          />
        </div>
      </template>
    </Menubar>

    <!-- Main Content Area -->
    <div class="content-wrapper">
      <!-- Sidebar Navigation -->
      <nav class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <Button
            icon="pi pi-bars"
            text
            severity="secondary"
            @click="toggleSidebar"
            aria-label="Toggle sidebar"
          />
        </div>
        
        <Menu :model="sidebarItems" class="sidebar-menu" />
      </nav>

      <!-- Page Content -->
      <main class="main-content" role="main">
        <div class="page-header" v-if="$route.meta.title">
          <h1 class="page-title">{{ $route.meta.title }}</h1>
          <nav aria-label="Breadcrumb">
            <Breadcrumb :model="breadcrumbItems" />
          </nav>
        </div>
        
        <div class="page-content">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

// Components
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Breadcrumb from 'primevue/breadcrumb'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Reactive state
const sidebarCollapsed = ref(false)
const userMenu = ref()

// Computed properties
const employeeFullName = computed(() => authStore.employeeFullName)
const employeeInitials = computed(() => authStore.employeeInitials)
const notificationCount = computed(() => notificationStore.unreadCount)

// Navigation items
const menuItems = ref([
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    route: '/employee/dashboard',
    visible: () => authStore.hasAnyRole(['employee', 'project_manager', 'admin', 'super_admin'])
  },
  {
    label: 'Projects',
    icon: 'pi pi-briefcase',
    items: [
      {
        label: 'All Projects',
        route: '/employee/projects'
      },
      {
        label: 'Create Project',
        route: '/employee/projects/create',
        visible: () => authStore.hasAnyRole(['project_manager', 'admin', 'super_admin'])
      }
    ]
  },
  {
    label: 'Files',
    icon: 'pi pi-file',
    route: '/employee/files'
  },
  {
    label: 'Feedback',
    icon: 'pi pi-comments',
    route: '/employee/feedback',
    visible: () => authStore.hasAnyRole(['project_manager', 'admin', 'super_admin'])
  },
  {
    label: 'Administration',
    icon: 'pi pi-cog',
    route: '/employee/admin',
    visible: () => authStore.hasAnyRole(['admin', 'super_admin'])
  }
])

const userMenuItems = ref([
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => router.push('/employee/profile')
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => router.push('/employee/settings')
  },
  {
    separator: true
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => logout()
  }
])

const sidebarItems = computed(() => {
  return menuItems.value
    .filter(item => !item.visible || item.visible())
    .map(item => ({
      ...item,
      command: item.route ? () => router.push(item.route) : undefined
    }))
})

const breadcrumbItems = computed(() => {
  const items = []
  const matched = route.matched

  matched.forEach((match, index) => {
    if (match.meta.title && index > 0) {
      items.push({
        label: match.meta.title,
        route: match.path
      })
    }
  })

  return items
})

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleUserMenu = (event) => {
  userMenu.value.toggle(event)
}

const toggleNotifications = () => {
  // Open notifications panel
  notificationStore.togglePanel()
}

const logout = async () => {
  try {
    await authStore.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Initialize notifications
  notificationStore.fetchNotifications()
})
</script>

<style scoped>
.employee-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.employee-navbar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--surface-border);
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo {
  height: 32px;
  width: auto;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: 600;
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: var(--surface-50);
  border-right: 1px solid var(--surface-border);
  transition: width 0.3s ease;
}

.sidebar-collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.sidebar-menu {
  border: none;
  padding: 1rem 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-0);
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
}

.page-content {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .page-header {
    padding: 1rem 1.5rem 0.5rem;
  }

  .page-content {
    padding: 1rem 1.5rem;
  }
}
</style>
```

#### Client Layout Component
```vue
<!-- src/components/layout/ClientLayout.vue -->
<template>
  <div class="client-layout">
    <!-- Client Header -->
    <header class="client-header">
      <div class="container">
        <div class="header-content">
          <div class="company-info">
            <img src="/logo.svg" alt="Unified Contractors" class="logo" />
            <div class="company-details">
              <h1 class="company-name">Unified Contractors</h1>
              <p class="tagline">Your Project Portal</p>
            </div>
          </div>
          
          <div class="contact-info" v-if="projectData">
            <div class="contact-item">
              <span class="pi pi-user contact-icon"></span>
              <span>{{ projectData.team_contact.name }}</span>
            </div>
            <div class="contact-item">
              <span class="pi pi-phone contact-icon"></span>
              <a :href="`tel:${projectData.team_contact.phone}`">
                {{ projectData.team_contact.phone }}
              </a>
            </div>
            <div class="contact-item">
              <span class="pi pi-envelope contact-icon"></span>
              <a :href="`mailto:${projectData.team_contact.email}`">
                {{ projectData.team_contact.email }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="client-main" role="main">
      <router-view />
    </main>

    <!-- Client Footer -->
    <footer class="client-footer">
      <div class="container">
        <div class="footer-content">
          <div class="company-info">
            <p>&copy; 2024 Unified Contractors. All rights reserved.</p>
          </div>
          <div class="contact-links">
            <a href="https://unifiedcontractors.com" target="_blank" rel="noopener">
              Visit Our Website
            </a>
            <a href="tel:(555) 987-6543">(555) 987-6543</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useClientStore } from '@/stores/client'

const clientStore = useClientStore()

const projectData = computed(() => clientStore.currentProject)
</script>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
}

.client-header {
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  height: 48px;
  width: auto;
}

.company-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.tagline {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: right;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.contact-icon {
  color: var(--primary-color);
  font-size: 1rem;
}

.client-main {
  flex: 1;
  padding: 2rem 0;
}

.client-footer {
  background: var(--surface-100);
  border-top: 1px solid var(--surface-border);
  padding: 1.5rem 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-links {
  display: flex;
  gap: 1rem;
}

.contact-links a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
}

.contact-links a:hover {
  text-decoration: underline;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .contact-info {
    align-items: center;
    text-align: center;
  }

  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .contact-links {
    flex-direction: column;
    align-items: center;
  }
}
</style>
```

## Component Architecture

### File Upload Component with PrimeVue
```vue
<!-- src/components/employee/FileUpload.vue -->
<template>
  <div class="file-upload-container">
    <Card class="upload-card">
      <template #title>
        <div class="upload-header">
          <span class="pi pi-cloud-upload upload-icon"></span>
          Upload Project Files
        </div>
      </template>
      
      <template #content>
        <FileUpload
          ref="fileUploader"
          name="files[]"
          :url="uploadUrl"
          :headers="uploadHeaders"
          :multiple="true"
          :accept="acceptedTypes"
          :maxFileSize="maxFileSize"
          :customUpload="true"
          @uploader="customUploader"
          @select="onFileSelect"
          @remove="onFileRemove"
          @error="onUploadError"
          @progress="onUploadProgress"
          class="custom-file-upload"
        >
          <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
            <div class="upload-toolbar">
              <Button
                @click="chooseCallback()"
                icon="pi pi-plus"
                label="Choose Files"
                severity="primary"
                class="upload-button"
              />
              <Button
                @click="uploadCallback()"
                icon="pi pi-upload"
                label="Upload All"
                :disabled="!files || files.length === 0"
                severity="success"
                class="upload-button"
              />
              <Button
                @click="clearCallback()"
                icon="pi pi-times"
                label="Clear"
                :disabled="!files || files.length === 0"
                severity="danger"
                text
                class="upload-button"
              />
            </div>
          </template>

          <template #content="{ files, uploadedFiles, removeUploadedFileCallback }">
            <div class="upload-content">
              <!-- Drop Zone -->
              <div class="drop-zone" v-show="!files || files.length === 0">
                <div class="drop-zone-content">
                  <span class="pi pi-cloud-upload drop-icon"></span>
                  <h3>Drag and drop files here</h3>
                  <p>or click "Choose Files" to select</p>
                  <div class="file-info">
                    <small>Supported formats: Images, Documents, Videos</small>
                    <small>Maximum file size: {{ formatFileSize(maxFileSize) }}</small>
                  </div>
                </div>
              </div>

              <!-- File List -->
              <div v-if="files && files.length > 0" class="file-list">
                <h4>Selected Files ({{ files.length }})</h4>
                <div class="file-items">
                  <div
                    v-for="(file, index) in files"
                    :key="file.name + file.size"
                    class="file-item"
                  >
                    <div class="file-info">
                      <div class="file-icon">
                        <span :class="getFileIcon(file.type)"></span>
                      </div>
                      <div class="file-details">
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-metadata">
                          {{ formatFileSize(file.size) }} • 
                          {{ getFileCategory(file.type) }}
                        </div>
                        
                        <!-- File Description Input -->
                        <div class="file-description">
                          <InputText
                            v-model="fileDescriptions[index]"
                            placeholder="Add description (optional)"
                            class="description-input"
                          />
                        </div>

                        <!-- File Category Selection -->
                        <div class="file-category">
                          <Dropdown
                            v-model="fileCategories[index]"
                            :options="categoryOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select category"
                            class="category-dropdown"
                          />
                        </div>

                        <!-- Public/Private Toggle -->
                        <div class="file-visibility">
                          <div class="field-checkbox">
                            <Checkbox
                              v-model="fileVisibility[index]"
                              :inputId="`public-${index}`"
                              :binary="true"
                            />
                            <label :for="`public-${index}`">Make public for client</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="uploadProgress[index] !== undefined" class="progress-container">
                      <ProgressBar 
                        :value="uploadProgress[index]" 
                        :showValue="true"
                        class="upload-progress"
                      />
                    </div>

                    <!-- Remove Button -->
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      @click="removeFile(index)"
                      class="remove-button"
                      :aria-label="`Remove ${file.name}`"
                    />
                  </div>
                </div>
              </div>

              <!-- Uploaded Files -->
              <div v-if="uploadedFiles && uploadedFiles.length > 0" class="uploaded-files">
                <h4>Uploaded Files ({{ uploadedFiles.length }})</h4>
                <div class="uploaded-items">
                  <div
                    v-for="file in uploadedFiles"
                    :key="file.name"
                    class="uploaded-item"
                  >
                    <div class="uploaded-info">
                      <span :class="getFileIcon(file.type)" class="file-icon"></span>
                      <span class="file-name">{{ file.name }}</span>
                      <Badge value="Uploaded" severity="success" />
                    </div>
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      @click="removeUploadedFileCallback(file.index)"
                      class="remove-button"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </FileUpload>
      </template>
    </Card>

    <!-- Upload Summary -->
    <Card v-if="uploadSummary" class="summary-card">
      <template #title>Upload Summary</template>
      <template #content>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Files:</span>
            <span class="stat-value">{{ uploadSummary.totalFiles }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Successful:</span>
            <span class="stat-value success">{{ uploadSummary.successful }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Failed:</span>
            <span class="stat-value error">{{ uploadSummary.failed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Size:</span>
            <span class="stat-value">{{ formatFileSize(uploadSummary.totalSize) }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import { filesApi } from '@/services/api/files'

// PrimeVue Components
import Card from 'primevue/card'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Badge from 'primevue/badge'

// Props
const props = defineProps({
  projectId: {
    type: Number,
    required: true
  },
  maxFiles: {
    type: Number,
    default: 10
  }
})

// Emits
const emit = defineEmits(['upload-complete', 'upload-progress'])

// Composables
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const fileUploader = ref()
const fileDescriptions = ref([])
const fileCategories = ref([])
const fileVisibility = ref([])
const uploadProgress = ref([])
const uploadSummary = ref(null)

// Configuration
const maxFileSize = 52428800 // 50MB
const acceptedTypes = 'image/*,.pdf,.doc,.docx,.mp4,.mov'

const categoryOptions = [
  { label: 'Image', value: 'image' },
  { label: 'Document', value: 'document' },
  { label: 'Video', value: 'video' },
  { label: 'Blueprint', value: 'blueprint' },
  { label: 'Other', value: 'other' }
]

// Computed properties
const uploadUrl = computed(() => `/api/v1/projects/${props.projectId}/files`)
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${authStore.accessToken}`
}))

// Methods
const onFileSelect = (event) => {
  const files = event.files
  
  // Initialize metadata arrays
  fileDescriptions.value = new Array(files.length).fill('')
  fileCategories.value = files.map(file => getFileCategory(file.type))
  fileVisibility.value = new Array(files.length).fill(true)
  uploadProgress.value = new Array(files.length).fill(undefined)
  
  toast.add({
    severity: 'info',
    summary: 'Files Selected',
    detail: `${files.length} file(s) selected for upload`,
    life: 3000
  })
}

const onFileRemove = (event) => {
  const removedIndex = event.index
  
  // Remove metadata for removed file
  fileDescriptions.value.splice(removedIndex, 1)
  fileCategories.value.splice(removedIndex, 1)
  fileVisibility.value.splice(removedIndex, 1)
  uploadProgress.value.splice(removedIndex, 1)
}

const customUploader = async (event) => {
  const files = event.files
  let successful = 0
  let failed = 0
  let totalSize = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    totalSize += file.size

    try {
      // Update progress
      uploadProgress.value[i] = 0

      const formData = new FormData()
      formData.append('files[]', file)
      formData.append('descriptions[]', fileDescriptions.value[i] || '')
      formData.append('categories[]', fileCategories.value[i] || 'other')
      formData.append('is_public[]', fileVisibility.value[i] ? 'true' : 'false')
      formData.append('sort_orders[]', i + 1)

      await filesApi.uploadFiles(props.projectId, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value[i] = progress
          
          emit('upload-progress', {
            fileIndex: i,
            fileName: file.name,
            progress
          })
        }
      })

      uploadProgress.value[i] = 100
      successful++

    } catch (error) {
      console.error(`Upload failed for ${file.name}:`, error)
      uploadProgress.value[i] = -1 // Error state
      failed++
      
      toast.add({
        severity: 'error',
        summary: 'Upload Failed',
        detail: `Failed to upload ${file.name}: ${error.message}`,
        life: 5000
      })
    }
  }

  // Show upload summary
  uploadSummary.value = {
    totalFiles: files.length,
    successful,
    failed,
    totalSize
  }

  if (successful > 0) {
    toast.add({
      severity: 'success',
      summary: 'Upload Complete',
      detail: `${successful} file(s) uploaded successfully`,
      life: 5000
    })

    emit('upload-complete', {
      successful,
      failed,
      totalFiles: files.length
    })
  }
}

const onUploadError = (error) => {
  console.error('Upload error:', error)
  toast.add({
    severity: 'error',
    summary: 'Upload Error',
    detail: 'An error occurred during file upload',
    life: 5000
  })
}

const onUploadProgress = (event) => {
  // Global upload progress if needed
  emit('upload-progress', event)
}

const removeFile = (index) => {
  fileUploader.value.removeFile(index)
}

// Utility methods
const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'pi pi-image'
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word'
  if (mimeType.startsWith('video/')) return 'pi pi-video'
  return 'pi pi-file'
}

const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  if (mimeType.startsWith('video/')) return 'video'
  return 'other'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-card,
.summary-card {
  width: 100%;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
}

.upload-icon {
  font-size: 1.25rem;
}

:deep(.custom-file-upload) {
  border: none;
  padding: 0;
}

.upload-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.upload-button {
  flex: 1;
}

.drop-zone {
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--surface-50);
  transition: all 0.3s ease;
}

.drop-zone:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.drop-icon {
  font-size: 3rem;
  color: var(--primary-color);
}

.drop-zone h3 {
  margin: 0;
  color: var(--text-color);
  font-weight: 600;
}

.drop-zone p {
  margin: 0;
  color: var(--text-color-secondary);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-info small {
  color: var(--text-color-secondary);
}

.file-list,
.uploaded-files {
  margin-top: 1.5rem;
}

.file-list h4,
.uploaded-files h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-weight: 600;
}

.file-items,
.uploaded-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-item,
.uploaded-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  background: var(--surface-0);
  position: relative;
}

.file-info,
.uploaded-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.file-icon {
  font-size: 2rem;
  color: var(--primary-color);
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-name {
  font-weight: 600;
  color: var(--text-color);
  word-break: break-all;
}

.file-metadata {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.description-input,
.category-dropdown {
  width: 100%;
  max-width: 300px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox label {
  font-size: 0.875rem;
  cursor: pointer;
}

.progress-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 1rem 0.5rem;
}

.upload-progress {
  height: 6px;
}

.remove-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
}

.stat-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.stat-value {
  font-weight: 700;
  color: var(--text-color);
}

.stat-value.success {
  color: var(--green-600);
}

.stat-value.error {
  color: var(--red-600);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .upload-toolbar {
    flex-direction: column;
  }

  .file-item,
  .uploaded-item {
    flex-direction: column;
    align-items: stretch;
  }

  .remove-button {
    position: static;
    align-self: flex-end;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>
```

## Performance Integration

### Bundle Configuration
```javascript
// vite.config.js - Enhanced for new features
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // Auto-import optimization for new components
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],
  
  // Enhanced build optimization
  build: {
    rollupOptions: {
      output: {
        // Separate chunks for different feature areas
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'primevue': ['primevue/config', 'primevue/button', 'primevue/inputtext'],
          'employee': [
            './src/views/employee/DashboardView.vue',
            './src/views/employee/ProjectsView.vue',
            './src/stores/auth.js',
            './src/stores/projects.js'
          ],
          'client': [
            './src/views/client/ProjectView.vue',
            './src/stores/client.js'
          ]
        }
      }
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  
  // Development optimization
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // Path resolution for new modules
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@employee': resolve(__dirname, 'src/components/employee'),
      '@client': resolve(__dirname, 'src/components/client'),
      '@shared': resolve(__dirname, 'src/components/shared')
    }
  }
})
```

### Service Worker Enhancement
```javascript
// public/sw.js - Enhanced for new features
const CACHE_NAME = 'unified-contractors-v2'
const STATIC_CACHE = 'static-v2'
const API_CACHE = 'api-v2'

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Employee portal assets
  employee: {
    strategy: 'StaleWhileRevalidate',
    cacheName: 'employee-assets'
  },
  
  // Client portal assets (more aggressive caching)
  client: {
    strategy: 'CacheFirst',
    cacheName: 'client-assets',
    expiration: {
      maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
    }
  },
  
  // API responses
  api: {
    strategy: 'NetworkFirst',
    cacheName: 'api-responses',
    expiration: {
      maxAgeSeconds: 5 * 60 // 5 minutes
    }
  }
}

// Enhanced caching for project files and images
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request))
    return
  }
  
  // Handle employee portal assets
  if (url.pathname.startsWith('/employee/')) {
    event.respondWith(handleEmployeeAssets(event.request))
    return
  }
  
  // Handle client portal assets
  if (url.pathname.startsWith('/client/')) {
    event.respondWith(handleClientAssets(event.request))
    return
  }
  
  // Default strategy for other assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    })
  )
})
```

## Testing Integration

### Component Testing Setup
```javascript
// src/test/setup/employee-test-utils.js
import { mount, createWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PrimeVue from 'primevue/config'
import { vi } from 'vitest'

export const createEmployeeComponentWrapper = (component, options = {}) => {
  const defaultOptions = {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            auth: {
              isAuthenticated: true,
              employee: {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                role: 'employee'
              },
              permissions: ['projects.read', 'files.upload']
            }
          }
        }),
        PrimeVue
      ],
      mocks: {
        $router: {
          push: vi.fn(),
          resolve: vi.fn(() => ({ href: '/test' }))
        },
        $route: {
          path: '/employee/dashboard',
          meta: { title: 'Test Page' }
        }
      }
    }
  }

  return mount(component, {
    ...defaultOptions,
    ...options
  })
}
```

### API Integration Testing
```javascript
// src/test/integration/auth-flow.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import * as authApi from '@/services/api/auth'

// Mock API
vi.mock('@/services/api/auth')

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should handle complete login flow', async () => {
    const authStore = useAuthStore()
    
    // Mock successful login response
    authApi.login.mockResolvedValue({
      data: {
        employee: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          role: 'employee',
          permissions: ['projects.read']
        },
        access_token: 'mock-token',
        expires_in: 900
      }
    })

    // Perform login
    await authStore.login({
      email: 'john@example.com',
      password: 'password'
    })

    // Verify state updates
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.employee.email).toBe('john@example.com')
    expect(authStore.hasPermission('projects.read')).toBe(true)
    expect(localStorage.getItem('uc_access_token')).toBe('mock-token')
  })

  it('should handle token refresh', async () => {
    const authStore = useAuthStore()
    
    // Set initial state
    authStore.accessToken = 'old-token'
    authStore.isAuthenticated = true
    
    // Mock refresh response
    authApi.refresh.mockResolvedValue({
      data: {
        access_token: 'new-token',
        expires_in: 900
      }
    })

    await authStore.refreshToken()

    expect(authStore.accessToken).toBe('new-token')
    expect(localStorage.getItem('uc_access_token')).toBe('new-token')
  })
})
```

## Accessibility Integration

### Screen Reader Support
```javascript
// src/composables/useAccessibility.js - Enhanced for new features
import { ref, onMounted, onUnmounted } from 'vue'

export const useAccessibility = () => {
  const announcements = ref([])
  const focusedElement = ref(null)

  // Announce important changes for screen readers
  const announce = (message, priority = 'polite') => {
    const announcement = {
      id: Date.now(),
      message,
      priority,
      timestamp: new Date()
    }
    
    announcements.value.push(announcement)
    
    // Create live region for announcement
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.setAttribute('class', 'sr-only')
    liveRegion.textContent = message
    
    document.body.appendChild(liveRegion)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion)
      announcements.value = announcements.value.filter(a => a.id !== announcement.id)
    }, 1000)
  }

  // Enhanced focus management for complex UIs
  const manageFocus = {
    trap: (container) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length === 0) return
      
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }
      
      container.addEventListener('keydown', handleKeyDown)
      firstElement.focus()
      
      return () => {
        container.removeEventListener('keydown', handleKeyDown)
      }
    },
    
    restore: () => {
      if (focusedElement.value) {
        focusedElement.value.focus()
        focusedElement.value = null
      }
    },
    
    save: () => {
      focusedElement.value = document.activeElement
    }
  }

  // Keyboard navigation helpers
  const keyboardNavigation = {
    // Arrow key navigation for custom components
    handleArrowKeys: (e, items, currentIndex, callback) => {
      let newIndex = currentIndex

      switch (e.key) {
        case 'ArrowUp':
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          break
        case 'ArrowDown':
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          break
        case 'Home':
          newIndex = 0
          break
        case 'End':
          newIndex = items.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      callback(newIndex)
    },
    
    // Enhanced Enter/Space key handling
    handleActivation: (e, callback) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callback()
      }
    }
  }

  return {
    announce,
    manageFocus,
    keyboardNavigation,
    announcements: announcements.value
  }
}
```

## Mobile Optimization

### Touch Interface Enhancements
```vue
<!-- src/components/shared/TouchOptimized.vue -->
<template>
  <div 
    class="touch-optimized"
    :class="{ 'touch-device': isTouchDevice }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isTouchDevice = ref(false)
const touchStart = ref({ x: 0, y: 0 })
const touchEnd = ref({ x: 0, y: 0 })

const emit = defineEmits(['swipe-left', 'swipe-right', 'swipe-up', 'swipe-down'])

onMounted(() => {
  // Detect touch device
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

const handleTouchStart = (e) => {
  const touch = e.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

const handleTouchMove = (e) => {
  // Prevent scrolling if needed
  if (e.cancelable) {
    e.preventDefault()
  }
}

const handleTouchEnd = (e) => {
  const touch = e.changedTouches[0]
  touchEnd.value = { x: touch.clientX, y: touch.clientY }
  
  const deltaX = touchEnd.value.x - touchStart.value.x
  const deltaY = touchEnd.value.y - touchStart.value.y
  const minSwipeDistance = 50
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      emit(deltaX > 0 ? 'swipe-right' : 'swipe-left')
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      emit(deltaY > 0 ? 'swipe-down' : 'swipe-up')
    }
  }
}
</script>

<style scoped>
.touch-optimized {
  /* Optimize for touch interactions */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.touch-device {
  /* Larger touch targets on touch devices */
  --touch-target-size: 44px;
}

.touch-device :deep(button),
.touch-device :deep(.clickable) {
  min-height: var(--touch-target-size);
  min-width: var(--touch-target-size);
}
</style>
```

## Integration Checklist

### Phase 1: Core Integration
- [ ] Router configuration with new routes
- [ ] Pinia stores for auth, projects, and client data
- [ ] Layout components (Employee, Client, Minimal)
- [ ] PrimeVue theme customization
- [ ] Basic authentication flow

### Phase 2: Component Development
- [ ] Employee authentication components
- [ ] Project management components  
- [ ] File upload system
- [ ] Client QR access interface
- [ ] Feedback submission system

### Phase 3: Performance Optimization
- [ ] Code splitting and lazy loading
- [ ] Service worker enhancements
- [ ] Image optimization pipeline
- [ ] Bundle size optimization
- [ ] Mobile performance tuning

### Phase 4: Testing Integration
- [ ] Component testing setup
- [ ] API integration tests
- [ ] E2E testing for user flows
- [ ] Accessibility testing
- [ ] Cross-browser testing

### Phase 5: Production Readiness
- [ ] Error boundary implementation
- [ ] Monitoring and analytics
- [ ] SEO optimization for public routes
- [ ] Security headers and CSP
- [ ] Performance monitoring

## Migration Strategy

### Backward Compatibility
The integration maintains full backward compatibility with the existing public website:

1. **Route Isolation**: New routes are prefixed (`/employee/*`, `/client/*`)
2. **Component Separation**: New components in separate directories
3. **Store Isolation**: New Pinia stores don't affect existing state
4. **Style Isolation**: Scoped styles and CSS modules prevent conflicts
5. **Bundle Separation**: Code splitting keeps public site bundle small

### Deployment Strategy
```bash
# 1. Deploy frontend updates
npm run build
npm run deploy

# 2. Deploy backend API (parallel development)
# API endpoints are versioned (/api/v1/) for compatibility

# 3. Test integration
npm run test:integration
npm run test:e2e

# 4. Performance validation
npm run lighthouse
npm run perf:audit
```

### Rollback Plan
```bash
# Quick rollback to previous version
git checkout main~1
npm run build
npm run deploy

# Gradual rollback (feature flags)
# Disable new routes in router configuration
# Maintain existing functionality
```

This comprehensive frontend architecture integration guide ensures that the Employee Login System and QR Code Project Review features integrate seamlessly with the existing Vue 3 + PrimeVue application while maintaining performance, accessibility, and security standards.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "arch-001", "content": "Design database schema with complete ERD and SQL scripts", "status": "completed"}, {"id": "arch-002", "content": "Create authentication system architecture with JWT and RBAC", "status": "completed"}, {"id": "arch-003", "content": "Design API architecture with RESTful endpoints specification", "status": "completed"}, {"id": "arch-004", "content": "Create security framework and implementation guide", "status": "completed"}, {"id": "arch-005", "content": "Design frontend architecture integration with Vue 3 + PrimeVue", "status": "completed"}]