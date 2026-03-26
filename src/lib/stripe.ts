// SHOP_src_lib_stripe.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Stripe server-side configuration and helpers

import Stripe from 'stripe';

// ============================================================================
// STRIPE INSTANCE
// ============================================================================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// ============================================================================
// CONSTANTS
// ============================================================================

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const SHOP_SUCCESS_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`
  : 'https://shop.opengateways.com/confirmation?session_id={CHECKOUT_SESSION_ID}';

export const SHOP_CANCEL_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`
  : 'https://shop.opengateways.com/checkout';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Get Stripe checkout session with line items
 */
export async function getSessionWithLineItems(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

/**
 * Create Stripe checkout session for cart items
 */
export async function createCheckoutSession(params: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  customerEmail: string;
  metadata: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const { lineItems, customerEmail, metadata } = params;
  
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: customerEmail,
    metadata,
    success_url: SHOP_SUCCESS_URL,
    cancel_url: SHOP_CANCEL_URL,
    billing_address_collection: 'auto',
    // Allow promotion codes if configured
    allow_promotion_codes: process.env.STRIPE_ALLOW_PROMO_CODES === 'true',
  });
}

/**
 * Format cart item for Stripe line item
 */
export function formatLineItem(
  name: string,
  priceInCents: number,
  quantity: number = 1,
  currency: string = 'usd'
): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency,
      unit_amount: Math.round(priceInCents),
      product_data: {
        name,
      },
    },
    quantity,
  };
}

/**
 * Retrieve payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Issue a refund
 */
export async function createRefund(
  paymentIntentId: string,
  amountInCents?: number
): Promise<Stripe.Refund> {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };
  
  if (amountInCents) {
    params.amount = amountInCents;
  }
  
  return stripe.refunds.create(params);
}
