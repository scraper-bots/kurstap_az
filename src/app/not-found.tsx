import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold text-blue-600">404</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </Link>
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Pages</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Link href="/interview" className="text-blue-600 hover:text-blue-700 transition-colors">
                Start Interview
              </Link>
              <Link href="/about" className="text-blue-600 hover:text-blue-700 transition-colors">
                About Us
              </Link>
              <Link href="/blog" className="text-blue-600 hover:text-blue-700 transition-colors">
                Blog
              </Link>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}