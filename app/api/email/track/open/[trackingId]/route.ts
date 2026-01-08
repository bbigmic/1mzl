import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const { trackingId } = params

    const email = await prisma.email.findUnique({
      where: { trackingId },
    })

    if (email && !email.openedAt) {
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: 'opened',
          openedAt: new Date(),
        },
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
              opens: (stats.opens || 0) + 1,
            },
          },
        })
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    // Return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
      },
    })
  }
}

