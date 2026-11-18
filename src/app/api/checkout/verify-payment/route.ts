// SHOP_src_app_api_checkout_verify-payment_route.ts
// Version: 1.0.3 | Created: 2026-01-28 | Last Modified: 2026-11-18 | Author: Open Gateways Team
// Description: Verify payment and return order details with download links

import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithLineItems } from '@/lib/stripe';
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
    const { session_id, language } = await request.json();
    // Customer-facing messages below follow the shopper's language.
    const es = language === 'es';
    
    if (!session_id) {
      return NextResponse.json(
        { success: false, error: es ? 'Falta la referencia del pago.' : 'The payment reference is missing.' },
        { status: 400 }
      );
    }
    
    // Get Stripe session
    const session = await getSessionWithLineItems(session_id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: es ? 'No encontramos este pago.' : "We couldn't find this payment." },
        { status: 404 }
      );
    }
    
    // Get order from database
    const order = getOrderByStripeSession(session_id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: es ? 'No encontramos el pedido de este pago.' : "We couldn't find the order for this payment." },
        { status: 404 }
      );
    }
    
    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: es
          ? 'Tu pago aún no se ha completado. Si ya pagaste, espera unos minutos y vuelve a cargar esta página.'
          : "Your payment hasn't been completed yet. If you've already paid, wait a few minutes and reload this page.",
        payment_status: session.payment_status,
      });
    }
    
    // Update order if not already completed
    if (order.order_status !== 'completed') {
      const paymentIntent = session.payment_intent as { id: string } | string;
      const paymentIntentId = typeof paymentIntent === 'string' 
        ? paymentIntent 
        : paymentIntent?.id;
      
      updateOrderStatus(
        order.id,
        'completed',
        'paid',
        paymentIntentId
      );
      
      // Create download tokens
      const tokens = createDownloadTokens(order.id);
      
      // Send confirmation email
      const updatedOrderWithItems = getOrderWithItems(order.id);
      if (updatedOrderWithItems) {
        await sendOrderConfirmationEmail({
          order: updatedOrderWithItems,
          downloadTokens: getOrderDownloadTokens(order.id),
          language: (order.language || 'en') as Language,
        });
      }
      
      console.log(`[Shop] Order ${order.order_reference} completed with ${tokens.length} download tokens`);
    }
    
    // Get download tokens
    const downloadTokens = getOrderDownloadTokens(order.id);
    
    // Get fresh order data, including line items (the confirmation page
    // expects order.items to be an array)
    const finalOrder = getOrderWithItems(order.id);
    
    return NextResponse.json({
      success: true,
      order: finalOrder,
      downloadTokens,
    });
  } catch (error) {
    console.error('[Shop] Error verifying payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        // The real error is logged above; never send it to the browser.
        error_code: 'verification_failed',
      },
      { status: 500 }
    );
  }
}
