import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowLeft, Share2, BookOpen, Target } from 'lucide-react'

interface BlogPostParams {
  params: Promise<{ id: string }>
}

// Mock blog post data - in a real app this would come from a CMS or database
const getBlogPost = (id: string) => {
  const posts = {
    "1": {
      id: "1",
      title: "Mastering the AI Interview: 7 Essential Tips for Success in 2025",
      content: `
        <p style="font-size: 1.25rem; color: #4b5563; margin-bottom: 2rem; line-height: 1.6;">As artificial intelligence revolutionizes the hiring process, traditional interview preparation strategies are no longer enough. AI-powered interviews are becoming the new standard across industries, from tech startups to Fortune 500 companies. Here's your comprehensive guide to excelling in this modern hiring landscape.</p>

        <h2 style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-top: 3rem; margin-bottom: 1rem;">Understanding AI Interviews</h2>
        <p style="margin-bottom: 1.5rem; color: #374151;">AI interviews use sophisticated algorithms to analyze your responses, body language, speech patterns, and even micro-expressions. Unlike human interviewers, AI systems are consistent, unbiased, and can process vast amounts of data in real-time to provide objective assessments.</p>

        <blockquote style="border-left: 4px solid #3b82f6; padding: 1.5rem; margin: 2rem 0; font-style: italic; color: #4b5563; background: #f8fafc; border-radius: 0.5rem;">
          <p style="margin-bottom: 0;">"The key to AI interview success isn't just what you say, but how you say it. Consistency, clarity, and authenticity are more important than ever." - Dr. Sarah Martinez, AI Recruiting Expert</p>
        </blockquote>

        <h2 style="font-size: 1.875rem; font-weight: 700; color: #111827; margin-top: 3rem; margin-bottom: 1rem;">7 Essential Tips for AI Interview Success</h2>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">1. Perfect Your Speaking Pace and Clarity</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">AI systems analyze speech patterns meticulously. Speak at a moderate pace (around 150-160 words per minute), enunciate clearly, and avoid filler words like "um," "uh," and "you know." Practice with voice recording apps to identify and eliminate speech habits that might confuse AI analyzers.</p>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">2. Maintain Consistent Eye Contact with the Camera</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">While human interviewers might forgive occasional breaks in eye contact, AI systems interpret sustained eye contact as confidence and engagement. Position your camera at eye level and look directly into the lens, not at the screen, throughout your responses.</p>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">3. Structure Your Responses Using the STAR Method</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">AI algorithms favor structured, logical responses. Use the STAR method (Situation, Task, Action, Result) consistently across behavioral questions. This helps AI systems parse and evaluate your experiences more accurately.</p>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">4. Optimize Your Environment</h3>
        <p style="margin-bottom: 1rem; color: #374151;">Create an interview-friendly space with:</p>
        <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
          <li style="margin-bottom: 0.5rem; color: #374151;">Consistent, bright lighting on your face</li>
          <li style="margin-bottom: 0.5rem; color: #374151;">Minimal background noise</li>
          <li style="margin-bottom: 0.5rem; color: #374151;">Professional, clutter-free background</li>
          <li style="margin-bottom: 0.5rem; color: #374151;">Stable internet connection</li>
          <li style="margin-bottom: 0.5rem; color: #374151;">High-quality camera and microphone</li>
        </ul>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">5. Use Specific Keywords and Metrics</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">AI systems are trained to recognize industry-specific terminology and quantifiable achievements. Include relevant keywords from the job description and support your claims with concrete numbers and metrics wherever possible.</p>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">6. Practice with AI Interview Platforms</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">Familiarize yourself with AI interview formats by practicing with platforms like Bir Guru. Regular practice helps you understand how AI systems interpret responses and identifies areas for improvement.</p>

        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-top: 2rem; margin-bottom: 1rem;">7. Be Authentic and Consistent</h3>
        <p style="margin-bottom: 1.5rem; color: #374151;">AI systems excel at detecting inconsistencies in responses and behavior. Be genuine in your answers and maintain consistency across similar questions. Authenticity resonates better with AI analysis than rehearsed responses.</p>

        <p style="margin-bottom: 1.5rem; color: #374151;"><strong>Ready to practice?</strong> Start practicing with AI interview platforms today, and transform what might seem like a technological hurdle into your pathway to career success.</p>
      `,
      author: "Bir Guru Team",
      date: "January 15, 2025",
      readTime: "8 min read",
      category: "Interview Tips"
    }
  }
  
  return posts[id as keyof typeof posts] || null
}

export default async function BlogPostPage({ params }: BlogPostParams) {
  const { id } = await params
  const post = getBlogPost(id)

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <Link href="/blog" className="text-blue-600 hover:text-blue-800">
              ← Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
            
            <div className="mb-4">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {post.date}
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {post.readTime}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="aspect-video rounded-2xl overflow-hidden relative">
            <Image
              src="https://images.unsplash.com/photo-1518378379207-3418372afea3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="AI Interview Technology"
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <article className="prose prose-lg prose-blue max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="article-content leading-relaxed"
            />
          </article>

          {/* Share Section */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 font-medium">Share this article:</span>
                <button className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center mt-12">
            <Target className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Ready to Practice AI Interviews?</h3>
            <p className="text-blue-100 mb-6 text-lg">
              Put these tips into action with our AI-powered interview platform. Get personalized feedback and track your improvement.
            </p>
            <Link
              href="/interview"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Practicing Now
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}