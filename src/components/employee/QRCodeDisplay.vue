<template>
  <div class="qr-code-display">
    <!-- QR Code Card -->
    <Card class="qr-card">
      <template #header>
        <div class="qr-header">
          <h3 class="qr-title">
            <i class="pi pi-qrcode"></i>
            Client Review QR Code
          </h3>
          <div class="qr-actions">
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              size="small"
              @click="regenerateQRCode"
              :loading="regenerating"
              v-tooltip.top="'Generate new QR code'"
            />
            <Button
              icon="pi pi-cog"
              severity="secondary"
              size="small"
              @click="showSettings = true"
              v-tooltip.top="'QR Code Settings'"
            />
          </div>
        </div>
      </template>

      <template #content>
        <div class="qr-content">
          <!-- QR Code Display -->
          <div class="qr-display-section">
            <div class="qr-code-container" :class="{ 'loading': generating }">
              <div v-if="generating" class="qr-loading">
                <ProgressSpinner size="50px" />
                <p>Generating QR code...</p>
              </div>
              <div v-else-if="qrCodeDataUrl" class="qr-code-wrapper">
                <img 
                  :src="qrCodeDataUrl" 
                  :alt="`QR Code for project ${project.name}`"
                  class="qr-code-image"
                />
                <div class="qr-overlay">
                  <div class="qr-overlay-actions">
                    <Button
                      icon="pi pi-download"
                      severity="success"
                      size="small"
                      @click="downloadQRCode"
                      v-tooltip="'Download QR Code'"
                      rounded
                    />
                    <Button
                      icon="pi pi-print"
                      severity="info"
                      size="small"
                      @click="printQRCode"
                      v-tooltip="'Print QR Code'"
                      rounded
                    />
                    <Button
                      icon="pi pi-copy"
                      severity="secondary"
                      size="small"
                      @click="copyQRLink"
                      v-tooltip="'Copy Link'"
                      rounded
                    />
                  </div>
                </div>
              </div>
              <div v-else-if="error" class="qr-error">
                <i class="pi pi-exclamation-triangle"></i>
                <p>{{ error }}</p>
                <Button
                  label="Try Again"
                  severity="secondary"
                  size="small"
                  @click="generateQRCode"
                />
              </div>
            </div>
          </div>

          <!-- QR Code Information -->
          <div class="qr-info-section">
            <div class="qr-info-grid">
              <div class="info-item">
                <label>Client Link:</label>
                <div class="link-display">
                  <InputText 
                    :value="clientReviewUrl" 
                    readonly 
                    class="link-input"
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    size="small"
                    @click="copyQRLink"
                    v-tooltip="'Copy Link'"
                  />
                </div>
              </div>
              
              <div class="info-item">
                <label>QR Code Status:</label>
                <Tag 
                  :value="qrStatus.label" 
                  :severity="qrStatus.severity"
                  :icon="qrStatus.icon"
                />
              </div>
              
              <div class="info-item">
                <label>Expires:</label>
                <span class="expiry-date">{{ formatExpiryDate(qrToken?.expires_at) }}</span>
              </div>
              
              <div class="info-item">
                <label>Views:</label>
                <span class="view-count">{{ qrToken?.view_count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Usage Instructions -->
          <div class="qr-instructions">
            <h4>
              <i class="pi pi-info-circle"></i>
              How to use this QR Code
            </h4>
            <ol>
              <li>Share this QR code with your client via email, text, or print</li>
              <li>Client scans the code with their phone camera or QR app</li>
              <li>Client views project photos and documents without login</li>
              <li>Client can provide feedback and ratings directly</li>
            </ol>
          </div>
        </div>
      </template>
    </Card>

    <!-- QR Settings Dialog -->
    <Dialog
      v-model:visible="showSettings"
      header="QR Code Settings"
      :style="{ width: '500px' }"
      modal
    >
      <div class="qr-settings">
        <div class="field">
          <label for="qr-size">QR Code Size:</label>
          <Slider
            id="qr-size"
            v-model="settings.size"
            :min="200"
            :max="800"
            :step="50"
            class="w-full"
          />
          <small>{{ settings.size }}px × {{ settings.size }}px</small>
        </div>

        <div class="field">
          <label for="qr-margin">Margin:</label>
          <Slider
            id="qr-margin"
            v-model="settings.margin"
            :min="0"
            :max="10"
            :step="1"
            class="w-full"
          />
          <small>{{ settings.margin }} modules</small>
        </div>

        <div class="field">
          <label for="expiry-days">Link Expiry (days):</label>
          <InputNumber
            id="expiry-days"
            v-model="settings.expiryDays"
            :min="1"
            :max="365"
            suffix=" days"
            class="w-full"
          />
        </div>

        <div class="field">
          <div class="flex align-items-center">
            <Checkbox
              id="include-logo"
              v-model="settings.includeLogo"
              binary
            />
            <label for="include-logo" class="ml-2">Include company logo</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          @click="showSettings = false"
        />
        <Button
          label="Apply & Regenerate"
          @click="applySettings"
          :loading="regenerating"
        />
      </template>
    </Dialog>

    <!-- Print Layout -->
    <div v-if="qrCodeDataUrl" class="qr-print-layout" ref="printContent">
      <div class="print-header">
        <h2>{{ project.name }} - Client Review</h2>
        <p>Scan this QR code to view project photos and provide feedback</p>
      </div>
      <div class="print-qr">
        <img :src="qrCodeDataUrl" alt="Project QR Code" />
      </div>
      <div class="print-footer">
        <p>{{ clientReviewUrl }}</p>
        <p>Generated on {{ new Date().toLocaleDateString() }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import QRCode from 'qrcode'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['qr-generated', 'qr-regenerated'])

const toast = useToast()

// Reactive state
const qrCodeDataUrl = ref(null)
const qrToken = ref(null)
const generating = ref(false)
const regenerating = ref(false)
const error = ref(null)
const showSettings = ref(false)
const printContent = ref(null)

// QR Code settings
const settings = ref({
  size: 400,
  margin: 2,
  expiryDays: 30,
  includeLogo: true,
  errorCorrectionLevel: 'M'
})

// Computed properties
const clientReviewUrl = computed(() => {
  if (!qrToken.value?.token) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/client/review/${qrToken.value.token}`
})

const qrStatus = computed(() => {
  if (!qrToken.value) {
    return { label: 'Not Generated', severity: 'secondary', icon: 'pi-minus' }
  }
  
  const now = new Date()
  const expiry = new Date(qrToken.value.expires_at)
  
  if (now > expiry) {
    return { label: 'Expired', severity: 'danger', icon: 'pi-times-circle' }
  }
  
  const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60)
  
  if (hoursUntilExpiry < 24) {
    return { label: 'Expiring Soon', severity: 'warning', icon: 'pi-exclamation-triangle' }
  }
  
  return { label: 'Active', severity: 'success', icon: 'pi-check-circle' }
})

// Methods
const generateQRCode = async () => {
  try {
    generating.value = true
    error.value = null

    // Generate or get existing token for project
    const token = await generateQRToken()
    if (!token) throw new Error('Failed to generate QR token')

    qrToken.value = token

    // Generate QR code with settings
    const qrOptions = {
      width: settings.value.size,
      margin: settings.value.margin,
      errorCorrectionLevel: settings.value.errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }

    const dataUrl = await QRCode.toDataURL(clientReviewUrl.value, qrOptions)
    qrCodeDataUrl.value = dataUrl

    emit('qr-generated', { token, qrCode: dataUrl })
    
    toast.add({
      severity: 'success',
      summary: 'QR Code Generated',
      detail: 'Client review QR code has been created successfully',
      life: 3000
    })

  } catch (err) {
    error.value = err.message || 'Failed to generate QR code'
    console.error('QR Code generation error:', err)
    
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: error.value,
      life: 5000
    })
  } finally {
    generating.value = false
  }
}

const regenerateQRCode = async () => {
  try {
    regenerating.value = true
    
    // Invalidate existing token and generate new one
    if (qrToken.value?.token) {
      await invalidateQRToken(qrToken.value.token)
    }
    
    await generateQRCode()
    emit('qr-regenerated', { token: qrToken.value, qrCode: qrCodeDataUrl.value })
    
    toast.add({
      severity: 'info',
      summary: 'QR Code Regenerated',
      detail: 'New QR code created. Previous code is now invalid.',
      life: 3000
    })

  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Regeneration Failed',
      detail: err.message || 'Failed to regenerate QR code',
      life: 5000
    })
  } finally {
    regenerating.value = false
  }
}

const downloadQRCode = () => {
  if (!qrCodeDataUrl.value) return

  const link = document.createElement('a')
  link.download = `${props.project.name}-qr-code.png`
  link.href = qrCodeDataUrl.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({
    severity: 'success',
    summary: 'Download Started',
    detail: 'QR code image download initiated',
    life: 2000
  })
}

const printQRCode = () => {
  if (!printContent.value) return

  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - ${props.project.name}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 20px;
          background: white;
        }
        .print-header h2 { 
          color: #2563eb; 
          margin-bottom: 10px; 
        }
        .print-header p { 
          color: #64748b; 
          margin-bottom: 30px; 
        }
        .print-qr img { 
          border: 2px solid #e2e8f0; 
          border-radius: 8px;
          margin: 20px 0;
        }
        .print-footer { 
          margin-top: 30px; 
          color: #64748b; 
          font-size: 12px; 
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${printContent.value.innerHTML}
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

const copyQRLink = async () => {
  if (!clientReviewUrl.value) return

  try {
    await navigator.clipboard.writeText(clientReviewUrl.value)
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Client review link copied to clipboard',
      life: 2000
    })
  } catch (err) {
    // Fallback for browsers without clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = clientReviewUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    toast.add({
      severity: 'success',
      summary: 'Link Copied',
      detail: 'Client review link copied to clipboard',
      life: 2000
    })
  }
}

const applySettings = async () => {
  showSettings.value = false
  await generateQRCode()
}

const formatExpiryDate = (dateString) => {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// API methods (these would integrate with your backend)
const generateQRToken = async () => {
  // This would make an API call to generate a secure token
  // For now, returning mock data
  return {
    token: `qr_${props.project.id}_${Date.now()}`,
    project_id: props.project.id,
    expires_at: new Date(Date.now() + (settings.value.expiryDays * 24 * 60 * 60 * 1000)).toISOString(),
    view_count: 0,
    created_at: new Date().toISOString()
  }
}

const invalidateQRToken = async (token) => {
  // This would make an API call to invalidate the token
  console.log('Invalidating token:', token)
}

// Lifecycle
onMounted(() => {
  // Auto-generate QR code on component mount
  generateQRCode()
})

// Watch for project changes
watch(() => props.project.id, () => {
  generateQRCode()
})
</script>

<style scoped>
.qr-code-display {
  max-width: 600px;
  margin: 0 auto;
}

.qr-card {
  border-radius: 12px;
  overflow: hidden;
}

.qr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin: -1rem -1rem 0 -1rem;
}

.qr-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.2rem;
}

.qr-actions {
  display: flex;
  gap: 0.5rem;
}

.qr-content {
  padding: 1.5rem;
}

.qr-display-section {
  text-align: center;
  margin-bottom: 2rem;
}

.qr-code-container {
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.qr-code-container.loading {
  opacity: 0.7;
}

.qr-loading {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.qr-code-wrapper {
  position: relative;
  display: inline-block;
}

.qr-code-image {
  display: block;
  border: 3px solid #e2e8f0;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.qr-code-wrapper:hover .qr-code-image {
  transform: scale(1.02);
}

.qr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.qr-code-wrapper:hover .qr-overlay {
  opacity: 1;
}

.qr-overlay-actions {
  display: flex;
  gap: 0.5rem;
}

.qr-error {
  padding: 2rem;
  text-align: center;
  color: #dc2626;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-error i {
  font-size: 2rem;
}

.qr-info-section {
  margin-bottom: 2rem;
}

.qr-info-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.link-display {
  display: flex;
  gap: 0.5rem;
}

.link-input {
  flex: 1;
  font-family: monospace;
  font-size: 0.875rem;
}

.expiry-date, .view-count {
  font-family: monospace;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.qr-instructions {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.qr-instructions h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1e40af;
  margin: 0 0 1rem 0;
}

.qr-instructions ol {
  margin: 0;
  padding-left: 1.5rem;
}

.qr-instructions li {
  margin-bottom: 0.5rem;
  color: #475569;
}

.qr-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: #374151;
}

.field small {
  color: #64748b;
  font-size: 0.75rem;
}

.qr-print-layout {
  display: none;
}

@media print {
  .qr-print-layout {
    display: block !important;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .qr-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .qr-actions {
    justify-content: center;
  }
  
  .qr-content {
    padding: 1rem;
  }
  
  .qr-info-grid {
    grid-template-columns: 1fr;
  }
  
  .link-display {
    flex-direction: column;
  }
  
  .qr-overlay-actions {
    flex-direction: column;
  }
}
</style>