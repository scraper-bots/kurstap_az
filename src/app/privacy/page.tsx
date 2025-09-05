import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Bir Guru (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our AI interview practice platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6">
                <li>Name and email address (when you create an account)</li>
                <li>Profile information (job title, experience level, industry)</li>
                <li>Voice recordings during interview practice sessions</li>
                <li>Text responses to interview questions</li>
                <li>Usage data and session statistics</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage patterns and interaction data</li>
                <li>Session duration and frequency</li>
                <li>Performance metrics and error logs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Providing and improving our AI interview services</li>
                <li>Personalizing your interview experience and recommendations</li>
                <li>Analyzing your performance and providing feedback</li>
                <li>Communicating with you about our services</li>
                <li>Ensuring platform security and preventing fraud</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Voice Data and AI Processing</h2>
              <p className="text-gray-700 mb-4">
                Our platform processes voice recordings to provide AI-powered interview feedback. Here&apos;s how we handle your voice data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Voice recordings are processed in real-time for transcription and analysis</li>
                <li>We use secure, industry-standard AI services for speech processing</li>
                <li>Voice data is encrypted during transmission and storage</li>
                <li>You can delete your voice recordings at any time</li>
                <li>We do not share voice recordings with third parties without consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>With your explicit consent</li>
                <li>To trusted service providers who assist in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transaction (merger, acquisition, etc.)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure data storage and transmission protocols</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate information</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and recommendations</li>
                <li>Ensure platform security and functionality</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings, but this may affect platform functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Account information: Until account deletion</li>
                <li>Interview sessions: 2 years for performance tracking</li>
                <li>Voice recordings: 30 days unless deleted sooner</li>
                <li>Usage analytics: 3 years for service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected such information, 
                we will take steps to delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your data during international transfers, including 
                standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new policy on this page and updating the &quot;last updated&quot; date. Your continued use of our 
                service constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Email: privacy@bir.guru<br/>
                  Data Protection Officer: dpo@bir.guru<br/>
                  Address: [Your Business Address]<br/>
                  Phone: [Your Contact Number]
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