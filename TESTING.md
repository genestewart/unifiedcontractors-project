# Unified Contractors - Testing Guide

This document provides comprehensive information about the testing strategy, setup, and execution for the Unified Contractors project.

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Types](#test-types)
3. [Setup Instructions](#setup-instructions)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Coverage Requirements](#coverage-requirements)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## 🎯 Testing Strategy

Our testing approach follows the testing pyramid with multiple layers:

```
    /\
   /  \     E2E Tests (10%)
  /    \    Integration Tests (20%)
 /      \   Unit Tests (70%)
/__________\
```

### Goals
- **Quality Assurance**: Ensure code reliability and maintainability
- **Security**: Validate authentication, authorization, and input sanitization
- **Performance**: Monitor and maintain application performance standards
- **User Experience**: Verify complete user workflows function correctly

## 🧪 Test Types

### 1. Unit Tests
- **Frontend Components**: Vue.js components, Pinia stores, utilities
- **Backend Models**: Laravel models, services, helpers
- **Coverage Target**: >80%

### 2. Integration Tests
- **API Integration**: Frontend-backend communication
- **Authentication Flows**: Complete login/logout workflows
- **Database Operations**: Model relationships and queries

### 3. End-to-End (E2E) Tests
- **User Journeys**: Complete workflows from UI to database
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Responsive design validation

### 4. Performance Tests
- **File Upload Performance**: Large file handling and memory usage
- **Page Load Times**: Core Web Vitals compliance
- **Mobile Performance**: Optimization for low-end devices

### 5. Security Tests
- **Authentication Security**: Session management, token validation
- **Input Validation**: XSS, CSRF, SQL injection prevention
- **Authorization**: Role-based access control

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- PHP 8.1+
- MySQL 8.0+
- Composer

### Installation

1. **Install frontend dependencies**:
```bash
npm install
```

2. **Install backend dependencies**:
```bash
cd backend
composer install
```

3. **Install Playwright browsers** (for E2E tests):
```bash
npx playwright install
```

4. **Setup test database**:
```bash
cd backend
cp .env.testing .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=TestSeeder
```

## 🚀 Running Tests

### All Tests
```bash
# Run comprehensive test suite
npm run test:all

# Run for CI/CD (includes backend)
npm run test:ci
```

### Frontend Tests
```bash
# Unit tests with coverage
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# Watch mode for development
npm run test:watch

# Interactive UI mode
npm run test:ui
```

### Backend Tests
```bash
# All backend tests
npm run test:backend

# Unit tests only
npm run test:backend:unit

# Feature tests only
npm run test:backend:feature

# With coverage report
npm run test:backend:coverage
```

### Specific Test Patterns
```bash
# Run specific test files
npx vitest run src/test/components/auth/LoginForm.test.js

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run tests in specific directory
npx vitest run src/test/security/
```

## ✍️ Writing Tests

### Frontend Component Tests

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(MyComponent, {
      props: { title: 'Test Title' },
      global: {
        plugins: [createTestingPinia()]
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('h1').text()).toBe('Test Title')
  })
})
```

### Store Tests

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '@/stores/myStore'

describe('MyStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMyStore()
  })

  it('has correct initial state', () => {
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
  })
})
```

### Backend Tests

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;

class UserModelTest extends TestCase
{
    /** @test */
    public function it_can_create_a_user()
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com'
        ]);

        $this->assertEquals('John Doe', $user->name);
        $this->assertEquals('john@example.com', $user->email);
    }
}
```

### E2E Tests

```javascript
import { test, expect } from '@playwright/test'

test('user can login successfully', async ({ page }) => {
  await page.goto('/employee/login')
  
  await page.fill('#email', 'admin@example.com')
  await page.fill('#password', 'password123')
  await page.click('.login-button')
  
  await expect(page).toHaveURL(/.*dashboard/)
  await expect(page.locator('.welcome-message')).toContainText('Welcome')
})
```

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Critical Areas (100% Coverage Required)
- Authentication logic
- Payment processing
- Security functions
- Data validation

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Our CI/CD pipeline runs tests on:
- **Trigger Events**: Push to main/develop, Pull Requests
- **Node.js Versions**: 18, 20
- **PHP Versions**: 8.1, 8.2
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Mobile

### Pipeline Stages
1. **Frontend Unit Tests** - Fast feedback on component logic
2. **Backend Unit Tests** - Model and service validation
3. **Integration Tests** - API and workflow testing
4. **E2E Tests** - Complete user journey validation
5. **Performance Tests** - Performance regression detection
6. **Security Tests** - Vulnerability scanning
7. **Test Report Generation** - Comprehensive reporting

### Coverage Integration
- **Codecov**: Automatic coverage reporting
- **PR Comments**: Coverage diff on pull requests
- **Quality Gates**: Block merging if coverage drops

## 🛠️ Troubleshooting

### Common Issues

#### Test Database Connection
```bash
# Reset test database
cd backend
php artisan migrate:fresh --seed --env=testing
```

#### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --force
```

#### Memory Issues with Large Files
```javascript
// Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

#### Flaky E2E Tests
```javascript
// Add explicit waits
await page.waitForLoadState('networkidle')
await expect(element).toBeVisible({ timeout: 10000 })
```

### Debug Mode

#### Frontend Tests
```bash
# Run with debug output
npx vitest run --reporter=verbose

# Debug specific test
npx vitest run --grep "specific test" --reporter=verbose
```

#### E2E Tests
```bash
# Run in headed mode
npm run test:e2e:headed

# Debug mode with inspector
npm run test:e2e:debug
```

### Performance Optimization

#### Test Performance
```bash
# Run tests with timing
npx vitest run --reporter=verbose --coverage=false

# Profile test execution
NODE_ENV=test npm run test:performance
```

## 📈 Monitoring and Metrics

### Key Metrics
- **Test Execution Time**: Target <5 minutes for full suite
- **Flakiness Rate**: <1% failure rate due to flakiness
- **Coverage Trend**: Maintain >80% with upward trend
- **Performance Regression**: <5% performance degradation tolerance

### Reporting
- **Daily**: Automated test runs with Slack notifications
- **Weekly**: Coverage and performance trend reports
- **Release**: Comprehensive test report with quality gates

## 🎯 Best Practices

### Writing Tests
1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Clear test descriptions
3. **Independent Tests**: No dependencies between tests
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Boundary conditions and error scenarios

### Maintaining Tests
1. **Refactor with Code**: Keep tests up-to-date
2. **Remove Obsolete Tests**: Clean up unused tests
3. **Update Test Data**: Keep fixtures current
4. **Monitor Flakiness**: Address unreliable tests promptly

### Performance
1. **Parallel Execution**: Run tests in parallel where possible
2. **Smart Test Selection**: Run relevant tests for changes
3. **Resource Management**: Clean up after tests
4. **Caching**: Use test result caching in CI

## 📞 Support

### Getting Help
- **Documentation Issues**: Create GitHub issue
- **Test Failures**: Check CI logs and test reports
- **Performance Issues**: Run local performance tests
- **Security Concerns**: Contact security team immediately

### Resources
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Laravel Testing](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)

---

**Remember**: Tests are living documentation of your code. Keep them clear, maintainable, and valuable! 🚀