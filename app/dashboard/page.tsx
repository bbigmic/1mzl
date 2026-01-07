import { Navbar } from '@/components/Navbar'
import { ContentGenerator } from '@/components/ContentGenerator'
import { ContentList } from '@/components/ContentList'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, TrendingUp, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/api/auth/signin')
  }

  if (!session.user.id) {
    console.error('Session user ID is missing')
    redirect('/api/auth/signin')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const plan = subscription?.plan || 'free'

  // Get stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalContent, todayContent, recentContent] = await Promise.all([
    prisma.content.count({
      where: { userId: session.user.id },
    }),
    prisma.content.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    }),
    prisma.content.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Wszystkie treści</p>
                <p className="text-3xl font-bold text-gray-900">{totalContent}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dzisiaj</p>
                <p className="text-3xl font-bold text-gray-900">{todayContent}</p>
              </div>
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan</p>
                <p className="text-3xl font-bold text-gray-900 capitalize">
                  {plan}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generator */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generuj nową treść
            </h2>
            <ContentGenerator />
          </div>

          {/* Recent Content */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ostatnie treści
            </h2>
            <ContentList initialContents={recentContent} />
          </div>
        </div>
      </div>
    </div>
  )
}

