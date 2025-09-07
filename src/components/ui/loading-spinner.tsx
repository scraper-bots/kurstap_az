import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'secondary' | 'accent'
  className?: string
}

const sizeVariants = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorVariants = {
  default: 'text-blue-600',
  secondary: 'text-gray-500',
  accent: 'text-indigo-600'
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeVariants[size],
        colorVariants[variant],
        className
      )}
    />
  )
}

export function LoadingState({ 
  message = 'Loading...',
  submessage,
  size = 'lg',
  className 
}: {
  message?: string
  submessage?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size={size} />
      <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      {submessage && (
        <p className="mt-2 text-sm text-gray-500 text-center max-w-md">{submessage}</p>
      )}
    </div>
  )
}

export function InlineLoadingSpinner({ 
  message,
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  )
}