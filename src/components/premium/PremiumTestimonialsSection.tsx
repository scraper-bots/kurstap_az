'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Star, 
  Quote, 
  TrendingUp, 
  Award, 
  Building2, 
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function PremiumTestimonialsSection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const testimonials = [
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      title: 'Senior Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      avatar: '/icon-192.png',
      video: '/testimonials/sarah-chen.mp4',
      duration: '2:34',
      joinedDate: 'March 2024',
      interviewCount: 47,
      successRate: 94,
      rating: 5,
      quote: 'InterviewAI transformed how I approach technical interviews. The AI feedback was so detailed and actionable - I could see exactly what I needed to improve after each session.',
      fullStory: 'I was struggling with system design interviews and kept getting rejected at the final rounds. After using InterviewAI for 3 weeks, I not only got better at explaining my thought process but also gained the confidence I was missing.',
      results: {
        previousRejections: 8,
        interviewsAfter: 3,
        offersReceived: 2,
        salaryIncrease: '45%',
        timeToOffer: '2 weeks'
      },
      skills: ['System Design', 'Behavioral Questions', 'Technical Communication'],
      beforeAfter: {
        before: 'Nervous, unclear explanations, rushed answers',
        after: 'Confident, structured responses, perfect pacing'
      },
      companyLogos: ['google', 'meta', 'netflix']
    },
    {
      id: 'marcus-rodriguez',
      name: 'Marcus Rodriguez',
      title: 'Product Manager',
      company: 'Microsoft',
      location: 'Seattle, WA',
      avatar: '/icon-192.png',
      video: '/testimonials/marcus-rodriguez.mp4',
      duration: '3:12',
      joinedDate: 'February 2024',
      interviewCount: 32,
      successRate: 91,
      rating: 5,
      quote: 'The AI understood product management scenarios perfectly. It asked follow-up questions just like real interviewers and helped me structure my product thinking.',
      fullStory: 'Transitioning from engineering to PM was tough. The behavioral questions were killing me. InterviewAI helped me craft compelling stories and practice the STAR method until it became natural.',
      results: {
        previousRejections: 12,
        interviewsAfter: 4,
        offersReceived: 3,
        salaryIncrease: '62%',
        timeToOffer: '3 weeks'
      },
      skills: ['Product Strategy', 'Stakeholder Management', 'Data Analysis'],
      beforeAfter: {
        before: 'Unfocused answers, weak examples, poor storytelling',
        after: 'Clear frameworks, compelling narratives, data-driven insights'
      },
      companyLogos: ['microsoft', 'uber', 'airbnb']
    },
    {
      id: 'emily-watson',
      name: 'Emily Watson',
      title: 'Senior Data Scientist',
      company: 'Stripe',
      location: 'San Francisco, CA',
      avatar: '/icon-192.png',
      video: '/testimonials/emily-watson.mp4',
      duration: '2:45',
      joinedDate: 'January 2024',
      interviewCount: 28,
      successRate: 96,
      rating: 5,
      quote: 'I loved how the AI adapted to my expertise level. It pushed me on advanced ML concepts while helping me communicate complex ideas simply.',
      fullStory: 'Moving from academia to industry required a different interview style. InterviewAI helped me translate my research experience into business impact stories that resonated with hiring managers.',
      results: {
        previousRejections: 6,
        interviewsAfter: 2,
        offersReceived: 2,
        salaryIncrease: '38%',
        timeToOffer: '1 week'
      },
      skills: ['Machine Learning', 'Statistical Analysis', 'Business Communication'],
      beforeAfter: {
        before: 'Too academic, complex jargon, missed business context',
        after: 'Business-focused, clear communication, impact-oriented'
      },
      companyLogos: ['stripe', 'snowflake', 'databricks']
    },
    {
      id: 'david-kim',
      name: 'David Kim',
      title: 'Engineering Manager',
      company: 'Meta',
      location: 'Menlo Park, CA',
      avatar: '/icon-192.png',
      video: '/testimonials/david-kim.mp4',
      duration: '3:28',
      joinedDate: 'April 2024',
      interviewCount: 41,
      successRate: 89,
      rating: 5,
      quote: 'The leadership scenario practice was invaluable. InterviewAI helped me articulate my management philosophy and prepare for difficult situational questions.',
      fullStory: 'Stepping into management meant facing entirely new types of interview questions. InterviewAI\'s leadership scenarios and people management questions prepared me for situations I hadn\'t even considered.',
      results: {
        previousRejections: 5,
        interviewsAfter: 3,
        offersReceived: 2,
        salaryIncrease: '28%',
        timeToOffer: '2 weeks'
      },
      skills: ['Technical Leadership', 'Team Management', 'Strategic Planning'],
      beforeAfter: {
        before: 'Vague leadership examples, reactive responses',
        after: 'Concrete leadership stories, proactive mindset'
      },
      companyLogos: ['meta', 'apple', 'tesla']
    }
  ]

  const currentTestimonial = testimonials[activeTestimonial]

  const stats = [
    { value: '15,847', label: 'Success Stories', icon: Users },
    { value: '94%', label: 'Success Rate', icon: TrendingUp },
    { value: '4.9', label: 'Average Rating', icon: Star },
    { value: '48%', label: 'Avg Salary Boost', icon: Award }
  ]

  return (
    <section id="testimonials" className="py-32 bg-gradient-to-b from-white via-neutral-50/30 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-secondary-50 to-primary-50 border border-secondary-100 rounded-full px-6 py-3 mb-8">
            <Quote className="w-5 h-5 text-secondary-600 mr-2" />
            <span className="text-secondary-700 font-bold">Success Stories</span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-display font-bold text-neutral-900 mb-8">
            Real People,{' '}
            <span className="text-transparent bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text">
              Real Results
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-neutral-600 max-w-4xl mx-auto leading-relaxed">
            Discover how professionals from top companies transformed their interview skills and landed dream jobs
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-6 bg-white rounded-2xl shadow-elevation-2 border border-neutral-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-100 to-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">{stat.value}</div>
              <div className="text-neutral-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Testimonial Selector */}
          <motion.div 
            className="lg:col-span-4 space-y-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                onClick={() => setActiveTestimonial(index)}
                className={`group w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeTestimonial === index
                    ? 'bg-white shadow-elevation-3 border-2 border-primary-200'
                    : 'bg-white/60 hover:bg-white border border-neutral-200 hover:shadow-elevation-2'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar & Play Button */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-neutral-200 to-neutral-300 rounded-xl overflow-hidden">
                      {/* Placeholder for avatar */}
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    {/* Play Button Overlay */}
                    <div className={`absolute inset-0 rounded-xl flex items-center justify-center transition-opacity ${
                      activeTestimonial === index ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/10'
                    }`}>
                      <Play className={`w-6 h-6 text-white transition-opacity ${
                        activeTestimonial === index || true ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'
                      }`} />
                    </div>
                    {/* Duration Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                      {testimonial.duration}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-bold text-neutral-900 truncate">{testimonial.name}</h3>
                      <div className="flex">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm text-neutral-600 mb-2">
                      {testimonial.title} at {testimonial.company}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-neutral-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{testimonial.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{testimonial.joinedDate}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm text-neutral-700 leading-relaxed ${
                      activeTestimonial === index ? '' : 'line-clamp-3'
                    }`}>
                      {testimonial.quote}
                    </p>

                    {/* Success Metrics */}
                    <div className="mt-3 flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1 text-secondary-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{testimonial.successRate}% success</span>
                      </div>
                      <div className="flex items-center space-x-1 text-primary-600">
                        <Award className="w-3 h-3" />
                        <span>{testimonial.interviewCount} interviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Indicator */}
                <AnimatePresence>
                  {activeTestimonial === index && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-r-full"
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

          {/* Main Testimonial Detail */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-elevation-4 border border-neutral-100 overflow-hidden"
              >
                {/* Video/Hero Section */}
                <div className="relative bg-gradient-to-br from-neutral-100 to-neutral-200 h-64 lg:h-80 flex items-center justify-center">
                  {/* Video Placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/80 to-secondary-500/80 flex items-center justify-center">
                    <motion.button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-elevation-3 hover:scale-105 transition-transform"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-primary-600" />
                      ) : (
                        <Play className="w-8 h-8 text-primary-600 ml-1" />
                      )}
                    </motion.button>
                  </div>

                  {/* Company Logos */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    {currentTestimonial.companyLogos.map((logo, index) => (
                      <div key={logo} className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-neutral-600" />
                      </div>
                    ))}
                  </div>

                  {/* Duration & Controls */}
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                    <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentTestimonial.duration}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                        {currentTestimonial.name}
                      </h3>
                      <div className="text-lg text-neutral-600 mb-2">
                        {currentTestimonial.title}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-neutral-500">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{currentTestimonial.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{currentTestimonial.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="bg-gradient-to-r from-neutral-50 to-primary-50/30 rounded-2xl p-6 mb-8">
                    <Quote className="w-8 h-8 text-primary-300 mb-4" />
                    <blockquote className="text-lg text-neutral-800 italic leading-relaxed mb-4">
                      "{currentTestimonial.fullStory}"
                    </blockquote>
                    <div className="text-neutral-600">— {currentTestimonial.name}</div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {Object.entries(currentTestimonial.results).map(([key, value]) => (
                      <div key={key} className="text-center p-4 bg-gradient-to-br from-neutral-50 to-secondary-50/30 rounded-xl">
                        <div className="text-2xl font-bold text-secondary-600 mb-1">{value}</div>
                        <div className="text-sm text-neutral-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills Improved */}
                  <div className="mb-8">
                    <h4 className="font-bold text-neutral-900 mb-4 flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-secondary-600 mr-2" />
                      Skills Improved
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentTestimonial.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Before/After */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                      <h5 className="font-bold text-red-800 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-2">
                          <span className="text-red-600 text-sm">✗</span>
                        </div>
                        Before
                      </h5>
                      <p className="text-red-700">{currentTestimonial.beforeAfter.before}</p>
                    </div>
                    
                    <div className="p-6 bg-secondary-50 border border-secondary-100 rounded-2xl">
                      <h5 className="font-bold text-secondary-800 mb-3 flex items-center">
                        <div className="w-6 h-6 bg-secondary-200 rounded-full flex items-center justify-center mr-2">
                          <CheckCircle2 className="w-4 h-4 text-secondary-600" />
                        </div>
                        After
                      </h5>
                      <p className="text-secondary-700">{currentTestimonial.beforeAfter.after}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-3xl p-12 border border-secondary-100">
            <h3 className="text-3xl lg:text-4xl font-display font-bold text-neutral-900 mb-6">
              Ready to Write Your Success Story?
            </h3>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've transformed their careers with AI-powered interview coaching
            </p>
            
            <motion.button
              className="group inline-flex items-center px-10 py-4 bg-gradient-to-r from-secondary-600 to-primary-600 text-white rounded-2xl font-bold text-lg shadow-elevation-3 hover:shadow-elevation-4 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <p className="text-neutral-500 mt-4">No credit card required • 7-day free trial</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}