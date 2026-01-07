import { Navbar } from '@/components/Navbar'
import { ContentGenerator } from '@/components/ContentGenerator'
import { Sparkles, Zap, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Generuj Treści z{' '}
            <span className="text-primary-600">Sztuczną Inteligencją</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            ContentAI Pro to profesjonalna platforma do tworzenia wysokiej
            jakości treści w kilka sekund. Artykuły, posty, opisy produktów i
            więcej - wszystko z pomocą AI.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/api/auth/signin"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Zacznij za darmo
            </Link>
            <Link
              href="/pricing"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition font-semibold"
            >
              Zobacz cennik
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Szybkie generowanie
            </h3>
            <p className="text-gray-600">
              Twórz profesjonalne treści w kilka sekund zamiast godzin
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Wysoka jakość
            </h3>
            <p className="text-gray-600">
              Treści na poziomie profesjonalnego copywritera
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bezpieczne i prywatne
            </h3>
            <p className="text-gray-600">
              Twoje dane są bezpieczne i nigdy nie są udostępniane
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Wypróbuj teraz
            </h2>
            <p className="text-gray-600">
              Zaloguj się, aby wygenerować swoją pierwszą treść
            </p>
          </div>
          <ContentGenerator />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Gotowy, aby zwiększyć produktywność?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Dołącz do tysięcy użytkowników, którzy już oszczędzają czas dzięki
            ContentAI Pro
          </p>
          <Link
            href="/api/auth/signin"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold inline-block"
          >
            Rozpocznij za darmo
          </Link>
        </div>
      </section>
    </div>
  )
}

