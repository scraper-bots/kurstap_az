'use client'

import { useState, useEffect } from 'react'
import { AuthUser } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    refresh: checkAuth
  }
}