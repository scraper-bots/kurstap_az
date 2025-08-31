export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      icon: '👔',
      title: 'Choose Your Role',
      description: 'Select from 50+ job roles including Software Engineer, Product Manager, Sales, Marketing, and more.',
      visual: 'Dropdown selector with popular job titles'
    },
    {
      number: 2,
      icon: '🎤',
      title: 'Start Voice Interview',
      description: 'Our AI interviewer asks relevant questions while you respond naturally using your voice.',
      visual: 'Microphone with sound waves animation'
    },
    {
      number: 3,
      icon: '🤖',
      title: 'Get Real-time Feedback',
      description: 'Receive instant analysis on your communication, confidence, technical accuracy, and areas to improve.',
      visual: 'Live dashboard with metrics'
    },
    {
      number: 4,
      icon: '📈',
      title: 'Improve & Repeat',
      description: 'Track your progress over time and practice until you are confident and interview-ready.',
      visual: 'Progress charts showing improvement'
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get interview-ready in 4 simple steps. No complex setup, no awkward video calls.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 transform -translate-y-1/2"></div>
          
          <div className="grid lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:scale-105 relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl lg:text-5xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl lg:text-2xl font-display font-bold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      {step.description}
                    </p>
                    
                    {/* Visual hint */}
                    <div className="text-xs text-primary-600 bg-primary-50 px-3 py-1 rounded-full inline-block">
                      {step.visual}
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* Arrow for mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-4 mb-4">
                    <div className="w-6 h-6 text-slate-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">
              Ready to Start Practicing?
            </h3>
            <p className="text-slate-600 mb-6">
              Join thousands of job seekers who've improved their interview skills with our AI coach
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary-900 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105">
                Get Started - It's Free
              </button>
              <button className="border-2 border-slate-300 text-slate-700 hover:border-primary-600 hover:text-primary-600 font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105">
                See Demo First
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}