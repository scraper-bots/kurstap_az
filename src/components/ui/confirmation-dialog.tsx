'use client'

import React from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Button } from './button'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  isLoading?: boolean
}

const variantStyles = {
  default: {
    icon: Info,
    iconColor: 'text-blue-600',
    confirmButton: 'bg-blue-600 hover:bg-blue-700'
  },
  destructive: {
    icon: XCircle,
    iconColor: 'text-red-600',
    confirmButton: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-yellow-600',
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    confirmButton: 'bg-green-600 hover:bg-green-700'
  }
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const { icon: Icon, iconColor, confirmButton } = variantStyles[variant]

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button
                className={confirmButton}
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing confirmation dialogs
export function useConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title: string
    message: string
    onConfirm: () => void
    variant?: 'default' | 'destructive' | 'warning' | 'success'
    confirmText?: string
    cancelText?: string
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const show = React.useCallback((options: {
    title: string
    message: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive' | 'warning' | 'success'
    confirmText?: string
    cancelText?: string
  }) => {
    setConfig({
      ...options,
      onConfirm: async () => {
        setIsLoading(true)
        try {
          await options.onConfirm()
          setIsOpen(false)
        } catch (error) {
          console.error('Confirmation action failed:', error)
        } finally {
          setIsLoading(false)
        }
      }
    })
    setIsOpen(true)
  }, [])

  const hide = React.useCallback(() => {
    if (!isLoading) {
      setIsOpen(false)
      setConfig(null)
    }
  }, [isLoading])

  const ConfirmationComponent = React.useMemo(() => {
    if (!config) return null

    return (
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={hide}
        onConfirm={config.onConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant}
        isLoading={isLoading}
      />
    )
  }, [config, isOpen, hide, isLoading])

  return {
    show,
    hide,
    ConfirmationComponent,
    isLoading
  }
}

// Pre-built confirmation dialogs for common actions
export const confirmations = {
  delete: (itemName: string, onConfirm: () => void | Promise<void>) => ({
    title: `Delete ${itemName}?`,
    message: `This action cannot be undone. Are you sure you want to delete this ${itemName.toLowerCase()}?`,
    confirmText: 'Delete',
    variant: 'destructive' as const,
    onConfirm
  }),

  discard: (onConfirm: () => void | Promise<void>) => ({
    title: 'Discard changes?',
    message: 'You have unsaved changes. Are you sure you want to discard them?',
    confirmText: 'Discard',
    variant: 'warning' as const,
    onConfirm
  }),

  logout: (onConfirm: () => void | Promise<void>) => ({
    title: 'Sign out?',
    message: 'Are you sure you want to sign out of your account?',
    confirmText: 'Sign Out',
    variant: 'default' as const,
    onConfirm
  }),

  endInterview: (onConfirm: () => void | Promise<void>) => ({
    title: 'End interview?',
    message: 'Are you sure you want to end the interview? Your current progress will be saved.',
    confirmText: 'End Interview',
    variant: 'warning' as const,
    onConfirm
  }),

  startOver: (onConfirm: () => void | Promise<void>) => ({
    title: 'Start over?',
    message: 'This will reset your current interview session. All progress will be lost.',
    confirmText: 'Start Over',
    variant: 'destructive' as const,
    onConfirm
  })
}