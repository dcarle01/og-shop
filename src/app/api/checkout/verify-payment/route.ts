// SHOP_src_app_api_checkout_verify-payment_route.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
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
    const { session_id } = await request.json();
    
    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get Stripe session
    const session = await getSessionWithLineItems(session_id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Get order from database
    const order = getOrderByStripeSession(session_id);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Payment not completed',
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
    
    // Get fresh order data
    const finalOrder = getOrderByStripeSession(session_id);
    
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
        error: error instanceof Error ? error.message : 'Payment verification failed' 
      },
      { status: 500 }
    );
  }
}
