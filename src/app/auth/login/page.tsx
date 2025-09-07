import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <LoginForm redirectTo={params.redirectTo} />
    </div>
  )
}