import { defineStore } from 'pinia'
import apiClient from '@/services/api'

export const useFilesStore = defineStore('files', {
  state: () => ({
    files: [],
    currentFile: null,
    uploadQueue: [],
    loading: false,
    uploading: false,
    error: null,
    
    // File management
    categories: [
      'blueprints',
      'documents',
      'images',
      'reports',
      'contracts',
      'invoices',
      'other'
    ],
    
    supportedFormats: {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
      blueprints: ['dwg', 'pdf', 'jpg', 'png', 'tiff'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      archives: ['zip', 'rar', '7z'],
      other: ['*']
    },
    
    maxFileSize: 50 * 1024 * 1024, // 50MB
    chunkSize: 1 * 1024 * 1024, // 1MB chunks for better reliability
    maxConcurrentUploads: 3, // Limit concurrent uploads
    compressionQuality: 0.8, // Image compression quality
    
    // Pagination
    pagination: {
      current_page: 1,
      per_page: 20,
      total: 0,
      last_page: 1
    },
    
    // Filters
    filters: {
      search: '',
      category: '',
      project_id: null,
      file_type: '',
      date_from: null,
      date_to: null
    }
  }),

  getters: {
    // Filter files
    filteredFiles: (state) => {
      let filtered = [...state.files]
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(file =>
          file.original_name.toLowerCase().includes(search) ||
          file.description?.toLowerCase().includes(search)
        )
      }
      
      if (state.filters.category) {
        filtered = filtered.filter(file => file.category === state.filters.category)
      }
      
      if (state.filters.project_id) {
        filtered = filtered.filter(file => file.project_id === state.filters.project_id)
      }
      
      if (state.filters.file_type) {
        filtered = filtered.filter(file => file.file_type === state.filters.file_type)
      }
      
      return filtered
    },

    // Files by project
    filesByProject: (state) => (projectId) => {
      return state.files.filter(file => file.project_id === projectId)
    },

    // Files by category
    filesByCategory: (state) => (category) => {
      return state.files.filter(file => file.category === category)
    },

    // Image files only
    imageFiles: (state) => {
      return state.files.filter(file => 
        state.supportedFormats.images.includes(file.file_extension?.toLowerCase())
      )
    },

    // Document files only
    documentFiles: (state) => {
      return state.files.filter(file => 
        state.supportedFormats.documents.includes(file.file_extension?.toLowerCase())
      )
    },

    // Upload progress
    uploadProgress: (state) => {
      if (state.uploadQueue.length === 0) return 0
      
      const totalFiles = state.uploadQueue.length
      const completedFiles = state.uploadQueue.filter(item => item.status === 'completed').length
      
      return Math.round((completedFiles / totalFiles) * 100)
    },

    // File statistics
    fileStats: (state) => {
      const stats = {
        total: state.files.length,
        by_category: {},
        by_type: {},
        total_size: 0
      }

      state.files.forEach(file => {
        // By category
        if (!stats.by_category[file.category]) {
          stats.by_category[file.category] = 0
        }
        stats.by_category[file.category]++

        // By type
        const extension = file.file_extension?.toLowerCase() || 'unknown'
        if (!stats.by_type[extension]) {
          stats.by_type[extension] = 0
        }
        stats.by_type[extension]++

        // Total size
        stats.total_size += file.file_size || 0
      })

      return stats
    },

    // Check if file type is supported
    isFileTypeSupported: (state) => (fileName) => {
      const extension = fileName.split('.').pop()?.toLowerCase()
      return Object.values(state.supportedFormats)
        .some(formats => formats.includes(extension) || formats.includes('*'))
    },

    // Get file type category
    getFileCategory: (state) => (fileName) => {
      const extension = fileName.split('.').pop()?.toLowerCase()
      
      for (const [category, extensions] of Object.entries(state.supportedFormats)) {
        if (extensions.includes(extension)) {
          return category
        }
      }
      
      return 'other'
    }
  },

  actions: {
    // Fetch files with pagination and filters
    async fetchFiles(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = {
          page: options.page || this.pagination.current_page,
          per_page: options.per_page || this.pagination.per_page,
          ...this.filters,
          ...options.filters
        }

        // Clean empty values
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })

        const response = await apiClient.get('/files', { params })
        
        this.files = response.data.data
        this.pagination = {
          current_page: response.data.meta.current_page,
          per_page: response.data.meta.per_page,
          total: response.data.meta.total,
          last_page: response.data.meta.last_page
        }

        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch files'
        console.error('Fetch files error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single file
    async fetchFile(id) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.get(`/files/${id}`)
        this.currentFile = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch file'
        console.error('Fetch file error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Enhanced upload files with chunking and compression
    async uploadFiles(files, projectId, options = {}) {
      this.uploading = true
      this.error = null
      
      // Process and compress files before upload
      const processedFiles = await this.preprocessFiles(Array.from(files))
      
      // Initialize upload queue with enhanced metadata
      const uploadItems = processedFiles.map(file => ({
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file: file.processedFile || file.originalFile,
        originalFile: file.originalFile,
        projectId,
        status: 'pending',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: (file.processedFile || file.originalFile).size,
        chunks: [],
        currentChunk: 0,
        error: null,
        result: null,
        compressionRatio: file.compressionRatio || 1,
        ...options
      }))
      
      this.uploadQueue.push(...uploadItems)

      try {
        // Process uploads with concurrency control
        await this.processUploadQueue(uploadItems)
        
        // Refresh file list
        await this.fetchFiles()
        
        return uploadItems.filter(item => item.status === 'completed').map(item => item.result)
      } catch (error) {
        this.error = error.message || 'Upload failed'
        console.error('Upload error:', error)
        throw error
      } finally {
        this.uploading = false
      }
    },

    // Preprocess files with compression and optimization
    async preprocessFiles(files) {
      const processedFiles = []
      
      for (const file of files) {
        let processedFile = null
        let compressionRatio = 1
        
        // Compress images
        if (file.type.startsWith('image/') && !file.type.includes('svg')) {
          try {
            const { compressedFile, ratio } = await this.compressImage(file)
            processedFile = compressedFile
            compressionRatio = ratio
          } catch (error) {
            console.warn('Image compression failed:', error)
            processedFile = file
          }
        }
        
        processedFiles.push({
          originalFile: file,
          processedFile,
          compressionRatio
        })
      }
      
      return processedFiles
    },

    // Process upload queue with concurrency control
    async processUploadQueue(uploadItems) {
      const semaphore = new Array(this.maxConcurrentUploads).fill(null)
      const uploadPromises = []
      
      for (let i = 0; i < uploadItems.length; i += this.maxConcurrentUploads) {
        const batch = uploadItems.slice(i, i + this.maxConcurrentUploads)
        const batchPromises = batch.map(item => this.uploadSingleFile(item))
        uploadPromises.push(...batchPromises)
        
        // Wait for current batch before processing next
        await Promise.allSettled(batchPromises)
      }
      
      return Promise.allSettled(uploadPromises)
    },

    // Enhanced single file upload with chunking
    async uploadSingleFile(uploadItem) {
      const { file, projectId, category, description } = uploadItem
      
      // Validate file
      if (!this.isFileTypeSupported(file.name)) {
        uploadItem.status = 'error'
        uploadItem.error = 'File type not supported'
        throw new Error('File type not supported')
      }
      
      if (file.size > this.maxFileSize) {
        uploadItem.status = 'error'
        uploadItem.error = 'File size too large'
        throw new Error('File size too large')
      }

      try {
        uploadItem.status = 'uploading'
        
        // Use chunked upload for large files
        if (file.size > 10 * 1024 * 1024) { // 10MB threshold for chunking
          return await this.uploadFileChunked(uploadItem)
        } else {
          return await this.uploadFileStandard(uploadItem)
        }
      } catch (error) {
        uploadItem.status = 'error'
        uploadItem.error = error.response?.data?.message || error.message || 'Upload failed'
        console.error('Single file upload error:', error)
        throw error
      }
    },

    // Standard upload for smaller files
    async uploadFileStandard(uploadItem) {
      const { file, projectId, category, description } = uploadItem
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)
      formData.append('category', category || this.getFileCategory(file.name))
      
      if (description) {
        formData.append('description', description)
      }

      const response = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          uploadItem.progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          uploadItem.uploadedBytes = progressEvent.loaded
        }
      })

      uploadItem.status = 'completed'
      uploadItem.result = response.data.data
      
      // Add to files array
      this.files.unshift(response.data.data)
      
      return response.data.data
    },

    // Chunked upload for large files
    async uploadFileChunked(uploadItem) {
      const { file, projectId, category, description } = uploadItem
      const totalChunks = Math.ceil(file.size / this.chunkSize)
      
      uploadItem.chunks = new Array(totalChunks).fill().map((_, index) => ({
        index,
        start: index * this.chunkSize,
        end: Math.min((index + 1) * this.chunkSize, file.size),
        uploaded: false,
        retryCount: 0
      }))
      
      // Initialize chunked upload session
      const initResponse = await apiClient.post('/files/chunked/init', {
        filename: file.name,
        total_size: file.size,
        total_chunks: totalChunks,
        project_id: projectId,
        category: category || this.getFileCategory(file.name),
        description: description || ''
      })
      
      const uploadSession = initResponse.data.upload_session
      
      try {
        // Upload chunks with retry logic
        const chunkPromises = uploadItem.chunks.map(chunk => 
          this.uploadChunk(uploadItem, chunk, uploadSession)
        )
        
        await Promise.all(chunkPromises)
        
        // Complete chunked upload
        const completeResponse = await apiClient.post(`/files/chunked/complete`, {
          upload_session: uploadSession
        })
        
        uploadItem.status = 'completed'
        uploadItem.result = completeResponse.data.data
        uploadItem.progress = 100
        
        // Add to files array
        this.files.unshift(completeResponse.data.data)
        
        return completeResponse.data.data
      } catch (error) {
        // Cleanup failed upload session
        await apiClient.delete(`/files/chunked/${uploadSession}`).catch(() => {})
        throw error
      }
    },

    // Upload individual chunk with retry logic
    async uploadChunk(uploadItem, chunk, uploadSession) {
      const { file } = uploadItem
      const maxRetries = 3
      
      const uploadSingleChunk = async () => {
        const chunkBlob = file.slice(chunk.start, chunk.end)
        const formData = new FormData()
        formData.append('chunk', chunkBlob)
        formData.append('upload_session', uploadSession)
        formData.append('chunk_index', chunk.index)
        
        const response = await apiClient.post('/files/chunked/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const chunkProgress = (progressEvent.loaded / progressEvent.total) * 100
            const totalProgress = uploadItem.chunks.reduce((acc, c) => {
              if (c.index === chunk.index) {
                return acc + (chunkProgress / uploadItem.chunks.length)
              }
              return acc + (c.uploaded ? (100 / uploadItem.chunks.length) : 0)
            }, 0)
            
            uploadItem.progress = Math.round(totalProgress)
            uploadItem.uploadedBytes = uploadItem.chunks.reduce((acc, c) => {
              if (c.uploaded || c.index === chunk.index) {
                const chunkSize = c.end - c.start
                return acc + (c.index === chunk.index ? 
                  (progressEvent.loaded / progressEvent.total) * chunkSize : 
                  chunkSize
                )
              }
              return acc
            }, 0)
          }
        })
        
        chunk.uploaded = true
        return response
      }
      
      // Retry logic for chunk upload
      while (chunk.retryCount <= maxRetries) {
        try {
          return await uploadSingleChunk()
        } catch (error) {
          chunk.retryCount++
          
          if (chunk.retryCount > maxRetries) {
            throw error
          }
          
          // Exponential backoff
          const delay = Math.pow(2, chunk.retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    },

    // Image compression utility
    async compressImage(file) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // Calculate new dimensions (maintain aspect ratio)
          const maxWidth = 1920
          const maxHeight = 1080
          
          let { width, height } = img
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            const compressionRatio = blob.size / file.size
            
            // Only use compressed version if it's significantly smaller
            if (compressionRatio < 0.8) {
              resolve({
                compressedFile: new File([blob], file.name, { 
                  type: blob.type || file.type,
                  lastModified: Date.now()
                }),
                ratio: compressionRatio
              })
            } else {
              resolve({
                compressedFile: file,
                ratio: 1
              })
            }
          }, file.type, this.compressionQuality)
        }
        
        img.onerror = () => resolve({ compressedFile: file, ratio: 1 })
        img.src = URL.createObjectURL(file)
      })
    },

    // Delete file
    async deleteFile(id) {
      this.loading = true
      this.error = null

      try {
        await apiClient.delete(`/files/${id}`)
        
        this.files = this.files.filter(f => f.id !== id)
        if (this.currentFile?.id === id) {
          this.currentFile = null
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete file'
        console.error('Delete file error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update file metadata
    async updateFile(id, fileData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiClient.put(`/files/${id}`, fileData)
        const updatedFile = response.data.data
        
        const index = this.files.findIndex(f => f.id === id)
        if (index !== -1) {
          this.files[index] = updatedFile
        }
        
        if (this.currentFile?.id === id) {
          this.currentFile = updatedFile
        }
        
        return updatedFile
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update file'
        console.error('Update file error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Download file
    async downloadFile(id, fileName) {
      try {
        const response = await apiClient.get(`/files/${id}/download`, {
          responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || `file_${id}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to download file'
        console.error('Download file error:', error)
        throw error
      }
    },

    // Get file preview URL
    getPreviewUrl(file) {
      if (!file || !file.id) return null
      
      // Check if file supports preview
      const previewableTypes = [
        ...this.supportedFormats.images,
        'pdf'
      ]
      
      if (!previewableTypes.includes(file.file_extension?.toLowerCase())) {
        return null
      }
      
      return `${apiClient.defaults.baseURL}/files/${file.id}/preview`
    },

    // Get file thumbnail URL
    getThumbnailUrl(file) {
      if (!file || !file.id) return null
      
      // Only images have thumbnails
      if (!this.supportedFormats.images.includes(file.file_extension?.toLowerCase())) {
        return null
      }
      
      return `${apiClient.defaults.baseURL}/files/${file.id}/thumbnail`
    },

    // Clear upload queue
    clearUploadQueue() {
      this.uploadQueue = []
    },

    // Remove upload item from queue
    removeUploadItem(id) {
      this.uploadQueue = this.uploadQueue.filter(item => item.id !== id)
    },

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },

    // Clear filters
    clearFilters() {
      this.filters = {
        search: '',
        category: '',
        project_id: null,
        file_type: '',
        date_from: null,
        date_to: null
      }
    },

    // Set current page
    setPage(page) {
      this.pagination.current_page = page
    },

    // Set items per page
    setPerPage(perPage) {
      this.pagination.per_page = perPage
      this.pagination.current_page = 1 // Reset to first page
    },

    // Clear current file
    clearCurrentFile() {
      this.currentFile = null
    },

    // Clear all data
    clearData() {
      this.files = []
      this.currentFile = null
      this.uploadQueue = []
      this.error = null
      this.pagination = {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1
      }
    },

    // Enhanced format file size with transfer speed estimation
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    // Estimate upload time based on connection speed
    estimateUploadTime(fileSize) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      if (!connection) {
        return 'Unknown'
      }
      
      // Estimate based on effective connection type
      const speedMap = {
        'slow-2g': 50 * 1024, // 50 KB/s
        '2g': 100 * 1024,     // 100 KB/s
        '3g': 1000 * 1024,    // 1 MB/s
        '4g': 5000 * 1024     // 5 MB/s
      }
      
      const estimatedSpeed = speedMap[connection.effectiveType] || speedMap['4g']
      const estimatedSeconds = fileSize / estimatedSpeed
      
      if (estimatedSeconds < 60) {
        return `~${Math.ceil(estimatedSeconds)}s`
      } else {
        return `~${Math.ceil(estimatedSeconds / 60)}min`
      }
    },

    // Cancel upload
    cancelUpload(uploadId) {
      const uploadItem = this.uploadQueue.find(item => item.id === uploadId)
      if (uploadItem) {
        uploadItem.status = 'cancelled'
        uploadItem.error = 'Upload cancelled by user'
        
        // Remove from queue
        this.uploadQueue = this.uploadQueue.filter(item => item.id !== uploadId)
      }
    },

    // Pause/Resume upload (for future implementation)
    pauseUpload(uploadId) {
      const uploadItem = this.uploadQueue.find(item => item.id === uploadId)
      if (uploadItem) {
        uploadItem.status = 'paused'
      }
    },

    resumeUpload(uploadId) {
      const uploadItem = this.uploadQueue.find(item => item.id === uploadId)
      if (uploadItem && uploadItem.status === 'paused') {
        uploadItem.status = 'uploading'
        // Re-trigger upload logic
        this.uploadSingleFile(uploadItem)
      }
    }
  }
})