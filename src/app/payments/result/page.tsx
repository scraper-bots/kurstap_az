import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PaymentResultContent from './PaymentResultContent'

function PaymentResultFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-blue-100 mb-8">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PaymentResultFallback />}>
        <PaymentResultContent />
      </Suspense>
      <Footer />
    </>
  )
}