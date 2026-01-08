'use client'

import { useState, useEffect } from 'react'
import { Send, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  sentAt: string | null
  stats: any
  emailList: {
    name: string
  }
}

export function EmailCampaigns({ onUpdate }: { onUpdate?: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/campaigns')
      const data = await response.json()
      if (data.campaigns) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      toast.error('Błąd ładowania kampanii')
    } finally {
      setLoading(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Czy na pewno chcesz wysłać tę kampanię?')) return

    setSending(campaignId)
    toast.loading('Wysyłanie kampanii...', { id: `send-${campaignId}` })

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd wysyłania')
      }

      toast.success(data.message || 'Kampania wysłana!', {
        id: `send-${campaignId}`,
      })
      fetchCampaigns()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się wysłać kampanii', {
        id: `send-${campaignId}`,
      })
    } finally {
      setSending(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'sending':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />
      case 'draft':
        return <XCircle className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Wysłana'
      case 'sending':
        return 'Wysyłanie...'
      case 'draft':
        return 'Szkic'
      case 'scheduled':
        return 'Zaplanowana'
      default:
        return status
    }
  }

  if (loading && campaigns.length === 0) {
    return <div className="text-center py-8 text-gray-600">Ładowanie...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Kampanie email</h2>

      {campaigns.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Brak kampanii</p>
          <p className="text-sm text-gray-500 mt-2">
            Utwórz pierwszą kampanię
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const stats = campaign.stats || {}
            const openRate =
              stats.opens && stats.sent
                ? ((stats.opens / stats.sent) * 100).toFixed(1)
                : '0'
            const clickRate =
              stats.clicks && stats.sent
                ? ((stats.clicks / stats.sent) * 100).toFixed(1)
                : '0'

            return (
              <div
                key={campaign.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(campaign.status)}
                      <h3 className="font-semibold text-gray-900">
                        {campaign.name}
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {campaign.emailList.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Temat:</strong> {campaign.subject}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <span className="font-semibold">Status:</span>
                        <span>{getStatusText(campaign.status)}</span>
                      </span>
                      {campaign.sentAt && (
                        <span>
                          Wysłana:{' '}
                          {new Date(campaign.sentAt).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                    </div>
                    {stats.sent > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Wysłane</p>
                          <p className="font-semibold text-gray-900">
                            {stats.sent || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Otwarcia</p>
                          <p className="font-semibold text-gray-900">
                            {stats.opens || 0} ({openRate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kliknięcia</p>
                          <p className="font-semibold text-gray-900">
                            {stats.clicks || 0} ({clickRate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Błędy</p>
                          <p className="font-semibold text-red-600">
                            {stats.failed || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => sendCampaign(campaign.id)}
                        disabled={sending === campaign.id}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        <span>
                          {sending === campaign.id ? 'Wysyłanie...' : 'Wyślij'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

