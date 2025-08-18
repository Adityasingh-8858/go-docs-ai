import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserSubscription } from "@/lib/subscriptions";

export async function POST(req: NextRequest) {
    const { userId } = auth();
    const { priceId } = await req.json();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!priceId) {
        return new NextResponse("Price ID is required", { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const supabase = getSupabaseAdmin();

    try {
        // Check if user already has an active subscription
        const subscription = await getUserSubscription();
        if (subscription.isSubscribed && subscription.priceId === priceId) {
            // User is already subscribed to this plan, redirect to billing portal
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: (await supabase.from('users').select('stripe_customer_id').eq('id', userId).single()).data?.stripe_customer_id!,
                return_url: `${appUrl}/billing`,
            });
            return NextResponse.json({ url: stripeSession.url });
        }

        // Get user profile to find/create stripe customer
        const { data: user, error } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let stripeCustomerId = user.stripe_customer_id;
        // If user is not a stripe customer yet, create one
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: (await auth()).user?.emailAddresses[0].emailAddress,
                name: (await auth()).user?.fullName || undefined,
                metadata: {
                    userId: userId,
                },
            });
            stripeCustomerId = customer.id;
            // Save the new customer id to our database
            await supabase
                .from('users')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', userId);
        }

        // Create the checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
            },
            success_url: `${appUrl}/dashboard?payment=success`,
            cancel_url: `${appUrl}/billing?payment=cancelled`,
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error("[STRIPE_CHECKOUT_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
