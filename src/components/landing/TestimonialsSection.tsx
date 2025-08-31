export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      image: '/api/placeholder/80/80',
      quote: 'Got my dream job at Google after just 2 weeks of practice. The AI feedback was incredibly detailed and helped me identify exactly what I needed to improve.',
      result: 'Landed offer at Google',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Product Manager',
      company: 'Microsoft',
      image: '/api/placeholder/80/80',
      quote: 'The behavioral questions were spot-on for PM roles. I felt so much more confident in my actual interviews after practicing here.',
      result: 'Increased confidence by 300%',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Sales Director',
      company: 'Salesforce',
      image: '/api/placeholder/80/80',
      quote: 'This platform helped me transition from a junior to senior sales role. The AI understood the nuances of sales interviews perfectly.',
      result: 'Promoted within 30 days',
      rating: 5
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Interviews Practiced' },
    { number: '78%', label: 'Land Job Within 30 Days' },
    { number: '4.9/5', label: 'Average Rating' },
    { number: '50+', label: 'Job Roles Supported' }
  ]

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Real people, real results. See how our AI interview coach has helped thousands land their dream jobs.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group hover:transform hover:scale-105"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 mb-6 italic leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Profile */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-slate-600">{testimonial.role}</div>
                  <div className="text-sm font-medium text-primary-600">{testimonial.company}</div>
                </div>
              </div>

              {/* Result */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">{testimonial.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-slate-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Your Data is Encrypted</div>
              <div className="text-sm text-slate-600">Bank-level security for all recordings</div>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900">We Never Share Recordings</div>
              <div className="text-sm text-slate-600">Your practice sessions stay private</div>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Used by Top Companies</div>
              <div className="text-sm text-slate-600">Employees from FAANG+ companies</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl lg:text-3xl font-display font-bold mb-4">
              Ready to Join Them?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Start your journey to interview success today. No credit card required for your first 3 practice sessions.
            </p>
            <button className="bg-white text-primary-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105">
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}