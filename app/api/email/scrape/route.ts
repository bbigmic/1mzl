import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import {
  identifyScrapeSources,
  scrapeMultipleSources,
  analyzeAudienceFit,
  ScrapeResult,
} from '@/lib/scraper'
import { isValidEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has Pro plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (subscription?.plan !== 'pro' && subscription?.plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Scrapowanie dostępne tylko w planie Pro i Enterprise' },
        { status: 403 }
      )
    }

    const { emailListId, targetAudience, product, minEmails = 10000 } =
      await req.json()

    if (!emailListId || !targetAudience || !product) {
      return NextResponse.json(
        { error: 'emailListId, targetAudience i product są wymagane' },
        { status: 400 }
      )
    }

    // Verify list ownership
    const list = await prisma.emailList.findFirst({
      where: {
        id: emailListId,
        userId: session.user.id,
      },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Email list not found or access denied' },
        { status: 404 }
      )
    }

    // Step 1: AI analyzes audience and identifies sources
    const [audienceAnalysis, sources] = await Promise.all([
      analyzeAudienceFit(targetAudience, product, openai),
      identifyScrapeSources(targetAudience, product, openai),
    ])

    // Step 2: Start scraping (this will be async, return immediately)
    // In production, you'd use a job queue like Bull or similar
    scrapeAndSave(
      emailListId,
      sources,
      minEmails,
      audienceAnalysis,
      session.user.id
    ).catch((error) => {
      console.error('Scraping error:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Scrapowanie rozpoczęte',
      analysis: audienceAnalysis,
      sources: sources.slice(0, 10), // Return first 10 sources
      totalSources: sources.length,
    })
  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Async function to scrape and save emails
async function scrapeAndSave(
  emailListId: string,
  sources: any[],
  minEmails: number,
  analysis: any,
  userId: string
) {
  let totalEmails = 0
  const savedEmails = new Set<string>()

  // Get existing emails to avoid duplicates
  const existing = await prisma.emailSubscriber.findMany({
    where: { emailListId },
    select: { email: true },
  })
  existing.forEach((sub) => savedEmails.add(sub.email.toLowerCase()))

  // Scrape sources
  const results = await scrapeMultipleSources(
    sources,
    async (result: ScrapeResult, total: number, current: number) => {
      // Save emails as we go
      for (const email of result.emails) {
        if (savedEmails.has(email.toLowerCase())) continue
        if (!isValidEmail(email)) continue

        try {
          await prisma.emailSubscriber.create({
            data: {
              emailListId,
              email: email.toLowerCase(),
              status: 'pending', // Will need double opt-in
              source: `scraped_${result.source}`,
              metadata: {
                analysis,
                scrapedAt: new Date().toISOString(),
              },
            },
          })

          savedEmails.add(email.toLowerCase())
          totalEmails++

          // Log progress every 100 emails
          if (totalEmails % 100 === 0) {
            console.log(`Scraped ${totalEmails} emails so far...`)
          }

          // Stop if we reached minimum
          if (totalEmails >= minEmails) {
            console.log(`Reached target of ${minEmails} emails`)
            return
          }
        } catch (error: any) {
          // Skip duplicates and errors
          if (!error.message?.includes('Unique constraint')) {
            console.error(`Error saving email ${email}:`, error.message)
          }
        }
      }
    }
  )

  console.log(`Scraping completed. Total emails: ${totalEmails}`)
  return { totalEmails, results }
}

// Get scraping status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const emailListId = searchParams.get('emailListId')

    if (!emailListId) {
      return NextResponse.json(
        { error: 'emailListId is required' },
        { status: 400 }
      )
    }

    // Get count of scraped emails
    const scrapedCount = await prisma.emailSubscriber.count({
      where: {
        emailListId,
        source: {
          startsWith: 'scraped_',
        },
      },
    })

    return NextResponse.json({
      scrapedCount,
      status: 'completed', // In production, track actual status
    })
  } catch (error: any) {
    console.error('Get scrape status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

