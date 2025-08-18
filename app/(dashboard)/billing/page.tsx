import PricingCard from "@/components/billing/PricingCard";
import ManageSubscriptionButton from "@/components/billing/ManageSubscriptionButton";
import { getUserSubscription, plans } from "@/lib/subscriptions";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function BillingPage() {
    const { userId } = auth();
    const userSubscription = await getUserSubscription();

    let stripeCustomerId: string | null = null;
    if(userId) {
        const supabase = getSupabaseAdmin();
        const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).single();
        stripeCustomerId = user?.stripe_customer_id ?? null;
    }


    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Billing & Subscriptions</h1>
            <p className="text-gray-400 mb-8">
                Manage your subscription plan and view pricing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => {
                    const isCurrentPlan = userSubscription.slug === plan.slug;
                    return (
                        <PricingCard
                            key={plan.slug}
                            title={plan.name}
                            description={
                                plan.slug === 'basic' ? "For light, personal use." :
                                plan.slug === 'pro' ? "For power users and professionals." :
                                "For teams and businesses."
                            }
                            price={
                                plan.slug === 'basic' ? "Free" :
                                plan.slug === 'pro' ? "$10" : "$25" // Example prices
                            }
                            features={[
                                `Up to ${plan.quota.PDFS === Infinity ? 'unlimited' : plan.quota.PDFS} PDFs`,
                                `Up to ${plan.quota.PAGES_PER_PDF} pages per PDF`,
                                plan.slug !== 'basic' ? "Advanced AI features" : "Basic AI features",
                                plan.slug === 'plus' ? "Team collaboration" : "Priority support",
                            ]}
                            isCurrentPlan={isCurrentPlan}
                            ctaButton={
                                <ManageSubscriptionButton
                                    userId={userId!}
                                    priceId={plan.priceId!}
                                    isSubscribed={isCurrentPlan && userSubscription.isSubscribed}
                                    stripeCustomerId={stripeCustomerId}
                                />
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
