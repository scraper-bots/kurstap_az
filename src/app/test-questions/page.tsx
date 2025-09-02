'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, Target, Lightbulb, BookOpen, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Question {
  id: number
  question: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tips: string[]
  sampleAnswer: string
}

const practiceQuestions: Question[] = [
  {
    id: 1,
    question: "Tell me about yourself and your professional background.",
    category: "Behavioral",
    difficulty: "Easy",
    tips: [
      "Keep it concise and relevant to the role",
      "Follow a chronological structure",
      "Focus on achievements and skills",
      "End with why you're interested in this opportunity"
    ],
    sampleAnswer: "I'm a software engineer with 5 years of experience building scalable web applications. I started my career at a startup where I learned full-stack development and worked on everything from database optimization to user interface design. Currently, I lead a team of 3 developers at TechCorp, where we've increased application performance by 40% and reduced deployment time by 60%. I'm particularly passionate about creating efficient, user-friendly solutions, which is why I'm excited about this opportunity to work on innovative products that impact millions of users."
  },
  {
    id: 2,
    question: "Describe a time when you had to work with a difficult team member.",
    category: "Behavioral",
    difficulty: "Medium",
    tips: [
      "Choose a real situation with a positive outcome",
      "Focus on your actions and communication",
      "Show empathy and professionalism",
      "Highlight what you learned"
    ],
    sampleAnswer: "In my previous role, I worked with a colleague who was consistently missing deadlines and wasn't communicating about blockers. Rather than escalate immediately, I first tried to understand their perspective. I discovered they were overwhelmed with multiple projects and felt unsupported. I offered to help prioritize tasks and pair program on complex issues. We also established daily check-ins to identify problems early. This approach improved their performance and strengthened our working relationship. The project was completed on time, and we continued to collaborate effectively on future projects."
  },
  {
    id: 3,
    question: "How would you design a URL shortening service like bit.ly?",
    category: "System Design",
    difficulty: "Hard",
    tips: [
      "Start with requirements and scale expectations",
      "Design the database schema",
      "Consider caching and performance",
      "Discuss monitoring and analytics"
    ],
    sampleAnswer: "I'd start by clarifying requirements: generating short URLs, redirecting to original URLs, and handling high read traffic. For the database, I'd use a key-value store with the short URL as key and original URL as value. For URL encoding, I'd use base62 encoding with a distributed counter system. To handle scale, I'd implement Redis caching for frequently accessed URLs, use CDNs for geographic distribution, and database sharding for writes. I'd also include analytics tracking, rate limiting, and monitoring for system health."
  },
  {
    id: 4,
    question: "Write a function to find the first non-repeating character in a string.",
    category: "Technical",
    difficulty: "Medium",
    tips: [
      "Consider time and space complexity",
      "Think about edge cases",
      "Explain your approach clearly",
      "Consider different solutions"
    ],
    sampleAnswer: "I'd use a hash map to count character frequencies, then iterate through the string to find the first character with count 1. Time complexity: O(n), space complexity: O(1) for ASCII characters. Here's the approach: 1) Create a frequency map by iterating through the string 2) Iterate through the string again and return the first character with frequency 1 3) Return null if no unique character exists. This handles edge cases like empty strings and strings with all repeating characters."
  },
  {
    id: 5,
    question: "How do you handle stress and pressure in the workplace?",
    category: "Behavioral",
    difficulty: "Easy",
    tips: [
      "Be honest but positive",
      "Give specific examples",
      "Show self-awareness",
      "Mention stress management techniques"
    ],
    sampleAnswer: "I handle stress by staying organized and maintaining clear priorities. When facing tight deadlines, I break large tasks into smaller, manageable pieces and focus on one thing at a time. I also communicate proactively with my team about potential challenges. For example, during a critical product launch, I created a detailed timeline, identified potential risks early, and held daily sync meetings. I also practice mindfulness and exercise regularly to maintain mental clarity. This approach helped us deliver the launch successfully and ahead of schedule."
  },
  {
    id: 6,
    question: "Explain the difference between processes and threads.",
    category: "Technical",
    difficulty: "Medium",
    tips: [
      "Define both concepts clearly",
      "Explain key differences",
      "Discuss use cases",
      "Mention advantages and disadvantages"
    ],
    sampleAnswer: "Processes are independent programs in execution with their own memory space, while threads are lightweight units within a process that share memory. Key differences: 1) Memory isolation - processes have separate memory spaces, threads share memory 2) Communication - processes use IPC, threads use shared memory 3) Creation cost - threads are lighter to create 4) Failure impact - process crash doesn't affect others, thread crash can affect the entire process. Threads are useful for concurrent tasks within an application, while processes provide isolation for separate applications or services."
  }
]

export default function PracticeQuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  const categories = ['All', 'Behavioral', 'Technical', 'System Design']
  const difficulties = ['All', 'Easy', 'Medium', 'Hard']

  const filteredQuestions = practiceQuestions.filter(q => {
    const categoryMatch = selectedCategory === 'All' || q.category === selectedCategory
    const difficultyMatch = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Behavioral': return 'bg-blue-100 text-blue-800'
      case 'Technical': return 'bg-purple-100 text-purple-800'
      case 'System Design': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Practice Questions
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Sharpen your interview skills with our curated collection of questions from real interviews. 
                Practice, learn, and build confidence for your next opportunity.
              </p>
              <Link
                href="/interview"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Start AI Interview Practice
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Filter by:</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Difficulty:</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getCategoryColor(question.category)}`}>
                          {question.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {question.question}
                      </h3>
                    </div>
                    <div className="ml-4">
                      {expandedQuestion === question.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedQuestion === question.id && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    {/* Tips */}
                    <div className="mb-6">
                      <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                        Tips for Success
                      </h4>
                      <ul className="space-y-2">
                        {question.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sample Answer */}
                    <div>
                      <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                        <Clock className="w-5 h-5 mr-2 text-green-500" />
                        Sample Answer
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">{question.sampleAnswer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more questions.</p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Ready for Real Interview Practice?</h3>
            <p className="text-blue-100 mb-6 text-lg max-w-2xl mx-auto">
              Take your preparation to the next level with our AI-powered interview simulator. 
              Get personalized feedback and track your improvement in real-time.
            </p>
            <Link
              href="/interview"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start AI Interview Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}