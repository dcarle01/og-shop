// SHOP_src_app_api_webhooks_stripe_route.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Stripe webhook handler for payment events

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { 
  getOrderByStripeSession, 
  updateOrderStatus,
  createDownloadTokens,
  getOrderDownloadTokens,
  getOrderWithItems
} from '@/lib/database';
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import type { Language } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('[Shop Webhook] No signature provided');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('[Shop Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    console.log(`[Shop Webhook] Received event: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Shop Webhook] Payment failed: ${paymentIntent.id}`);
        // Could update order status to failed here
        break;
      }
      
      default:
        console.log(`[Shop Webhook] Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Shop Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Shop Webhook] Processing completed checkout: ${session.id}`);
  
  const order = getOrderByStripeSession(session.id);
  
  if (!order) {
    console.error(`[Shop Webhook] Order not found for session: ${session.id}`);
    return;
  }
  
  // Skip if already processed
  if (order.order_status === 'completed') {
    console.log(`[Shop Webhook] Order ${order.order_reference} already completed`);
    return;
  }
  
  // Verify payment status
  if (session.payment_status !== 'paid') {
    console.log(`[Shop Webhook] Payment not completed: ${session.payment_status}`);
    return;
  }
  
  // Update order status
  const paymentIntent = session.payment_intent as string | null;
  updateOrderStatus(order.id, 'completed', 'paid', paymentIntent || undefined);
  
  // Create download tokens
  const tokens = createDownloadTokens(order.id);
  console.log(`[Shop Webhook] Created ${tokens.length} download tokens for order ${order.order_reference}`);
  
  // Send confirmation email
  try {
    const updatedOrderWithItems = getOrderWithItems(order.id);
    if (updatedOrderWithItems) {
      await sendOrderConfirmationEmail({
        order: updatedOrderWithItems,
        downloadTokens: getOrderDownloadTokens(order.id),
        language: (order.language || 'en') as Language,
      });
      console.log(`[Shop Webhook] Sent confirmation email to ${order.customer_email}`);
    }
  } catch (emailError) {
    console.error('[Shop Webhook] Failed to send confirmation email:', emailError);
    // Don't fail the webhook for email errors
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  console.log(`[Shop Webhook] Checkout expired: ${session.id}`);
  
  const order = getOrderByStripeSession(session.id);
  
  if (!order) {
    console.log(`[Shop Webhook] No order found for expired session: ${session.id}`);
    return;
  }
  
  // Only update if still pending
  if (order.order_status === 'pending') {
    updateOrderStatus(order.id, 'cancelled', 'failed');
    console.log(`[Shop Webhook] Cancelled expired order: ${order.order_reference}`);
  }
}
