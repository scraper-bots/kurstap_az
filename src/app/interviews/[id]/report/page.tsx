// import { redirect } from 'next/navigation' // TODO: Add proper auth redirects
import Link from 'next/link'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Brain, 
  Award, 
  BookOpen,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

async function getInterviewReport(interviewId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Make a server-side request to get user info from cookies
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('bir-guru-session')
    
    if (!sessionCookie) {
      console.log('No session cookie found')
      return null
    }
    
    // First, get user info from session
    const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': `bir-guru-session=${sessionCookie.value}`
      }
    })
    
    if (!userResponse.ok) {
      console.log('Failed to get user info:', userResponse.status)
      return null
    }
    
    const userData = await userResponse.json()
    if (!userData.success || !userData.user) {
      console.log('Invalid user data:', userData)
      return null
    }
    
    // Now fetch the interview report with the user ID
    const response = await fetch(`${baseUrl}/api/interviews/${interviewId}/report`, {
      cache: 'no-store',
      headers: {
        'x-user-id': userData.user.id
      }
    })
    
    if (!response.ok) {
      console.log('Failed to fetch interview report:', response.status)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching interview report:', error)
    return null
  }
}

// Extended mock data for detailed report (fallback)
const mockDetailedReport = {
  '1': {
    basicInfo: {
      title: 'Senior Software Engineer Interview',
      company: 'Tech Corp',
      date: '2024-01-15T10:00:00Z',
      duration: 45,
      overallScore: 78,
      difficulty: 'Hard'
    },
    detailedMetrics: {
      responseTime: {
        average: 28, // seconds
        fastest: 12,
        slowest: 45,
        trend: 'improving' // getting faster over time
      },
      confidence: {
        overall: 75,
        byCategory: {
          'Technical': 80,
          'Behavioral': 85,
          'System Design': 65,
          'Coding': 70
        }
      },
      communicationSkills: {
        clarity: 85,
        structure: 78,
        engagement: 82,
        technicalLanguage: 88
      }
    },
    strengthsAnalysis: [
      {
        area: 'Technical Knowledge',
        score: 85,
        description: 'Demonstrates strong understanding of distributed systems and scalable architectures',
        evidence: ['Mentioned specific technologies like Redis, PostgreSQL', 'Explained microservices migration clearly', 'Showed understanding of system trade-offs']
      },
      {
        area: 'Problem-Solving Approach', 
        score: 80,
        description: 'Shows systematic thinking and considers multiple aspects of problems',
        evidence: ['Broke down complex problems into components', 'Considered scalability implications', 'Thought about caching strategies']
      },
      {
        area: 'Communication',
        score: 82,
        description: 'Clear and structured communication with good use of examples',
        evidence: ['Used specific examples from experience', 'Explained concepts clearly', 'Good pacing and clarity']
      }
    ],
    weaknessesAnalysis: [
      {
        area: 'System Design Depth',
        score: 65,
        description: 'Needs to provide more comprehensive system design solutions',
        impact: 'May struggle with senior-level architecture discussions',
        improvementActions: [
          'Study system design patterns in depth',
          'Practice drawing system diagrams', 
          'Learn about distributed system challenges',
          'Review case studies of large-scale systems'
        ]
      },
      {
        area: 'Code Implementation Details',
        score: 68,
        description: 'Tends to describe algorithms at high level without implementation specifics',
        impact: 'May not demonstrate hands-on coding proficiency effectively',
        improvementActions: [
          'Practice coding problems with full implementation',
          'Focus on edge cases and error handling',
          'Discuss time and space complexity analysis',
          'Code in real-time during practice sessions'
        ]
      }
    ],
    benchmarkComparison: {
      industryAverage: {
        overall: 72,
        technical: 74,
        behavioral: 78,
        systemDesign: 69
      },
      yourScores: {
        overall: 78,
        technical: 80,
        behavioral: 85,
        systemDesign: 65
      },
      percentileRanking: 68 // better than 68% of candidates
    },
    improvementRoadmap: {
      immediate: [
        {
          skill: 'System Design Fundamentals',
          timeline: '2-3 weeks',
          resources: ['Designing Data-Intensive Applications book', 'System Design Interview courses', 'Practice with real system examples'],
          measurableGoal: 'Complete 10 system design problems with detailed solutions'
        },
        {
          skill: 'Coding Implementation',
          timeline: '3-4 weeks', 
          resources: ['LeetCode premium', 'Cracking the Coding Interview', 'Daily coding practice'],
          measurableGoal: 'Solve 50 medium-level problems with complete implementations'
        }
      ],
      longTerm: [
        {
          skill: 'Leadership & Communication',
          timeline: '2-3 months',
          resources: ['Technical leadership courses', 'Practice technical presentations', 'Mentoring junior developers'],
          measurableGoal: 'Lead a technical architecture discussion at work'
        },
        {
          skill: 'Advanced Architecture Patterns',
          timeline: '3-6 months',
          resources: ['Microservices patterns study', 'Cloud architecture certifications', 'Real-world project experience'],
          measurableGoal: 'Design and implement a microservices solution'
        }
      ]
    },
    nextSteps: {
      recommendedPractice: [
        'Focus on system design interviews - practice 2-3 problems weekly',
        'Implement coding solutions completely, not just algorithms',
        'Record yourself answering questions to improve communication',
        'Join system design discussion groups or forums'
      ],
      suggestedResources: [
        {
          type: 'Course',
          name: 'Grokking the System Design Interview',
          provider: 'Educative',
          duration: '4-6 weeks'
        },
        {
          type: 'Book',
          name: 'System Design Interview - An Insider\'s Guide',
          author: 'Alex Xu',
          duration: '3-4 weeks'
        },
        {
          type: 'Practice',
          name: 'Mock System Design Interviews',
          provider: 'Pramp/InterviewBit',
          frequency: 'Weekly'
        }
      ],
      targetImprovement: {
        nextScore: 85,
        timeline: '6-8 weeks',
        keyFocusAreas: ['System Design', 'Implementation Details', 'Architecture Discussions']
      }
    }
  }
}

interface ReportProps {
  params: Promise<{ id: string }>
}

export default async function DetailedReportPage({ params }: ReportProps) {
  const { id } = await params
  // TODO: Add proper authentication check

  const report = await getInterviewReport(id) || mockDetailedReport[id as keyof typeof mockDetailedReport]
  
  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <Link href="/interviews" className="text-blue-600 hover:text-blue-800">
            ← Back to Interviews
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/interviews/${id}`} className="text-blue-600 hover:text-blue-800">
                ← Back to Interview
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detailed Performance Report</h1>
                <p className="text-gray-600 mt-1">{report.basicInfo.title} • {report.basicInfo.company}</p>
              </div>
            </div>
            {/* TODO: Add user menu */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{report.basicInfo.overallScore}%</div>
              <div className="text-blue-100">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{report.benchmarkComparison.percentileRanking}%</div>
              <div className="text-blue-100">Percentile Rank</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{report.detailedMetrics.confidence.overall}%</div>
              <div className="text-blue-100">Confidence Level</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{report.nextSteps.targetImprovement.nextScore}%</div>
              <div className="text-blue-100">Target Score</div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Response Time Analysis */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Response Time Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-semibold">{report.detailedMetrics.responseTime.average}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fastest Response</span>
                <span className="font-semibold text-green-600">{report.detailedMetrics.responseTime.fastest}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Slowest Response</span>
                <span className="font-semibold text-red-600">{report.detailedMetrics.responseTime.slowest}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trend</span>
                <span className="flex items-center text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Improving
                </span>
              </div>
            </div>
          </div>

          {/* Communication Skills */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              Communication Skills
            </h3>
            <div className="space-y-3">
              {Object.entries(report.detailedMetrics.communicationSkills).map(([skill, score]) => (
                <div key={skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600 capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-medium">{Number(score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${Number(score) >= 80 ? 'bg-green-500' : Number(score) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${Number(score)}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
            Industry Benchmark Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(report.benchmarkComparison.industryAverage).map(([category, industryScore]) => {
              const yourScore = report.benchmarkComparison.yourScores[category as keyof typeof report.benchmarkComparison.yourScores]
              const difference = yourScore - Number(industryScore)
              
              return (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">You</span>
                      <span className={`font-semibold ${yourScore >= Number(industryScore) ? 'text-green-600' : 'text-red-600'}`}>
                        {yourScore}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Industry</span>
                      <span className="text-gray-700">{Number(industryScore)}%</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Difference</span>
                      <span className={difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {difference > 0 ? '+' : ''}{difference}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Strengths Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2 text-green-600" />
            Detailed Strengths Analysis
          </h3>
          <div className="space-y-6">
            {report.strengthsAnalysis.map((strength: any, idx: number) => (
              <div key={idx} className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{strength.area}</h4>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    {strength.score}%
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{strength.description}</p>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Evidence:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {strength.evidence.map((evidence: string, evidenceIdx: number) => (
                      <li key={evidenceIdx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses Analysis */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
            Areas for Improvement
          </h3>
          <div className="space-y-8">
            {report.weaknessesAnalysis.map((weakness: any, idx: number) => (
              <div key={idx} className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{weakness.area}</h4>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                    {weakness.score}%
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{weakness.description}</p>
                <div className="bg-orange-50 p-3 rounded-lg mb-4">
                  <h5 className="text-sm font-medium text-orange-900 mb-1">Impact:</h5>
                  <p className="text-sm text-orange-700">{weakness.impact}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {weakness.improvementActions.map((action: string, actionIdx: number) => (
                      <li key={actionIdx} className="flex items-start">
                        <Target className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Roadmap */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-yellow-600" />
            Personalized Improvement Roadmap
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-blue-700 mb-4">Immediate Focus (2-4 weeks)</h4>
              <div className="space-y-4">
                {report.improvementRoadmap.immediate.map((item: any, idx: number) => (
                  <div key={idx} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{item.skill}</h5>
                      <span className="text-sm text-blue-600 font-medium">{item.timeline}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Goal: </span>
                      <span className="text-sm text-gray-600">{item.measurableGoal}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Resources:</span>
                      <ul className="text-sm text-gray-600 mt-1">
                        {item.resources.map((resource: string, resourceIdx: number) => (
                          <li key={resourceIdx} className="flex items-start ml-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-green-700 mb-4">Long-term Development (2-6 months)</h4>
              <div className="space-y-4">
                {report.improvementRoadmap.longTerm.map((item: any, idx: number) => (
                  <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{item.skill}</h5>
                      <span className="text-sm text-green-600 font-medium">{item.timeline}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Goal: </span>
                      <span className="text-sm text-gray-600">{item.measurableGoal}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Resources:</span>
                      <ul className="text-sm text-gray-600 mt-1">
                        {item.resources.map((resource: string, resourceIdx: number) => (
                          <li key={resourceIdx} className="flex items-start ml-2">
                            <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps & Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
              Recommended Resources
            </h3>
            <div className="space-y-4">
              {report.nextSteps.suggestedResources.map((resource: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{resource.name}</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                      {resource.type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {resource.provider && <span>by {resource.provider}</span>}
                    {resource.author && <span>by {resource.author}</span>}
                    {resource.frequency && <span>{resource.frequency}</span>}
                    {resource.duration && <span> • {resource.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Target Achievement
            </h3>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {report.nextSteps.targetImprovement.nextScore}%
                </div>
                <div className="text-sm text-gray-600">Target Score</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Timeline:</span>
                  <span className="font-medium">{report.nextSteps.targetImprovement.timeline}</span>
                </div>
                <div className="text-gray-600 mb-2">Key Focus Areas:</div>
                <div className="space-y-1">
                  {report.nextSteps.targetImprovement.keyFocusAreas.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mr-2" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link
            href="/interview"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Practice Session
          </Link>
          <Link
            href="/interviews"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            View All Interviews
          </Link>
        </div>
      </div>
      </div>
      <Footer />
    </>
  )
}