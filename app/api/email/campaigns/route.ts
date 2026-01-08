import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, recordEmailSent } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId: session.user.id },
      include: {
        emailList: {
          select: { name: true },
        },
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { emailListId, name, subject, content, htmlContent, scheduledAt } =
      await req.json()

    if (!emailListId || !name || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const campaign = await prisma.emailCampaign.create({
      data: {
        userId: session.user.id,
        emailListId,
        name,
        subject,
        content,
        htmlContent: htmlContent || content,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    })

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

