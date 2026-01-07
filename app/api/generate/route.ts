import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateContent } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, type, options } = await req.json()

    if (!prompt || !type) {
      return NextResponse.json(
        { error: 'Prompt and type are required' },
        { status: 400 }
      )
    }

    // Check user subscription and limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    const plan = subscription?.plan || 'free'
    const planLimits = PLANS[plan as keyof typeof PLANS]

    // Count user's content generations today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayContentCount = await prisma.content.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
    })

    if (
      planLimits.limits.generations !== -1 &&
      todayContentCount >= planLimits.limits.generations
    ) {
      return NextResponse.json(
        {
          error: 'Osiągnięto dzienny limit generacji. Rozważ upgrade do planu Pro.',
        },
        { status: 403 }
      )
    }

    // Generate content
    const content = await generateContent(prompt, type, options)

    // Save to database
    const savedContent = await prisma.content.create({
      data: {
        userId: session.user.id,
        title: prompt.substring(0, 100),
        type,
        prompt,
        content,
        metadata: {
          tone: options?.tone,
          length: options?.length,
          language: options?.language,
          wordCount: content.split(/\s+/).length,
        },
      },
    })

    return NextResponse.json({ content: savedContent })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

