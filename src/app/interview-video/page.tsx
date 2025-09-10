'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { VideoInterview } from '@/components/video-interview'
import { LoadingState } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InterviewModeConfig } from '@/lib/interview-modes-service'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Video, 
  Clock, 
  CreditCard, 
  Star, 
  Users, 
  Award,
  AlertCircle
} from 'lucide-react'
import { InterviewMode } from '@prisma/client'

interface InterviewSetup {
  position: string
  company: string
  mode: InterviewMode
}

interface InterviewData {
  id: string
  questions: any[]
  estimatedDuration: number
  creditsUsed: number
}

function VideoInterviewContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stage, setStage] = useState<'setup' | 'interview' | 'completed' | 'loading'>('setup')
  const [setup, setSetup] = useState<InterviewSetup>({
    position: '',
    company: '',
    mode: 'STANDARD'
  })
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [availableModes, setAvailableModes] = useState<InterviewModeConfig[]>([])
  const [userCredits, setUserCredits] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Load available interview modes and user credits
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load interview modes
        const modesResponse = await fetch('/api/interview/video/start')
        if (modesResponse.ok) {
          const modesData = await modesResponse.json()
          setAvailableModes(modesData.modes || [])
        }

        // Load user credits
        const creditsResponse = await fetch('/api/users/credits')
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          setUserCredits(creditsData.credits || 0)
        }
      } catch (error) {
        console.error('Failed to load interview data:', error)
      }
    }

    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const startVideoInterview = async () => {
    if (!setup.position.trim()) {
      setError('Please enter a position')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/interview/video/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position: setup.position,
          company: setup.company || undefined,
          mode: setup.mode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          setError(`Insufficient credits. This interview requires ${data.requiredCredits} credits, but you have ${data.userCredits}.`)
          return
        }
        throw new Error(data.error || 'Failed to start interview')
      }

      setInterviewData({
        id: data.interview.id,
        questions: data.interview.questions,
        estimatedDuration: data.interview.estimatedDuration,
        creditsUsed: data.interview.creditsUsed
      })

      setUserCredits(data.interview.remainingCredits)
      setStage('interview')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start interview'
      setError(errorMessage)
      console.error('Error starting video interview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterviewComplete = async (completionData: {
    videoUrl: string
    duration: number
    answers: Array<{
      questionId: string
      answer: string
      timestamp: number
    }>
  }) => {
    if (!interviewData) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/interview/video/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interviewId: interviewData.id,
          videoUrl: completionData.videoUrl,
          duration: completionData.duration,
          answers: completionData.answers
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete interview')
      }

      // Redirect to interview details page
      router.push(`/interviews/${interviewData.id}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete interview'
      setError(errorMessage)
      console.error('Error completing video interview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterviewError = (errorMessage: string) => {
    setError(errorMessage)
    console.error('Video interview error:', errorMessage)
  }

  const getCurrentModeConfig = (): InterviewModeConfig | null => {
    return availableModes.find(mode => mode.mode === setup.mode) || null
  }

  const canAffordInterview = (): boolean => {
    const config = getCurrentModeConfig()
    return config ? userCredits >= config.price : false
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
              <p className="text-gray-600">You need to be signed in to take a video interview.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Video Interview</h1>
            <p className="text-xl text-gray-600 mb-2">
              Record your responses and get comprehensive AI analysis
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {userCredits} credits available
              </div>
            </div>
          </div>

          {/* Interview Setup Form */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Setup</CardTitle>
              <CardDescription>
                Configure your video interview preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Position and Company */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    placeholder="e.g. Software Engineer, Product Manager"
                    value={setup.position}
                    onChange={(e) => setSetup(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Google, Microsoft"
                    value={setup.company}
                    onChange={(e) => setSetup(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              {/* Interview Mode Selection */}
              <div>
                <Label htmlFor="mode">Interview Mode</Label>
                <Select
                  value={setup.mode}
                  onValueChange={(value: string) => setSetup(prev => ({ ...prev, mode: value as InterviewMode }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModes.map(mode => (
                      <SelectItem key={mode.mode} value={mode.mode}>
                        {mode.name} - {mode.price} credit{mode.price > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Details */}
              {getCurrentModeConfig() && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      {getCurrentModeConfig()!.name}
                    </h3>
                    <p className="text-blue-800 text-sm mb-3">
                      {getCurrentModeConfig()!.description}
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>{getCurrentModeConfig()!.questionCount} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>~{getCurrentModeConfig()!.estimatedDuration}min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>{getCurrentModeConfig()!.difficulty.join(', ')}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        Categories: {getCurrentModeConfig()!.categories.join(', ')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Credit Warning */}
              {!canAffordInterview() && getCurrentModeConfig() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Insufficient Credits</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    This interview requires {getCurrentModeConfig()!.price} credits, but you have {userCredits}.
                    <a href="/pricing" className="underline ml-1">Purchase more credits</a>
                  </p>
                </div>
              )}

              {/* Start Button */}
              <Button
                onClick={startVideoInterview}
                disabled={isLoading || !setup.position.trim() || !canAffordInterview()}
                className="w-full flex items-center justify-center gap-2 py-3"
                size="lg"
              >
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Start Video Interview
                    {getCurrentModeConfig() && (
                      <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                        -{getCurrentModeConfig()!.price} credit{getCurrentModeConfig()!.price > 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Video className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">HD Video Recording</h3>
                <p className="text-sm text-gray-600">Professional quality recording with camera and audio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">AI Analysis</h3>
                <p className="text-sm text-gray-600">Comprehensive feedback on body language, speech, and content</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Detailed Report</h3>
                <p className="text-sm text-gray-600">Professional report with scores and improvement recommendations</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (stage === 'interview' && interviewData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <VideoInterview
            interviewId={interviewData.id}
            questions={interviewData.questions}
            estimatedDuration={interviewData.estimatedDuration}
            onComplete={handleInterviewComplete}
            onError={handleInterviewError}
          />
        </ErrorBoundary>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <LoadingState />
    </div>
  )
}

export default function VideoInterviewPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <VideoInterviewContent />
    </Suspense>
  )
}