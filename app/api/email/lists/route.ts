import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

    const lists = await prisma.emailList.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            subscribers: {
              where: { status: 'subscribed' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ lists })
  } catch (error: any) {
    console.error('Get email lists error:', error)
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

    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const list = await prisma.emailList.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
      },
    })

    return NextResponse.json({ list })
  } catch (error: any) {
    console.error('Create email list error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

