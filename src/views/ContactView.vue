<template>
  <main class="contact-page">
    <div class="page-header">
      <div class="container">
        <h1>Contact Us</h1>
        <p class="lead">
          Get your free consultation and estimate today
        </p>
      </div>
    </div>

    <section class="contact-section section">
      <div class="container">
        <div class="row g-5">
          <div class="col-lg-8">
            <div class="contact-form-wrapper">
              <h2 id="contact-form-heading">
                Request Your Free Estimate
              </h2>
              <form
                class="contact-form"
                role="form"
                aria-labelledby="contact-form-heading"
                novalidate
                @submit.prevent="handleSubmit"
              >
                <!-- Personal Information Fieldset -->
                <fieldset class="form-fieldset">
                  <legend class="form-legend">
                    Personal Information
                  </legend>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="form-group">
                        <label for="firstName">
                          First Name 
                          <span
                            class="required-indicator"
                            aria-label="required"
                          >*</span>
                        </label>
                        <input
                          id="firstName"
                          v-model="form.firstName"
                          type="text"
                          required
                          aria-required="true"
                          aria-describedby="firstName-error"
                          class="form-control"
                          :class="{ 'error': formErrors.firstName }"
                        >
                        <div
                          id="firstName-error"
                          class="error-message"
                          role="alert"
                          :aria-live="formErrors.firstName ? 'polite' : 'off'"
                        >
                          {{ formErrors.firstName }}
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group">
                        <label for="lastName">
                          Last Name 
                          <span
                            class="required-indicator"
                            aria-label="required"
                          >*</span>
                        </label>
                        <input
                          id="lastName"
                          v-model="form.lastName"
                          type="text"
                          required
                          aria-required="true"
                          aria-describedby="lastName-error"
                          class="form-control"
                          :class="{ 'error': formErrors.lastName }"
                        >
                        <div
                          id="lastName-error"
                          class="error-message"
                          role="alert"
                          :aria-live="formErrors.lastName ? 'polite' : 'off'"
                        >
                          {{ formErrors.lastName }}
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <!-- Contact Information Fieldset -->
                <fieldset class="form-fieldset">
                  <legend class="form-legend">
                    Contact Information
                  </legend>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="form-group">
                        <label for="email">
                          Email Address 
                          <span
                            class="required-indicator"
                            aria-label="required"
                          >*</span>
                        </label>
                        <input
                          id="email"
                          v-model="form.email"
                          type="email"
                          required
                          aria-required="true"
                          aria-describedby="email-error email-help"
                          class="form-control"
                          :class="{ 'error': formErrors.email }"
                          autocomplete="email"
                        >
                        <div
                          id="email-help"
                          class="form-help"
                        >
                          We'll use this to send you your estimate
                        </div>
                        <div
                          id="email-error"
                          class="error-message"
                          role="alert"
                          :aria-live="formErrors.email ? 'polite' : 'off'"
                        >
                          {{ formErrors.email }}
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group">
                        <label for="phone">
                          Phone Number 
                          <span
                            class="required-indicator"
                            aria-label="required"
                          >*</span>
                        </label>
                        <input
                          id="phone"
                          v-model="form.phone"
                          type="tel"
                          required
                          aria-required="true"
                          aria-describedby="phone-error phone-help"
                          class="form-control"
                          :class="{ 'error': formErrors.phone }"
                          autocomplete="tel"
                          placeholder="(435) 555-0123"
                        >
                        <div
                          id="phone-help"
                          class="form-help"
                        >
                          Include area code for faster response
                        </div>
                        <div
                          id="phone-error"
                          class="error-message"
                          role="alert"
                          :aria-live="formErrors.phone ? 'polite' : 'off'"
                        >
                          {{ formErrors.phone }}
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <!-- Project Information Fieldset -->
                <fieldset class="form-fieldset">
                  <legend class="form-legend">
                    Project Information
                  </legend>
                  <div class="form-group">
                    <label for="service">
                      Service Needed 
                      <span
                        class="required-indicator"
                        aria-label="required"
                      >*</span>
                    </label>
                    <select
                      id="service"
                      v-model="form.service"
                      required
                      aria-required="true"
                      aria-describedby="service-error"
                      class="form-control"
                      :class="{ 'error': formErrors.service }"
                    >
                      <option value="">
                        Select a service
                      </option>
                      <option value="custom-home">
                        Custom Home Construction
                      </option>
                      <option value="design">
                        Design Services
                      </option>
                      <option value="remodeling">
                        Remodeling
                      </option>
                      <option value="water-damage">
                        Water Damage Restoration
                      </option>
                      <option value="sump-pump">
                        Sump Pump Systems
                      </option>
                      <option value="other">
                        Other
                      </option>
                    </select>
                    <div
                      id="service-error"
                      class="error-message"
                      role="alert"
                      :aria-live="formErrors.service ? 'polite' : 'off'"
                    >
                      {{ formErrors.service }}
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="message">
                      Project Details 
                      <span
                        class="required-indicator"
                        aria-label="required"
                      >*</span>
                    </label>
                    <textarea
                      id="message"
                      v-model="form.message"
                      required
                      aria-required="true"
                      aria-describedby="message-error message-help"
                      rows="5"
                      class="form-control"
                      :class="{ 'error': formErrors.message }"
                      placeholder="Tell us about your project..."
                      maxlength="1000"
                    />
                    <div
                      id="message-help"
                      class="form-help"
                    >
                      {{ 1000 - form.message.length }} characters remaining
                    </div>
                    <div
                      id="message-error"
                      class="error-message"
                      role="alert"
                      :aria-live="formErrors.message ? 'polite' : 'off'"
                    >
                      {{ formErrors.message }}
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="timeline">Project Timeline</label>
                    <select
                      id="timeline"
                      v-model="form.timeline"
                      aria-describedby="timeline-help"
                      class="form-control"
                    >
                      <option value="">
                        Select timeline (optional)
                      </option>
                      <option value="asap">
                        As soon as possible
                      </option>
                      <option value="1-month">
                        Within 1 month
                      </option>
                      <option value="3-months">
                        Within 3 months
                      </option>
                      <option value="6-months">
                        Within 6 months
                      </option>
                      <option value="planning">
                        Just planning
                      </option>
                    </select>
                    <div
                      id="timeline-help"
                      class="form-help"
                    >
                      This helps us prioritize your request
                    </div>
                  </div>
                </fieldset>

                <div
                  v-if="submitError"
                  class="form-error-summary"
                  role="alert"
                  aria-live="polite"
                >
                  <h3>Please correct the following errors:</h3>
                  <ul>
                    <li
                      v-for="error in Object.values(formErrors)"
                      :key="error"
                    >
                      {{ error }}
                    </li>
                  </ul>
                </div>

                <div
                  v-if="submitSuccess"
                  class="form-success-message"
                  role="status"
                  aria-live="polite"
                >
                  Thank you! Your request has been submitted successfully. We'll contact you within 24 hours.
                </div>

                <button
                  type="submit"
                  class="btn-submit"
                  :disabled="isSubmitting"
                  :aria-busy="isSubmitting.toString()"
                >
                  <span v-if="isSubmitting">Sending...</span>
                  <span v-else>Send Message</span>
                </button>
              </form>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="contact-info">
              <div class="info-card">
                <h3>Get In Touch</h3>
                <div class="info-item">
                  <i class="pi pi-phone" />
                  <div>
                    <h4>24/7 Emergency</h4>
                    <a href="tel:435-555-0100">(435) 555-0100</a>
                  </div>
                </div>
                <div class="info-item">
                  <i class="pi pi-envelope" />
                  <div>
                    <h4>Email</h4>
                    <a href="mailto:info@unifiedcontractors.com">info@unifiedcontractors.com</a>
                  </div>
                </div>
                <div class="info-item">
                  <i class="pi pi-map-marker" />
                  <div>
                    <h4>Office</h4>
                    <p>8343 N Silver Creek Rd<br>Park City, UT 84098</p>
                  </div>
                </div>
                <div class="info-item">
                  <i class="pi pi-clock" />
                  <div>
                    <h4>Hours</h4>
                    <p>Mon-Fri: 8AM - 6PM<br>Emergency: 24/7</p>
                  </div>
                </div>
              </div>

              <div class="info-card">
                <h3>Why Choose Us</h3>
                <ul class="benefits-list">
                  <li><i class="pi pi-check" /> Free Estimates</li>
                  <li><i class="pi pi-check" /> Licensed & Insured</li>
                  <li><i class="pi pi-check" /> 25+ Years Experience</li>
                  <li><i class="pi pi-check" /> Family-Owned</li>
                  <li><i class="pi pi-check" /> 24/7 Emergency Service</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSEO, pageMeta } from '@/composables/useSEO'

const { setMeta, setBreadcrumbStructuredData } = useSEO()

onMounted(() => {
  setMeta(pageMeta.contact)
  setBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' }
  ])
})

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  service: '',
  message: '',
  timeline: ''
})

const formErrors = ref({})
const isSubmitting = ref(false)
const submitError = ref(false)
const submitSuccess = ref(false)

/**
 * Validate individual form fields
 */
const validateField = (fieldName, value) => {
  const errors = {}
  
  switch (fieldName) {
    case 'firstName':
      if (!value.trim()) {
        errors.firstName = 'First name is required'
      } else if (value.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters'
      }
      break
    case 'lastName':
      if (!value.trim()) {
        errors.lastName = 'Last name is required'
      } else if (value.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters'
      }
      break
    case 'email':
      if (!value.trim()) {
        errors.email = 'Email address is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.email = 'Please enter a valid email address'
      }
      break
    case 'phone':
      if (!value.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!/^[\d\s\-()]+$/.test(value) || value.replace(/\D/g, '').length < 10) {
        errors.phone = 'Please enter a valid 10-digit phone number'
      }
      break
    case 'service':
      if (!value) {
        errors.service = 'Please select a service'
      }
      break
    case 'message':
      if (!value.trim()) {
        errors.message = 'Project details are required'
      } else if (value.trim().length < 10) {
        errors.message = 'Please provide more details (at least 10 characters)'
      }
      break
  }
  
  return errors
}

/**
 * Validate entire form
 */
const validateForm = () => {
  const errors = {}
  const fields = ['firstName', 'lastName', 'email', 'phone', 'service', 'message']
  
  fields.forEach(field => {
    const fieldErrors = validateField(field, form.value[field])
    Object.assign(errors, fieldErrors)
  })
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

/**
 * Handle form submission with validation
 */
const handleSubmit = async () => {
  // Clear previous states
  submitError.value = false
  submitSuccess.value = false
  
  // Validate form
  if (!validateForm()) {
    submitError.value = true
    // Focus first error field
    const firstErrorField = Object.keys(formErrors.value)[0]
    if (firstErrorField) {
      const field = document.getElementById(firstErrorField)
      if (field) {
        field.focus()
        field.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    submitSuccess.value = true
    
    // Reset form after successful submission
    form.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      service: '',
      message: '',
      timeline: ''
    }
    formErrors.value = {}
    
    // Focus success message for screen readers
    setTimeout(() => {
      const successMessage = document.querySelector('.form-success-message')
      if (successMessage) {
        successMessage.focus()
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    
  } catch (error) {
    console.error('Form submission error:', error)
    submitError.value = true
    formErrors.value = { general: 'There was an error submitting your form. Please try again.' }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--uc-primary), var(--uc-primary-dark));
  padding: 4rem 0;
  color: white;
  text-align: center;
}

.page-header h1 {
  color: white;
  margin-bottom: 1rem;
}

.page-header .lead {
  font-size: 1.25rem;
  opacity: 0.9;
}

.contact-form-wrapper {
  background: white;
  padding: 3rem;
  border-radius: var(--uc-radius-lg);
  box-shadow: var(--uc-shadow-md);
}

.contact-form-wrapper h2 {
  color: var(--uc-dark);
  margin-bottom: 2rem;
}

/* Form Fieldsets */
.form-fieldset {
  border: 1px solid #e0e0e0;
  border-radius: var(--uc-radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
  background: #fafafa;
}

.form-legend {
  font-weight: 600;
  color: var(--uc-primary);
  padding: 0 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--uc-dark);
  font-weight: 500;
}

.required-indicator {
  color: var(--uc-secondary);
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: var(--uc-radius);
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: var(--uc-primary);
  box-shadow: 0 0 0 3px rgba(5, 179, 242, 0.1);
}

.form-control.error {
  border-color: var(--uc-secondary);
  background-color: #fff5f5;
}

.form-control.error:focus {
  border-color: var(--uc-secondary);
  box-shadow: 0 0 0 3px rgba(227, 4, 20, 0.1);
}

/* Form Help Text */
.form-help {
  font-size: 0.875rem;
  color: var(--uc-gray);
  margin-top: 0.25rem;
}

/* Error Messages */
.error-message {
  color: var(--uc-secondary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 500;
  min-height: 1.2em;
}

.error-message:empty {
  display: none;
}

/* Form States */
.form-error-summary {
  background: #fff5f5;
  border: 1px solid var(--uc-secondary);
  border-radius: var(--uc-radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.form-error-summary h3 {
  color: var(--uc-secondary);
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.form-error-summary ul {
  margin: 0;
  padding-left: 1.5rem;
}

.form-error-summary li {
  color: var(--uc-secondary);
  margin-bottom: 0.25rem;
}

.form-success-message {
  background: #f0fff4;
  border: 1px solid #22c55e;
  border-radius: var(--uc-radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #15803d;
  font-weight: 500;
  outline: none;
}

.btn-submit {
  background: var(--uc-secondary);
  color: white;
  padding: 1rem 3rem;
  border: none;
  border-radius: var(--uc-radius);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: var(--uc-secondary-dark);
  transform: translateY(-2px);
  box-shadow: var(--uc-shadow-md);
}

.btn-submit:focus {
  outline: 2px solid var(--uc-primary);
  outline-offset: 2px;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.info-card {
  background: white;
  padding: 2rem;
  border-radius: var(--uc-radius-lg);
  box-shadow: var(--uc-shadow-md);
  margin-bottom: 2rem;
}

.info-card h3 {
  color: var(--uc-dark);
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.info-item i {
  color: var(--uc-primary);
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.info-item h4 {
  color: var(--uc-dark);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.info-item p,
.info-item a {
  color: var(--uc-gray);
  margin: 0;
}

.info-item a:hover {
  color: var(--uc-primary);
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--uc-dark);
  border-bottom: 1px solid #eee;
}

.benefits-list li:last-child {
  border-bottom: none;
}

.benefits-list i {
  color: var(--uc-primary);
}
</style>