'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Play, Users, Star, Zap, Target, TrendingUp, Award, X, Menu } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function PremiumHeroSection() {
  const { isSignedIn, user } = useUser()
  const [currentStats, setCurrentStats] = useState({
    users: 0,
    interviews: 0,
    success: 0,
    rating: 0
  })
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

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
    y: [-2, 2, -2],
    rotate: [0, 0.5, -0.5, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-primary-400/15 to-brand-400/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-r from-secondary-400/10 to-accent-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.05, 1, 1.05],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-r from-accent-300/12 to-primary-300/12 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-[0.02]"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-50 px-4 sm:px-6 py-4 sm:py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-brand rounded-lg sm:rounded-xl flex items-center justify-center shadow-glow">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-display font-bold text-slate-800">
              Bir Guru
            </span>
          </motion.div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {[
              { name: 'Features', href: '#features' },
              { name: 'Pricing', href: '/interview' },
              { name: 'Success Stories', href: '#testimonials' },
              { name: 'Company', href: '#about' }
            ].map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item.name}
              </motion.a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center space-x-3 lg:space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <motion.a
                  href="/dashboard"
                  className="hidden md:block px-4 py-2 text-slate-700 font-medium hover:text-slate-900 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.a>
                <UserButton />
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <motion.button 
                    className="hidden md:block px-4 py-2 text-slate-700 font-medium hover:text-slate-900 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <motion.button 
                    className="px-4 sm:px-6 py-2 bg-gradient-brand text-white rounded-lg font-semibold shadow-elevation-2 hover:shadow-elevation-3 transition-all text-sm sm:text-base"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started
                  </motion.button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            type="button"
            className="sm:hidden w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-elevation-1 flex items-center justify-center touch-manipulation relative z-50"
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsMobileMenuOpen(!isMobileMenuOpen)
            }}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm touch-manipulation"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsMobileMenuOpen(false)
              }}
              onTouchStart={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              className="absolute right-4 top-4 bg-white rounded-2xl shadow-2xl p-6 min-w-[280px] max-w-[90vw]"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsMobileMenuOpen(false)
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors touch-manipulation"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>

              {/* Navigation Links */}
              <div className="space-y-6 pt-8">
                {[
                  { name: 'Features', href: '#features' },
                  { name: 'Pricing', href: '/interview' },
                  { name: 'About', href: '#about' },
                  { name: 'Contact', href: '#testimonials' }
                ].map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="block text-lg font-semibold text-slate-700 hover:text-primary-600 transition-colors touch-manipulation py-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                    }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </div>

              {/* Mobile Actions */}
              <div className="pt-6 mt-6 border-t border-neutral-100 space-y-3">
                {isSignedIn ? (
                  <div className="space-y-3">
                    <a
                      href="/dashboard"
                      className="block w-full py-3 px-4 text-center text-slate-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors touch-manipulation"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                    <div className="flex justify-center">
                      <UserButton />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-full">
                      <SignInButton mode="modal">
                        <button 
                          type="button"
                          className="w-full py-3 px-4 text-slate-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors touch-manipulation"
                        >
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                    <div className="w-full">
                      <SignUpButton mode="modal">
                        <button 
                          type="button"
                          className="w-full py-3 px-4 bg-gradient-brand text-white font-semibold rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-all touch-manipulation"
                        >
                          Get Started
                        </button>
                      </SignUpButton>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-8rem)] sm:min-h-[80vh]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Trust Badge */}
            <motion.div 
              className="inline-flex items-center bg-white/90 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-6 py-2 sm:py-3 shadow-elevation-1"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex -space-x-1 sm:-space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white ${
                      i === 1 ? 'bg-gradient-to-r from-primary-500 to-primary-600' :
                      i === 2 ? 'bg-gradient-to-r from-secondary-500 to-secondary-600' :
                      i === 3 ? 'bg-gradient-to-r from-accent-500 to-accent-600' :
                      'bg-gradient-to-r from-brand-500 to-brand-600'
                    }`} />
                  ))}
                </div>
                <div className="h-3 sm:h-4 w-px bg-neutral-300" />
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    {currentStats.users.toLocaleString()}+ professionals practicing
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div className="space-y-4 sm:space-y-6" variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[0.9]">
                <span className="block text-slate-900">Master Every</span>
                <span className="block text-transparent bg-gradient-brand bg-clip-text animate-gradient bg-300% inline-block">
                  Interview
                </span>
                <span className="block text-slate-900">With AI</span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Practice with our AI interviewer that adapts to your industry, provides real-time feedback, 
                and helps you land your{' '}
                <span className="font-semibold text-blue-600">dream job</span>
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
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              variants={itemVariants}
            >
              {isSignedIn ? (
                <motion.a
                  href="/dashboard"
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-brand text-white rounded-xl font-semibold text-base sm:text-lg shadow-elevation-3 overflow-hidden block"
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative flex items-center justify-center space-x-2">
                    <span>Go to Dashboard</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.a>
              ) : (
                <SignUpButton mode="modal">
                  <motion.button
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-brand text-white rounded-xl font-semibold text-base sm:text-lg shadow-elevation-3 overflow-hidden"
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center space-x-2">
                      <span>Start Free Practice</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                </SignUpButton>
              )}

              <motion.a
                href="#features"
                className="group flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-white/90 backdrop-blur-sm border border-white/20 text-slate-700 rounded-xl font-semibold text-base sm:text-lg shadow-elevation-1 hover:shadow-elevation-2 transition-all"
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </motion.a>
            </motion.div>

            {/* Security Badge */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-slate-300" />
              <div className="text-sm text-slate-500">Enterprise-grade security</div>
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
                      <div className="font-bold text-neutral-900">Bir Guru AI Coach</div>
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
                  y: [-2, 2, -2],
                  rotate: [0.5, -0.5, 0.5],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                Great structure! 💡
              </motion.div>

              <motion.div
                className="absolute -bottom-6 -left-8 bg-accent-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-elevation-3"
                animate={{
                  y: [2, -2, 2],
                  rotate: [-0.5, 0.5, -0.5],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              >
                Consider scalability 📈
              </motion.div>

              <motion.div
                className="absolute top-1/2 -left-12 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-elevation-3"
                animate={{
                  y: [-1, 1, -1],
                  rotate: [0.3, -0.3, 0.3],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
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