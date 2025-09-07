import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')

  // Set up test database if needed
  if (process.env.NODE_ENV === 'test') {
    console.log('📊 Setting up test database...')
    // Add database seeding or migration logic here
  }

  // Create a browser instance for authentication setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Set up authentication state for tests
  try {
    console.log('🔐 Setting up authentication state...')
    
    // Mock authentication for test environment
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-e2e',
            email: 'test@playwright.test',
            firstName: 'Test',
            lastName: 'User'
          }
        })
      })
    })

    // Navigate to the app to establish session
    await page.goto('http://localhost:3002')
    
    // Save authenticated state
    await context.storageState({ path: 'playwright-auth.json' })
    
    console.log('✅ Authentication state saved')
  } catch (error) {
    console.error('❌ Failed to set up authentication:', error)
  }

  await browser.close()

  // Set up any other global test fixtures
  console.log('🔧 Setting up global test fixtures...')
  
  // Mock external services
  process.env.OPENAI_API_KEY = 'test-key-e2e'
  process.env.DATABASE_URL = 'test-database-url'
  
  console.log('✅ Global E2E test setup completed')
}

export default globalSetup