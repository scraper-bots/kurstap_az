import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Password Reset</CardTitle>
          <CardDescription className="text-gray-600">
            Password reset functionality is coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              For now, please contact support if you need to reset your password.
            </p>
            
            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}