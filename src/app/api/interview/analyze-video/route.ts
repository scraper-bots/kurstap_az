import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const sessionId = formData.get('sessionId') as string

    if (!videoFile || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Video file and session ID are required' },
        { status: 400 }
      )
    }

    // Convert video to buffer for audio extraction
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())
    
    // Extract audio from video using OpenAI Whisper
    const audioFile = new File([videoBuffer], 'audio.webm', { type: 'audio/webm' })
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    })

    const transcript = transcriptionResponse.text

    // Analyze emotions and communication style from transcript
    const emotionAnalysisPrompt = `
Analyze the following interview response for emotions and communication patterns. 
Provide a structured analysis in JSON format with the following fields:
- emotions: array of detected emotions (confident, nervous, enthusiastic, uncertain, etc.)
- confidence_level: number from 1-100
- communication_clarity: number from 1-100
- key_points: array of main points mentioned
- overall_sentiment: positive/neutral/negative

Interview Response: "${transcript}"

Return only valid JSON:
`

    const emotionResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: emotionAnalysisPrompt
        }
      ],
      temperature: 0.3
    })

    let emotionAnalysis
    try {
      emotionAnalysis = JSON.parse(emotionResponse.choices[0].message.content || '{}')
    } catch (parseError) {
      console.error('Error parsing emotion analysis:', parseError)
      emotionAnalysis = {
        emotions: ['neutral'],
        confidence_level: 75,
        communication_clarity: 75,
        key_points: ['Clear response provided'],
        overall_sentiment: 'neutral'
      }
    }

    // Generate overall video analysis
    const videoAnalysisPrompt = `
Based on this interview response transcript, provide constructive feedback focusing on:
1. Content quality and relevance
2. Communication effectiveness
3. Areas for improvement
4. Specific strengths demonstrated

Keep feedback professional and actionable. Response: "${transcript}"
`

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: videoAnalysisPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    })

    const videoAnalysis = analysisResponse.choices[0].message.content || 'Analysis completed successfully'

    return NextResponse.json({
      success: true,
      transcript,
      emotions: emotionAnalysis,
      analysis: videoAnalysis,
      sessionId
    })

  } catch (error) {
    console.error('Error analyzing video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze video' 
      },
      { status: 500 }
    )
  }
}