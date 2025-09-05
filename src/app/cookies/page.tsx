import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-600 mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  analyzing how you use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-medium text-blue-900 mb-3">🔧 Essential Cookies</h3>
                  <p className="text-blue-800 mb-3">
                    These cookies are necessary for the website to function properly. They cannot be switched off.
                  </p>
                  <ul className="list-disc pl-5 text-blue-800">
                    <li>Authentication and security cookies</li>
                    <li>Session management cookies</li>
                    <li>Load balancing cookies</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-medium text-green-900 mb-3">📊 Analytics Cookies</h3>
                  <p className="text-green-800 mb-3">
                    These help us understand how visitors interact with our website by collecting anonymous information.
                  </p>
                  <ul className="list-disc pl-5 text-green-800">
                    <li>Google Analytics cookies</li>
                    <li>Usage statistics cookies</li>
                    <li>Performance monitoring cookies</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-medium text-purple-900 mb-3">🎯 Functionality Cookies</h3>
                  <p className="text-purple-800 mb-3">
                    These cookies remember choices you make to provide enhanced, personalized features.
                  </p>
                  <ul className="list-disc pl-5 text-purple-800">
                    <li>Preference and settings cookies</li>
                    <li>Language selection cookies</li>
                    <li>Theme and layout cookies</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-medium text-orange-900 mb-3">📢 Marketing Cookies</h3>
                  <p className="text-orange-800 mb-3">
                    These cookies track your visit to our website to display relevant advertisements.
                  </p>
                  <ul className="list-disc pl-5 text-orange-800">
                    <li>Advertisement tracking cookies</li>
                    <li>Social media integration cookies</li>
                    <li>Conversion tracking cookies</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use several third-party services that may set their own cookies:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
                    <p className="text-gray-700 text-sm">Used for website analytics and performance monitoring.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Clerk Authentication</h4>
                    <p className="text-gray-700 text-sm">Required for user authentication and account management.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Daily.co</h4>
                    <p className="text-gray-700 text-sm">Powers our voice interview functionality.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Vercel Analytics</h4>
                    <p className="text-gray-700 text-sm">Provides website performance insights.</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
                <p className="text-gray-700 mb-6">
                  You have several options to manage cookies:
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Browser Settings</h3>
                  <p className="text-gray-700 mb-4">
                    Most browsers allow you to control cookies through their settings preferences. Here&apos;s how:
                  </p>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                    <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                    <li><strong>Edge:</strong> Settings → Site permissions → Cookies and site data</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Disabling certain cookies may affect the functionality of our website 
                    and limit your user experience.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Consent</h2>
                <p className="text-gray-700 mb-4">
                  When you first visit our website, we&apos;ll show you a cookie consent banner. You can:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Accept all cookies for the full experience</li>
                  <li>Reject non-essential cookies</li>
                  <li>Customize your preferences</li>
                  <li>Change your preferences at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
                <p className="text-gray-700 mb-4">
                  Different cookies have different lifespans:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900">Session Cookies</h4>
                    <p className="text-blue-700 text-sm">Deleted when you close your browser</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Temporary Cookies</h4>
                    <p className="text-green-700 text-sm">Expire after 1-30 days</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900">Persistent Cookies</h4>
                    <p className="text-purple-700 text-sm">Stored for up to 2 years</p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy from time to time. We will notify you of any material changes 
                  by posting the updated policy on this page and updating the &quot;last updated&quot; date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about our use of cookies, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    Email: privacy@bir.guru<br/>
                    Subject: Cookie Policy Inquiry
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}