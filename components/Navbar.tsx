'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Sparkles, User, LogOut } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">ContentAI Pro</span>
          </Link>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-gray-600">Ładowanie...</div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Cennik
                </Link>
                <div className="flex items-center space-x-2">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full border-2 border-gray-200"
                      onError={(e) => {
                        // Fallback jeśli obraz się nie załaduje
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Wyloguj</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Cennik
                </Link>
                <Link
                  href="/api/auth/signin"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Zaloguj się
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

