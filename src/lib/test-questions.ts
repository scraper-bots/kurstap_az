import { OpenAIService } from './openai'
import { PineconeService } from './pinecone'

/**
 * Test script for question generation system
 * Run this to verify everything is working correctly
 */
export async function testQuestionGeneration() {
  console.log('🚀 Starting Question Generation Test...')
  
  try {
    // Test 1: Generate questions with OpenAI
    console.log('\n📝 Test 1: Generating questions with OpenAI...')
    const jobTitle = 'Software Engineer'
    const questionSet = await OpenAIService.generateQuestions(jobTitle)
    
    console.log(`✅ Generated ${questionSet.behavioral.length} behavioral questions`)
    console.log(`✅ Generated ${questionSet.technical.length} technical questions`)
    console.log(`✅ Generated ${questionSet.situational.length} situational questions`)
    
    // Show sample questions
    console.log('\n📋 Sample Questions:')
    if (questionSet.behavioral.length > 0) {
      console.log(`Behavioral: "${questionSet.behavioral[0].question}"`)
    }
    if (questionSet.technical.length > 0) {
      console.log(`Technical: "${questionSet.technical[0].question}"`)
    }
    
    // Test 2: Create Pinecone index (if needed)
    console.log('\n🔧 Test 2: Setting up Pinecone index...')
    await PineconeService.createIndex()
    console.log('✅ Pinecone index ready')
    
    // Test 3: Store questions in Pinecone
    console.log('\n💾 Test 3: Storing questions in Pinecone...')
    await PineconeService.storeQuestionSet(questionSet)
    console.log('✅ Questions stored successfully')
    
    // Test 4: Search questions
    console.log('\n🔍 Test 4: Searching questions...')
    const searchResults = await PineconeService.searchQuestions(
      'tell me about a challenging project',
      jobTitle
    )
    console.log(`✅ Found ${searchResults.length} similar questions`)
    
    if (searchResults.length > 0) {
      console.log(`Top result: "${searchResults[0].question}" (score: ${searchResults[0].score.toFixed(3)})`)
    }
    
    // Test 5: Get questions by job title
    console.log('\n📚 Test 5: Getting questions by job title...')
    const storedQuestions = await PineconeService.getQuestionsByJobTitle(jobTitle)
    console.log(`✅ Retrieved ${storedQuestions.length} stored questions`)
    
    // Test 6: Generate embeddings
    console.log('\n🧮 Test 6: Testing embeddings...')
    const testTexts = ['What is your greatest strength?', 'Describe a technical challenge']
    const embeddings = await OpenAIService.generateEmbeddings(testTexts)
    console.log(`✅ Generated ${embeddings.length} embeddings (${embeddings[0].length} dimensions each)`)
    
    // Test 7: Get index stats
    console.log('\n📊 Test 7: Getting index statistics...')
    const stats = await PineconeService.getIndexStats()
    console.log(`✅ Index contains ${stats.totalRecordCount || 0} vectors`)
    
    console.log('\n🎉 All tests passed! Question generation system is working correctly.')
    
    return {
      success: true,
      questionSet,
      searchResults,
      storedQuestions: storedQuestions.length,
      indexStats: stats
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test the scoring functionality
 */
export async function testAnswerScoring() {
  console.log('\n🧠 Testing Answer Scoring...')
  
  try {
    const question = "Tell me about a time when you had to work with a difficult team member."
    const answer = "In my previous role, I worked with a colleague who was often unresponsive to messages and missed deadlines. I approached them privately to understand if there were any challenges they were facing. It turned out they were overwhelmed with their workload. We worked together to prioritize tasks and I offered to help with some of their responsibilities. This improved our working relationship and project outcomes."
    
    const score = await OpenAIService.scoreAnswer(question, answer, 'Software Engineer', 'behavioral')
    
    console.log('✅ Answer scored successfully:')
    console.log(`   Technical Accuracy: ${score.technicalAccuracy}/10`)
    console.log(`   Communication Clarity: ${score.communicationClarity}/10`)
    console.log(`   Problem Solving: ${score.problemSolvingApproach}/10`)
    console.log(`   Overall Score: ${score.overallScore}/10`)
    console.log(`   Feedback: ${score.feedback}`)
    
    return { success: true, score }
  } catch (error) {
    console.error('❌ Scoring test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Main test function
export async function runAllTests() {
  console.log('🧪 Running Complete Question Generation System Tests')
  console.log('=' .repeat(60))
  
  const questionTest = await testQuestionGeneration()
  const scoringTest = await testAnswerScoring()
  
  console.log('\n📊 Test Summary:')
  console.log(`Question Generation: ${questionTest.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Answer Scoring: ${scoringTest.success ? '✅ PASS' : '❌ FAIL'}`)
  
  if (questionTest.success && scoringTest.success) {
    console.log('\n🎉 All systems operational! Ready for production.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
  
  return {
    questionGeneration: questionTest,
    answerScoring: scoringTest,
    allPassed: questionTest.success && scoringTest.success
  }
}