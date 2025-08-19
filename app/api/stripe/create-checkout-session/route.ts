import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserSubscription } from "@/lib/subscriptions";
import { trace } from "@/lib/sentry";
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
    return trace('api.stripe.create-checkout-session', async (span) => {
        try {
            const { userId } = auth();
            const { priceId } = await req.json();
            span?.setAttributes({ userId, priceId });

            if (!userId) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            if (!priceId) {
                return new NextResponse("Price ID is required", { status: 400 });
            }

            const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
            const supabase = getSupabaseAdmin();

            const { data: user } = await trace('db.getUserStripeInfo', () =>
                supabase
                    .from('users')
                    .select('stripe_customer_id, stripe_subscription_id, stripe_price_id')
                    .eq('id', userId)
                    .single()
            );

            if (!user) {
                return new NextResponse("User not found", { status: 404 });
            }

            const subscription = await getUserSubscription();
            if (subscription.isSubscribed && user.stripe_customer_id) {
                const stripeSession = await trace('stripe.createBillingPortalSession', () =>
                    stripe.billingPortal.sessions.create({
                        customer: user.stripe_customer_id!,
                        return_url: `${appUrl}/billing`,
                    })
                );
                return NextResponse.json({ url: stripeSession.url });
            }

            let stripeCustomerId = user.stripe_customer_id;
            if (!stripeCustomerId) {
                const clerkUser = await auth();
                const customer = await trace('stripe.createCustomer', () =>
                    stripe.customers.create({
                        email: clerkUser.user?.emailAddresses[0].emailAddress,
                        name: clerkUser.user?.fullName || undefined,
                        metadata: { userId },
                    })
                );
                stripeCustomerId = customer.id;
                await trace('db.updateUserStripeCustomerId', () =>
                    supabase
                        .from('users')
                        .update({ stripe_customer_id: stripeCustomerId })
                        .eq('id', userId)
                );
            }

            const checkoutSession = await trace('stripe.createCheckoutSession', () =>
                stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    payment_method_types: ["card"],
                    mode: "subscription",
                    line_items: [{ price: priceId, quantity: 1 }],
                    metadata: { userId },
                    success_url: `${appUrl}/dashboard?payment=success`,
                    cancel_url: `${appUrl}/billing`,
                })
            );

            return NextResponse.json({ url: checkoutSession.url });

        } catch (error) {
            Sentry.captureException(error);
            console.error("[STRIPE_CHECKOUT_ERROR]", {
                message: (error as Error).message,
                stack: (error as Error).stack,
            });
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    });
}
