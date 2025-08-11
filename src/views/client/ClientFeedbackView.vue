<template>
  <ClientReviewLayout>
    <div class="client-feedback-page">
      <!-- Feedback Header -->
      <div class="feedback-header">
        <Card class="header-card">
          <template #content>
            <div class="header-content">
              <div class="header-icon">
                <i class="pi pi-star"></i>
              </div>
              <div class="header-text">
                <h1 class="feedback-title">Share Your Experience</h1>
                <p class="feedback-description">
                  Your feedback helps us improve our service and ensures your project meets your expectations.
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Feedback Form -->
      <div class="feedback-form-section">
        <Card class="feedback-form-card">
          <template #header>
            <div class="form-header">
              <h2>Project Feedback</h2>
              <p>{{ clientStore.currentProject?.name }}</p>
            </div>
          </template>

          <template #content>
            <form @submit.prevent="submitFeedback" class="feedback-form">
              <!-- Overall Rating -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-star"></i>
                  Overall Rating
                </h3>
                <p class="section-description">
                  How would you rate your overall experience with this project?
                </p>
                
                <div class="rating-container">
                  <Rating
                    v-model="form.overallRating"
                    :stars="5"
                    :cancel="false"
                    class="custom-rating"
                    @change="onRatingChange"
                  />
                  <span class="rating-text">{{ getRatingText(form.overallRating) }}</span>
                </div>
              </div>

              <!-- Detailed Ratings -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-chart-line"></i>
                  Detailed Ratings
                </h3>
                <p class="section-description">
                  Please rate different aspects of your project experience:
                </p>
                
                <div class="detailed-ratings">
                  <div 
                    v-for="aspect in ratingAspects" 
                    :key="aspect.key"
                    class="rating-aspect"
                  >
                    <div class="aspect-info">
                      <label class="aspect-label">
                        <i :class="aspect.icon"></i>
                        {{ aspect.label }}
                      </label>
                      <small class="aspect-description">{{ aspect.description }}</small>
                    </div>
                    <div class="aspect-rating">
                      <Rating
                        v-model="form.detailedRatings[aspect.key]"
                        :stars="5"
                        :cancel="false"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Comments Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-comment"></i>
                  Your Comments
                </h3>
                <p class="section-description">
                  Tell us more about your experience (optional):
                </p>
                
                <Textarea
                  v-model="form.comments"
                  rows="6"
                  placeholder="Share your thoughts about the project, team performance, communication, quality of work, or any suggestions for improvement..."
                  class="feedback-textarea"
                />
                <small class="char-counter">
                  {{ form.comments.length }}/1000 characters
                </small>
              </div>

              <!-- File Attachments -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-paperclip"></i>
                  Attachments (Optional)
                </h3>
                <p class="section-description">
                  Upload photos or documents related to your feedback:
                </p>
                
                <FileUpload
                  mode="advanced"
                  :multiple="true"
                  accept="image/*,.pdf,.doc,.docx"
                  :maxFileSize="5000000"
                  :fileLimit="5"
                  @upload="onFileUpload"
                  @remove="onFileRemove"
                  @select="onFileSelect"
                  class="feedback-upload"
                >
                  <template #header="{ chooseCallback, clearCallback, files }">
                    <div class="upload-header">
                      <Button
                        @click="chooseCallback()"
                        icon="pi pi-plus"
                        label="Choose Files"
                        severity="secondary"
                      />
                      <Button
                        @click="clearCallback()"
                        icon="pi pi-times"
                        label="Clear"
                        severity="secondary"
                        :disabled="!files || files.length === 0"
                      />
                    </div>
                  </template>
                  
                  <template #content="{ files, removeFileCallback }">
                    <div v-if="files.length > 0" class="upload-files">
                      <div 
                        v-for="(file, index) of files" 
                        :key="`${file.name}-${index}`"
                        class="upload-file"
                      >
                        <div class="file-info">
                          <img 
                            v-if="file.type.startsWith('image/')"
                            :src="getFilePreview(file)"
                            class="file-preview"
                          />
                          <div v-else class="file-icon">
                            <i class="pi pi-file"></i>
                          </div>
                          <div class="file-details">
                            <span class="file-name">{{ file.name }}</span>
                            <small class="file-size">{{ formatFileSize(file.size) }}</small>
                          </div>
                        </div>
                        <Button
                          icon="pi pi-times"
                          @click="removeFileCallback(index)"
                          size="small"
                          severity="danger"
                          text
                        />
                      </div>
                    </div>
                    <div v-else class="upload-empty">
                      <i class="pi pi-cloud-upload"></i>
                      <p>Drag and drop files here or click "Choose Files"</p>
                      <small>Maximum 5 files, 5MB each. Supported: Images, PDF, Word documents</small>
                    </div>
                  </template>
                </FileUpload>
              </div>

              <!-- Contact Information -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-user"></i>
                  Contact Information (Optional)
                </h3>
                <p class="section-description">
                  Provide your contact details if you'd like a follow-up:
                </p>
                
                <div class="contact-fields">
                  <div class="field-group">
                    <label for="clientName">Your Name</label>
                    <InputText
                      id="clientName"
                      v-model="form.clientName"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div class="field-group">
                    <label for="clientEmail">Email Address</label>
                    <InputText
                      id="clientEmail"
                      v-model="form.clientEmail"
                      type="email"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div class="field-group">
                    <label for="clientPhone">Phone Number</label>
                    <InputText
                      id="clientPhone"
                      v-model="form.clientPhone"
                      placeholder="(435) 555-0123"
                    />
                  </div>
                </div>
                
                <div class="contact-preferences">
                  <div class="preference-item">
                    <Checkbox
                      id="followUp"
                      v-model="form.requestFollowUp"
                      binary
                    />
                    <label for="followUp">I would like someone to follow up with me about this feedback</label>
                  </div>
                </div>
              </div>

              <!-- Recommendation -->
              <div class="form-section">
                <h3 class="section-title">
                  <i class="pi pi-heart"></i>
                  Recommendation
                </h3>
                <p class="section-description">
                  Would you recommend Unified Contractors to others?
                </p>
                
                <div class="recommendation-options">
                  <div 
                    v-for="option in recommendationOptions" 
                    :key="option.value"
                    class="recommendation-option"
                    :class="{ active: form.wouldRecommend === option.value }"
                    @click="form.wouldRecommend = option.value"
                  >
                    <div class="option-icon" :class="option.class">
                      <i :class="option.icon"></i>
                    </div>
                    <div class="option-content">
                      <span class="option-title">{{ option.label }}</span>
                      <small class="option-description">{{ option.description }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Section -->
              <div class="form-section submit-section">
                <div class="submit-info">
                  <div class="privacy-notice">
                    <i class="pi pi-shield"></i>
                    <div>
                      <strong>Privacy Notice:</strong> Your feedback will be shared with the project team to improve service quality. 
                      Contact information is optional and will only be used for follow-up if requested.
                    </div>
                  </div>
                </div>
                
                <div class="submit-actions">
                  <Button
                    type="submit"
                    label="Submit Feedback"
                    icon="pi pi-send"
                    :loading="submitting"
                    :disabled="!isFormValid"
                    class="submit-button"
                  />
                  <Button
                    label="Clear Form"
                    icon="pi pi-refresh"
                    severity="secondary"
                    @click="clearForm"
                    :disabled="submitting"
                  />
                </div>
              </div>
            </form>
          </template>
        </Card>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccess" class="success-message">
        <Card class="success-card">
          <template #content>
            <div class="success-content">
              <div class="success-icon">
                <i class="pi pi-check-circle"></i>
              </div>
              <h3>Thank You for Your Feedback!</h3>
              <p>
                Your feedback has been submitted successfully. 
                <span v-if="form.requestFollowUp">Someone from our team will contact you soon.</span>
              </p>
              <div class="success-actions">
                <Button
                  label="Back to Project"
                  icon="pi pi-arrow-left"
                  @click="goBackToProject"
                />
                <Button
                  label="Submit Another Review"
                  icon="pi pi-plus"
                  severity="secondary"
                  @click="resetForNewReview"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </ClientReviewLayout>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useClientStore } from '@/stores/client'
import ClientReviewLayout from '@/components/layout/ClientReviewLayout.vue'
import Card from 'primevue/card'
import Rating from 'primevue/rating'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import FileUpload from 'primevue/fileupload'

const props = defineProps({
  token: {
    type: String,
    required: true
  }
})

const router = useRouter()
const toast = useToast()
const clientStore = useClientStore()

// Form state
const form = reactive({
  overallRating: 0,
  detailedRatings: {
    communication: 0,
    quality: 0,
    timeliness: 0,
    professionalism: 0,
    cleanliness: 0
  },
  comments: '',
  attachments: [],
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  requestFollowUp: false,
  wouldRecommend: null
})

const submitting = ref(false)
const showSuccess = ref(false)

// Rating aspects configuration
const ratingAspects = [
  {
    key: 'communication',
    label: 'Communication',
    description: 'How well did the team keep you informed?',
    icon: 'pi pi-comments'
  },
  {
    key: 'quality',
    label: 'Work Quality',
    description: 'Quality of craftsmanship and materials',
    icon: 'pi pi-star'
  },
  {
    key: 'timeliness',
    label: 'Schedule',
    description: 'Did the project stay on schedule?',
    icon: 'pi pi-clock'
  },
  {
    key: 'professionalism',
    label: 'Professionalism',
    description: 'Team behavior and work ethic',
    icon: 'pi pi-user-plus'
  },
  {
    key: 'cleanliness',
    label: 'Site Cleanliness',
    description: 'How well was the work site maintained?',
    icon: 'pi pi-home'
  }
]

// Recommendation options
const recommendationOptions = [
  {
    value: 'definitely',
    label: 'Definitely Yes',
    description: 'Absolutely would recommend',
    icon: 'pi pi-thumbs-up',
    class: 'positive'
  },
  {
    value: 'probably',
    label: 'Probably Yes',
    description: 'Likely would recommend',
    icon: 'pi pi-check',
    class: 'positive'
  },
  {
    value: 'maybe',
    label: 'Maybe',
    description: 'Not sure, depends on situation',
    icon: 'pi pi-minus',
    class: 'neutral'
  },
  {
    value: 'probably_not',
    label: 'Probably Not',
    description: 'Unlikely to recommend',
    icon: 'pi pi-times',
    class: 'negative'
  },
  {
    value: 'definitely_not',
    label: 'Definitely Not',
    description: 'Would not recommend',
    icon: 'pi pi-thumbs-down',
    class: 'negative'
  }
]

// Computed properties
const isFormValid = computed(() => {
  return form.overallRating > 0 && form.wouldRecommend !== null
})

// Methods
const getRatingText = (rating) => {
  const texts = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
  return texts[rating] || 'Not rated'
}

const onRatingChange = (event) => {
  // Auto-populate detailed ratings based on overall rating if they're not set
  if (Object.values(form.detailedRatings).every(rating => rating === 0)) {
    Object.keys(form.detailedRatings).forEach(key => {
      form.detailedRatings[key] = event.value
    })
  }
}

const onFileSelect = (event) => {
  form.attachments = event.files
}

const onFileUpload = (event) => {
  // Handle successful upload
  console.log('Files uploaded:', event.files)
}

const onFileRemove = (event) => {
  // Update attachments array
  form.attachments = form.attachments.filter(file => file !== event.file)
}

const getFilePreview = (file) => {
  return URL.createObjectURL(file)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const submitFeedback = async () => {
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Incomplete Form',
      detail: 'Please provide an overall rating and recommendation',
      life: 3000
    })
    return
  }

  try {
    submitting.value = true

    // Prepare feedback data
    const feedbackData = {
      ...form,
      token: props.token,
      submittedAt: new Date().toISOString()
    }

    // Submit to store
    await clientStore.submitFeedback(feedbackData)

    // Show success
    showSuccess.value = true
    
    // Scroll to success message
    setTimeout(() => {
      document.querySelector('.success-message')?.scrollIntoView({
        behavior: 'smooth'
      })
    }, 100)

    toast.add({
      severity: 'success',
      summary: 'Feedback Submitted',
      detail: 'Thank you for your valuable feedback!',
      life: 5000
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    
    toast.add({
      severity: 'error',
      summary: 'Submission Failed',
      detail: error.message || 'Failed to submit feedback. Please try again.',
      life: 5000
    })
  } finally {
    submitting.value = false
  }
}

const clearForm = () => {
  // Reset form to initial state
  Object.assign(form, {
    overallRating: 0,
    detailedRatings: {
      communication: 0,
      quality: 0,
      timeliness: 0,
      professionalism: 0,
      cleanliness: 0
    },
    comments: '',
    attachments: [],
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    requestFollowUp: false,
    wouldRecommend: null
  })

  toast.add({
    severity: 'info',
    summary: 'Form Cleared',
    detail: 'All fields have been reset',
    life: 2000
  })
}

const goBackToProject = () => {
  router.push({
    name: 'client-review',
    params: { token: props.token }
  })
}

const resetForNewReview = () => {
  showSuccess.value = false
  clearForm()
  
  // Scroll to top
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.client-feedback-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

/* Header */
.feedback-header {
  margin-bottom: 1rem;
}

.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  border: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
}

.header-icon {
  font-size: 3rem;
  opacity: 0.9;
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.feedback-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.feedback-description {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
  line-height: 1.6;
}

/* Form */
.feedback-form-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e2e8f0;
}

.form-header {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.form-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.form-header p {
  color: #64748b;
  margin: 0;
}

.feedback-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

/* Rating */
.rating-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.custom-rating {
  font-size: 2rem;
}

.rating-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3b82f6;
}

.detailed-ratings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rating-aspect {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.aspect-info {
  flex: 1;
}

.aspect-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
  cursor: pointer;
}

.aspect-description {
  color: #64748b;
  line-height: 1.4;
}

.aspect-rating {
  flex-shrink: 0;
}

/* Comments */
.feedback-textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
}

.char-counter {
  display: block;
  text-align: right;
  color: #64748b;
  margin-top: 0.5rem;
}

/* File Upload */
.feedback-upload {
  width: 100%;
}

.upload-header {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.upload-files {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.upload-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.file-preview {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 6px;
  font-size: 1.2rem;
  color: #64748b;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #1e293b;
}

.file-size {
  color: #64748b;
}

.upload-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.upload-empty i {
  font-size: 2.5rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

/* Contact Fields */
.contact-fields {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-bottom: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-weight: 600;
  color: #374151;
}

.contact-preferences {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.preference-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.preference-item label {
  line-height: 1.6;
  color: #374151;
  cursor: pointer;
}

/* Recommendation */
.recommendation-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recommendation-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.recommendation-option:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.recommendation-option.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.option-icon.positive { 
  background: #dcfce7; 
  color: #16a34a; 
}

.option-icon.neutral { 
  background: #fef3c7; 
  color: #d97706; 
}

.option-icon.negative { 
  background: #fee2e2; 
  color: #dc2626; 
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.option-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.option-description {
  color: #64748b;
  line-height: 1.4;
}

/* Submit Section */
.submit-section {
  background: #f8fafc;
  padding: 2rem !important;
  margin: 2rem -2rem 0 -2rem;
  border-radius: 0 0 16px 16px;
}

.submit-info {
  margin-bottom: 1.5rem;
}

.privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #dbeafe;
}

.privacy-notice i {
  color: #3b82f6;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.privacy-notice div {
  color: #1e40af;
  line-height: 1.6;
}

.submit-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.submit-button {
  min-width: 160px;
}

/* Success Message */
.success-message {
  margin-top: 2rem;
}

.success-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 16px;
}

.success-content {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  font-size: 4rem;
  color: #22c55e;
  margin-bottom: 1rem;
}

.success-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #15803d;
  margin: 0 0 1rem 0;
}

.success-content p {
  color: #166534;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .header-icon {
    font-size: 2.5rem;
  }

  .feedback-title {
    font-size: 1.5rem;
  }

  .feedback-form {
    padding: 1.5rem;
  }

  .rating-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .custom-rating {
    font-size: 1.5rem;
  }

  .rating-aspect {
    flex-direction: column;
    gap: 1rem;
  }

  .contact-fields {
    grid-template-columns: 1fr;
  }

  .recommendation-options {
    gap: 0.5rem;
  }

  .recommendation-option {
    padding: 0.75rem;
  }

  .option-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .submit-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .success-actions {
    flex-direction: column;
    align-items: center;
  }

  .submit-section {
    margin-left: -1.5rem;
    margin-right: -1.5rem;
  }
}

@media (max-width: 480px) {
  .feedback-form {
    padding: 1rem;
  }

  .detailed-ratings {
    gap: 1rem;
  }

  .rating-aspect {
    padding: 0.75rem;
  }

  .upload-files {
    padding: 0.75rem;
  }

  .submit-section {
    padding: 1.5rem !important;
    margin-left: -1rem;
    margin-right: -1rem;
  }
}
</style>