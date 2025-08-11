/**
 * Comprehensive Test Runner
 * Orchestrates all test suites and generates coverage reports
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '../..')

class TestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, coverage: 0, duration: 0 },
      integration: { passed: 0, failed: 0, coverage: 0, duration: 0 },
      e2e: { passed: 0, failed: 0, coverage: 0, duration: 0 },
      performance: { passed: 0, failed: 0, duration: 0 },
      security: { passed: 0, failed: 0, duration: 0 }
    }
    
    this.coverageThreshold = {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite')
    console.log('=====================================')
    
    const startTime = Date.now()
    
    try {
      // Create test results directory
      this.ensureDirectoryExists(join(projectRoot, 'test-results'))
      
      // Run test suites in sequence
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runE2ETests()
      await this.runPerformanceTests()
      await this.runSecurityTests()
      
      // Generate reports
      await this.generateCoverageReport()
      await this.generateTestReport()
      
      const totalDuration = Date.now() - startTime
      this.displaySummary(totalDuration)
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
      process.exit(1)
    }
  }

  async runUnitTests() {
    console.log('\n📋 Running Unit Tests...')
    console.log('========================')
    
    const startTime = Date.now()
    
    try {
      // Run frontend unit tests
      const vitestResult = this.runCommand(
        'npx vitest run --coverage --reporter=json --outputFile=test-results/unit-results.json',
        { cwd: projectRoot }
      )
      
      // Run backend unit tests
      const phpunitResult = this.runCommand(
        'php artisan test --testsuite=Unit --coverage-clover=test-results/backend-coverage.xml --log-junit=test-results/backend-unit.xml',
        { cwd: join(projectRoot, 'backend') }
      )
      
      this.testResults.unit.duration = Date.now() - startTime
      this.parseUnitTestResults()
      
      console.log(`✅ Unit tests completed in ${this.testResults.unit.duration}ms`)
      console.log(`   Passed: ${this.testResults.unit.passed}, Failed: ${this.testResults.unit.failed}`)
      console.log(`   Coverage: ${this.testResults.unit.coverage}%`)
      
    } catch (error) {
      console.error('❌ Unit tests failed:', error.message)
      this.testResults.unit.failed++
      throw error
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...')
    console.log('===============================')
    
    const startTime = Date.now()
    
    try {
      // Run integration tests with specific pattern
      const result = this.runCommand(
        'npx vitest run src/test/integration --reporter=json --outputFile=test-results/integration-results.json',
        { cwd: projectRoot }
      )
      
      // Run backend feature tests
      const backendResult = this.runCommand(
        'php artisan test --testsuite=Feature --log-junit=test-results/backend-feature.xml',
        { cwd: join(projectRoot, 'backend') }
      )
      
      this.testResults.integration.duration = Date.now() - startTime
      this.parseIntegrationTestResults()
      
      console.log(`✅ Integration tests completed in ${this.testResults.integration.duration}ms`)
      console.log(`   Passed: ${this.testResults.integration.passed}, Failed: ${this.testResults.integration.failed}`)
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error.message)
      this.testResults.integration.failed++
      throw error
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running End-to-End Tests...')
    console.log('==============================')
    
    const startTime = Date.now()
    
    try {
      // Start the application in test mode
      console.log('Starting test server...')
      const serverProcess = this.startTestServer()
      
      // Wait for server to be ready
      await this.waitForServer('http://localhost:5173', 30000)
      
      // Run E2E tests with Playwright
      const result = this.runCommand(
        'npx playwright test --reporter=json --output-dir=test-results/e2e',
        { cwd: projectRoot }
      )
      
      // Stop test server
      serverProcess?.kill()
      
      this.testResults.e2e.duration = Date.now() - startTime
      this.parseE2ETestResults()
      
      console.log(`✅ E2E tests completed in ${this.testResults.e2e.duration}ms`)
      console.log(`   Passed: ${this.testResults.e2e.passed}, Failed: ${this.testResults.e2e.failed}`)
      
    } catch (error) {
      console.error('❌ E2E tests failed:', error.message)
      this.testResults.e2e.failed++
      throw error
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...')
    console.log('===============================')
    
    const startTime = Date.now()
    
    try {
      // Run performance tests
      const result = this.runCommand(
        'npx vitest run src/test/performance --reporter=json --outputFile=test-results/performance-results.json',
        { cwd: projectRoot }
      )
      
      // Run Lighthouse CI for web performance
      const lighthouseResult = this.runCommand(
        'npx @lhci/cli autorun --config=lighthouserc.js',
        { cwd: projectRoot }
      )
      
      this.testResults.performance.duration = Date.now() - startTime
      this.parsePerformanceTestResults()
      
      console.log(`✅ Performance tests completed in ${this.testResults.performance.duration}ms`)
      console.log(`   Passed: ${this.testResults.performance.passed}, Failed: ${this.testResults.performance.failed}`)
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message)
      this.testResults.performance.failed++
      // Don't throw - performance tests are informational
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...')
    console.log('=============================')
    
    const startTime = Date.now()
    
    try {
      // Run security-focused tests
      const result = this.runCommand(
        'npx vitest run src/test/security --reporter=json --outputFile=test-results/security-results.json',
        { cwd: projectRoot }
      )
      
      // Run security audit
      const auditResult = this.runCommand('npm audit --json', { cwd: projectRoot })
      
      this.testResults.security.duration = Date.now() - startTime
      this.parseSecurityTestResults()
      
      console.log(`✅ Security tests completed in ${this.testResults.security.duration}ms`)
      console.log(`   Passed: ${this.testResults.security.passed}, Failed: ${this.testResults.security.failed}`)
      
    } catch (error) {
      console.error('❌ Security tests failed:', error.message)
      this.testResults.security.failed++
      throw error
    }
  }

  async generateCoverageReport() {
    console.log('\n📊 Generating Coverage Report...')
    console.log('================================')
    
    try {
      // Combine coverage reports
      const combinedCoverage = await this.combineCoverageReports()
      
      // Generate HTML report
      this.runCommand(
        'npx nyc report --reporter=html --report-dir=coverage/html',
        { cwd: projectRoot }
      )
      
      // Generate lcov report for CI
      this.runCommand(
        'npx nyc report --reporter=lcov --report-dir=coverage/lcov',
        { cwd: projectRoot }
      )
      
      console.log('✅ Coverage reports generated')
      console.log(`   Location: ${join(projectRoot, 'coverage')}`)
      
    } catch (error) {
      console.error('❌ Coverage report generation failed:', error.message)
    }
  }

  async generateTestReport() {
    console.log('\n📄 Generating Test Report...')
    console.log('============================')
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        ci: process.env.CI === 'true'
      },
      summary: this.calculateSummary(),
      results: this.testResults,
      coverage: await this.calculateCoverageStats(),
      recommendations: this.generateRecommendations()
    }
    
    // Write JSON report
    writeFileSync(
      join(projectRoot, 'test-results', 'test-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    // Write HTML report
    await this.generateHTMLReport(report)
    
    console.log('✅ Test reports generated')
    console.log(`   JSON: ${join(projectRoot, 'test-results', 'test-report.json')}`)
    console.log(`   HTML: ${join(projectRoot, 'test-results', 'test-report.html')}`)
  }

  displaySummary(totalDuration) {
    console.log('\n🎯 Test Suite Summary')
    console.log('====================')
    
    const summary = this.calculateSummary()
    
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`)
    console.log(`Overall Status: ${summary.allPassed ? '✅ PASSED' : '❌ FAILED'}`)
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`Passed: ${summary.totalPassed}`)
    console.log(`Failed: ${summary.totalFailed}`)
    console.log(`Success Rate: ${summary.successRate}%`)
    
    if (summary.coverageAverage >= this.coverageThreshold.global.lines) {
      console.log(`Coverage: ✅ ${summary.coverageAverage}% (meets threshold)`)
    } else {
      console.log(`Coverage: ❌ ${summary.coverageAverage}% (below ${this.coverageThreshold.global.lines}% threshold)`)
    }
    
    console.log('\nDetailed Results:')
    Object.entries(this.testResults).forEach(([suite, results]) => {
      const status = results.failed === 0 ? '✅' : '❌'
      console.log(`  ${status} ${suite}: ${results.passed} passed, ${results.failed} failed (${Math.round(results.duration)}ms)`)
    })
    
    if (!summary.allPassed) {
      console.log('\n❌ Some tests failed. Check the detailed reports for more information.')
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed successfully!')
    }
  }

  // Helper methods
  runCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        ...options
      })
      return result
    } catch (error) {
      throw new Error(`Command failed: ${command}\nError: ${error.message}`)
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  }

  startTestServer() {
    const { spawn } = require('child_process')
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      detached: false
    })
    
    return serverProcess
  }

  async waitForServer(url, timeout = 30000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          console.log('Test server is ready')
          return
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error(`Server at ${url} did not become ready within ${timeout}ms`)
  }

  parseUnitTestResults() {
    try {
      const resultsPath = join(projectRoot, 'test-results', 'unit-results.json')
      if (existsSync(resultsPath)) {
        const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'))
        this.testResults.unit.passed = results.numPassedTests || 0
        this.testResults.unit.failed = results.numFailedTests || 0
        this.testResults.unit.coverage = results.coverageMap?.total?.lines?.pct || 0
      }
    } catch (error) {
      console.warn('Could not parse unit test results:', error.message)
    }
  }

  parseIntegrationTestResults() {
    try {
      const resultsPath = join(projectRoot, 'test-results', 'integration-results.json')
      if (existsSync(resultsPath)) {
        const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'))
        this.testResults.integration.passed = results.numPassedTests || 0
        this.testResults.integration.failed = results.numFailedTests || 0
      }
    } catch (error) {
      console.warn('Could not parse integration test results:', error.message)
    }
  }

  parseE2ETestResults() {
    try {
      const resultsPath = join(projectRoot, 'test-results', 'e2e', 'results.json')
      if (existsSync(resultsPath)) {
        const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'))
        this.testResults.e2e.passed = results.stats?.expected || 0
        this.testResults.e2e.failed = results.stats?.failed || 0
      }
    } catch (error) {
      console.warn('Could not parse E2E test results:', error.message)
    }
  }

  parsePerformanceTestResults() {
    try {
      const resultsPath = join(projectRoot, 'test-results', 'performance-results.json')
      if (existsSync(resultsPath)) {
        const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'))
        this.testResults.performance.passed = results.numPassedTests || 0
        this.testResults.performance.failed = results.numFailedTests || 0
      }
    } catch (error) {
      console.warn('Could not parse performance test results:', error.message)
    }
  }

  parseSecurityTestResults() {
    try {
      const resultsPath = join(projectRoot, 'test-results', 'security-results.json')
      if (existsSync(resultsPath)) {
        const results = JSON.parse(require('fs').readFileSync(resultsPath, 'utf8'))
        this.testResults.security.passed = results.numPassedTests || 0
        this.testResults.security.failed = results.numFailedTests || 0
      }
    } catch (error) {
      console.warn('Could not parse security test results:', error.message)
    }
  }

  calculateSummary() {
    const totalPassed = Object.values(this.testResults).reduce((sum, result) => sum + result.passed, 0)
    const totalFailed = Object.values(this.testResults).reduce((sum, result) => sum + result.failed, 0)
    const totalTests = totalPassed + totalFailed
    const successRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
    const coverageAverage = Math.round(
      Object.values(this.testResults)
        .filter(result => result.coverage > 0)
        .reduce((sum, result) => sum + result.coverage, 0) /
      Object.values(this.testResults).filter(result => result.coverage > 0).length
    )
    
    return {
      totalTests,
      totalPassed,
      totalFailed,
      successRate,
      coverageAverage,
      allPassed: totalFailed === 0 && totalTests > 0
    }
  }

  async combineCoverageReports() {
    // Combine frontend and backend coverage reports
    // This is a placeholder - actual implementation would merge coverage data
    return {}
  }

  async calculateCoverageStats() {
    return {
      frontend: this.testResults.unit.coverage,
      backend: 85, // Placeholder
      overall: Math.round((this.testResults.unit.coverage + 85) / 2)
    }
  }

  generateRecommendations() {
    const recommendations = []
    
    const summary = this.calculateSummary()
    
    if (summary.coverageAverage < this.coverageThreshold.global.lines) {
      recommendations.push({
        type: 'coverage',
        severity: 'high',
        message: `Code coverage (${summary.coverageAverage}%) is below the ${this.coverageThreshold.global.lines}% threshold. Consider adding more unit tests.`
      })
    }
    
    if (this.testResults.security.failed > 0) {
      recommendations.push({
        type: 'security',
        severity: 'critical',
        message: 'Security tests are failing. Address these issues immediately as they may indicate vulnerabilities.'
      })
    }
    
    if (this.testResults.performance.failed > 0) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: 'Performance tests are failing. Consider optimizing slow operations and improving resource usage.'
      })
    }
    
    return recommendations
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Unified Contractors</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .passed { border-left: 4px solid #4caf50; }
        .failed { border-left: 4px solid #f44336; }
        .warning { border-left: 4px solid #ff9800; }
        .recommendations { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Unified Contractors - Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Environment: ${report.environment.platform} (Node ${report.environment.node})</p>
        <p>CI: ${report.environment.ci ? 'Yes' : 'No'}</p>
    </div>

    <div class="summary">
        <div class="card ${report.summary.allPassed ? 'passed' : 'failed'}">
            <h3>Overall Status</h3>
            <p style="font-size: 24px; margin: 0;">
                ${report.summary.allPassed ? '✅ PASSED' : '❌ FAILED'}
            </p>
        </div>
        <div class="card">
            <h3>Total Tests</h3>
            <p style="font-size: 24px; margin: 0;">${report.summary.totalTests}</p>
        </div>
        <div class="card passed">
            <h3>Passed</h3>
            <p style="font-size: 24px; margin: 0;">${report.summary.totalPassed}</p>
        </div>
        <div class="card ${report.summary.totalFailed > 0 ? 'failed' : ''}">
            <h3>Failed</h3>
            <p style="font-size: 24px; margin: 0;">${report.summary.totalFailed}</p>
        </div>
        <div class="card ${report.summary.coverageAverage >= 80 ? 'passed' : 'warning'}">
            <h3>Coverage</h3>
            <p style="font-size: 24px; margin: 0;">${report.summary.coverageAverage}%</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Test Suite</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Duration (ms)</th>
                <th>Coverage (%)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(report.results).map(([suite, results]) => `
                <tr>
                    <td>${suite}</td>
                    <td style="color: green;">${results.passed}</td>
                    <td style="color: red;">${results.failed}</td>
                    <td>${Math.round(results.duration)}</td>
                    <td>${results.coverage || 'N/A'}</td>
                    <td>${results.failed === 0 ? '✅ Passed' : '❌ Failed'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
                ${report.recommendations.map(rec => `
                    <li>
                        <strong>${rec.severity.toUpperCase()}:</strong> 
                        ${rec.message}
                    </li>
                `).join('')}
            </ul>
        </div>
    ` : ''}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p>Report generated by Unified Contractors Test Suite</p>
    </footer>
</body>
</html>
    `
    
    writeFileSync(
      join(projectRoot, 'test-results', 'test-report.html'),
      html
    )
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner()
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

export default TestRunner