import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from './supabase';

// Define your subscription plans and their limits here
export const plans = [
    {
        name: "Basic",
        slug: "basic",
        priceId: null, // Free plan has no price ID
        quota: {
            PDFS: 5,
            PAGES_PER_PDF: 25,
        },
    },
    {
        name: "Pro",
        slug: "pro",
        priceId: process.env.STRIPE_PRO_PRICE_ID!,
        quota: {
            PDFS: 50,
            PAGES_PER_PDF: 200,
        },
    },
    {
        name: "Plus",
        slug: "plus",
        priceId: process.env.STRIPE_PLUS_PRICE_ID!,
        quota: {
            PDFS: Infinity, // Or a very high number
            PAGES_PER_PDF: 4000,
        },
    },
];

export async function getUserSubscription() {
    const session = auth();
    const userId = session.userId;
    if (!userId) {
        return { ...plans[0], isSubscribed: false, isCanceled: false }; // Default to Basic plan if no user
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
        .from('users')
        .select('stripe_price_id, stripe_current_period_end, stripe_subscription_id')
        .eq('id', userId)
        .single();

    if (error || !user) {
        console.error("Could not find user subscription data:", error?.message);
        return { ...plans[0], isSubscribed: false, isCanceled: false }; // Default to Basic plan on error
    }

    const isSubscribed = Boolean(
        user.stripe_price_id &&
        user.stripe_current_period_end &&
        new Date(user.stripe_current_period_end).getTime() + 86_400_000 > Date.now()
    );

    const plan = isSubscribed
        ? plans.find((p) => p.priceId === user.stripe_price_id)
        : plans[0];

    if (!plan) {
        return { ...plans[0], isSubscribed: false, isCanceled: false }; // Fallback to basic
    }

    // Check if the subscription is active but has been canceled (will not renew)
    let isCanceled = false;
    if(isSubscribed && user.stripe_subscription_id) {
        // Here you might need a direct Stripe API call to check `cancel_at_period_end`
        // For simplicity, we'll assume this logic is handled on webhook updates.
        // Or you can add a `stripe_subscription_status` column to your db.
    }

    return {
        ...plan,
        isSubscribed,
        isCanceled,
    };
}

// This new function can be called from server-side processes without a live user session
export async function getSubscriptionForUser(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
        .from('users')
        .select('stripe_price_id, stripe_current_period_end')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return { ...plans[0], isSubscribed: false }; // Default to Basic plan on error
    }

    const isSubscribed = Boolean(
        user.stripe_price_id &&
        user.stripe_current_period_end &&
        new Date(user.stripe_current_period_end).getTime() + 86_400_000 > Date.now()
    );

    const plan = isSubscribed
        ? plans.find((p) => p.priceId === user.stripe_price_id)
        : plans[0];

    if (!plan) {
        return { ...plans[0], isSubscribed: false }; // Fallback to basic
    }

    return {
        ...plan,
        isSubscribed,
    };
}


export async function checkUploadLimits() {
    const session = auth();
    const userId = session.userId;
    if (!userId) {
        return { hasReachedLimit: true, currentCount: 0, limit: 0 };
    }

    const subscription = await getUserSubscription();

    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error("Error counting user documents:", error.message);
        return { hasReachedLimit: true, currentCount: 0, limit: subscription.quota.PDFS };
    }

    return {
        hasReachedLimit: count! >= subscription.quota.PDFS,
        currentCount: count || 0,
        limit: subscription.quota.PDFS,
    };
}
