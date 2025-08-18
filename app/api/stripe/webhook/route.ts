import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.created',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('Stripe-Signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Stripe signature or webhook secret is missing.");
    return new NextResponse('Webhook secret not configured', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = getSupabaseAdmin();
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (!session.metadata?.userId) {
            throw new Error("Missing userId on checkout session metadata");
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              stripe_price_id: subscription.items.data[0]?.price.id,
              stripe_current_period_end: new Date(subscription.current_period_end * 1000),
            })
            .eq('id', session.metadata.userId);
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const userId = customer.metadata.userId;
          if(!userId) {
            throw new Error("Missing userId on customer metadata");
          }

          await supabase
            .from('users')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              stripe_current_period_end: new Date(subscription.current_period_end * 1000),
            })
            .eq('id', userId);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const userId = customer.metadata.userId;
          if(!userId) {
            throw new Error("Missing userId on customer metadata");
          }

          await supabase
            .from('users')
            .update({
              stripe_subscription_id: null,
              stripe_price_id: null,
              stripe_current_period_end: null,
            })
            .eq('id', userId);
          break;
        }
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.error('Webhook handler failed.', error);
      return new NextResponse('Webhook handler failed. View logs.', { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
