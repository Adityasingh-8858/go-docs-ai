import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { trace } from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.created',
]);

async function handleEvent(event: Stripe.Event) {
    return trace(`stripe.webhook.${event.type}`, async (span) => {
        span?.setAttributes({ eventId: event.id });
        const supabase = getSupabaseAdmin();
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                if (!userId) throw new Error("Missing userId on checkout session metadata");
                span?.setAttribute('userId', userId);

                const subscription = await trace('stripe.retrieveSubscription', () =>
                    stripe.subscriptions.retrieve(session.subscription as string)
                );

                await trace('db.updateUserSubscription', () =>
                    supabase.from('users').update({
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: subscription.customer as string,
                        stripe_price_id: subscription.items.data[0]?.price.id,
                        stripe_current_period_end: new Date(subscription.current_period_end * 1000),
                    }).eq('id', userId)
                );
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                const customer = await trace('stripe.retrieveCustomer', () =>
                    stripe.customers.retrieve(subscription.customer as string) as Promise<Stripe.Customer>
                );
                const userId = customer.metadata.userId;
                if (!userId) throw new Error("Missing userId on customer metadata");
                span?.setAttribute('userId', userId);

                await trace('db.updateUserSubscription', () =>
                    supabase.from('users').update({
                        stripe_subscription_id: subscription.id,
                        stripe_price_id: subscription.items.data[0]?.price.id,
                        stripe_current_period_end: new Date(subscription.current_period_end * 1000),
                    }).eq('id', userId)
                );
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customer = await trace('stripe.retrieveCustomer', () =>
                    stripe.customers.retrieve(subscription.customer as string) as Promise<Stripe.Customer>
                );
                const userId = customer.metadata.userId;
                if (!userId) throw new Error("Missing userId on customer metadata");
                span?.setAttribute('userId', userId);

                await trace('db.clearUserSubscription', () =>
                    supabase.from('users').update({
                        stripe_subscription_id: null,
                        stripe_price_id: null,
                        stripe_current_period_end: null,
                    }).eq('id', userId)
                );
                break;
            }
            default:
                throw new Error(`Unhandled relevant event type: ${event.type}`);
        }
    });
}

export async function POST(req: NextRequest) {
    return trace('api.stripe.webhook', async (span) => {
        const body = await req.text();
        const sig = headers().get('Stripe-Signature');
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !webhookSecret) {
            const error = "Stripe signature or webhook secret is missing.";
            console.error(error);
            Sentry.captureMessage(error, 'error');
            return new NextResponse('Webhook secret not configured', { status: 400 });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
            span?.setAttribute('event.type', event.type);
        } catch (err: any) {
            Sentry.captureException(err, {
                extra: { headers: Object.fromEntries(headers().entries()) }
            });
            console.error(`❌ Webhook signature verification failed:`, { message: err.message });
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
        }

        if (relevantEvents.has(event.type)) {
            try {
                await handleEvent(event);
            } catch (error) {
                Sentry.captureException(error, {
                    extra: { eventId: event.id, eventType: event.type }
                });
                console.error(`Webhook handler for event [${event.type}] failed:`, {
                    message: (error as Error).message,
                    stack: (error as Error).stack,
                });
                return new NextResponse('Webhook handler failed. View logs.', { status: 500 });
            }
        }

        return NextResponse.json({ received: true });
    });
}
