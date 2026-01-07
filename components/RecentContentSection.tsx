'use client'

import { useState, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { ContentList } from './ContentList'

interface Content {
  id: string
  title: string
  type: string
  content: string
  imageUrl?: string | null
  createdAt: Date
}

interface RecentContentSectionProps {
  initialContents: Content[]
}

export function RecentContentSection({ initialContents }: RecentContentSectionProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshFnRef = useRef<(() => void) | null>(null)

  const handleRefresh = async () => {
    if (refreshFnRef.current) {
      setIsRefreshing(true)
      try {
        await new Promise<void>((resolve) => {
          refreshFnRef.current?.()
          // Wait a bit for the refresh to complete
          setTimeout(resolve, 500)
        })
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Ostatnie treści
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Odśwież listę"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <ContentList 
        initialContents={initialContents}
        onRefreshReady={(fn) => {
          refreshFnRef.current = fn
        }}
      />
    </div>
  )
}

