<template>
  <ClientReviewLayout>
    <div class="client-help-page">
      <!-- Help Header -->
      <div class="help-header">
        <Card class="header-card">
          <template #content>
            <div class="header-content">
              <div class="header-icon">
                <i class="pi pi-question-circle"></i>
              </div>
              <div class="header-text">
                <h1 class="help-title">QR Code Help & Instructions</h1>
                <p class="help-description">
                  Learn how to use QR codes to access your construction project information
                </p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Instructions -->
      <div class="instructions-grid">
        <Card class="instruction-card">
          <template #header>
            <div class="card-header">
              <i class="pi pi-qrcode"></i>
              <h3>Scanning QR Codes</h3>
            </div>
          </template>
          <template #content>
            <ol class="instruction-list">
              <li>Open your phone's camera app</li>
              <li>Point the camera at the QR code</li>
              <li>Tap the notification that appears</li>
              <li>Your project will open automatically</li>
            </ol>
            <p class="note">
              <strong>Note:</strong> Most modern smartphones can scan QR codes directly with the camera app. 
              If yours doesn't, download a free QR code scanner app.
            </p>
          </template>
        </Card>

        <Card class="instruction-card">
          <template #header>
            <div class="card-header">
              <i class="pi pi-eye"></i>
              <h3>Viewing Your Project</h3>
            </div>
          </template>
          <template #content>
            <ul class="feature-list">
              <li><strong>Overview:</strong> See project summary and recent updates</li>
              <li><strong>Gallery:</strong> Browse all project photos with zoom and fullscreen</li>
              <li><strong>Documents:</strong> View plans, permits, and other project files</li>
              <li><strong>Feedback:</strong> Rate your experience and leave comments</li>
            </ul>
          </template>
        </Card>

        <Card class="instruction-card">
          <template #header>
            <div class="card-header">
              <i class="pi pi-shield"></i>
              <h3>Privacy & Security</h3>
            </div>
          </template>
          <template #content>
            <ul class="security-list">
              <li>Your project information is secure and private</li>
              <li>Only you and your construction team can access this content</li>
              <li>QR codes expire after 30 days for security</li>
              <li>No personal information is stored</li>
            </ul>
          </template>
        </Card>
      </div>

      <!-- Contact Information -->
      <Card class="contact-card">
        <template #header>
          <div class="card-header">
            <i class="pi pi-phone"></i>
            <h3>Need Help?</h3>
          </div>
        </template>
        <template #content>
          <p>If you're having trouble accessing your project or need assistance:</p>
          <div class="contact-methods">
            <a href="tel:+1-435-555-0123" class="contact-method">
              <i class="pi pi-phone"></i>
              <span>Call (435) 555-0123</span>
            </a>
            <a href="mailto:info@unifiedcontractors.com" class="contact-method">
              <i class="pi pi-envelope"></i>
              <span>Email info@unifiedcontractors.com</span>
            </a>
          </div>
        </template>
      </Card>
    </div>
  </ClientReviewLayout>
</template>

<script setup>
import ClientReviewLayout from '@/components/layout/ClientReviewLayout.vue'
import Card from 'primevue/card'
</script>

<style scoped>
.client-help-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2rem;
}

.help-header {
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

.help-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.help-description {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
  line-height: 1.6;
}

.instructions-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.instruction-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-header i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.card-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.2rem;
}

.instruction-list, .feature-list, .security-list {
  margin: 0;
  padding-left: 1.5rem;
}

.instruction-list li, .feature-list li, .security-list li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.note {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  color: #1e40af;
  line-height: 1.6;
}

.contact-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.contact-methods {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.contact-method {
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

.contact-method:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .help-title {
    font-size: 1.5rem;
  }

  .instructions-grid {
    grid-template-columns: 1fr;
  }

  .contact-methods {
    flex-direction: column;
    align-items: center;
  }

  .contact-method {
    width: 100%;
    justify-content: center;
    max-width: 250px;
  }
}
</style>