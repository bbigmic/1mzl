'use client'

import { useState, useEffect } from 'react'
import { Mail, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const campaignSchema = z.object({
  emailListId: z.string().min(1, 'Wybierz listę mailingową'),
  name: z.string().min(1, 'Nazwa jest wymagana'),
  subject: z.string().min(1, 'Temat jest wymagany'),
  content: z.string().min(10, 'Treść musi mieć co najmniej 10 znaków'),
})

type CampaignForm = z.infer<typeof campaignSchema>

interface EmailList {
  id: string
  name: string
  _count?: {
    subscribers: number
  }
}

export function CreateCampaign({ onUpdate }: { onUpdate?: () => void }) {
  const [lists, setLists] = useState<EmailList[]>([])
  const [generating, setGenerating] = useState(false)
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
  })

  const content = watch('content')

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/email/lists')
      const data = await response.json()
      if (data.lists) {
        setLists(data.lists.filter((list: EmailList) => 
          (list._count?.subscribers || 0) > 0
        ))
      }
    } catch (error) {
      toast.error('Błąd ładowania list')
    }
  }

  const generateContent = async () => {
    const subject = watch('subject')
    if (!subject) {
      toast.error('Najpierw wpisz temat emaila')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Napisz profesjonalny email marketingowy na temat: ${subject}. Email powinien być perswazyjny, ale nie nachalny. Zawrzyj CTA (call-to-action).`,
          type: 'email',
          options: {
            tone: 'profesjonalny',
            length: 'średnia',
          },
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Błąd generowania')
      }

      setValue('content', result.content.content)
      toast.success('Treść wygenerowana!')
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się wygenerować treści')
    } finally {
      setGenerating(false)
    }
  }

  const onSubmit = async (data: CampaignForm) => {
    setCreating(true)
    try {
      const response = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailListId: data.emailListId,
          name: data.name,
          subject: data.subject,
          content: data.content,
          htmlContent: data.content.replace(/\n/g, '<br>'),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Błąd tworzenia kampanii')
      }

      toast.success('Kampania utworzona! Możesz teraz ją wysłać.')
      // Reset form
      setValue('name', '')
      setValue('subject', '')
      setValue('content', '')
      setValue('emailListId', '')
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się utworzyć kampanii')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Utwórz nową kampanię</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lista mailingowa *
          </label>
          <select
            {...register('emailListId')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            <option value="">Wybierz listę...</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list._count?.subscribers || 0} subskrybentów)
              </option>
            ))}
          </select>
          {errors.emailListId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.emailListId.message}
            </p>
          )}
          {lists.length === 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Najpierw utwórz listę mailingową i dodaj subskrybentów
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nazwa kampanii *
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="np. Newsletter Q1 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temat emaila *
          </label>
          <input
            type="text"
            {...register('subject')}
            placeholder="np. Oszczędź 50% czasu na tworzeniu treści!"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Treść emaila *
            </label>
            <button
              type="button"
              onClick={generateContent}
              disabled={generating || !watch('subject')}
              className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              <span>{generating ? 'Generowanie...' : 'Generuj z AI'}</span>
            </button>
          </div>
          <textarea
            {...register('content')}
            rows={12}
            placeholder="Wpisz treść emaila lub użyj AI, aby wygenerować..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">
              {errors.content.message}
            </p>
          )}
          {content && (
            <p className="mt-1 text-xs text-gray-500">
              {content.split(/\s+/).length} słów
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Wskazówka:</strong> Po utworzeniu kampanii możesz ją
            przejrzeć i wysłać z zakładki "Kampanie". Upewnij się, że masz
            skonfigurowane SMTP w zmiennych środowiskowych.
          </p>
        </div>

        <button
          type="submit"
          disabled={creating || lists.length === 0}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Mail className="h-5 w-5" />
          <span>{creating ? 'Tworzenie...' : 'Utwórz kampanię'}</span>
        </button>
      </form>
    </div>
  )
}

