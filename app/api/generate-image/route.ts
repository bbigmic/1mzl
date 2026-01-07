import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateImage } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId } = await req.json()

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // Get content and verify ownership
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        userId: session.user.id,
      },
    })

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found or access denied' },
        { status: 404 }
      )
    }

    // Check if image already exists
    if (content.imageUrl) {
      return NextResponse.json({
        imageUrl: content.imageUrl,
        message: 'Zdjęcie już istnieje',
      })
    }

    // Generate image based on content
    const imageUrl = await generateImage(content.prompt, content.type)

    // Update content with image URL
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: { imageUrl },
    })

    return NextResponse.json({
      imageUrl: updatedContent.imageUrl,
      success: true,
    })
  } catch (error: any) {
    console.error('Generate image error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

