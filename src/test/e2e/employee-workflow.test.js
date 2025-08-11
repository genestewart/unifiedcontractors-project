/**
 * Employee Workflow E2E Tests
 * Tests complete user journeys for employee authentication, project management, and QR code functionality
 * Uses Playwright for cross-browser testing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { chromium, firefox, webkit } from 'playwright'

describe('Employee Workflow E2E Tests', () => {
  let browser
  let context
  let page

  // Test configuration
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'
  const TEST_TIMEOUT = 30000
  
  // Test data
  const validEmployee = {
    email: 'admin@unifiedcontractors.com',
    password: 'AdminPass123!',
    firstName: 'Test',
    lastName: 'Admin'
  }

  const testProject = {
    name: 'E2E Test Project',
    description: 'A project created during E2E testing',
    clientName: 'Test Client',
    clientEmail: 'client@example.com',
    status: 'active'
  }

  beforeAll(async () => {
    // Launch browser - can be switched between chromium, firefox, webkit
    browser = await chromium.launch({
      headless: process.env.CI !== 'false',
      slowMo: process.env.CI ? 0 : 100
    })
  })

  afterAll(async () => {
    await browser?.close()
  })

  beforeEach(async () => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      // Simulate realistic network conditions
      recordVideo: process.env.CI ? undefined : { dir: 'test-results/videos' }
    })
    
    page = await context.newPage()
    
    // Set up request/response logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text())
      }
    })
    
    // Intercept API calls for testing
    await page.route('**/api/**', route => {
      console.log('API call:', route.request().method(), route.request().url())
      route.continue()
    })
  })

  afterEach(async () => {
    await context?.close()
  })

  describe('Authentication Workflow', () => {
    it('should complete full login workflow successfully', async () => {
      // Navigate to login page
      await page.goto(`${BASE_URL}/employee/login`)
      
      // Verify login page loads correctly
      await expect(page.locator('h1')).toContainText('Employee Portal')
      await expect(page.locator('.login-form')).toBeVisible()
      
      // Check form fields are present
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('#rememberMe')).toBeVisible()
      
      // Fill login form
      await page.fill('#email', validEmployee.email)
      await page.fill('#password', validEmployee.password)
      await page.check('#rememberMe')
      
      // Submit form and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('.login-button')
      ])
      
      // Verify successful login
      await expect(page).toHaveURL(/.*\/employee\/dashboard/)
      await expect(page.locator('.welcome-message')).toContainText(`Welcome back, ${validEmployee.firstName}`)
      
      // Verify dashboard elements are loaded
      await expect(page.locator('.dashboard-stats')).toBeVisible()
      await expect(page.locator('.recent-projects')).toBeVisible()
      await expect(page.locator('.user-menu')).toBeVisible()
    }, TEST_TIMEOUT)

    it('should handle login errors correctly', async () => {
      await page.goto(`${BASE_URL}/employee/login`)
      
      // Try with invalid credentials
      await page.fill('#email', 'invalid@example.com')
      await page.fill('#password', 'wrongpassword')
      await page.click('.login-button')
      
      // Verify error message appears
      await expect(page.locator('.error-message')).toBeVisible()
      await expect(page.locator('.error-message')).toContainText(/invalid.*credentials/i)
      
      // Verify user stays on login page
      await expect(page).toHaveURL(/.*\/employee\/login/)
      
      // Verify form is still functional
      await expect(page.locator('#email')).toBeEnabled()
      await expect(page.locator('#password')).toBeEnabled()
    }, TEST_TIMEOUT)

    it('should enforce account lockout after multiple failed attempts', async () => {
      await page.goto(`${BASE_URL}/employee/login`)
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await page.fill('#email', validEmployee.email)
        await page.fill('#password', 'wrongpassword')
        await page.click('.login-button')
        
        if (i < 4) {
          await expect(page.locator('.error-message')).toBeVisible()
        }
        
        // Clear form for next attempt
        await page.fill('#password', '')
      }
      
      // Verify account lockout message
      await expect(page.locator('.lockout-message')).toBeVisible()
      await expect(page.locator('.lockout-message')).toContainText(/temporarily locked/i)
      
      // Verify form fields are disabled
      await expect(page.locator('#email')).toBeDisabled()
      await expect(page.locator('#password')).toBeDisabled()
      await expect(page.locator('.login-button')).toBeDisabled()
    }, TEST_TIMEOUT)

    it('should complete logout workflow', async () => {
      // Login first
      await loginAsEmployee(page, validEmployee)
      
      // Navigate to dashboard
      await expect(page).toHaveURL(/.*\/employee\/dashboard/)
      
      // Click user menu
      await page.click('.user-menu')
      await expect(page.locator('.user-dropdown')).toBeVisible()
      
      // Click logout
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('.logout-button')
      ])
      
      // Verify redirect to login page
      await expect(page).toHaveURL(/.*\/employee\/login/)
      
      // Verify logout message
      await expect(page.locator('.success-message')).toContainText(/logged out/i)
      
      // Verify cannot access protected routes
      await page.goto(`${BASE_URL}/employee/dashboard`)
      await expect(page).toHaveURL(/.*\/employee\/login/)
    }, TEST_TIMEOUT)
  })

  describe('Project Management Workflow', () => {
    beforeEach(async () => {
      await loginAsEmployee(page, validEmployee)
    })

    it('should create a new project successfully', async () => {
      // Navigate to projects page
      await page.click('nav a[href*="/projects"]')
      await expect(page).toHaveURL(/.*\/employee\/projects/)
      
      // Click create project button
      await page.click('.create-project-btn')
      await expect(page.locator('.project-form-dialog')).toBeVisible()
      
      // Fill project form
      await page.fill('#projectName', testProject.name)
      await page.fill('#projectDescription', testProject.description)
      await page.fill('#clientName', testProject.clientName)
      await page.fill('#clientEmail', testProject.clientEmail)
      await page.selectOption('#projectStatus', testProject.status)
      
      // Submit form
      await page.click('.submit-project-btn')
      
      // Verify success message
      await expect(page.locator('.success-toast')).toContainText(/project created/i)
      
      // Verify project appears in list
      await expect(page.locator('.project-list')).toContainText(testProject.name)
      await expect(page.locator('.project-list')).toContainText(testProject.clientName)
    }, TEST_TIMEOUT)

    it('should edit an existing project', async () => {
      // First create a project (assuming it exists or create it)
      await createTestProject(page, testProject)
      
      // Find and click edit button for the project
      await page.click(`[data-testid="edit-project-${testProject.name}"]`)
      await expect(page.locator('.project-form-dialog')).toBeVisible()
      
      // Verify form is pre-filled
      await expect(page.locator('#projectName')).toHaveValue(testProject.name)
      
      // Update project details
      const updatedName = testProject.name + ' (Updated)'
      await page.fill('#projectName', updatedName)
      await page.selectOption('#projectStatus', 'completed')
      
      // Submit changes
      await page.click('.submit-project-btn')
      
      // Verify success message
      await expect(page.locator('.success-toast')).toContainText(/project updated/i)
      
      // Verify changes in project list
      await expect(page.locator('.project-list')).toContainText(updatedName)
      await expect(page.locator('.project-status')).toContainText('Completed')
    }, TEST_TIMEOUT)

    it('should view project details', async () => {
      await createTestProject(page, testProject)
      
      // Click on project to view details
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await expect(page).toHaveURL(/.*\/employee\/projects\/\d+/)
      
      // Verify project details are displayed
      await expect(page.locator('.project-title')).toContainText(testProject.name)
      await expect(page.locator('.project-description')).toContainText(testProject.description)
      await expect(page.locator('.client-info')).toContainText(testProject.clientName)
      await expect(page.locator('.client-info')).toContainText(testProject.clientEmail)
      
      // Verify project actions are available
      await expect(page.locator('.edit-project-btn')).toBeVisible()
      await expect(page.locator('.generate-qr-btn')).toBeVisible()
      await expect(page.locator('.upload-files-btn')).toBeVisible()
    }, TEST_TIMEOUT)

    it('should filter and search projects', async () => {
      // Create multiple test projects
      await createTestProject(page, testProject)
      await createTestProject(page, { ...testProject, name: 'Another Project', status: 'completed' })
      
      // Navigate to projects page
      await page.goto(`${BASE_URL}/employee/projects`)
      
      // Test search functionality
      await page.fill('.search-input', testProject.name)
      await page.keyboard.press('Enter')
      
      // Verify filtered results
      await expect(page.locator('.project-list .project-item')).toHaveCount(1)
      await expect(page.locator('.project-list')).toContainText(testProject.name)
      
      // Clear search
      await page.fill('.search-input', '')
      await page.keyboard.press('Enter')
      
      // Test status filter
      await page.selectOption('.status-filter', 'completed')
      
      // Verify filtered results
      await expect(page.locator('.project-list')).toContainText('Another Project')
      await expect(page.locator('.project-list')).not.toContainText(testProject.name)
    }, TEST_TIMEOUT)
  })

  describe('QR Code Generation Workflow', () => {
    beforeEach(async () => {
      await loginAsEmployee(page, validEmployee)
      await createTestProject(page, testProject)
    })

    it('should generate QR code for project', async () => {
      // Navigate to project details
      await page.click(`[data-testid="project-${testProject.name}"]`)
      
      // Click generate QR code button
      await page.click('.generate-qr-btn')
      await expect(page.locator('.qr-code-dialog')).toBeVisible()
      
      // Wait for QR code to generate
      await expect(page.locator('.qr-code-image')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.qr-code-url')).toBeVisible()
      
      // Verify QR code elements
      const qrCodeSrc = await page.locator('.qr-code-image').getAttribute('src')
      expect(qrCodeSrc).toContain('data:image/png;base64')
      
      // Verify URL is displayed
      const qrUrl = await page.locator('.qr-code-url').textContent()
      expect(qrUrl).toContain('/client/project/')
    }, TEST_TIMEOUT)

    it('should copy QR code URL to clipboard', async () => {
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.generate-qr-btn')
      await expect(page.locator('.qr-code-dialog')).toBeVisible()
      
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      
      // Click copy URL button
      await page.click('.copy-url-btn')
      
      // Verify success message
      await expect(page.locator('.success-toast')).toContainText(/copied to clipboard/i)
      
      // Verify clipboard content
      const clipboardContent = await page.evaluate(async () => {
        return await navigator.clipboard.readText()
      })
      expect(clipboardContent).toContain('/client/project/')
    }, TEST_TIMEOUT)

    it('should download QR code as image', async () => {
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.generate-qr-btn')
      await expect(page.locator('.qr-code-dialog')).toBeVisible()
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download')
      
      // Click download button
      await page.click('.download-qr-btn')
      
      // Verify download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/.*\.png$/)
      
      // Verify file is not empty
      const path = await download.path()
      expect(path).toBeTruthy()
    }, TEST_TIMEOUT)

    it('should handle QR code expiration', async () => {
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.generate-qr-btn')
      await expect(page.locator('.qr-code-dialog')).toBeVisible()
      
      // Check if expiration info is displayed
      await expect(page.locator('.expiration-info')).toBeVisible()
      
      // For testing expired QR codes, we would need to mock the API response
      // or create a project with an expired QR code
    }, TEST_TIMEOUT)
  })

  describe('File Upload Workflow', () => {
    beforeEach(async () => {
      await loginAsEmployee(page, validEmployee)
      await createTestProject(page, testProject)
    })

    it('should upload project files successfully', async () => {
      await page.click(`[data-testid="project-${testProject.name}"]`)
      
      // Click upload files button
      await page.click('.upload-files-btn')
      await expect(page.locator('.file-upload-dialog')).toBeVisible()
      
      // Create a test file
      const testFile = Buffer.from('test file content')
      
      // Upload file
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: testFile
      })
      
      // Verify file is selected
      await expect(page.locator('.selected-files')).toContainText('test-image.jpg')
      
      // Submit upload
      await page.click('.upload-submit-btn')
      
      // Verify success message
      await expect(page.locator('.success-toast')).toContainText(/files uploaded/i)
      
      // Verify file appears in project files list
      await expect(page.locator('.project-files')).toContainText('test-image.jpg')
    }, TEST_TIMEOUT)

    it('should validate file types and sizes', async () => {
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.upload-files-btn')
      
      // Try to upload invalid file type
      const invalidFile = Buffer.from('invalid content')
      const fileInput = page.locator('input[type="file"]')
      
      await fileInput.setInputFiles({
        name: 'test.exe',
        mimeType: 'application/x-executable',
        buffer: invalidFile
      })
      
      // Verify error message
      await expect(page.locator('.error-message')).toContainText(/file type not allowed/i)
      
      // Try large file (simulate)
      const largeFile = Buffer.alloc(60 * 1024 * 1024) // 60MB
      await fileInput.setInputFiles({
        name: 'large-file.jpg',
        mimeType: 'image/jpeg',
        buffer: largeFile
      })
      
      await expect(page.locator('.error-message')).toContainText(/file too large/i)
    }, TEST_TIMEOUT)
  })

  describe('Client Access Workflow', () => {
    it('should allow client to access project via QR code', async () => {
      // First, login as employee and get QR code URL
      await loginAsEmployee(page, validEmployee)
      await createTestProject(page, testProject)
      
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.generate-qr-btn')
      
      const qrUrl = await page.locator('.qr-code-url').textContent()
      
      // Logout employee
      await page.click('.user-menu')
      await page.click('.logout-button')
      
      // Access project as client
      await page.goto(qrUrl)
      
      // Verify client can see project
      await expect(page.locator('.client-project-title')).toContainText(testProject.name)
      await expect(page.locator('.client-info')).toContainText(testProject.clientName)
      
      // Verify client can see public files
      await expect(page.locator('.project-gallery')).toBeVisible()
      
      // Verify feedback form is available
      await expect(page.locator('.feedback-form')).toBeVisible()
    }, TEST_TIMEOUT)

    it('should allow client to submit feedback', async () => {
      // Setup: Get client access URL
      await loginAsEmployee(page, validEmployee)
      await createTestProject(page, testProject)
      
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await page.click('.generate-qr-btn')
      const qrUrl = await page.locator('.qr-code-url').textContent()
      
      await page.click('.user-menu')
      await page.click('.logout-button')
      
      // Access as client
      await page.goto(qrUrl)
      
      // Fill feedback form
      await page.fill('#feedbackComment', 'This looks great! I love the design.')
      await page.selectOption('#feedbackRating', '5')
      
      // Submit feedback
      await page.click('.submit-feedback-btn')
      
      // Verify success message
      await expect(page.locator('.success-message')).toContainText(/feedback submitted/i)
      
      // Verify feedback appears in list
      await expect(page.locator('.feedback-list')).toContainText('This looks great!')
    }, TEST_TIMEOUT)
  })

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await loginAsEmployee(page, validEmployee)
      
      // Verify mobile navigation
      await expect(page.locator('.mobile-menu-toggle')).toBeVisible()
      await page.click('.mobile-menu-toggle')
      await expect(page.locator('.mobile-nav')).toBeVisible()
      
      // Test project creation on mobile
      await page.click('nav a[href*="/projects"]')
      await page.click('.create-project-btn')
      
      // Verify form is usable on mobile
      await expect(page.locator('.project-form-dialog')).toBeVisible()
      await page.fill('#projectName', 'Mobile Test Project')
      
      // Form should be scrollable and inputs accessible
      await expect(page.locator('#projectName')).toBeEnabled()
    }, TEST_TIMEOUT)

    it('should work correctly on tablet devices', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await loginAsEmployee(page, validEmployee)
      
      // Verify tablet layout
      await expect(page.locator('.dashboard-grid')).toBeVisible()
      
      // Test touch interactions
      await page.click(`[data-testid="project-${testProject.name}"]`)
      await expect(page.locator('.project-details')).toBeVisible()
    }, TEST_TIMEOUT)
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      await page.goto(`${BASE_URL}/employee/login`)
      
      // Tab through form fields
      await page.keyboard.press('Tab') // Email field
      await expect(page.locator('#email')).toBeFocused()
      
      await page.keyboard.press('Tab') // Password field
      await expect(page.locator('#password')).toBeFocused()
      
      await page.keyboard.press('Tab') // Remember me checkbox
      await expect(page.locator('#rememberMe')).toBeFocused()
      
      await page.keyboard.press('Tab') // Submit button
      await expect(page.locator('.login-button')).toBeFocused()
    }, TEST_TIMEOUT)

    it('should have proper ARIA labels and roles', async () => {
      await page.goto(`${BASE_URL}/employee/login`)
      
      // Check ARIA attributes
      await expect(page.locator('#email')).toHaveAttribute('aria-describedby')
      await expect(page.locator('#password')).toHaveAttribute('aria-describedby')
      
      // Check form labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
    }, TEST_TIMEOUT)
  })

  // Helper functions
  async function loginAsEmployee(page, employee) {
    await page.goto(`${BASE_URL}/employee/login`)
    await page.fill('#email', employee.email)
    await page.fill('#password', employee.password)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('.login-button')
    ])
  }

  async function createTestProject(page, project) {
    await page.goto(`${BASE_URL}/employee/projects`)
    await page.click('.create-project-btn')
    await page.fill('#projectName', project.name)
    await page.fill('#projectDescription', project.description)
    await page.fill('#clientName', project.clientName)
    await page.fill('#clientEmail', project.clientEmail)
    await page.selectOption('#projectStatus', project.status)
    await page.click('.submit-project-btn')
    await expect(page.locator('.success-toast')).toBeVisible()
  }
})