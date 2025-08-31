export default function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect to get started and see how it works',
      features: [
        '3 practice interviews',
        'Basic feedback and scoring',
        'Common interview questions',
        'Email support',
        'Progress tracking'
      ],
      limitations: [
        'Limited to 3 total interviews',
        'Basic analytics only'
      ],
      cta: 'Start Free',
      popular: false,
      color: 'slate'
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'Everything you need to ace your interviews',
      features: [
        'Unlimited practice interviews',
        'Advanced AI feedback & coaching',
        'Industry-specific questions',
        'Detailed performance analytics',
        'Interview recording playback',
        'Progress tracking & trends',
        'Priority email support',
        'Export performance reports',
        'Custom interview scenarios'
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      popular: true,
      color: 'primary'
    }
  ]

  const guarantees = [
    { icon: '💳', text: 'No credit card required for free tier' },
    { icon: '❌', text: 'Cancel anytime, no questions asked' },
    { icon: '💰', text: '30-day money-back guarantee' },
    { icon: '🔒', text: 'Secure payments via Stripe' }
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no long-term commitments.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 ${
                plan.popular
                  ? 'bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 shadow-xl'
                  : 'bg-slate-50 border border-slate-200 shadow-lg hover:shadow-xl'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl lg:text-5xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600 ml-2">/ {plan.period}</span>
                </div>
                <p className="text-slate-600">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="font-semibold text-slate-900 mb-3">What's included:</div>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="text-sm font-semibold text-slate-600 mb-2">Limitations:</div>
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center space-x-3 mb-2">
                        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-600">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 ${
                  plan.popular
                    ? 'bg-primary-900 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.cta}
              </button>

              {/* Additional info */}
              {plan.name === 'Pro' && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-slate-600">
                    7-day free trial • Then {plan.price}/month
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {guarantees.map((guarantee, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-3">{guarantee.icon}</div>
              <div className="text-sm font-medium text-slate-700">{guarantee.text}</div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-display font-bold text-center text-slate-900 mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            {[
              {
                q: "Can I upgrade or downgrade my plan anytime?",
                a: "Yes! You can upgrade to Pro anytime during your free trial or while using the free plan. You can also cancel your Pro subscription at any time and continue using the free version."
              },
              {
                q: "What happens after my free trial ends?",
                a: "After your 7-day Pro trial, you'll be charged $19/month. You can cancel before the trial ends and continue with the free plan if you prefer."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with Pro, we'll refund your payment, no questions asked."
              },
              {
                q: "How realistic is the AI interviewer?",
                a: "Our AI is trained on thousands of real interviews from top companies. Users consistently tell us it feels like practicing with a human recruiter."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-6">
                <div className="font-semibold text-slate-900 mb-2">{faq.q}</div>
                <div className="text-slate-700">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-slate-50 to-primary-50/30 rounded-2xl p-8 border border-slate-200">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">
              Ready to Start Practicing?
            </h3>
            <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
              Join thousands of job seekers who've improved their interview skills and landed their dream jobs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary-900 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105">
                Start Free Practice
              </button>
              <button className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 hover:scale-105">
                Try Pro Free for 7 Days
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}