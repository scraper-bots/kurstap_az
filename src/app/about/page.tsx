import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About Bir Guru</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Empowering professionals worldwide with AI-powered interview practice and career development tools.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6">
              At Bir Guru, we believe everyone deserves the opportunity to succeed in their career journey. Our mission 
              is to democratize interview preparation and make world-class career coaching accessible to professionals 
              at every level, anywhere in the world.
            </p>
            <p className="text-lg text-gray-700">
              Through cutting-edge AI technology and proven coaching methodologies, we're transforming how people 
              prepare for interviews, build confidence, and unlock their career potential.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-700 mb-6">
              Founded in 2024, Bir Guru was born from a simple observation: talented professionals were missing out on 
              dream opportunities not because they lacked skills, but because they struggled with interview performance. 
              Traditional interview coaching was expensive, time-consuming, and often inaccessible to those who needed it most.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Our founding team, with backgrounds in AI, career coaching, and talent acquisition, set out to create a 
              solution that would level the playing field. By combining artificial intelligence with proven interview 
              techniques, we built a platform that provides personalized, real-time feedback at scale.
            </p>
            <p className="text-lg text-gray-700">
              Today, thousands of professionals trust Bir Guru to help them prepare for interviews, build confidence, 
              and advance their careers. We're proud to be part of their success stories.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessibility</h3>
              <p className="text-gray-700">
                We believe great career coaching should be available to everyone, regardless of location, budget, or background.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700">
                We're committed to delivering the highest quality AI-powered coaching experience through continuous innovation.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-700">
                Your data and privacy are paramount. We use advanced encryption and follow strict data protection standards.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM6 9.5a3.5 3.5 0 117 0V11a1 1 0 11-2 0V9.5a1.5 1.5 0 00-3 0V11a1 1 0 11-2 0V9.5z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Empowerment</h3>
              <p className="text-gray-700">
                We empower individuals to take control of their career journey with confidence, skills, and support.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Technology</h2>
            <p className="text-lg text-gray-700 mb-6">
              Bir Guru leverages cutting-edge artificial intelligence and natural language processing to provide:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎤 Real-time Voice Analysis</h4>
                <p className="text-gray-700 mb-4">Advanced speech recognition and sentiment analysis for natural conversation flow.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🧠 Personalized Feedback</h4>
                <p className="text-gray-700 mb-4">AI-driven insights tailored to your industry, role, and experience level.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📊 Performance Tracking</h4>
                <p className="text-gray-700 mb-4">Comprehensive analytics to track your improvement over time.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔒 Secure & Private</h4>
                <p className="text-gray-700">End-to-end encryption ensures your practice sessions remain confidential.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">15,000+</div>
                <div className="text-gray-700">Professionals Coached</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">89%</div>
                <div className="text-gray-700">Success Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-700">Countries Served</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-700 mb-6">
              Have questions or want to learn more about Bir Guru? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@bir.guru"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="/interview"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Try Our Platform
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
    <Footer />
    </>
  )
}