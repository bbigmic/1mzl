'use client'

import { useState, useEffect, useRef } from 'react'
import { formatDate } from '@/lib/utils'
import { FileText, Trash2, ChevronDown, ChevronUp, Copy, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

interface Content {
  id: string
  title: string
  type: string
  content: string
  imageUrl?: string | null
  createdAt: Date
}

interface ContentListProps {
  initialContents?: Content[]
  autoRefresh?: boolean
  refreshInterval?: number
  onRefreshReady?: (refreshFn: () => void) => void
}

export function ContentList({ 
  initialContents = [], 
  autoRefresh = true,
  refreshInterval = 30000,
  onRefreshReady
}: ContentListProps) {
  const [contents, setContents] = useState<Content[]>(initialContents)
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchContents = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/contents?limit=10')
      const data = await response.json()
      if (data.contents) {
        setContents(data.contents)
      }
    } catch (error) {
      if (showLoading) {
        toast.error('Błąd ładowania treści')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch if no initial contents
    if (initialContents.length === 0) {
      fetchContents(true)
    }

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchContents(false)
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [initialContents.length, autoRefresh, refreshInterval])

  // Listen for content generation events
  useEffect(() => {
    const handleContentGenerated = () => {
      fetchContents(false)
    }

    window.addEventListener('contentGenerated', handleContentGenerated)
    return () => {
      window.removeEventListener('contentGenerated', handleContentGenerated)
    }
  }, [])

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => fetchContents(false))
    }
  }, [onRefreshReady])

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę treść?')) return

    try {
      const response = await fetch(`/api/contents?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setContents(contents.filter((c) => c.id !== id))
        setExpandedIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
        toast.success('Treść usunięta')
      } else {
        throw new Error('Błąd usuwania')
      }
    } catch (error) {
      toast.error('Nie udało się usunąć treści')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Skopiowano!')
  }

  const handleGenerateImage = async (contentId: string) => {
    // Check if image already exists
    const content = contents.find((c) => c.id === contentId)
    if (content?.imageUrl) {
      toast('Zdjęcie już zostało wygenerowane', { icon: 'ℹ️' })
      return
    }

    setGeneratingImages((prev) => new Set(prev).add(contentId))
    toast.loading('Generowanie zdjęcia...', { id: `image-${contentId}` })

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Błąd generowania zdjęcia')
      }

      // Update content with new image URL
      setContents((prev) =>
        prev.map((c) =>
          c.id === contentId ? { ...c, imageUrl: result.imageUrl } : c
        )
      )

      toast.success('Zdjęcie wygenerowane pomyślnie!', { id: `image-${contentId}` })
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się wygenerować zdjęcia', {
        id: `image-${contentId}`,
      })
    } finally {
      setGeneratingImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(contentId)
        return newSet
      })
    }
  }

  if (loading && contents.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Ładowanie...</p>
      </div>
    )
  }

  if (contents.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Brak wygenerowanych treści</p>
        <p className="text-sm text-gray-500 mt-2">
          Wygeneruj swoją pierwszą treść!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border divide-y">
      {contents.map((content) => {
        const isExpanded = expandedIds.has(content.id)
        const shouldTruncate = content.content.length > 150

        return (
          <div key={content.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">
                    {content.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(content.createdAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {content.title}
                </h3>
                <div className="text-sm text-gray-600">
                  {isExpanded ? (
                    <p className="whitespace-pre-wrap">{content.content}</p>
                  ) : (
                    <p className={shouldTruncate ? 'line-clamp-2' : ''}>
                      {shouldTruncate
                        ? `${content.content.substring(0, 150)}...`
                        : content.content}
                    </p>
                  )}
                </div>
                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpand(content.id)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                  >
                    <span>{isExpanded ? 'Zwiń' : 'Rozwiń'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Generated Image */}
                {content.imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                    <div className="relative w-full h-64 bg-gray-100">
                      <Image
                        src={content.imageUrl}
                        alt={content.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => handleCopy(content.content)}
                  className="p-2 text-gray-600 hover:text-primary-600 transition"
                  title="Kopiuj treść"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleGenerateImage(content.id)}
                  disabled={generatingImages.has(content.id) || !!content.imageUrl}
                  className={`p-2 transition ${
                    content.imageUrl
                      ? 'text-green-600 cursor-default'
                      : generatingImages.has(content.id)
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                  title={
                    content.imageUrl
                      ? 'Zdjęcie wygenerowane'
                      : generatingImages.has(content.id)
                      ? 'Generowanie...'
                      : 'Generuj mistrzowskie zdjęcie'
                  }
                >
                  {generatingImages.has(content.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleExpand(content.id)}
                  className="p-2 text-gray-600 hover:text-primary-600 transition"
                  title={isExpanded ? 'Zwiń' : 'Rozwiń'}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(content.id)}
                  className="p-2 text-gray-600 hover:text-red-600 transition"
                  title="Usuń"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

