import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { trace } from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
    return trace('api.stripe.create-billing-portal-session', async (span) => {
        try {
            const { userId } = auth();
            if (!userId) {
                return new NextResponse('Unauthorized', { status: 401 });
            }
            span?.setAttribute('userId', userId);

            const { customerId } = await req.json();
            if (!customerId) {
                return new NextResponse('Customer ID is required', { status: 400 });
            }
            span?.setAttribute('customerId', customerId);

            const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

            const session = await trace('stripe.createBillingPortalSession', () =>
                stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: `${appUrl}/billing`,
                })
            );

            return NextResponse.json({ url: session.url });
        } catch (error) {
            Sentry.captureException(error);
            console.error('[STRIPE_BILLING_PORTAL_ERROR]', error);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    });
}
