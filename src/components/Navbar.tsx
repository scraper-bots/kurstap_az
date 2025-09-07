'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, User, LogOut } from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigation: { name: string; href: string }[] = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BG</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Bir Guru</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{user?.firstName || user?.email}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      logout()
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="px-3 py-4 space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:from-blue-700 hover:to-indigo-700 transition-all text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}