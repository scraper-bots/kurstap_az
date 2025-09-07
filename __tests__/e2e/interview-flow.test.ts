import { test, expect, Page } from '@playwright/test'

// E2E tests for the complete interview flow
test.describe('Interview Flow End-to-End', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Mock authentication - in real tests you'd sign in properly
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'test-user' } })
      })
    })

    await page.goto('/interview')
  })

  test('should complete full interview flow', async () => {
    // Step 1: Setup interview
    await test.step('Setup interview parameters', async () => {
      await expect(page.locator('h1')).toContainText('AI Interview Assistant')
      
      // Enter position
      await page.fill('input[placeholder*="Software Engineer"]', 'Frontend Developer')
      
      // Select difficulty (Medium is default)
      await page.click('text=Medium')
      
      // Verify start button is enabled
      await expect(page.locator('text=Start Voice Interview')).toBeEnabled()
    })

    // Step 2: Start interview
    await test.step('Start interview', async () => {
      // Mock the start interview API
      await page.route('**/api/interview/start', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              sessionId: 'test-session-123',
              currentQuestion: {
                id: 'q1',
                question: 'Tell me about a challenging project you worked on recently.',
                category: 'behavioral',
                difficulty: 'medium',
                expectedDuration: 4
              }
            }
          })
        })
      })

      await page.click('text=Start Voice Interview')
      
      // Should show loading state
      await expect(page.locator('text=Setting up your AI interview')).toBeVisible()
      
      // Should transition to interview interface
      await expect(page.locator('text=Audio Interview Progress')).toBeVisible()
    })

    // Step 3: Interact with interview
    await test.step('Conduct interview interaction', async () => {
      // Mock Daily.co audio services
      await page.evaluate(() => {
        // Mock the Daily.co initialization
        window.dailyAudioService = {
          initialize: () => Promise.resolve(),
          createRoom: () => Promise.resolve('mock-room-url'),
          joinRoom: () => Promise.resolve(),
          startRecording: () => Promise.resolve(),
          stopRecording: () => Promise.resolve(),
          playAIResponse: () => Promise.resolve(),
          leaveRoom: () => Promise.resolve(),
          onCallJoined: null,
          onCallLeft: null,
          onCallError: null,
          onTranscriptReceived: null
        }
      })

      // Should show current question
      await expect(page.locator('text=Tell me about a challenging project')).toBeVisible()
      
      // Should show progress indicator
      await expect(page.locator('text=Question 1 of')).toBeVisible()
      
      // Should show call controls
      await expect(page.locator('text=Start Call')).toBeVisible()
    })

    // Step 4: Submit answer and progress
    await test.step('Submit answer and progress', async () => {
      // Mock answer submission
      await page.route('**/api/interview/answer', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              nextAction: 'next-question',
              currentQuestion: {
                id: 'q2',
                question: 'How do you handle conflicts in your team?',
                category: 'behavioral',
                difficulty: 'medium',
                expectedDuration: 4
              },
              progress: {
                current: 2,
                total: 8
              }
            }
          })
        })
      })

      // Simulate clicking next question (skip for testing)
      await page.click('text=Next Question')
      
      // Should progress to next question
      await expect(page.locator('text=Question 2 of')).toBeVisible()
      await expect(page.locator('text=How do you handle conflicts')).toBeVisible()
    })

    // Step 5: Complete interview
    await test.step('Complete interview', async () => {
      // Mock session data retrieval
      await page.route('**/api/interview/session*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              answers: [
                {
                  questionId: 'q1',
                  question: 'Tell me about a challenging project you worked on recently.',
                  userAnswer: 'I worked on a complex e-commerce platform...',
                  category: 'behavioral'
                }
              ],
              questions: [
                {
                  id: 'q1',
                  question: 'Tell me about a challenging project you worked on recently.',
                  category: 'behavioral',
                  difficulty: 'medium'
                }
              ]
            }
          })
        })
      })

      // Mock completion API
      await page.route('**/api/interviews/complete', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            interviewId: 'completed-interview-123',
            message: 'Interview completed successfully'
          })
        })
      })

      // Mock final answer submission that triggers completion
      await page.route('**/api/interview/answer', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              nextAction: 'completed',
              overallScore: 85,
              progress: {
                current: 8,
                total: 8
              }
            }
          })
        })
      })

      // Click finish early or wait for natural completion
      await page.click('text=Finish Early')
      
      // Should show completion screen
      await expect(page.locator('text=Interview Completed!')).toBeVisible()
      await expect(page.locator('text=Excellent work!')).toBeVisible()
    })

    // Step 6: Post-completion actions
    await test.step('Navigate after completion', async () => {
      // Should show completion summary
      await expect(page.locator('text=Interview Summary')).toBeVisible()
      await expect(page.locator('text=Position: Frontend Developer')).toBeVisible()
      
      // Should have options to start new interview or go to dashboard
      await expect(page.locator('text=Start New Interview')).toBeVisible()
      await expect(page.locator('text=Back to Dashboard')).toBeVisible()
    })
  })

  test('should handle errors gracefully', async () => {
    await test.step('Handle API errors', async () => {
      // Fill in position
      await page.fill('input[placeholder*="Software Engineer"]', 'Backend Developer')
      
      // Mock failed start interview API
      await page.route('**/api/interview/start', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server error'
          })
        })
      })

      await page.click('text=Start Voice Interview')
      
      // Should show loading initially
      await expect(page.locator('text=Setting up your AI interview')).toBeVisible()
      
      // Should return to setup on error
      await expect(page.locator('text=AI Interview Assistant')).toBeVisible()
    })
  })

  test('should validate input requirements', async () => {
    await test.step('Validate position requirement', async () => {
      // Start button should be disabled without position
      await expect(page.locator('text=Start Voice Interview')).toBeDisabled()
      
      // Enable after entering position
      await page.fill('input[placeholder*="Software Engineer"]', 'Data Scientist')
      await expect(page.locator('text=Start Voice Interview')).toBeEnabled()
    })
  })

  test('should support different difficulty levels', async () => {
    await test.step('Select different difficulties', async () => {
      await page.fill('input[placeholder*="Software Engineer"]', 'DevOps Engineer')
      
      // Test Easy difficulty
      await page.click('text=Easy')
      await expect(page.locator('text=5 questions')).toBeVisible()
      
      // Test Hard difficulty
      await page.click('text=Hard')
      await expect(page.locator('text=12 questions')).toBeVisible()
    })
  })

  test('should be responsive on mobile', async () => {
    await test.step('Test mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      
      await page.fill('input[placeholder*="Software Engineer"]', 'Mobile Developer')
      
      // Should still show all elements properly
      await expect(page.locator('h1')).toContainText('AI Interview Assistant')
      await expect(page.locator('text=Easy')).toBeVisible()
      await expect(page.locator('text=Medium')).toBeVisible()
      await expect(page.locator('text=Hard')).toBeVisible()
      
      // Start button should be properly sized
      const startButton = page.locator('text=Start Voice Interview')
      await expect(startButton).toBeVisible()
    })
  })

  test('should handle authentication redirect', async () => {
    await test.step('Handle unauthenticated user', async () => {
      // Mock unauthenticated state
      await page.route('**/api/auth/**', (route) => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        })
      })

      await page.reload()
      
      // Should show sign-in message
      await expect(page.locator('text=Please sign in to start your interview')).toBeVisible()
    })
  })
})