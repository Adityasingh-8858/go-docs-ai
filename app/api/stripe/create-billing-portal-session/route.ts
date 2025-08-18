import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { customerId } = await req.json();
  if (!customerId) {
    return new NextResponse('Customer ID is required', { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE_BILLING_PORTAL_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
