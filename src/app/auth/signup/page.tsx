import { SignupForm } from '@/components/auth/SignupForm'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <SignupForm redirectTo={params.redirectTo} />
    </div>
  )
}