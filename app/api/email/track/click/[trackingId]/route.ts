import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const email = await prisma.email.findUnique({
      where: { trackingId },
    })

    if (email) {
      const updateData: any = {
        status: 'clicked',
      }

      if (!email.clickedAt) {
        updateData.clickedAt = new Date()
      }

      await prisma.email.update({
        where: { id: email.id },
        data: updateData,
      })

      // Update campaign stats
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: email.campaignId },
      })

      if (campaign?.stats) {
        const stats = campaign.stats as any
        await prisma.emailCampaign.update({
          where: { id: email.campaignId },
          data: {
            stats: {
              ...stats,
              clicks: (stats.clicks || 0) + 1,
            },
          },
        })
      }
    }

    // Redirect to original URL
    redirect(url)
  } catch (error) {
    // Redirect even on error
    const url = new URL(req.url).searchParams.get('url')
    if (url) {
      redirect(url)
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

