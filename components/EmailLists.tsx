'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Trash2, Mail, Upload, Search, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailList {
  id: string
  name: string
  description: string | null
  _count?: {
    subscribers: number
  }
}

export function EmailLists({ onUpdate }: { onUpdate?: () => void }) {
  const [lists, setLists] = useState<EmailList[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showScrape, setShowScrape] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scrapeProgress, setScrapeProgress] = useState({ current: 0, total: 0 })
  const [targetAudience, setTargetAudience] = useState('')
  const [product, setProduct] = useState('')
  const [minEmails, setMinEmails] = useState(10000)
  const [scrapeAnalysis, setScrapeAnalysis] = useState<any>(null)

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/lists')
      const data = await response.json()
      if (data.lists) {
        setLists(data.lists)
      }
    } catch (error) {
      toast.error('Błąd ładowania list')
    } finally {
      setLoading(false)
    }
  }

  const createList = async () => {
    if (!newListName.trim()) {
      toast.error('Nazwa listy jest wymagana')
      return
    }

    try {
      const response = await fetch('/api/email/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd tworzenia listy')
      }

      toast.success('Lista utworzona pomyślnie!')
      setNewListName('')
      setNewListDescription('')
      setShowCreateForm(false)
      fetchLists()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się utworzyć listy')
    }
  }

  const fetchSubscribers = async (listId: string) => {
    try {
      const response = await fetch(
        `/api/email/subscribers?emailListId=${listId}&status=subscribed`
      )
      const data = await response.json()
      if (data.subscribers) {
        setSubscribers(data.subscribers)
      }
    } catch (error) {
      toast.error('Błąd ładowania subskrybentów')
    }
  }

  const startScraping = async (listId: string) => {
    if (!targetAudience.trim() || !product.trim()) {
      toast.error('Wypełnij grupę docelową i produkt')
      return
    }

    setScraping(true)
    setScrapeProgress({ current: 0, total: 0 })
    toast.loading('AI analizuje grupę docelową i identyfikuje źródła...', {
      id: 'scraping',
    })

    try {
      const response = await fetch('/api/email/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailListId: listId,
          targetAudience,
          product,
          minEmails: parseInt(minEmails.toString()),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd scrapowania')
      }

      setScrapeAnalysis(data.analysis)
      toast.success(
        `Scrapowanie rozpoczęte! AI znalazł ${data.totalSources} źródeł.`,
        { id: 'scraping' }
      )

      // Poll for progress
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/email/scrape?emailListId=${listId}`
          )
          const statusData = await statusRes.json()
          setScrapeProgress({
            current: statusData.scrapedCount || 0,
            total: minEmails,
          })

          if (statusData.scrapedCount >= minEmails) {
            clearInterval(interval)
            setScraping(false)
            toast.success(`Scrapowanie zakończone! Znaleziono ${statusData.scrapedCount} emaili`)
            if (selectedList) {
              fetchSubscribers(selectedList)
            }
            onUpdate?.()
          }
        } catch (error) {
          console.error('Error checking scrape status:', error)
        }
      }, 5000) // Check every 5 seconds

      // Cleanup after 10 minutes
      setTimeout(() => {
        clearInterval(interval)
        if (scraping) {
          setScraping(false)
        }
      }, 600000)
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się rozpocząć scrapowania', {
        id: 'scraping',
      })
      setScraping(false)
    }
  }

  const importSubscribers = async (listId: string) => {
    if (!importText.trim()) {
      toast.error('Wklej emaile do zaimportowania')
      return
    }

    try {
      const response = await fetch('/api/email/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailListId: listId,
          emails: importText,
          source: 'manual_import',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd importowania')
      }

      toast.success(data.message || 'Subskrybenci zaimportowani!')
      setImportText('')
      setShowImport(false)
      if (selectedList) {
        fetchSubscribers(selectedList)
      }
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się zaimportować')
    }
  }

  if (loading && lists.length === 0) {
    return <div className="text-center py-8 text-gray-600">Ładowanie...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Listy mailingowe</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Nowa lista</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-3">Utwórz nową listę</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nazwa listy"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
            <textarea
              placeholder="Opis (opcjonalne)"
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={createList}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Utwórz
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewListName('')
                  setNewListDescription('')
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Brak list mailingowych</p>
          <p className="text-sm text-gray-500 mt-2">
            Utwórz pierwszą listę, aby zacząć
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {list.name}
                  </h3>
                  {list.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {list.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {list._count?.subscribers || 0} subskrybentów
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedList(list.id)
                      setShowScrape(true)
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 transition"
                    title="Scrapuj emaile z internetu (AI)"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedList(list.id)
                      fetchSubscribers(list.id)
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 transition"
                    title="Zarządzaj subskrybentami"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedList(list.id)
                      setShowImport(true)
                    }}
                    className="p-2 text-gray-600 hover:text-primary-600 transition"
                    title="Importuj emaile"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedList === list.id && (
                <div className="mt-4 pt-4 border-t">
                  {showScrape ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center space-x-2">
                          <Sparkles className="h-5 w-5 text-primary-600" />
                          <span>AI Scrapowanie Emaili</span>
                        </h4>
                        <button
                          onClick={() => {
                            setShowScrape(false)
                            setTargetAudience('')
                            setProduct('')
                            setScrapeAnalysis(null)
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Zamknij
                        </button>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>🤖 AI analizuje</strong> grupę docelową, identyfikuje
                          problemy i znajduje najlepsze źródła emaili. Skacze do
                          rzeczywistości z najlepszym rozwiązaniem!
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grupa docelowa *
                          </label>
                          <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="np. Copywriterzy freelancerzy, Właściciele e-commerce, Agencje marketingowe"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            disabled={scraping}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produkt/Rozwiązanie *
                          </label>
                          <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="np. ContentAI Pro - generowanie treści z AI"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            disabled={scraping}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Minimalna liczba emaili
                          </label>
                          <input
                            type="number"
                            value={minEmails}
                            onChange={(e) =>
                              setMinEmails(parseInt(e.target.value) || 10000)
                            }
                            min={1000}
                            max={100000}
                            step={1000}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                            disabled={scraping}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            AI będzie scrapować do osiągnięcia tej liczby
                          </p>
                        </div>

                        {scrapeAnalysis && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h5 className="font-semibold text-green-900 mb-2">
                              📊 Analiza AI:
                            </h5>
                            {scrapeAnalysis.problems?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-green-800">
                                  Problemy:
                                </p>
                                <ul className="text-sm text-green-700 list-disc list-inside">
                                  {scrapeAnalysis.problems.map(
                                    (p: string, i: number) => (
                                      <li key={i}>{p}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                            {scrapeAnalysis.keyMessage && (
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  Kluczowy message:
                                </p>
                                <p className="text-sm text-green-700">
                                  {scrapeAnalysis.keyMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {scraping && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                              <span className="font-semibold text-yellow-900">
                                Scrapowanie w toku...
                              </span>
                            </div>
                            <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-yellow-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${
                                    (scrapeProgress.current /
                                      scrapeProgress.total) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <p className="text-sm text-yellow-800">
                              Znaleziono: {scrapeProgress.current} /{' '}
                              {scrapeProgress.total} emaili
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Emaile są zapisywane na bieżąco do bazy danych
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => startScraping(list.id)}
                          disabled={
                            scraping ||
                            !targetAudience.trim() ||
                            !product.trim()
                          }
                          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {scraping ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Scrapowanie...</span>
                            </>
                          ) : (
                            <>
                              <Search className="h-5 w-5" />
                              <span>Rozpocznij scrapowanie z AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : showImport ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Importuj emaile</h4>
                      <textarea
                        placeholder="Wklej emaile (jeden na linię lub oddzielone przecinkami)"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white font-mono text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => importSubscribers(list.id)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                        >
                          Importuj
                        </button>
                        <button
                          onClick={() => {
                            setShowImport(false)
                            setImportText('')
                          }}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold mb-2">Subskrybenci</h4>
                      {subscribers.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          Brak subskrybentów. Importuj emaile, aby zacząć.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {subscribers.slice(0, 10).map((sub) => (
                            <div
                              key={sub.id}
                              className="text-sm text-gray-700 flex items-center justify-between"
                            >
                              <span>{sub.email}</span>
                              <span className="text-xs text-gray-500">
                                {sub.name || 'Bez imienia'}
                              </span>
                            </div>
                          ))}
                          {subscribers.length > 10 && (
                            <p className="text-xs text-gray-500">
                              ... i {subscribers.length - 10} więcej
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

