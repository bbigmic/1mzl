'use client'

import { signIn } from 'next-auth/react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function ErrorMessage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (error === 'OAuthSignin') {
      setErrorMessage('Błąd konfiguracji OAuth. Sprawdź czy GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET są ustawione w pliku .env')
    } else if (error === 'OAuthCallback') {
      setErrorMessage('Błąd podczas autoryzacji. Spróbuj ponownie.')
    } else if (error === 'OAuthCreateAccount') {
      setErrorMessage('Nie udało się utworzyć konta. Spróbuj ponownie.')
    } else if (error === 'EmailCreateAccount') {
      setErrorMessage('Nie udało się utworzyć konta email.')
    } else if (error === 'Callback') {
      setErrorMessage('Błąd podczas logowania. Spróbuj ponownie.')
    } else if (error === 'OAuthAccountNotLinked') {
      setErrorMessage('Konto z tym emailem już istnieje z innym dostawcą.')
    } else if (error === 'EmailSignin') {
      setErrorMessage('Błąd podczas wysyłania emaila.')
    } else if (error === 'CredentialsSignin') {
      setErrorMessage('Nieprawidłowe dane logowania.')
    } else if (error === 'SessionRequired') {
      setErrorMessage('Musisz być zalogowany, aby uzyskać dostęp do tej strony.')
    }
  }, [error])

  if (!errorMessage) return null

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-800">{errorMessage}</p>
    </div>
  )
}

export default function SignInPage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Witaj w ContentAI Pro
          </h1>
          <p className="text-gray-600">
            Zaloguj się, aby rozpocząć generowanie treści
          </p>
        </div>

        <Suspense fallback={null}>
          <ErrorMessage />
        </Suspense>

        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard', redirect: true })}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center space-x-3"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Zaloguj się przez Google</span>
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Logując się, akceptujesz nasze Warunki korzystania i Politykę
          prywatności
        </p>
      </div>
    </div>
  )
}

