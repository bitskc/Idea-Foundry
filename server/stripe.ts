import Stripe from 'stripe';

// Ensure STRIPE_SECRET_KEY is present or warn
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;

/**
 * Creates a Stripe Checkout session for a subscription
 */
export async function createCheckoutSession(customerId: string, returnUrl: string, userId: string) {
  if (!STRIPE_PRO_PRICE_ID) {
    throw new Error("STRIPE_PRO_PRICE_ID is not set");
  }

  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    allow_promotion_codes: true,
  });
}

/**
 * Creates a Billing Portal session for a customer to manage their subscription
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Gets an existing Stripe customer by email or creates a new one
 */
export async function getOrCreateCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  // 1. Search by email
  const existingCustomers = await stripe.customers.list({ 
    email: email, 
    limit: 1 
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // 2. Create new if not found
  return await stripe.customers.create({
    email,
    name,
  });
}
