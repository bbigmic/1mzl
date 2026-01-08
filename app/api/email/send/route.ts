import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendEmail,
  generateEmailTemplate,
  generateTrackingId,
  checkRateLimit,
  recordEmailSent,
} from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await req.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Get campaign and verify ownership
    const campaign = await prisma.emailCampaign.findFirst({
      where: {
        id: campaignId,
        userId: session.user.id,
      },
      include: {
        emailList: {
          include: {
            subscribers: {
              where: { status: 'subscribed' },
            },
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Campaign already sent or is being sent' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        {
          error:
            'Osiągnięto limit wysyłki. Spróbuj ponownie za godzinę lub rozważ upgrade do Enterprise.',
        },
        { status: 429 }
      )
    }

    const subscribers = campaign.emailList.subscribers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending', sentAt: new Date() },
    })

    // Send emails in background (you might want to use a queue system for production)
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const subscriber of subscribers) {
      try {
        const trackingId = generateTrackingId()
        const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?token=${subscriber.id}`

        const { html, text } = generateEmailTemplate(
          campaign.subject,
          campaign.htmlContent || campaign.content,
          unsubscribeUrl,
          trackingId,
          baseUrl
        )

        await sendEmail(subscriber.email, campaign.subject, html, text)

        // Create email record
        await prisma.email.create({
          data: {
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            to: subscriber.email,
            subject: campaign.subject,
            status: 'sent',
            sentAt: new Date(),
            trackingId,
          },
        })

        recordEmailSent(session.user.id)
        results.sent++
      } catch (error: any) {
        console.error(`Failed to send to ${subscriber.email}:`, error)
        results.failed++
        results.errors.push(`${subscriber.email}: ${error.message}`)

        // Create failed email record
        await prisma.email.create({
          data: {
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            to: subscriber.email,
            subject: campaign.subject,
            status: 'failed',
            bounceReason: error.message,
            trackingId: generateTrackingId(),
          },
        })
      }
    }

    // Update campaign status and stats
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        stats: {
          sent: results.sent,
          failed: results.failed,
          total: subscribers.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `Wysłano ${results.sent} z ${subscribers.length} emaili`,
    })
  } catch (error: any) {
    console.error('Send campaign error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

