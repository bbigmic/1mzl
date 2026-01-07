'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const formSchema = z.object({
  prompt: z.string().min(10, 'Prompt musi mieć co najmniej 10 znaków'),
  type: z.enum(['article', 'post', 'product', 'email', 'ad']),
  tone: z.string().optional(),
  length: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ContentGenerator() {
  const { data: session, status } = useSession()
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: FormData) => {
    // Check if user is logged in
    if (!session) {
      toast.error('Musisz być zalogowany, aby generować treści')
      window.location.href = '/api/auth/signin'
      return
    }

    setIsGenerating(true)
    setGeneratedContent('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt,
          type: data.type,
          options: {
            tone: data.tone,
            length: data.length,
          },
        }),
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 401) {
          toast.error('Musisz być zalogowany, aby generować treści')
          window.location.href = '/api/auth/signin'
          return
        }
        const text = await response.text()
        throw new Error('Otrzymano nieprawidłową odpowiedź z serwera')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Błąd generowania')
      }

      setGeneratedContent(result.content.content)
      toast.success('Treść wygenerowana pomyślnie!')
    } catch (error: any) {
      if (error.message && !error.message.includes('JSON')) {
        toast.error(error.message || 'Nie udało się wygenerować treści')
      } else {
        toast.error('Nie udało się wygenerować treści. Sprawdź połączenie z serwerem.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    toast.success('Skopiowano do schowka!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Show login prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">
            Musisz być zalogowany, aby generować treści
          </p>
          <Link
            href="/api/auth/signin"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-block"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Typ treści
          </label>
          <select
            {...register('type')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="article">Artykuł blogowy</option>
            <option value="post">Post na social media</option>
            <option value="product">Opis produktu</option>
            <option value="email">Email marketingowy</option>
            <option value="ad">Reklama</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt / Temat
          </label>
          <textarea
            {...register('prompt')}
            rows={4}
            placeholder="Opisz, jaką treść chcesz wygenerować..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
          />
          {errors.prompt && (
            <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ton
            </label>
            <select
              {...register('tone')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="">Domyślny</option>
              <option value="profesjonalny">Profesjonalny</option>
              <option value="przyjazny">Przyjazny</option>
              <option value="humorystyczny">Humorystyczny</option>
              <option value="perswazyjny">Perswazyjny</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Długość
            </label>
            <select
              {...register('length')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="">Domyślna</option>
              <option value="krótka">Krótka</option>
              <option value="średnia">Średnia</option>
              <option value="długa">Długa</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-5 w-5 animate-spin" />
              <span>Generowanie...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Generuj treść</span>
            </>
          )}
        </button>
      </form>

      {generatedContent && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Wygenerowana treść
            </h3>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Skopiowano!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Kopiuj</span>
                </>
              )}
            </button>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {generatedContent}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

