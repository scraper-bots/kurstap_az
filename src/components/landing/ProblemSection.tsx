export default function ProblemSection() {
  const problems = [
    {
      icon: '😰',
      stat: '87%',
      text: 'of people get nervous in interviews'
    },
    {
      icon: '🤷‍♂️',
      stat: 'Most',
      text: 'never practice out loud'
    },
    {
      icon: '📝',
      stat: 'Generic',
      text: 'feedback doesn\'t help'
    }
  ]

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">
            Why Most People Struggle in Interviews
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Traditional interview prep just doesn't cut it. Here's what's holding you back:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="mb-6 relative">
                <div className="text-6xl lg:text-7xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {problem.icon}
                </div>
                <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full font-bold text-lg lg:text-xl">
                  {problem.stat}
                </div>
              </div>
              <p className="text-lg lg:text-xl text-slate-700 font-medium">
                {problem.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-lg border border-slate-200">
            <span className="text-slate-600 mr-2">The result?</span>
            <span className="font-bold text-red-600">Missed opportunities and lost confidence</span>
          </div>
        </div>
      </div>
    </section>
  )
}