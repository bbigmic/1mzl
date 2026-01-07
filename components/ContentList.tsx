'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import { FileText, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  type: string
  content: string
  createdAt: Date
}

interface ContentListProps {
  initialContents?: Content[]
}

export function ContentList({ initialContents = [] }: ContentListProps) {
  const [contents, setContents] = useState<Content[]>(initialContents)
  const [loading, setLoading] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const fetchContents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contents?limit=10')
      const data = await response.json()
      if (data.contents) {
        setContents(data.contents)
      }
    } catch (error) {
      toast.error('Błąd ładowania treści')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialContents.length === 0) {
      fetchContents()
    }
  }, [initialContents.length])

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
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleCopy(content.content)}
                  className="p-2 text-gray-600 hover:text-primary-600 transition"
                  title="Kopiuj"
                >
                  <Copy className="h-4 w-4" />
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

