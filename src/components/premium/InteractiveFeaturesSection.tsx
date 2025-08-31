'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  Brain,
  Mic,
  BarChart3,
  Target,
  Zap,
  Award,
  Users,
  CheckCircle2
} from 'lucide-react'

export default function InteractiveFeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const features = [
    {
      id: 'ai-interviewer',
      title: 'AI Interviewer',
      subtitle: 'Human-like conversations',
      description: 'Experience realistic interview scenarios with our advanced AI that adapts to your responses and asks relevant follow-up questions.',
      icon: Brain,
      color: 'primary',
      gradient: 'from-primary-500 to-primary-700',
      demo: {
        type: 'interview',
        conversation: [
          { speaker: 'ai', text: 'Tell me about a challenging project you worked on recently.', time: '0:00' },
          { speaker: 'user', text: 'I led the development of a real-time analytics dashboard...', time: '0:03' },
          { speaker: 'ai', text: 'That sounds complex. What were the main technical challenges?', time: '0:15' },
        ],
        metrics: {
          'Natural Flow': 96,
          'Contextual Questions': 94,
          'Industry Relevance': 91
        }
      }
    },
    {
      id: 'real-time-feedback',
      title: 'Real-time Feedback',
      subtitle: 'Instant performance insights',
      description: 'Get immediate analysis of your communication style, confidence level, and technical accuracy as you speak.',
      icon: BarChart3,
      color: 'secondary',
      gradient: 'from-secondary-500 to-secondary-700',
      demo: {
        type: 'analytics',
        liveMetrics: {
          'Confidence Level': { value: 87, trend: 'up', change: '+12%' },
          'Speech Clarity': { value: 92, trend: 'up', change: '+8%' },
          'Technical Depth': { value: 94, trend: 'stable', change: '+2%' },
          'Pace & Flow': { value: 76, trend: 'down', change: '-3%' }
        },
        suggestions: [
          'Great technical depth! Consider slowing down slightly for better clarity.',
          'Strong confidence improvement this session.',
          'Try using more concrete examples to illustrate your points.'
        ]
      }
    },
    {
      id: 'voice-analysis',
      title: 'Voice Analysis',
      subtitle: 'Advanced speech processing',
      description: 'Our AI analyzes your speech patterns, tone, pace, and delivery to provide comprehensive communication insights.',
      icon: Mic,
      color: 'accent',
      gradient: 'from-accent-500 to-accent-700',
      demo: {
        type: 'voice',
        waveform: true,
        analysis: {
          'Tone Confidence': 88,
          'Speaking Pace': 156, // words per minute
          'Filler Words': 3,
          'Pause Frequency': 'Optimal',
          'Volume Consistency': 94
        },
        insights: [
          'Your tone conveys strong confidence',
          'Speaking pace is slightly fast - consider slowing down',
          'Excellent use of strategic pauses'
        ]
      }
    },
    {
      id: 'progress-tracking',
      title: 'Progress Tracking',
      subtitle: 'Comprehensive improvement analytics',
      description: 'Track your interview skills development over time with detailed performance metrics and personalized recommendations.',
      icon: TrendingUp,
      color: 'brand',
      gradient: 'from-brand-500 to-brand-700',
      demo: {
        type: 'progress',
        timeframe: '30 days',
        improvement: {
          overall: '+47%',
          confidence: '+52%',
          technical: '+34%',
          communication: '+61%'
        },
        milestones: [
          { date: 'Week 1', achievement: 'First complete interview', score: 72 },
          { date: 'Week 2', achievement: 'Confidence breakthrough', score: 81 },
          { date: 'Week 3', achievement: 'Technical mastery', score: 89 },
          { date: 'Week 4', achievement: 'Interview ready', score: 94 }
        ]
      }
    }
  ]

  const currentFeature = features[activeFeature]

  return (
    <section className="py-32 bg-gradient-to-b from-white via-neutral-50/50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100 rounded-full px-6 py-3 mb-8">
            <Zap className="w-5 h-5 text-primary-600 mr-2" />
            <span className="text-primary-700 font-bold">Interactive Demo</span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-display font-bold text-neutral-900 mb-8">
            Experience Our{' '}
            <span className="text-transparent bg-gradient-brand bg-clip-text">
              AI Technology
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-neutral-600 max-w-4xl mx-auto leading-relaxed">
            See how our advanced AI transforms your interview preparation with real-time analysis, 
            personalized feedback, and human-like conversations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Feature Navigation */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                onClick={() => setActiveFeature(index)}
                className={`group w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeFeature === index
                    ? `bg-gradient-to-r ${feature.gradient} text-white shadow-elevation-3`
                    : 'bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 shadow-elevation-1'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    activeFeature === index
                      ? 'bg-white/20 backdrop-blur-sm'
                      : `bg-gradient-to-r ${feature.gradient} text-white`
                  }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-display font-bold text-lg mb-1 ${
                      activeFeature === index ? 'text-white' : 'text-neutral-900'
                    }`}>
                      {feature.title}
                    </div>
                    <div className={`text-sm font-medium mb-2 ${
                      activeFeature === index ? 'text-white/80' : 'text-neutral-500'
                    }`}>
                      {feature.subtitle}
                    </div>
                    <div className={`text-sm leading-relaxed ${
                      activeFeature === index ? 'text-white/70' : 'text-neutral-600'
                    }`}>
                      {feature.description}
                    </div>
                  </div>
                </div>

                {/* Active Indicator */}
                <AnimatePresence>
                  {activeFeature === index && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 rounded-r-full"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: '100%', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </motion.div>

          {/* Interactive Demo Area */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-white rounded-3xl p-8 shadow-elevation-4 border border-neutral-100 min-h-[600px]">
              {/* Demo Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 bg-gradient-to-r ${currentFeature.gradient} rounded-xl`}>
                    <currentFeature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-neutral-900">
                      {currentFeature.title} Demo
                    </h3>
                    <p className="text-neutral-600">{currentFeature.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-3 bg-gradient-to-r ${currentFeature.gradient} text-white rounded-xl shadow-elevation-2`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </motion.button>
                  <motion.button
                    className="p-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Demo Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  {/* AI Interviewer Demo */}
                  {currentFeature.demo.type === 'interview' && currentFeature.demo.conversation && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {currentFeature.demo.conversation.map((msg, index) => (
                          <motion.div
                            key={index}
                            className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                            initial={{ opacity: 0, x: msg.speaker === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                          >
                            <div className={`max-w-lg p-4 rounded-2xl ${
                              msg.speaker === 'user'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  msg.speaker === 'user' ? 'bg-white/20' : 'bg-primary-100'
                                }`}>
                                  {msg.speaker === 'user' ? (
                                    <Users className="w-3 h-3" />
                                  ) : (
                                    <Brain className="w-3 h-3 text-primary-600" />
                                  )}
                                </div>
                                <span className="text-xs font-medium opacity-70">{msg.time}</span>
                              </div>
                              <p className="leading-relaxed">{msg.text}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-100">
                        <h4 className="font-bold text-neutral-900 mb-4">AI Performance Metrics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {currentFeature.demo.metrics && Object.entries(currentFeature.demo.metrics).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <div className="text-2xl font-bold text-primary-600">{value}%</div>
                              <div className="text-sm text-neutral-600">{key}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Real-time Analytics Demo */}
                  {currentFeature.demo.type === 'analytics' && currentFeature.demo.liveMetrics && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(currentFeature.demo.liveMetrics).map(([metric, data]) => (
                          <motion.div
                            key={metric}
                            className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-6 border border-neutral-100"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-neutral-600">{metric}</span>
                              <div className={`flex items-center space-x-1 text-xs font-bold ${
                                data.trend === 'up' ? 'text-secondary-600' : 
                                data.trend === 'down' ? 'text-accent-600' : 'text-neutral-500'
                              }`}>
                                <TrendingUp className={`w-3 h-3 ${
                                  data.trend === 'down' ? 'rotate-180' : ''
                                }`} />
                                <span>{data.change}</span>
                              </div>
                            </div>
                            
                            <div className="text-3xl font-bold text-neutral-900 mb-2">{data.value}%</div>
                            
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${data.value}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-6 border border-secondary-100">
                        <h4 className="font-bold text-neutral-900 mb-4 flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2 text-secondary-600" />
                          AI Suggestions
                        </h4>
                        <div className="space-y-3">
                          {currentFeature.demo.suggestions && currentFeature.demo.suggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start space-x-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-secondary-600 mt-0.5 flex-shrink-0" />
                              <span className="text-neutral-700">{suggestion}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice Analysis Demo */}
                  {currentFeature.demo.type === 'voice' && (
                    <div className="space-y-6">
                      {/* Waveform Visualization */}
                      <div className="bg-gradient-to-r from-accent-50 to-accent-100/50 rounded-2xl p-6">
                        <h4 className="font-bold text-neutral-900 mb-4 flex items-center">
                          <Mic className="w-5 h-5 mr-2 text-accent-600" />
                          Live Voice Analysis
                        </h4>
                        <div className="flex items-center justify-center space-x-1 py-8">
                          {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-gradient-to-t from-accent-600 to-accent-400 rounded-full"
                              animate={{
                                height: [
                                  Math.random() * 40 + 20,
                                  Math.random() * 80 + 30,
                                  Math.random() * 40 + 20
                                ]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.05,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Voice Metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentFeature.demo.analysis && Object.entries(currentFeature.demo.analysis).map(([metric, value]) => (
                          <div key={metric} className="bg-white rounded-xl p-4 border border-neutral-100 shadow-elevation-1">
                            <div className="text-sm font-medium text-neutral-600 mb-2">{metric}</div>
                            <div className="text-2xl font-bold text-accent-600">
                              {typeof value === 'number' ? 
                                (metric === 'Speaking Pace' ? `${value} wpm` : `${value}%`) : 
                                value
                              }
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Voice Insights */}
                      <div className="bg-gradient-to-r from-accent-50 to-accent-100/50 rounded-2xl p-6 border border-accent-100">
                        <h4 className="font-bold text-neutral-900 mb-4">Voice Analysis Insights</h4>
                        <div className="space-y-3">
                          {currentFeature.demo.insights && currentFeature.demo.insights.map((insight, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start space-x-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <Target className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" />
                              <span className="text-neutral-700">{insight}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Tracking Demo */}
                  {currentFeature.demo.type === 'progress' && (
                    <div className="space-y-6">
                      {/* Overall Improvement */}
                      <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 rounded-2xl p-6 border border-brand-100">
                        <h4 className="font-bold text-neutral-900 mb-6 flex items-center">
                          <Award className="w-5 h-5 mr-2 text-brand-600" />
                          30-Day Progress Overview
                        </h4>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {currentFeature.demo.improvement && Object.entries(currentFeature.demo.improvement).map(([key, value]) => (
                            <motion.div
                              key={key}
                              className="text-center p-4 bg-white rounded-xl shadow-elevation-1"
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <div className="text-3xl font-bold text-brand-600 mb-1">{value}</div>
                              <div className="text-sm text-neutral-600 capitalize">{key}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                        <h4 className="font-bold text-neutral-900 mb-6">Achievement Timeline</h4>
                        <div className="space-y-4">
                          {currentFeature.demo.milestones && currentFeature.demo.milestones.map((milestone, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-brand-50/30"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                                <Award className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-neutral-900">{milestone.achievement}</div>
                                <div className="text-sm text-neutral-600">{milestone.date}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-brand-600">{milestone.score}</div>
                                <div className="text-sm text-neutral-500">Score</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.button
            className="group relative px-12 py-6 bg-gradient-brand text-white rounded-2xl font-bold text-xl shadow-elevation-4 overflow-hidden"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 25px 50px rgba(59, 130, 246, 0.3)" 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative">Try These Features Free</span>
          </motion.button>
          <p className="text-neutral-600 mt-4 text-lg">
            Experience all features with our 7-day free trial
          </p>
        </motion.div>
      </div>
    </section>
  )
}