import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { syncUserToCustomerIo, sendCustomerIoEvent, CustomerIoEvents, buildUserPayload } from "@/lib/customerio"

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`)

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdate(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaid(invoice)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentFailed(invoice)
      break
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!prisma) return

  const userId = BigInt(session.metadata?.userId!)
  const planIdentifier = session.metadata?.planIdentifier!

  console.log(`[Stripe] Checkout completed for user ${userId}, plan: ${planIdentifier}`)

  if (!session.subscription) {
    console.error('[Stripe] No subscription in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  // Check if subscription already exists
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeId: subscription.id }
  })

  if (existingSub) {
    console.log('[Stripe] Subscription already exists, updating...')
    await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        stripeStatus: subscription.status,
        stripePlan: subscription.items.data[0].price.id,
      }
    })
  } else {
    // Create new subscription
    await prisma.subscription.create({
      data: {
        userId,
        name: planIdentifier,
        stripeId: subscription.id,
        stripeStatus: subscription.status,
        stripePlan: subscription.items.data[0].price.id,
        quantity: subscription.items.data[0].quantity ?? 1,
        trialEndsAt: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
        endsAt: null,
      }
    })
  }

  // Update user credits based on plan
  const plan = await prisma.plan.findUnique({
    where: { identifier: planIdentifier }
  })

  if (plan) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        balanceGenerateProduct: plan.limitGenerateProduct,
        balanceVideoGeneration: plan.limitVideoGeneration,
        balanceImageGeneration: plan.limitImageGeneration,
        balanceProductExporter: plan.limitProductExporter,
        nextCreditRenewalAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      }
    })
    console.log(`[Stripe] Updated credits for user ${userId}`)

    // Send 'subscribed' event to Customer.io
    sendCustomerIoEvent(Number(userId), CustomerIoEvents.SUBSCRIBED, {
      plan_identifier: planIdentifier,
      plan_name: plan.title,
      plan_price: plan.price,
    }).catch(err => {
      console.error('[Stripe] Customer.io event error:', err);
    });

    // Sync user to Customer.io with updated subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (user) {
      const customerIoPayload = await buildUserPayload({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lang: user.lang,
        lastLogin: user.lastLogin,
        shopifyDomain: user.shopifyDomain,
        shopifySetupCompleted: user.shopifySetupCompleted,
      }, {
        activePlan: { identifier: planIdentifier, title: plan.title },
        subscriptionStartDate: new Date(),
      });
      syncUserToCustomerIo(customerIoPayload).catch(err => {
        console.error('[Stripe] Customer.io sync error:', err);
      });
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  if (!prisma) return

  console.log(`[Stripe] Subscription updated: ${subscription.id}, status: ${subscription.status}`)

  const existingSub = await prisma.subscription.findUnique({
    where: { stripeId: subscription.id }
  })

  if (!existingSub) {
    console.log('[Stripe] Subscription not found in database, skipping update')
    return
  }

  await prisma.subscription.update({
    where: { stripeId: subscription.id },
    data: {
      stripeStatus: subscription.status,
      stripePlan: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity ?? 1,
      trialEndsAt: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null,
      endsAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
    }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!prisma) return

  console.log(`[Stripe] Subscription deleted: ${subscription.id}`)

  await prisma.subscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      stripeStatus: 'canceled',
      endsAt: new Date(),
    }
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!prisma) return

  console.log(`[Stripe] Invoice paid: ${invoice.id}`)

  const userId = await getUserIdFromCustomer(invoice.customer as string)
  
  if (!userId) {
    console.error('[Stripe] Could not find user for invoice')
    return
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: { stripeId: invoice.id }
  })

  if (existingInvoice) {
    console.log('[Stripe] Invoice already exists, skipping')
    return
  }

  await prisma.invoice.create({
    data: {
      userId,
      stripeId: invoice.id,
      amountPaid: (invoice.amount_paid / 100),
      currency: invoice.currency,
      status: invoice.status ?? 'paid',
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    }
  })

  // If this is a renewal invoice (not the first payment), renew credits
  if (invoice.billing_reason === 'subscription_cycle') {
    const sub = await prisma.subscription.findFirst({
      where: { 
        userId,
        stripeStatus: 'active'
      }
    })

    if (sub) {
      // Fetch plan by subscription name (which is the plan identifier)
      const plan = await prisma.plan.findUnique({
        where: { identifier: sub.name }
      })

      if (plan) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            balanceGenerateProduct: plan.limitGenerateProduct,
            balanceVideoGeneration: plan.limitVideoGeneration,
            balanceImageGeneration: plan.limitImageGeneration,
            balanceProductExporter: plan.limitProductExporter,
            nextCreditRenewalAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        })
        console.log(`[Stripe] Renewed credits for user ${userId}`)
      }
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`[Stripe] Payment failed for invoice: ${invoice.id}`)
  
  // TODO: Send email notification to user about failed payment
  const userId = await getUserIdFromCustomer(invoice.customer as string)
  if (userId) {
    console.log(`[Stripe] Payment failed for user ${userId}`)
    // Could update user status or send notification
  }
}

async function getUserIdFromCustomer(customerId: string): Promise<bigint | null> {
  if (!prisma) return null

  const user = await prisma.user.findFirst({
    where: { stripeId: customerId },
    select: { id: true }
  })
  return user?.id ?? null
}
