import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2024-06-20', // Use the latest API version
  typescript: true,
});
