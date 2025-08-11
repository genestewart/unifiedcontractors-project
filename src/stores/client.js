import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clientApi } from '@/services/api/client'

export const useClientStore = defineStore('client', () => {
  // State
  const currentProject = ref(null)
  const projectFiles = ref([])
  const token = ref(null)
  const tokenInfo = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const feedback = ref({
    rating: 0,
    comment: '',
    attachments: []
  })

  // Computed properties
  const isTokenValid = computed(() => {
    if (!tokenInfo.value) return false
    
    const now = new Date()
    const expiresAt = new Date(tokenInfo.value.expires_at)
    
    return now <= expiresAt && !tokenInfo.value.is_revoked
  })

  const fileCategories = computed(() => {
    if (!projectFiles.value.length) return []
    
    const categories = {}
    
    projectFiles.value.forEach(file => {
      const category = file.category || 'other'
      if (!categories[category]) {
        categories[category] = {
          name: category,
          label: getCategoryLabel(category),
          icon: getCategoryIcon(category),
          files: [],
          count: 0
        }
      }
      categories[category].files.push(file)
      categories[category].count++
    })
    
    return Object.values(categories)
  })

  const imageFiles = computed(() => {
    return projectFiles.value.filter(file => 
      file.mime_type?.startsWith('image/') || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.filename)
    )
  })

  const documentFiles = computed(() => {
    return projectFiles.value.filter(file => 
      !file.mime_type?.startsWith('image/') && 
      !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.filename)
    )
  })

  const progressPhotos = computed(() => {
    return imageFiles.value.filter(file => 
      file.category === 'progress' || 
      file.tags?.includes('progress')
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  })

  const beforeAfterPhotos = computed(() => {
    return imageFiles.value.filter(file => 
      file.category === 'before_after' || 
      file.tags?.includes('before') || 
      file.tags?.includes('after')
    )
  })

  // Actions
  const validateToken = async (qrToken) => {
    try {
      loading.value = true
      error.value = null
      token.value = qrToken

      // API call to validate token and get project info
      const response = await clientApi.validateToken(qrToken)
      
      if (response.valid) {
        tokenInfo.value = response.token_info
        currentProject.value = response.project
        
        // Track the token usage
        await trackTokenUsage(qrToken)
        
        return true
      } else {
        throw new Error(response.message || 'Invalid or expired token')
      }
      
    } catch (err) {
      error.value = err.message || 'Token validation failed'
      console.error('Token validation error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const loadProjectData = async () => {
    if (!token.value || !isTokenValid.value) {
      throw new Error('Valid token required')
    }

    try {
      loading.value = true
      error.value = null

      // Load project files
      const filesResponse = await clientApi.getProjectFiles(token.value)
      projectFiles.value = filesResponse.files || []

      return true
    } catch (err) {
      error.value = err.message || 'Failed to load project data'
      console.error('Load project data error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const submitFeedback = async (feedbackData) => {
    if (!token.value || !isTokenValid.value) {
      throw new Error('Valid token required')
    }

    try {
      loading.value = true
      error.value = null

      const formData = new FormData()
      formData.append('token', token.value)
      formData.append('overall_rating', feedbackData.overallRating)
      formData.append('detailed_ratings', JSON.stringify(feedbackData.detailedRatings))
      formData.append('comments', feedbackData.comments || '')
      formData.append('client_name', feedbackData.clientName || '')
      formData.append('client_email', feedbackData.clientEmail || '')
      formData.append('client_phone', feedbackData.clientPhone || '')
      formData.append('request_follow_up', feedbackData.requestFollowUp || false)
      formData.append('would_recommend', feedbackData.wouldRecommend || '')

      // Add file attachments if any
      if (feedbackData.attachments && feedbackData.attachments.length > 0) {
        feedbackData.attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file)
        })
      }

      const response = await clientApi.submitFeedback(formData)

      // Clear feedback form
      feedback.value = {
        rating: 0,
        comment: '',
        attachments: []
      }

      return response
    } catch (err) {
      error.value = err.message || 'Failed to submit feedback'
      console.error('Submit feedback error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const trackTokenUsage = async (qrToken) => {
    try {
      await clientApi.trackTokenUsage({
        token: qrToken,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      })
    } catch (err) {
      // Non-critical error, just log it
      console.warn('Failed to track token usage:', err)
    }
  }

  const getFileUrl = (file) => {
    if (!file || !token.value) return null
    
    // Generate authenticated URL for client file access
    return `/api/client/file/${token.value}/${file.id}`
  }

  const getThumbnailUrl = (file, size = 'medium') => {
    if (!file || !token.value) return null
    
    if (file.mime_type?.startsWith('image/')) {
      return `/api/client/thumbnail/${token.value}/${file.id}/${size}`
    }
    
    // Return appropriate file type icon
    return getFileTypeIcon(file.filename)
  }

  const downloadFile = async (file) => {
    if (!file || !token.value) return
    
    try {
      const response = await clientApi.downloadFile(token.value, file.id)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Download error:', err)
      throw new Error(err.message || 'Failed to download file')
    }
  }

  const shareProject = async (method = 'link') => {
    if (!currentProject.value || !token.value) return null
    
    const shareData = {
      title: `${currentProject.value.name} - Project Review`,
      text: `View the progress of my construction project: ${currentProject.value.name}`,
      url: `${window.location.origin}/client/review/${token.value}`
    }
    
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share(shareData)
        return true
      } catch (err) {
        console.warn('Native share failed:', err)
        // Fallback to clipboard
        method = 'clipboard'
      }
    }
    
    if (method === 'clipboard') {
      try {
        await navigator.clipboard.writeText(shareData.url)
        return shareData.url
      } catch (err) {
        console.warn('Clipboard write failed:', err)
        return shareData.url
      }
    }
    
    return shareData.url
  }

  // Utility functions
  const getCategoryLabel = (category) => {
    const labels = {
      'progress': 'Progress Photos',
      'before_after': 'Before & After',
      'blueprints': 'Blueprints & Plans',
      'documents': 'Documents',
      'permits': 'Permits & Approvals',
      'materials': 'Materials & Samples',
      'final': 'Final Photos',
      'other': 'Other Files'
    }
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'progress': 'pi-camera',
      'before_after': 'pi-images',
      'blueprints': 'pi-map',
      'documents': 'pi-file-pdf',
      'permits': 'pi-verified',
      'materials': 'pi-box',
      'final': 'pi-star',
      'other': 'pi-folder'
    }
    return icons[category] || 'pi-file'
  }

  const getFileTypeIcon = (filename) => {
    const extension = filename.toLowerCase().split('.').pop()
    // Using placeholder approach until actual icons are available
    const iconMap = {
      'pdf': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZGM2MjI2IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiI+UERGPC90ZXh0Pjwvc3ZnPg==',
      'doc': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzI4OWU2IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+RE9DPC90ZXh0Pjwvc3ZnPg==',
      'docx': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzI4OWU2IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+RE9DPC90ZXh0Pjwvc3ZnPg==',
      'xls': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjJjNTVlIiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+WExTPC90ZXh0Pjwvc3ZnPg==',
      'xlsx': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjJjNTVlIiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+WExTPC90ZXh0Pjwvc3ZnPg==',
      'txt': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNjQ3NDhiIiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+VFhUPC90ZXh0Pjwvc3ZnPg==',
      'zip': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjU5ZTBiIiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+WklQPC90ZXh0Pjwvc3ZnPg==',
      'rar': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjU5ZTBiIiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+UkFSPC90ZXh0Pjwvc3ZnPg==',
      'dwg': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjOGI1Y2Y2IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMCI+RFdHPC90ZXh0Pjwvc3ZnPg==',
      'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjOTRhM2I4IiByeD0iNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI4Ij5GSUxFPC90ZXh0Pjwvc3ZnPg=='
    }
    return iconMap[extension] || iconMap.default
  }

  const getFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Reset store state
  const resetStore = () => {
    currentProject.value = null
    projectFiles.value = []
    token.value = null
    tokenInfo.value = null
    loading.value = false
    error.value = null
    feedback.value = {
      rating: 0,
      comment: '',
      attachments: []
    }
  }

  return {
    // State
    currentProject,
    projectFiles,
    token,
    tokenInfo,
    loading,
    error,
    feedback,
    
    // Computed
    isTokenValid,
    fileCategories,
    imageFiles,
    documentFiles,
    progressPhotos,
    beforeAfterPhotos,
    
    // Actions
    validateToken,
    loadProjectData,
    submitFeedback,
    trackTokenUsage,
    getFileUrl,
    getThumbnailUrl,
    downloadFile,
    shareProject,
    resetStore,
    
    // Utilities
    getCategoryLabel,
    getCategoryIcon,
    getFileTypeIcon,
    getFileSize,
    formatDate
  }
})