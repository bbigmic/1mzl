import { Navbar } from '@/components/Navbar'
import { PricingCard } from '@/components/PricingCard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  let currentPlan = 'free'

  if (session?.user?.id) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })
    currentPlan = subscription?.plan || 'free'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wybierz plan dla siebie
          </h1>
          <p className="text-xl text-gray-600">
            Rozpocznij za darmo i upgrade'uj, gdy będziesz gotowy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            name="Free"
            price={0}
            description="Idealne do testowania"
            features={[
              '10 generacji dziennie',
              'Do 1000 słów na treść',
              'Podstawowe szablony',
              'Wsparcie email',
            ]}
            plan="free"
            currentPlan={currentPlan}
          />

          <PricingCard
            name="Pro"
            price={99}
            description="Dla profesjonalistów"
            features={[
              '500 generacji dziennie',
              'Do 50,000 słów na treść',
              'Wszystkie szablony',
              'Priorytetowe wsparcie',
              'Eksport do PDF',
              'Historia treści',
            ]}
            plan="pro"
            currentPlan={currentPlan}
          />

          <PricingCard
            name="Enterprise"
            price={299}
            description="Dla zespołów i firm"
            features={[
              'Nielimitowane generacje',
              'Nielimitowane słowa',
              'Wszystkie funkcje Pro',
              'Dedykowane wsparcie',
              'API access',
              'Custom integrations',
              'SLA 99.9%',
            ]}
            plan="enterprise"
            currentPlan={currentPlan}
          />
        </div>
      </div>
    </div>
  )
}

