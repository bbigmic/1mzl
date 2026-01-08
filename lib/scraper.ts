import * as cheerio from 'cheerio'
import { isValidEmail, extractEmails } from './email'

// Use node-fetch for Node.js environment
let fetchFn: typeof fetch
if (typeof fetch === 'undefined') {
  // @ts-ignore
  fetchFn = require('node-fetch')
} else {
  fetchFn = fetch
}

// Rate limiting for respectful scraping
const scrapeDelays = new Map<string, number>()
const DELAY_BETWEEN_REQUESTS = 2000 // 2 seconds
const MAX_CONCURRENT_SCRAPES = 5

export interface ScrapeSource {
  url: string
  type: 'website' | 'directory' | 'forum' | 'social' | 'job_board'
  priority: number
  description: string
}

export interface ScrapeResult {
  emails: string[]
  source: string
  success: boolean
  error?: string
}

// AI-powered source identification
export async function identifyScrapeSources(
  targetAudience: string,
  product: string,
  openai: any
): Promise<ScrapeSource[]> {
  const prompt = `Jesteś ekspertem od lead generation i email marketing. 

Grupa docelowa: ${targetAudience}
Produkt: ${product}

Zidentyfikuj najlepsze publiczne źródła internetowe, gdzie można znaleźć emaile osób z tej grupy docelowej, które mają problem, który rozwiązuje nasz produkt.

Zwróć listę źródeł w formacie JSON:
[
  {
    "url": "przykładowy URL lub wzorzec",
    "type": "website|directory|forum|social|job_board",
    "priority": 1-10 (10 = najwyższy priorytet),
    "description": "Dlaczego to źródło jest dobre"
  }
]

Skup się na:
- Stronach firm z sekcjami "Kontakt" lub "Zespół"
- Katalogach branżowych
- Forach i społecznościach
- LinkedIn (publiczne profile)
- Stronach z ogłoszeniami o pracę
- Blogach branżowych z autorami

Zwróć TYLKO JSON, bez dodatkowego tekstu.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem od lead generation. Zwracasz TYLKO poprawny JSON bez dodatkowego tekstu.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(response)

    // Handle both array and object with array property
    const sources = Array.isArray(parsed)
      ? parsed
      : parsed.sources || parsed.results || []

    return sources
      .map((source: any) => ({
        url: source.url || source.link || '',
        type: source.type || 'website',
        priority: source.priority || 5,
        description: source.description || source.reason || '',
      }))
      .filter((s: ScrapeSource) => s.url)
      .sort((a: ScrapeSource, b: ScrapeSource) => b.priority - a.priority)
  } catch (error: any) {
    console.error('AI source identification error:', error)
    // Fallback to default sources
    return getDefaultSources(targetAudience)
  }
}

// Default sources based on target audience
function getDefaultSources(targetAudience: string): ScrapeSource[] {
  const sources: ScrapeSource[] = []

  if (targetAudience.toLowerCase().includes('copywriter')) {
    sources.push(
      {
        url: 'https://www.linkedin.com/search/results/people/?keywords=copywriter',
        type: 'social',
        priority: 9,
        description: 'LinkedIn - Copywriterzy',
      },
      {
        url: 'https://www.fiverr.com/categories/writing-translation/copywriting-services',
        type: 'directory',
        priority: 8,
        description: 'Fiverr - Copywriterzy freelancerzy',
      }
    )
  }

  if (targetAudience.toLowerCase().includes('e-commerce') || targetAudience.toLowerCase().includes('sklep')) {
    sources.push(
      {
        url: 'https://www.allegro.pl',
        type: 'directory',
        priority: 7,
        description: 'Allegro - Sprzedawcy',
      }
    )
  }

  // Generic business directories
  sources.push(
    {
      url: 'https://www.goldenpages.pl',
      type: 'directory',
      priority: 6,
      description: 'Golden Pages - Katalog firm',
    },
    {
      url: 'https://www.pkt.pl',
      type: 'directory',
      priority: 5,
      description: 'PKT - Katalog firm',
    }
  )

  return sources
}

// Scrape emails from a single URL
export async function scrapeEmailsFromUrl(
  url: string,
  sourceType: string
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    emails: [],
    source: url,
    success: false,
  }

  try {
    // Respect rate limits
    const domain = new URL(url).hostname
    const lastRequest = scrapeDelays.get(domain) || 0
    const timeSinceLastRequest = Date.now() - lastRequest

    if (timeSinceLastRequest < DELAY_BETWEEN_REQUESTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS - timeSinceLastRequest)
      )
    }

    scrapeDelays.set(domain, Date.now())

    // Fetch the page
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetchFn(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    } as any)

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract emails from text content
    const textContent = $.text()
    const emails = extractEmails(textContent)

    // Also check common email patterns in HTML
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim()
        if (isValidEmail(email)) {
          emails.push(email.toLowerCase())
        }
      }
    })

    // Check contact pages, about pages, team pages
    $('[class*="contact"], [class*="team"], [class*="about"]').each(
      (_, el) => {
        const text = $(el).text()
        const foundEmails = extractEmails(text)
        emails.push(...foundEmails)
      }
    )

    // Remove duplicates and validate
    const uniqueEmails = [...new Set(emails)]
      .map((e) => e.toLowerCase().trim())
      .filter((e) => isValidEmail(e))

    result.emails = uniqueEmails
    result.success = true
  } catch (error: any) {
    result.error = error.message || 'Unknown error'
    console.error(`Scraping error for ${url}:`, error)
  }

  return result
}

// Scrape multiple URLs with concurrency control
export async function scrapeMultipleSources(
  sources: ScrapeSource[],
  onProgress?: (result: ScrapeResult, total: number, current: number) => void
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = []
  const total = sources.length

  // Process in batches to respect rate limits
  const batchSize = MAX_CONCURRENT_SCRAPES

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize)
    const batchPromises = batch.map(
      async (source, index) => {
        const result = await scrapeEmailsFromUrl(source.url, source.type)
        if (onProgress) {
          onProgress(result, total, i + index + 1)
        }
        return result
      }
    )

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Delay between batches
    if (i + batchSize < sources.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS))
    }
  }

  return results
}

// Analyze target audience problems and product fit
export async function analyzeAudienceFit(
  targetAudience: string,
  product: string,
  openai: any
): Promise<{
  problems: string[]
  solution: string
  keyMessage: string
  painPoints: string[]
}> {
  const prompt = `Jesteś ekspertem od marketingu i psychologii konsumenta.

Grupa docelowa: ${targetAudience}
Produkt: ${product}

Przeanalizuj:
1. Jakie są główne problemy/bolączki tej grupy?
2. Jak nasz produkt rozwiązuje te problemy?
3. Jaki jest kluczowy message, który trafi do tej grupy?
4. Jakie są najważniejsze pain points?

Zwróć JSON:
{
  "problems": ["problem1", "problem2"],
  "solution": "jak produkt rozwiązuje",
  "keyMessage": "główny message",
  "painPoints": ["pain1", "pain2"]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem od marketingu. Zwracasz TYLKO poprawny JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const response = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    )

    return {
      problems: response.problems || [],
      solution: response.solution || '',
      keyMessage: response.keyMessage || '',
      painPoints: response.painPoints || [],
    }
  } catch (error: any) {
    console.error('AI analysis error:', error)
    return {
      problems: [],
      solution: '',
      keyMessage: '',
      painPoints: [],
    }
  }
}

