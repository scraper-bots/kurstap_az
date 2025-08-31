'use client'

import React from 'react'
import Button from '../ui/Button'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-500/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-500/10 rounded-lg rotate-45 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-accent-500/10 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Trust signal */}
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-slate-600 border border-slate-200">
              <div className="flex -space-x-2 mr-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-full border-2 border-white"></div>
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white"></div>
              </div>
              Join 10,000+ job seekers
            </div>

            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-slate-900 leading-tight">
                Ace Your Next{' '}
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Interview
                </span>{' '}
                With AI
              </h1>
              <p className="text-xl lg:text-2xl text-slate-600 max-w-2xl leading-relaxed">
                Practice with realistic interview scenarios, get instant feedback, and land the job you want
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Free Practice Interview
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                🎥 Watch 2-min Demo
              </Button>
            </div>

            {/* Key benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              {[
                { icon: '🎯', text: 'Job-specific questions' },
                { icon: '🗣️', text: 'Voice interaction' },
                { icon: '📊', text: 'Instant feedback' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 text-slate-700">
                  <span className="text-2xl">{benefit.icon}</span>
                  <span className="font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
              {/* Mock interview interface */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🤖</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">AI Interviewer</div>
                      <div className="text-sm text-slate-500">Senior Software Engineer Interview</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-xs text-slate-500">Recording</div>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 font-medium">
                    "Tell me about a challenging technical problem you solved recently..."
                  </p>
                </div>

                {/* Voice visualization */}
                <div className="flex items-center justify-center space-x-1 py-4">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-primary-600 to-secondary-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.5 + Math.random()}s`
                      }}
                    ></div>
                  ))}
                </div>

                {/* Real-time feedback */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-slate-700">Real-time Analysis</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Confidence</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full">
                          <div className="w-16 h-2 bg-secondary-500 rounded-full"></div>
                        </div>
                        <span className="text-xs text-secondary-600 font-medium">82%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Clarity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full">
                          <div className="w-18 h-2 bg-primary-500 rounded-full"></div>
                        </div>
                        <span className="text-xs text-primary-600 font-medium">91%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating feedback bubbles */}
              <div className="absolute -right-4 -top-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-float">
                Great structure! 👍
              </div>
              <div className="absolute -left-6 top-1/2 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-float" style={{animationDelay: '1s'}}>
                Speak slower
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-2 animate-bounce">
          <div className="text-sm text-slate-500">Scroll to explore</div>
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-300 rounded-full mt-2"></div>
          </div>
        </div>
      </div>
    </section>
  )
}