import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover' as any,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && plan && session.subscription) {
          // Pobierz subskrypcję, aby uzyskać price_id
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          const priceId = subscription.items.data[0]?.price.id

          await prisma.subscription.update({
            where: { userId },
            data: {
              plan,
              status: 'active',
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId,
            },
          })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          if (event.type === 'customer.subscription.deleted') {
            await prisma.subscription.update({
              where: { id: dbSubscription.id },
              data: {
                plan: 'free',
                status: 'canceled',
                stripeSubscriptionId: null,
              },
            })
          } else {
            // W nowszej wersji API Stripe, current_period_end jest dostępne bezpośrednio w obiekcie subscription z webhook
            const periodEnd = (subscription as any).current_period_end
            await prisma.subscription.update({
              where: { id: dbSubscription.id },
              data: {
                status: subscription.status,
                stripeCurrentPeriodEnd: periodEnd
                  ? new Date(periodEnd * 1000)
                  : null,
              },
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

