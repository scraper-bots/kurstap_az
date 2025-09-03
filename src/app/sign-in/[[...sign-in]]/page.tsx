import { SignIn } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <SignIn />
      </div>
      <Footer />
    </>
  )
}