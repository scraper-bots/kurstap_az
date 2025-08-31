export default function FeaturesSection() {
  const features = [
    {
      title: 'Realistic AI Interviewer',
      description: 'Feels like talking to a human recruiter',
      details: 'Our advanced AI understands context, follows up on your answers, and adapts the conversation flow just like a real interviewer would.',
      image: '/api/placeholder/600/400',
      stats: ['Natural conversation flow', 'Context-aware follow-ups', 'Industry-specific knowledge'],
      reverse: false
    },
    {
      title: 'Personalized Questions',
      description: '500+ questions for Software Engineers, PMs, Sales...',
      details: 'Questions are tailored to your specific role, experience level, and industry. From technical deep-dives to behavioral scenarios.',
      image: '/api/placeholder/600/400',
      stats: ['50+ job roles covered', '500+ unique questions', 'Regular content updates'],
      reverse: true
    },
    {
      title: 'Detailed Analytics',
      description: 'Track your progress interview by interview',
      details: 'Get comprehensive insights into your communication style, confidence level, technical accuracy, and improvement areas.',
      image: '/api/placeholder/600/400',
      stats: ['Communication analysis', 'Confidence scoring', 'Progress tracking'],
      reverse: false
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            Features That Set Us Apart
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            More than just practice questions. A complete interview preparation platform.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div key={index} className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${feature.reverse ? 'lg:grid-flow-col-dense' : ''}`}>
              {/* Content */}
              <div className={`space-y-6 ${feature.reverse ? 'lg:col-start-2' : ''}`}>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-lg font-semibold text-primary-600 mb-4">
                    {feature.description}
                  </p>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {feature.details}
                  </p>
                </div>

                {/* Stats/Features */}
                <div className="space-y-3">
                  {feature.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                      <span className="text-slate-700 font-medium">{stat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4">
                  <button className="bg-secondary-600 hover:bg-secondary-500 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105">
                    Try This Feature
                  </button>
                </div>
              </div>

              {/* Visual/Mockup */}
              <div className={`${feature.reverse ? 'lg:col-start-1' : ''}`}>
                <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 group hover:shadow-2xl transition-all duration-300">
                  {/* Feature-specific mockup */}
                  {index === 0 && (
                    <div className="space-y-6">
                      {/* AI Interviewer Interface */}
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">🤖</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">AI Interviewer</div>
                            <div className="text-sm text-slate-500">Senior Product Manager</div>
                          </div>
                          <div className="ml-auto">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                          <p className="text-slate-700">"That's a great approach. Can you walk me through how you'd measure success for this feature?"</p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Follow-up question generated</span>
                          <span className="text-secondary-600 font-medium">Natural conversation ✓</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="space-y-4">
                      {/* Question Bank Interface */}
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">Question Bank</h4>
                          <div className="text-sm text-slate-500">Software Engineer • Senior</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                            <span className="text-slate-700">System Design Questions</span>
                            <span className="text-primary-600 font-medium">47 questions</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                            <span className="text-slate-700">Behavioral Questions</span>
                            <span className="text-secondary-600 font-medium">32 questions</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-accent-50 rounded-lg">
                            <span className="text-slate-700">Technical Deep-dives</span>
                            <span className="text-accent-600 font-medium">28 questions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="space-y-4">
                      {/* Analytics Dashboard */}
                      <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="mb-4">
                          <h4 className="font-semibold text-slate-900 mb-2">Interview Performance</h4>
                          <div className="text-sm text-slate-500">Last 7 interviews</div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Communication Clarity</span>
                              <span className="text-sm font-medium text-secondary-600">87%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full">
                              <div className="w-5/6 h-2 bg-secondary-500 rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Confidence Level</span>
                              <span className="text-sm font-medium text-primary-600">74%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full">
                              <div className="w-3/4 h-2 bg-primary-500 rounded-full"></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600">Technical Accuracy</span>
                              <span className="text-sm font-medium text-accent-600">92%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full">
                              <div className="w-11/12 h-2 bg-accent-500 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <div className="text-sm font-medium text-green-800">🎉 Great improvement this week!</div>
                          <div className="text-xs text-green-600 mt-1">+12% confidence increase</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating success indicators */}
                  <div className="absolute -top-2 -right-2 bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-float">
                    ✓ Working
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-24 text-center bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-12">
          <h3 className="text-2xl lg:text-3xl font-display font-bold text-slate-900 mb-4">
            Experience the Difference
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Don't just take our word for it. Try our AI interviewer and see how realistic and helpful it really is.
          </p>
          <button className="bg-primary-900 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105 animate-pulse-slow hover:animate-none">
            Start Your Free Interview Now
          </button>
        </div>
      </div>
    </section>
  )
}