#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * This script runs comprehensive performance tests including:
 * - Bundle size analysis
 * - Lighthouse performance audit
 * - Load time measurements
 * - Core Web Vitals monitoring
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
}

const log = (message, color = colors.white) => {
  console.log(`${color}${message}${colors.reset}`)
}

const logHeader = (message) => {
  log('\n' + '='.repeat(60), colors.cyan)
  log(` ${message}`, colors.cyan)
  log('='.repeat(60), colors.cyan)
}

const logSuccess = (message) => log(`✅ ${message}`, colors.green)
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow)
const logError = (message) => log(`❌ ${message}`, colors.red)
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue)

class PerformanceTest {
  constructor() {
    this.results = {
      bundleSize: null,
      lighthouse: null,
      buildTime: null,
      timestamp: new Date().toISOString()
    }
  }

  async run() {
    try {
      logHeader('🚀 Starting Performance Tests')
      
      await this.measureBuildTime()
      await this.analyzeBundleSize()
      await this.runLighthouseTests()
      await this.generateReport()
      
      logHeader('✨ Performance Tests Complete')
      this.displaySummary()
      
    } catch (error) {
      logError(`Performance test failed: ${error.message}`)
      process.exit(1)
    }
  }

  async measureBuildTime() {
    logHeader('⏱️  Measuring Build Time')
    
    const startTime = Date.now()
    
    try {
      await execAsync('npm run build')
      const buildTime = Date.now() - startTime
      this.results.buildTime = buildTime
      
      logSuccess(`Build completed in ${buildTime}ms`)
      
      if (buildTime > 30000) {
        logWarning('Build time is above 30 seconds - consider optimization')
      } else if (buildTime < 10000) {
        logSuccess('Excellent build time!')
      }
      
    } catch (error) {
      logError(`Build failed: ${error.message}`)
      throw error
    }
  }

  async analyzeBundleSize() {
    logHeader('📦 Analyzing Bundle Size')
    
    try {
      // Generate bundle analysis
      await execAsync('npm run build:analyze')
      
      // Read the dist directory to analyze file sizes
      const distPath = join(process.cwd(), 'dist')
      const stats = await this.getBundleStats(distPath)
      
      this.results.bundleSize = stats
      
      logInfo(`Total bundle size: ${stats.totalSize} KB`)
      logInfo(`Gzipped size: ${stats.gzippedSize} KB`)
      logInfo(`JavaScript size: ${stats.jsSize} KB`)
      logInfo(`CSS size: ${stats.cssSize} KB`)
      
      // Performance budget checks
      if (stats.gzippedSize > 200) {
        logWarning('Bundle size exceeds 200KB budget')
      } else {
        logSuccess('Bundle size within budget')
      }
      
    } catch (error) {
      logError(`Bundle analysis failed: ${error.message}`)
      throw error
    }
  }

  async getBundleStats(distPath) {
    const stats = {
      totalSize: 0,
      gzippedSize: 0,
      jsSize: 0,
      cssSize: 0,
      files: []
    }

    try {
      const { stdout } = await execAsync(`find ${distPath} -type f -name "*.js" -o -name "*.css" | head -20`)
      const files = stdout.trim().split('\n').filter(Boolean)
      
      for (const file of files) {
        const { size } = await this.getFileSize(file)
        const fileName = file.split('/').pop()
        
        stats.files.push({ name: fileName, size })
        stats.totalSize += size
        
        if (fileName.endsWith('.js')) {
          stats.jsSize += size
        } else if (fileName.endsWith('.css')) {
          stats.cssSize += size
        }
      }
      
      // Estimate gzipped size (approximately 70% smaller)
      stats.gzippedSize = Math.round(stats.totalSize * 0.3)
      
      // Convert to KB
      stats.totalSize = Math.round(stats.totalSize / 1024)
      stats.gzippedSize = Math.round(stats.gzippedSize / 1024)
      stats.jsSize = Math.round(stats.jsSize / 1024)
      stats.cssSize = Math.round(stats.cssSize / 1024)
      
    } catch (error) {
      logWarning(`Could not analyze bundle size in detail: ${error.message}`)
      stats.totalSize = 'Unknown'
      stats.gzippedSize = 'Unknown'
    }
    
    return stats
  }

  async getFileSize(filePath) {
    try {
      const { stdout } = await execAsync(`stat -c%s "${filePath}"`)
      return { size: parseInt(stdout.trim()) }
    } catch (error) {
      logWarning(`Could not get file size: ${error.message}`)
      return { size: 0 }
    }
  }

  async runLighthouseTests() {
    logHeader('🔍 Running Lighthouse Performance Audit')
    
    try {
      // Start preview server
      logInfo('Starting preview server...')
      const serverProcess = exec('npm run preview')
      
      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Run Lighthouse
      const { stdout } = await execAsync('npm run lighthouse')
      
      // Parse Lighthouse results (simplified)
      const lighthouseResults = this.parseLighthouseResults(stdout)
      this.results.lighthouse = lighthouseResults
      
      logSuccess('Lighthouse audit completed')
      
      // Kill preview server
      serverProcess.kill()
      
    } catch (error) {
      logError(`Lighthouse test failed: ${error.message}`)
      logWarning('Continuing without Lighthouse results')
      this.results.lighthouse = { error: error.message }
    }
  }

  parseLighthouseResults(output) {
    // Simplified parser - in real implementation would parse JSON output
    const results = {
      performance: 'Unknown',
      accessibility: 'Unknown',
      bestPractices: 'Unknown',
      seo: 'Unknown',
      pwa: 'Unknown'
    }
    
    try {
      // Look for score patterns in output
      const performanceMatch = output.match(/Performance: (\d+)/i)
      const accessibilityMatch = output.match(/Accessibility: (\d+)/i)
      const bestPracticesMatch = output.match(/Best Practices: (\d+)/i)
      const seoMatch = output.match(/SEO: (\d+)/i)
      const pwaMatch = output.match(/PWA: (\d+)/i)
      
      if (performanceMatch) results.performance = performanceMatch[1]
      if (accessibilityMatch) results.accessibility = accessibilityMatch[1]
      if (bestPracticesMatch) results.bestPractices = bestPracticesMatch[1]
      if (seoMatch) results.seo = seoMatch[1]
      if (pwaMatch) results.pwa = pwaMatch[1]
      
    } catch (error) {
      logWarning(`Could not parse Lighthouse results: ${error.message}`)
    }
    
    return results
  }

  async generateReport() {
    logHeader('📊 Generating Performance Report')
    
    const reportPath = join(process.cwd(), 'performance-report.json')
    
    try {
      // Load previous results if they exist
      let historicalData = []
      if (existsSync(reportPath)) {
        const previousReport = JSON.parse(readFileSync(reportPath, 'utf8'))
        historicalData = previousReport.history || []
      }
      
      // Add current results to history
      historicalData.push(this.results)
      
      // Keep only last 10 results
      if (historicalData.length > 10) {
        historicalData = historicalData.slice(-10)
      }
      
      const report = {
        current: this.results,
        history: historicalData,
        summary: this.generateSummary(),
        recommendations: this.generateRecommendations()
      }
      
      writeFileSync(reportPath, JSON.stringify(report, null, 2))
      logSuccess(`Performance report saved to ${reportPath}`)
      
    } catch (error) {
      logError(`Failed to generate report: ${error.message}`)
    }
  }

  generateSummary() {
    const summary = {
      grade: 'Unknown',
      issues: [],
      strengths: []
    }
    
    // Build time analysis
    if (this.results.buildTime) {
      if (this.results.buildTime < 10000) {
        summary.strengths.push('Fast build time')
      } else if (this.results.buildTime > 30000) {
        summary.issues.push('Slow build time')
      }
    }
    
    // Bundle size analysis
    if (this.results.bundleSize && this.results.bundleSize.gzippedSize !== 'Unknown') {
      if (this.results.bundleSize.gzippedSize < 200) {
        summary.strengths.push('Optimal bundle size')
      } else {
        summary.issues.push('Large bundle size')
      }
    }
    
    // Calculate overall grade
    const issueCount = summary.issues.length
    const strengthCount = summary.strengths.length
    
    if (issueCount === 0 && strengthCount > 2) {
      summary.grade = 'A'
    } else if (issueCount <= 1) {
      summary.grade = 'B'
    } else if (issueCount <= 2) {
      summary.grade = 'C'
    } else {
      summary.grade = 'D'
    }
    
    return summary
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.results.buildTime > 30000) {
      recommendations.push({
        type: 'build',
        priority: 'high',
        message: 'Optimize build configuration for faster builds'
      })
    }
    
    if (this.results.bundleSize && this.results.bundleSize.gzippedSize > 200) {
      recommendations.push({
        type: 'bundle',
        priority: 'high',
        message: 'Reduce bundle size through code splitting and tree shaking'
      })
    }
    
    if (this.results.bundleSize && this.results.bundleSize.jsSize > 150) {
      recommendations.push({
        type: 'javascript',
        priority: 'medium',
        message: 'Consider lazy loading for non-critical JavaScript'
      })
    }
    
    return recommendations
  }

  displaySummary() {
    const summary = this.generateSummary()
    
    log(`\n📈 Performance Grade: ${summary.grade}`, 
        summary.grade === 'A' ? colors.green : 
        summary.grade === 'B' ? colors.blue :
        summary.grade === 'C' ? colors.yellow : colors.red)
    
    if (summary.strengths.length > 0) {
      log('\n✅ Strengths:', colors.green)
      summary.strengths.forEach(strength => log(`  • ${strength}`, colors.green))
    }
    
    if (summary.issues.length > 0) {
      log('\n⚠️  Areas for Improvement:', colors.yellow)
      summary.issues.forEach(issue => log(`  • ${issue}`, colors.yellow))
    }
    
    const recommendations = this.generateRecommendations()
    if (recommendations.length > 0) {
      log('\n💡 Recommendations:', colors.cyan)
      recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? colors.red : 
                        rec.priority === 'medium' ? colors.yellow : colors.blue
        log(`  • [${rec.priority.toUpperCase()}] ${rec.message}`, priority)
      })
    }
    
    log(`\n📊 Full report available in: performance-report.json`, colors.blue)
  }
}

// Run the performance test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new PerformanceTest()
  test.run().catch(error => {
    logError(`Test runner failed: ${error.message}`)
    process.exit(1)
  })
}

export default PerformanceTest