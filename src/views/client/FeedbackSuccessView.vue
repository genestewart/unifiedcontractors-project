<template>
  <ClientReviewLayout>
    <div class="feedback-success-page">
      <Card class="success-card">
        <template #content>
          <div class="success-content">
            <div class="success-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h1 class="success-title">Thank You!</h1>
            <p class="success-message">
              Your feedback has been submitted successfully. We appreciate you taking the time 
              to share your experience with us.
            </p>
            
            <div class="success-details">
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <span>Submitted on {{ new Date().toLocaleDateString() }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-clock"></i>
                <span>We'll review your feedback within 24 hours</span>
              </div>
            </div>

            <div class="next-steps">
              <h3>What happens next?</h3>
              <ul>
                <li>Your project team will review your feedback</li>
                <li>If you requested follow-up, someone will contact you soon</li>
                <li>Your input helps us improve our service quality</li>
              </ul>
            </div>

            <div class="success-actions">
              <Button
                label="Back to Project Overview"
                icon="pi pi-arrow-left"
                @click="goHome"
                class="primary-action"
              />
              <Button
                label="View Project Gallery"
                icon="pi pi-images"
                @click="goToGallery"
                severity="secondary"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Additional Information -->
      <Card class="info-card">
        <template #content>
          <div class="info-content">
            <h3>Stay Connected</h3>
            <p>
              Continue following your project progress and don't hesitate to reach out 
              if you have any questions or concerns.
            </p>
            
            <div class="contact-info">
              <a href="tel:+1-435-555-0123" class="contact-link">
                <i class="pi pi-phone"></i>
                <span>(435) 555-0123</span>
              </a>
              <a href="mailto:info@unifiedcontractors.com" class="contact-link">
                <i class="pi pi-envelope"></i>
                <span>info@unifiedcontractors.com</span>
              </a>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </ClientReviewLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ClientReviewLayout from '@/components/layout/ClientReviewLayout.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()

const goHome = () => {
  // Go back to the referring page or home
  if (window.history.length > 1) {
    router.go(-2) // Go back 2 steps to skip the feedback form
  } else {
    router.push('/')
  }
}

const goToGallery = () => {
  // Try to extract token from referrer or go to help
  const referrer = document.referrer
  const tokenMatch = referrer.match(/\/client\/\w+\/([^\/]+)/)
  
  if (tokenMatch) {
    router.push({
      name: 'client-gallery',
      params: { token: tokenMatch[1] }
    })
  } else {
    router.push({ name: 'client-help' })
  }
}
</script>

<style scoped>
.feedback-success-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem 0;
  max-width: 600px;
  margin: 0 auto;
}

.success-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.success-content {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  font-size: 5rem;
  color: #22c55e;
  margin-bottom: 1.5rem;
  animation: checkmark 0.6s ease-in-out;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #15803d;
  margin: 0 0 1rem 0;
}

.success-message {
  font-size: 1.1rem;
  color: #166534;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.success-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #166534;
  font-weight: 500;
}

.detail-item i {
  color: #22c55e;
  font-size: 1.1rem;
}

.next-steps {
  text-align: left;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.next-steps h3 {
  color: #15803d;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-align: center;
}

.next-steps ul {
  color: #166534;
  line-height: 1.8;
  margin: 0;
  padding-left: 1.5rem;
}

.next-steps li {
  margin-bottom: 0.5rem;
}

.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-action {
  min-width: 200px;
}

.info-card {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-content {
  text-align: center;
  padding: 1.5rem;
}

.info-content h3 {
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.info-content p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.contact-info {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.contact-link:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .feedback-success-page {
    padding: 1rem 0;
    margin: 0 1rem;
  }

  .success-title {
    font-size: 2rem;
  }

  .success-message {
    font-size: 1rem;
  }

  .success-details {
    padding: 1rem;
  }

  .next-steps {
    padding: 1rem;
  }

  .success-actions {
    flex-direction: column;
    align-items: center;
  }

  .success-actions .p-button {
    width: 100%;
    max-width: 250px;
  }

  .contact-info {
    flex-direction: column;
    align-items: center;
  }

  .contact-link {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .success-icon {
    font-size: 4rem;
  }

  .success-title {
    font-size: 1.5rem;
  }

  .detail-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>