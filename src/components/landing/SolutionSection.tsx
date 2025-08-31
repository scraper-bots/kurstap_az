export default function SolutionSection() {
  const solutions = [
    {
      icon: '🎯',
      title: 'Realistic Practice',
      description: 'Job-specific questions for your role',
      details: 'Get questions tailored to your industry and seniority level, from entry-level to executive positions.'
    },
    {
      icon: '🗣️',
      title: 'Voice Interaction',
      description: 'Practice speaking, not just thinking',
      details: 'Our AI interviewer responds to your actual voice, just like a real interview situation.'
    },
    {
      icon: '📊',
      title: 'Instant Feedback',
      description: 'Know exactly what to improve',
      details: 'Get detailed analysis on your communication style, confidence level, and technical accuracy.'
    }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            The AI-Powered Solution You've Been Looking For
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Practice like it's the real thing. Get feedback like you have a personal coach.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 h-full hover:shadow-xl transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {solution.icon}
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">
                  {solution.title}
                </h3>
                <p className="text-lg font-semibold text-primary-600 mb-4">
                  {solution.description}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {solution.details}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              {/* Connection line for desktop */}
              {index < solutions.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-slate-300 to-transparent"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full px-8 py-4 border border-primary-200">
            <span className="text-lg font-semibold text-slate-700 mr-2">
              Ready to transform your interview skills?
            </span>
            <span className="text-primary-600 font-bold">Start practicing now →</span>
          </div>
        </div>
      </div>
    </section>
  )
}