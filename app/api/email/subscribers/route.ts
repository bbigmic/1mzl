import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidEmail, extractEmails } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

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
        { error: 'Email marketing dostępny tylko w planie Pro i Enterprise' },
        { status: 403 }
      )
    }

    const { emailListId, emails, names, source } = await req.json()

    if (!emailListId) {
      return NextResponse.json(
        { error: 'Email list ID is required' },
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

    // Process emails - support both single email and bulk import
    let emailArray: string[] = []
    if (typeof emails === 'string') {
      // If it's a string, try to extract emails
      emailArray = extractEmails(emails)
    } else if (Array.isArray(emails)) {
      emailArray = emails
    } else {
      return NextResponse.json(
        { error: 'Invalid emails format' },
        { status: 400 }
      )
    }

    // Validate and add subscribers
    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < emailArray.length; i++) {
      const email = emailArray[i].toLowerCase().trim()
      const name = names?.[i] || null

      if (!isValidEmail(email)) {
        results.errors.push(`Invalid email: ${email}`)
        results.skipped++
        continue
      }

      try {
        // Check if already exists
        const existing = await prisma.emailSubscriber.findUnique({
          where: {
            emailListId_email: {
              emailListId,
              email,
            },
          },
        })

        if (existing) {
          results.skipped++
          continue
        }

        // Create subscriber with pending status (double opt-in)
        await prisma.emailSubscriber.create({
          data: {
            emailListId,
            email,
            name,
            status: 'pending',
            source: source || 'manual',
          },
        })

        results.added++
      } catch (error: any) {
        results.errors.push(`Error adding ${email}: ${error.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Dodano ${results.added} subskrybentów, pominięto ${results.skipped}`,
    })
  } catch (error: any) {
    console.error('Add subscribers error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const emailListId = searchParams.get('emailListId')
    const status = searchParams.get('status')

    if (!emailListId) {
      return NextResponse.json(
        { error: 'Email list ID is required' },
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

    const where: any = { emailListId }
    if (status) {
      where.status = status
    }

    const subscribers = await prisma.emailSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit for performance
    })

    return NextResponse.json({ subscribers })
  } catch (error: any) {
    console.error('Get subscribers error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

