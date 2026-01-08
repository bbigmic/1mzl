import { Navbar } from '@/components/Navbar'
import { EmailMarketingDashboard } from '@/components/EmailMarketingDashboard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function EmailMarketingPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/api/auth/signin')
  }

  // Check if user has Pro plan
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const plan = subscription?.plan || 'free'

  if (plan !== 'pro' && plan !== 'enterprise') {
    redirect('/pricing?upgrade=email-marketing')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Marketing
          </h1>
          <p className="text-gray-600">
            Zarządzaj listami mailingowymi i wysyłaj profesjonalne kampanie
          </p>
        </div>

        <EmailMarketingDashboard />
      </div>
    </div>
  )
}

