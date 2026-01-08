'use client'

import { useState, useEffect } from 'react'
import { Mail, Plus, Users, Send, BarChart3, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmailLists } from './EmailLists'
import { EmailCampaigns } from './EmailCampaigns'
import { CreateCampaign } from './CreateCampaign'

type Tab = 'lists' | 'campaigns' | 'create'

export function EmailMarketingDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('lists')
  const [stats, setStats] = useState({
    totalLists: 0,
    totalSubscribers: 0,
    totalCampaigns: 0,
    sentEmails: 0,
  })

  const fetchStats = async () => {
    try {
      const [listsRes, campaignsRes] = await Promise.all([
        fetch('/api/email/lists'),
        fetch('/api/email/campaigns'),
      ])

      const listsData = await listsRes.json()
      const campaignsData = await campaignsRes.json()

      const totalSubscribers = listsData.lists?.reduce(
        (sum: number, list: any) => sum + (list._count?.subscribers || 0),
        0
      ) || 0

      const sentEmails = campaignsData.campaigns?.reduce(
        (sum: number, campaign: any) => {
          const stats = campaign.stats as any
          return sum + (stats?.sent || 0)
        },
        0
      ) || 0

      setStats({
        totalLists: listsData.lists?.length || 0,
        totalSubscribers,
        totalCampaigns: campaignsData.campaigns?.length || 0,
        sentEmails,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">⚠️ Ważne - Zgodność z prawem</p>
          <p>
            Upewnij się, że masz zgodę na wysyłanie emaili (RODO/GDPR). 
            Używaj tylko list z wyraźną zgodą. Spam jest nielegalny i może 
            prowadzić do blacklistowania domeny.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Listy mailingowe</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalLists}
              </p>
            </div>
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Subskrybenci</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSubscribers}
              </p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Kampanie</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCampaigns}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Wysłane emaile</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.sentEmails}
              </p>
            </div>
            <Send className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('lists')}
              className={`${
                activeTab === 'lists'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Listy mailingowe
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`${
                activeTab === 'campaigns'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Kampanie
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`${
                activeTab === 'create'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Utwórz kampanię
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'lists' && <EmailLists onUpdate={fetchStats} />}
          {activeTab === 'campaigns' && (
            <EmailCampaigns onUpdate={fetchStats} />
          )}
          {activeTab === 'create' && <CreateCampaign onUpdate={fetchStats} />}
        </div>
      </div>
    </div>
  )
}

