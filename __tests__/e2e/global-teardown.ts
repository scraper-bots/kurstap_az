import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...')

  // Clean up authentication state
  const authFile = 'playwright-auth.json'
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile)
    console.log('🗑️ Authentication state file removed')
  }

  // Clean up test database if needed
  if (process.env.NODE_ENV === 'test') {
    console.log('🗑️ Cleaning up test database...')
    // Add database cleanup logic here
  }

  // Clean up any test artifacts
  const testResultsDir = 'test-results'
  if (fs.existsSync(testResultsDir)) {
    // Clean up old test artifacts but keep recent results
    const files = fs.readdirSync(testResultsDir)
    const oldFiles = files.filter(file => {
      const filePath = path.join(testResultsDir, file)
      const stats = fs.statSync(filePath)
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
      return stats.mtime.getTime() < dayAgo
    })

    oldFiles.forEach(file => {
      const filePath = path.join(testResultsDir, file)
      try {
        fs.unlinkSync(filePath)
        console.log(`🗑️ Removed old test artifact: ${file}`)
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}:`, error)
      }
    })
  }

  // Clean up any temporary files created during tests
  const tempFiles = [
    'test-session-storage.json',
    'test-cache.json',
    'mock-daily-room.json'
  ]

  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file)
        console.log(`🗑️ Removed temporary file: ${file}`)
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}:`, error)
      }
    }
  })

  // Reset environment variables
  delete process.env.PLAYWRIGHT_TEST_MODE
  delete process.env.TEST_OPENAI_API_KEY

  console.log('✅ Global E2E test teardown completed')
}

export default globalTeardown