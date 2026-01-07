'use client'

import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface PricingCardProps {
  name: string
  price: number
  description: string
  features: string[]
  plan: 'free' | 'pro' | 'enterprise'
  currentPlan?: string
}

export function PricingCard({
  name,
  price,
  description,
  features,
  plan,
  currentPlan,
}: PricingCardProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!session) {
      toast.error('Musisz się najpierw zalogować')
      return
    }

    if (plan === 'free') {
      toast.error('Już korzystasz z planu Free')
      return
    }

    if (currentPlan === plan) {
      toast.error('Już masz ten plan')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Błąd tworzenia sesji płatności')
      }
    } catch (error: any) {
      toast.error(error.message || 'Błąd podczas subskrypcji')
    } finally {
      setLoading(false)
    }
  }

  const isCurrentPlan = currentPlan === plan
  const isPopular = plan === 'pro'

  return (
    <div
      className={`relative p-8 bg-white rounded-2xl border-2 ${
        isPopular
          ? 'border-primary-500 shadow-xl scale-105'
          : 'border-gray-200'
      } ${isCurrentPlan ? 'ring-2 ring-primary-300' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Najpopularniejsze
          </span>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          {price > 0 && (
            <span className="text-gray-600 ml-2">zł/mies.</span>
          )}
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          isCurrentPlan
            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
            : isPopular
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {loading
          ? 'Przekierowywanie...'
          : isCurrentPlan
          ? 'Twój obecny plan'
          : price === 0
          ? 'Zacznij za darmo'
          : 'Wybierz plan'}
      </button>
    </div>
  )
}

