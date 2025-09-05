import { Suspense } from 'react'
import { XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PaymentErrorContent from './PaymentErrorContent'

function PaymentErrorFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
            <XCircle className="h-20 w-20 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PaymentErrorFallback />}>
        <PaymentErrorContent />
      </Suspense>
      <Footer />
    </>
  )
}