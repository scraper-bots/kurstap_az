'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, MessageCircle, Target, BarChart3, Brain, Zap } from 'lucide-react'

export default function ProblemSolutionSection() {
  const problems = [
    {
      icon: AlertTriangle,
      stat: '89%',
      title: 'Interview Anxiety',
      description: 'Get nervous and freeze up during critical moments',
      impact: 'Lost opportunities at dream companies',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: TrendingDown,
      stat: '73%',
      title: 'Poor Preparation',
      description: 'Generic practice that doesn\'t match real scenarios',
      impact: 'Unprepared for company-specific questions',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: MessageCircle,
      stat: '65%',
      title: 'Communication Issues',
      description: 'Struggle to articulate thoughts clearly under pressure',
      impact: 'Technical skills overshadowed by poor delivery',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const solutions = [
    {
      icon: Target,
      title: 'Realistic AI Practice',
      description: 'Industry-specific scenarios that mirror real interviews',
      features: ['Company-specific questions', 'Role-based difficulty', 'Real interview flow'],
      improvement: '+127%',
      metric: 'confidence boost',
      gradient: 'from-primary-500 to-primary-600'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Instant feedback on every aspect of your performance',
      features: ['Speech analysis', 'Confidence scoring', 'Technical accuracy'],
      improvement: '+89%',
      metric: 'better responses',
      gradient: 'from-secondary-500 to-secondary-600'
    },
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'AI that learns from your mistakes and improves with you',
      features: ['Personalized questions', 'Weakness targeting', 'Progress tracking'],
      improvement: '+156%',
      metric: 'faster improvement',
      gradient: 'from-accent-500 to-accent-600'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Problem Section */}
        <motion.div
          className="mb-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <div className="inline-flex items-center bg-red-50 border border-red-100 rounded-full px-4 py-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-700 font-medium text-sm">The Problem</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-neutral-900 mb-6">
              Why Most People{' '}
              <span className="text-red-600">Fail</span>{' '}
              Interviews
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Despite having the right skills, talented professionals lose out on opportunities due to these critical gaps
            </p>
          </motion.div>

          {/* Problems Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                className="group relative"
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative bg-white rounded-3xl p-8 h-full shadow-elevation-2 group-hover:shadow-elevation-4 transition-all duration-300 border border-neutral-100">
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03]">
                    <div className={`w-full h-full bg-gradient-to-br ${problem.color} rounded-full blur-3xl`} />
                  </div>

                  {/* Icon & Stat */}
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${problem.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <problem.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`inline-flex items-center bg-gradient-to-r ${problem.color} rounded-full px-4 py-2`}>
                      <span className="text-white font-bold text-2xl">{problem.stat}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-2xl font-display font-bold text-neutral-900 mb-4">
                      {problem.title}
                    </h3>
                    <p className="text-neutral-600 mb-6 leading-relaxed">
                      {problem.description}
                    </p>
                    <div className="border-t border-neutral-100 pt-4">
                      <div className="text-sm font-medium text-neutral-500 mb-1">Impact</div>
                      <div className="text-neutral-800 font-medium">{problem.impact}</div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neutral-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Impact Statement */}
          <motion.div 
            className="mt-16 text-center"
            variants={itemVariants}
          >
            <div className="inline-flex items-center bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-full px-8 py-4">
              <TrendingDown className="w-6 h-6 text-red-600 mr-3" />
              <span className="text-neutral-800 font-semibold text-lg">
                Result: <span className="text-red-600">78% of qualified candidates</span> get rejected
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <div className="inline-flex items-center bg-secondary-50 border border-secondary-100 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-secondary-600 mr-2" />
              <span className="text-secondary-700 font-medium text-sm">The Solution</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-neutral-900 mb-6">
              AI-Powered{' '}
              <span className="text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text">
                Interview Mastery
              </span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Transform your interview skills with AI that understands your industry, adapts to your needs, and scales your success
            </p>
          </motion.div>

          {/* Solutions Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                className="group relative"
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`relative bg-gradient-to-br ${solution.gradient} rounded-3xl p-8 h-full text-white overflow-hidden`}>
                  {/* Background Effects */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-8 -translate-x-4" />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <solution.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-display font-bold mb-4">
                      {solution.title}
                    </h3>
                    <p className="text-white/90 mb-6 leading-relaxed">
                      {solution.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {solution.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Improvement Metric */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <div className="text-3xl font-bold mb-1">{solution.improvement}</div>
                      <div className="text-white/80 text-sm font-medium">{solution.metric}</div>
                    </div>
                  </div>

                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Results Dashboard Preview */}
          <motion.div 
            className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-3xl p-8 lg:p-12"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div>
                <div className="inline-flex items-center bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100 rounded-full px-4 py-2 mb-6">
                  <BarChart3 className="w-4 h-4 text-primary-600 mr-2" />
                  <span className="text-primary-700 font-medium text-sm">Proven Results</span>
                </div>
                
                <h3 className="text-3xl lg:text-4xl font-display font-bold text-neutral-900 mb-6">
                  See Your Progress in{' '}
                  <span className="text-primary-600">Real-Time</span>
                </h3>
                
                <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                  Our AI provides detailed analytics on every aspect of your interview performance, 
                  helping you identify strengths and improve weaknesses systematically.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Avg. Improvement', value: '340%', icon: TrendingDown },
                    { label: 'Success Rate', value: '94%', icon: Target }
                  ].map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-white rounded-2xl shadow-elevation-1">
                      <metric.icon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-neutral-900">{metric.value}</div>
                      <div className="text-sm text-neutral-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Mock Analytics */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-elevation-3 border border-neutral-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-neutral-900">Interview Analytics</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-neutral-500">Live</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { skill: 'Technical Knowledge', score: 92, color: 'primary' },
                      { skill: 'Communication', score: 87, color: 'secondary' },
                      { skill: 'Problem Solving', score: 94, color: 'accent' },
                      { skill: 'Confidence Level', score: 83, color: 'brand' }
                    ].map((item, index) => (
                      <div key={item.skill}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-neutral-700">{item.skill}</span>
                          <span className="text-sm font-bold text-neutral-900">{item.score}%</span>
                        </div>
                        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${
                              item.color === 'primary' ? 'from-primary-500 to-primary-600' :
                              item.color === 'secondary' ? 'from-secondary-500 to-secondary-600' :
                              item.color === 'accent' ? 'from-accent-500 to-accent-600' :
                              'from-brand-500 to-brand-600'
                            } rounded-full`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.score}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl border border-secondary-100">
                    <div className="flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-secondary-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-neutral-800 mb-1">AI Insight</div>
                        <div className="text-sm text-neutral-600">
                          Great technical depth! Try speaking 15% slower to improve clarity and impact.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Achievement */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-4 py-2 rounded-xl shadow-elevation-3"
                  animate={{ 
                    y: [-2, 2, -2],
                    rotate: [0.5, -0.5, 0.5]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-sm font-bold">+47% This Week! 🎉</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            variants={itemVariants}
          >
            <motion.button
              className="group relative px-12 py-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-bold text-xl shadow-elevation-4 overflow-hidden"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 25px 50px rgba(59, 130, 246, 0.3)" 
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative">Transform Your Interview Skills Now</span>
            </motion.button>
            <p className="text-neutral-500 mt-4">Join 15,000+ professionals who've mastered interviews with AI</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}