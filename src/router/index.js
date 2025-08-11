import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Park City Construction & Remodeling Company',
        description: 'Unified Contractors is Park City\'s premier construction company with 25+ years of experience.',
        canonical: 'https://unifiedcontractors.com/',
        requiresAuth: false
      }
    },
    {
      path: '/services',
      name: 'services',
      component: () => import(/* webpackChunkName: "services" */ '../views/ServicesView.vue'),
      meta: {
        title: 'Construction Services - Custom Homes & Remodeling',
        description: 'Complete construction services in Park City, UT. Custom home building, design services, remodeling.',
        canonical: 'https://unifiedcontractors.com/services',
        requiresAuth: false,
        preload: true // High priority route
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
      meta: {
        title: 'About Us - Family-Owned Construction Company',
        description: 'Learn about Unified Contractors, Park City\'s trusted family-owned construction company.',
        canonical: 'https://unifiedcontractors.com/about',
        requiresAuth: false,
        preload: true // High priority route
      }
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import(/* webpackChunkName: "contact" */ '../views/ContactView.vue'),
      meta: {
        title: 'Contact Us - Free Construction Estimates',
        description: 'Get your free construction estimate today. Contact Unified Contractors for custom homes and remodeling.',
        canonical: 'https://unifiedcontractors.com/contact',
        requiresAuth: false,
        preload: true // High priority route
      }
    },
    {
      path: '/portfolio',
      name: 'portfolio',
      component: () => import(/* webpackChunkName: "portfolio" */ '../views/PortfolioView.vue'),
      meta: {
        title: 'Our Work - Construction Portfolio & Gallery',
        description: 'View our portfolio of custom homes, remodeling projects, and construction work in Park City, Utah.',
        canonical: 'https://unifiedcontractors.com/portfolio',
        requiresAuth: false
      }
    },

    // Employee Authentication Routes
    {
      path: '/employee',
      name: 'employee',
      redirect: '/employee/login',
      meta: {
        layout: 'minimal',
        requiresAuth: false
      }
    },
    {
      path: '/employee/login',
      name: 'employee-login',
      component: () => import(/* webpackChunkName: "employee-auth" */ '../views/employee/LoginView.vue'),
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
      component: () => import(/* webpackChunkName: "employee-auth" */ '../views/employee/ForgotPasswordView.vue'),
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
      component: () => import(/* webpackChunkName: "employee-auth" */ '../views/employee/ResetPasswordView.vue'),
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
      component: () => import(/* webpackChunkName: "employee-dashboard" */ '../views/employee/DashboardView.vue'),
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
      component: () => import(/* webpackChunkName: "employee-projects" */ '../views/employee/ProjectsView.vue'),
      meta: {
        title: 'Projects - Employee Portal',
        description: 'Manage and view construction projects',
        layout: 'employee',
        requiresAuth: true,
        roles: ['employee', 'project_manager', 'admin', 'super_admin'],
        noindex: true
      }
    },
    {
      path: '/employee/projects/:id',
      name: 'employee-project-detail',
      component: () => import(/* webpackChunkName: "employee-projects" */ '../views/employee/ProjectDetailView.vue'),
      props: true,
      meta: {
        title: 'Project Details - Employee Portal',
        description: 'View detailed project information and files',
        layout: 'employee',
        requiresAuth: true,
        roles: ['employee', 'project_manager', 'admin', 'super_admin'],
        noindex: true
      }
    },
    {
      path: '/employee/files',
      name: 'employee-files',
      component: () => import(/* webpackChunkName: "employee-files" */ '../views/employee/FilesView.vue'),
      meta: {
        title: 'File Management - Employee Portal',
        description: 'Upload and manage project files',
        layout: 'employee',
        requiresAuth: true,
        roles: ['employee', 'project_manager', 'admin', 'super_admin'],
        noindex: true
      }
    },
    {
      path: '/employee/feedback',
      name: 'employee-feedback',
      component: () => import(/* webpackChunkName: "employee-feedback" */ '../views/employee/FeedbackView.vue'),
      meta: {
        title: 'Client Feedback - Employee Portal',
        description: 'View and respond to client feedback',
        layout: 'employee',
        requiresAuth: true,
        roles: ['employee', 'project_manager', 'admin', 'super_admin'],
        noindex: true
      }
    },
    {
      path: '/employee/profile',
      name: 'employee-profile',
      component: () => import(/* webpackChunkName: "employee-profile" */ '../views/employee/ProfileView.vue'),
      meta: {
        title: 'Profile Settings - Employee Portal',
        description: 'Manage your profile and account settings',
        layout: 'employee',
        requiresAuth: true,
        roles: ['employee', 'project_manager', 'admin', 'super_admin'],
        noindex: true
      }
    },

    // Client Review Routes (Public - No Authentication Required)
    {
      path: '/client',
      name: 'client',
      redirect: '/client/help',
      meta: {
        layout: 'client',
        requiresAuth: false
      }
    },
    {
      path: '/client/help',
      name: 'client-help',
      component: () => import(/* webpackChunkName: "client-views" */ '../views/client/ClientHelpView.vue'),
      meta: {
        title: 'QR Code Help - Project Review Instructions',
        description: 'Learn how to scan QR codes and review your construction project',
        layout: 'client',
        requiresAuth: false,
        noindex: true
      }
    },
    {
      path: '/client/review/:token',
      name: 'client-review',
      component: () => import(/* webpackChunkName: "client-views" */ '../views/client/ClientReviewView.vue'),
      props: true,
      meta: {
        title: 'Project Review - Unified Contractors',
        description: 'Review your construction project photos and documents',
        layout: 'client',
        requiresAuth: false,
        noindex: true
      }
    },
    {
      path: '/client/gallery/:token/:category?',
      name: 'client-gallery',
      component: () => import(/* webpackChunkName: "client-views" */ '../views/client/ClientGalleryView.vue'),
      props: true,
      meta: {
        title: 'Project Gallery - View Photos & Documents',
        description: 'Browse project images and documents for your construction project',
        layout: 'client',
        requiresAuth: false,
        noindex: true
      }
    },
    {
      path: '/client/feedback/:token',
      name: 'client-feedback',
      component: () => import(/* webpackChunkName: "client-views" */ '../views/client/ClientFeedbackView.vue'),
      props: true,
      meta: {
        title: 'Project Feedback - Share Your Experience',
        description: 'Provide feedback and ratings for your construction project',
        layout: 'client',
        requiresAuth: false,
        noindex: true
      }
    },
    {
      path: '/client/feedback-success',
      name: 'client-feedback-success',
      component: () => import(/* webpackChunkName: "client-views" */ '../views/client/FeedbackSuccessView.vue'),
      meta: {
        title: 'Feedback Submitted - Thank You',
        description: 'Your feedback has been submitted successfully',
        layout: 'client',
        requiresAuth: false,
        noindex: true
      }
    },

    // Unauthorized access route
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import(/* webpackChunkName: "error-pages" */ '../views/UnauthorizedView.vue'),
      meta: {
        title: 'Access Denied',
        description: 'You do not have permission to access this resource',
        layout: 'minimal',
        noindex: true
      }
    },

    // 404 catch-all route
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import(/* webpackChunkName: "error-pages" */ '../views/NotFoundView.vue'),
      meta: {
        title: 'Page Not Found',
        description: 'The page you are looking for could not be found.',
        layout: 'public',
        noindex: true
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // If the user is navigating back/forward, restore scroll position
    if (savedPosition) {
      return savedPosition
    }
    // If navigating to an anchor link
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    // Default to top of page
    return { top: 0 }
  }
})

// Performance tracking for route navigation
const navigationStartTime = new Map()

// Enhanced route guards with authentication and performance tracking
router.beforeEach(async (to, from, next) => {
  // Track navigation start time
  navigationStartTime.set(to.path, performance.now())
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Check session timeout for authenticated users
  if (authStore.isAuthenticated && !authStore.checkSessionTimeout()) {
    // Session expired, will be handled by auth store
    return
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
  if (to.meta.roles && authStore.isAuthenticated && !authStore.hasAnyRole(to.meta.roles)) {
    next({ name: 'unauthorized' })
    return
  }

  // Handle permission-based access
  if (to.meta.permissions && authStore.isAuthenticated) {
    const hasPermission = to.meta.permissions.some(permission => 
      authStore.hasPermission(permission)
    )
    
    if (!hasPermission) {
      next({ name: 'unauthorized' })
      return
    }
  }

  // Enhanced preloading with user behavior analytics
  const preloadRoutes = {
    '/': ['/services', '/about'],
    '/services': ['/contact', '/portfolio'],
    '/about': ['/services', '/contact'],
    '/employee/login': ['/employee/dashboard'],
    '/employee/dashboard': ['/employee/projects', '/employee/files'],
    '/employee/projects': ['/employee/files', '/employee/feedback'],
    '/client/review': ['/client/feedback'],
    '/client/gallery': ['/client/feedback']
  }
  
  const routesToPreload = preloadRoutes[to.path]
  if (routesToPreload && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routesToPreload.forEach(route => {
        const routeRecord = router.resolve(route)
        if (routeRecord.matched[0]?.components?.default) {
          // Preload the component during idle time
          routeRecord.matched[0].components.default().catch(() => {
            // Silently handle preload failures
          })
        }
      })
    }, { timeout: 2000 })
  }

  next()
})

// Track route navigation performance
router.afterEach((to, from) => {
  const startTime = navigationStartTime.get(to.path)
  if (startTime) {
    const navigationTime = performance.now() - startTime
    navigationStartTime.delete(to.path)
    
    // Log slow navigations in development
    if (import.meta.env.DEV && navigationTime > 1000) {
      console.warn(`Slow navigation to ${to.path}: ${navigationTime.toFixed(2)}ms`)
    }
    
    // Send to analytics in production
    if (import.meta.env.PROD && typeof gtag !== 'undefined') {
      gtag('event', 'page_view_timing', {
        page_path: to.path,
        navigation_time: Math.round(navigationTime)
      })
    }
  }
})

export default router