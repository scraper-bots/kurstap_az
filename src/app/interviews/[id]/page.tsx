import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Target, TrendingUp, AlertTriangle, CheckCircle, Award, ArrowRight } from 'lucide-react'

async function getInterviewDetail(interviewId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/interviews/${interviewId}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching interview detail:', error)
    return null
  }
}

// Mock detailed interview data (fallback)
const mockInterviewDetails = {
  '1': {
    id: '1',
    title: 'Senior Software Engineer Interview',
    company: 'Tech Corp',
    position: 'Senior Software Engineer',
    date: '2024-01-15T10:00:00Z',
    duration: 45,
    difficulty: 'Hard',
    status: 'completed',
    overallScore: 78,
    questionsCount: 12,
    category: 'Technical',
    questions: [
      {
        id: 1,
        question: "Tell me about yourself and your experience with scalable systems.",
        userAnswer: "I have 5 years of experience in software development, working primarily with distributed systems. I've built microservices architectures that handle millions of requests per day using technologies like Node.js, Redis, and PostgreSQL. In my current role, I led the migration from monolithic to microservices architecture which improved our system's scalability by 300%.",
        idealAnswer: "A strong answer should cover relevant experience, specific technologies, quantifiable achievements, and demonstrate understanding of scalable systems principles.",
        score: 85,
        strengths: ["Clear communication", "Specific examples", "Quantifiable results"],
        weaknesses: ["Could mention more about system design patterns", "Missing details about challenges faced"],
        category: "Behavioral"
      },
      {
        id: 2, 
        question: "How would you design a URL shortening service like bit.ly?",
        userAnswer: "I would use a hash function to generate short URLs, store mappings in a database, and use caching for popular URLs. The system would need to handle high read traffic, so I'd implement Redis caching and database sharding.",
        idealAnswer: "Should cover database design, encoding strategies, caching, load balancing, analytics, and scalability considerations.",
        score: 72,
        strengths: ["Mentioned caching", "Considered scalability"],
        weaknesses: ["Didn't discuss encoding strategies in detail", "Missing analytics component", "No mention of load balancing"],
        category: "System Design"
      },
      {
        id: 3,
        question: "Implement a function to find the longest palindromic substring.",
        userAnswer: "I would use dynamic programming approach. Create a 2D table to store whether substrings are palindromes, then iterate through all possible substrings to find the longest one.",
        idealAnswer: "Multiple approaches possible: dynamic programming O(n²), expand around centers O(n²), or Manacher's algorithm O(n).",
        score: 68,
        strengths: ["Correct approach mentioned", "Understanding of dynamic programming"],
        weaknesses: ["Didn't provide implementation details", "Could mention time complexity", "Didn't consider space optimization"],
        category: "Coding"
      }
    ],
    overallAnalysis: {
      strengths: [
        "Strong technical background and experience",
        "Good communication skills",
        "Practical examples and quantifiable results",
        "Understanding of scalable systems"
      ],
      weaknesses: [
        "Need to provide more implementation details in coding questions",
        "System design answers could be more comprehensive",
        "Should discuss time/space complexity analysis",
        "Could benefit from mentioning more design patterns"
      ],
      recommendations: [
        "Practice more system design problems focusing on complete architecture",
        "Work on coding implementation details and complexity analysis",
        "Study common design patterns and when to apply them",
        "Practice explaining technical concepts with more depth"
      ]
    },
    categoryScores: {
      "Behavioral": 85,
      "System Design": 72, 
      "Coding": 68,
      "Technical Knowledge": 80
    }
  }
}

interface InterviewDetailProps {
  params: Promise<{ id: string }>
}

export default async function InterviewDetailPage({ params }: InterviewDetailProps) {
  const { id } = await params
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  const interview = await getInterviewDetail(id) || mockInterviewDetails[id as keyof typeof mockInterviewDetails]
  
  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Interview Not Found</h1>
          <Link href="/interviews" className="text-blue-600 hover:text-blue-800">
            ← Back to Interviews
          </Link>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/interviews" className="text-blue-600 hover:text-blue-800">
                ← Back to Interviews
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{interview.title}</h1>
                <p className="text-gray-600 mt-1">{interview.company} • {new Date(interview.date).toLocaleDateString()}</p>
              </div>
            </div>
            <UserButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${getScoreColor(interview.overallScore).split(' ')[0]}`}>
                {interview.overallScore}%
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{interview.duration}m</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{interview.questionsCount}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{interview.difficulty}</div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(interview.categoryScores).map(([category, score]) => (
              <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold mb-1 ${getScoreColor(Number(score)).split(' ')[0]}`}>
                  {score}%
                </div>
                <div className="text-sm text-gray-600">{category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Questions & Answers</h2>
          {interview.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                      Question {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(q.score)}`}>
                      {q.score}%
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded">
                      {q.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{q.question}</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{q.userAnswer}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ideal Answer Guidance:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{q.idealAnswer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {q.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {q.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Analysis & Improvement Plan</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {interview.overallAnalysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Areas Needing Improvement
              </h3>
              <ul className="space-y-2">
                {interview.overallAnalysis.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Personalized Action Plan
            </h3>
            <div className="space-y-3">
              {interview.overallAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start bg-blue-50 p-4 rounded-lg">
                  <span className="bg-blue-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/interview"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Practice Again
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}