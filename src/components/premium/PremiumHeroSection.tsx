'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Play, Users, Star, Zap, Target, TrendingUp, Award } from 'lucide-react'

export default function PremiumHeroSection() {
  const [currentStats, setCurrentStats] = useState({
    users: 0,
    interviews: 0,
    success: 0,
    rating: 0
  })

  // Animate counters
  useEffect(() => {
    const animateCounter = (target: number, key: keyof typeof currentStats, duration: number = 2000) => {
      let start = 0
      const increment = target / (duration / 16)
      
      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          start = target
          clearInterval(timer)
        }
        setCurrentStats(prev => ({ ...prev, [key]: Math.floor(start) }))
      }, 16)
    }

    const timeout = setTimeout(() => {
      animateCounter(15847, 'users', 2000)
      animateCounter(89432, 'interviews', 2500)
      animateCounter(87, 'success', 1800)
      animateCounter(4.9, 'rating', 1500)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  }

  const floatingAnimation = {
    y: [-10, 10, -10],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-brand-50/50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-primary-400/20 to-brand-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-r from-secondary-400/15 to-accent-400/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-r from-accent-300/20 to-primary-300/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-[0.02]"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-50 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
              InterviewAI
            </span>
          </motion.div>
          
          <div className="hidden lg:flex items-center space-x-8">
            {['Features', 'Pricing', 'Success Stories', 'Company'].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <motion.button 
              className="px-4 py-2 text-neutral-700 font-medium hover:text-neutral-900 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
            <motion.button 
              className="px-6 py-2 bg-gradient-brand text-white rounded-lg font-semibold shadow-elevation-2 hover:shadow-elevation-3 transition-all"
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="grid lg:grid-cols-2 gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <motion.div 
              className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 shadow-elevation-1"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-white ${
                      i === 1 ? 'bg-gradient-to-r from-primary-500 to-primary-600' :
                      i === 2 ? 'bg-gradient-to-r from-secondary-500 to-secondary-600' :
                      i === 3 ? 'bg-gradient-to-r from-accent-500 to-accent-600' :
                      'bg-gradient-to-r from-brand-500 to-brand-600'
                    }`} />
                  ))}
                </div>
                <div className="h-4 w-px bg-neutral-300" />
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">
                    {currentStats.users.toLocaleString()}+ professionals practicing
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div className="space-y-6" variants={itemVariants}>
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[0.9]">
                <span className="block text-neutral-900">Master Every</span>
                <span className="block bg-gradient-brand bg-clip-text text-transparent animate-gradient bg-300% inline-block">
                  Interview
                </span>
                <span className="block text-neutral-900">With AI</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-neutral-600 max-w-2xl leading-relaxed">
                Practice with our AI interviewer that adapts to your industry, provides real-time feedback, 
                and helps you land your{' '}
                <span className="font-semibold text-primary-600">dream job</span>
              </p>
            </motion.div>

            {/* Stats Row */}
            <motion.div 
              className="grid grid-cols-4 gap-6"
              variants={itemVariants}
            >
              {[
                { value: currentStats.interviews.toLocaleString(), label: 'Interviews', icon: Target },
                { value: `${currentStats.success}%`, label: 'Success Rate', icon: TrendingUp },
                { value: currentStats.rating.toFixed(1), label: 'Rating', icon: Star },
                { value: '24/7', label: 'Available', icon: Award }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-brand-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                  <div className="text-sm text-neutral-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="group relative px-8 py-4 bg-gradient-brand text-white rounded-xl font-semibold text-lg shadow-elevation-3 overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative flex items-center justify-center space-x-2">
                  <span>Start Free Practice</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>

              <motion.button
                className="group flex items-center justify-center space-x-3 px-8 py-4 bg-white/80 backdrop-blur-sm border border-white/20 text-neutral-700 rounded-xl font-semibold text-lg shadow-elevation-1 hover:shadow-elevation-2 transition-all"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-brand-500 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Security Badge */}
            <motion.div 
              className="flex items-center space-x-4 pt-4"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 text-sm text-neutral-500">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="h-4 w-px bg-neutral-300" />
              <div className="text-sm text-neutral-500">Enterprise-grade security</div>
            </motion.div>
          </div>

          {/* Right Column - Interactive Demo */}
          <motion.div 
            className="relative"
            variants={itemVariants}
          >
            <div className="relative">
              {/* Main Demo Card */}
              <motion.div
                className="relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-elevation-4"
                animate={floatingAnimation}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-glow">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">AI Interview Coach</div>
                      <div className="text-sm text-neutral-500">Senior Software Engineer Mock</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-neutral-500 font-medium">LIVE</span>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-gradient-to-r from-primary-50 to-brand-50 rounded-2xl p-6 mb-6">
                  <div className="text-sm font-medium text-primary-600 mb-2">Current Question</div>
                  <p className="text-neutral-800 leading-relaxed">
                    "Walk me through how you'd design a system to handle 10 million concurrent users. 
                    What are the key architectural decisions you'd make?"
                  </p>
                </div>

                {/* Voice Visualization */}
                <div className="flex items-center justify-center space-x-1 py-6 mb-6">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-primary-600 via-brand-500 to-secondary-500 rounded-full"
                      animate={{
                        height: [
                          Math.random() * 40 + 10,
                          Math.random() * 60 + 20,
                          Math.random() * 40 + 10
                        ]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                {/* Real-time Analysis */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">Real-time Analysis</span>
                    <span className="text-xs text-neutral-400">Updating...</span>
                  </div>
                  
                  {[
                    { label: 'Technical Accuracy', value: 94, color: 'from-primary-500 to-primary-600' },
                    { label: 'Communication Clarity', value: 87, color: 'from-secondary-500 to-secondary-600' },
                    { label: 'Confidence Level', value: 76, color: 'from-accent-500 to-accent-600' }
                  ].map((metric, index) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">{metric.label}</span>
                        <span className="text-sm font-bold text-neutral-800">{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 2, delay: index * 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Floating Feedback Cards */}
              <motion.div
                className="absolute -top-4 -right-8 bg-secondary-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-elevation-3"
                animate={{
                  y: [-5, 5, -5],
                  rotate: [2, -2, 2],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                Great structure! 💡
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-8 bg-accent-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-elevation-3"
                animate={{
                  y: [5, -5, 5],
                  rotate: [-2, 2, -2],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                Consider scalability 📈
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-12 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-elevation-3"
                animate={{
                  y: [-3, 3, -3],
                  rotate: [1, -1, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                Speak slower ⏱️
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          className="flex flex-col items-center space-y-3 text-neutral-500"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-sm font-medium">Discover More</span>
          <div className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center">
            <motion.div
              className="w-1.5 h-3 bg-neutral-400 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}