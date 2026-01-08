import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find subscriber by ID (token is subscriber ID)
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { id: token },
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 404 }
      )
    }

    // Unsubscribe
    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
    })

    // Return success page
    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Wypisano z listy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
    }
    h1 { color: #333; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Wypisano z listy</h1>
    <p>Zostałeś pomyślnie wypisany z naszej listy mailingowej.</p>
    <p>Nie będziesz już otrzymywać od nas emaili.</p>
  </div>
</body>
</html>
    `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

