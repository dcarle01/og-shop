// SHOP_src_app_api_checkout_create-session_route.ts
// Version: 1.3.2 | Created: 2026-01-28 | Last Modified: 2026-11-16 | Author: Open Gateways Team
// Description: Create Stripe Checkout session for cart
// ✅ Added user_id support for logged-in users
// ✅ Added MXN price rounding support - charges rounded MXN amount via Stripe

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, formatLineItem } from '@/lib/stripe';
import { createOrder, getProductById, openDatabase, updateOrderStatus } from '@/lib/database';
import { getUsdMxnRate } from '@/lib/exchangeRate';
import type { CartItem, Language, Currency } from '@/types';

interface CreateSessionBody {
  cart: {
    items: CartItem[];
    subtotal_usd: number;
  };
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_country?: string;
  language: Language;
  currency: Currency;
  exchange_rate?: number;
  mxn_rounding_unit?: number;  // ✅ NEW: Rounding unit from frontend
  user_id?: number;
}

// ✅ NEW: Helper to get MXN rounding setting from database
function getMxnRoundingUnit(): number {
  try {
    const db = openDatabase();
    const result = db.prepare(`
      SELECT setting_value 
      FROM system_settings 
      WHERE setting_category = 'shop' 
        AND setting_key = 'mxn_price_rounding_unit'
    `).get() as { setting_value: string } | undefined;
    
    return result ? parseFloat(result.setting_value) || 1 : 1;
  } catch {
    return 1; // Fallback: no rounding
  }
}

export async function POST(request: NextRequest) {
  // Set once the order exists, so the error handler can close it (see the catch).
  let createdOrderId: number | null = null;
  try {
    const body: CreateSessionBody = await request.json();
    
    const {
      cart,
      customer_email,
      customer_first_name,
      customer_last_name,
      customer_country,
      language,
      currency,
      exchange_rate,
      mxn_rounding_unit: clientRoundingUnit,
      user_id,
    } = body;
    
    // Validate required fields
    if (!cart?.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }
    
    if (!customer_email || !customer_first_name || !customer_last_name) {
      return NextResponse.json(
        { success: false, error: 'Customer information is required' },
        { status: 400 }
      );
    }
    
    // ✅ Get rounding unit from database (authoritative source)
    // Fall back to client-provided value or 1 (no rounding)
    const roundingUnit = getMxnRoundingUnit() || clientRoundingUnit || 1;
    
    // ✅ The exchange rate comes from the server (Banxico FIX), never from the
    // browser: a rate sent by the browser could be edited to change what Stripe charges.
    const currentRate = currency === 'MXN' ? await getUsdMxnRate() : null;
    if (currency === 'MXN' && !currentRate) {
      return NextResponse.json(
        { success: false, error: 'MXN pricing is temporarily unavailable. Please pay in USD.' },
        { status: 503 }
      );
    }
    const serverRate: number | null = currentRate ? currentRate.rate : null;
    if (serverRate && exchange_rate && Math.abs(exchange_rate - serverRate) / serverRate > 0.005) {
      console.log(`[Shop Checkout] Browser rate ${exchange_rate} differs from server rate ${serverRate}; charging the server rate`);
    }
    
    // Verify products and calculate totals
    let calculatedTotalUsd = 0;
    let calculatedTotalDisplay = 0;
    const verifiedItems: CartItem[] = [];
    
    for (const item of cart.items) {
      const product = getProductById(item.product_id);
      
      if (!product || !product.is_active) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.name_en}` },
          { status: 400 }
        );
      }
      
      // Use server-side price for security
      verifiedItems.push({
        ...item,
        price_usd: product.price_usd,
      });
      
      // Calculate original USD total (for record keeping)
      calculatedTotalUsd += product.price_usd * item.quantity;
      
      // ✅ Calculate display total (rounded if MXN)
      if (currency === 'MXN' && serverRate) {
        const mxnAmount = product.price_usd * serverRate * item.quantity;
        const roundedMxn = roundingUnit > 1
          ? Math.floor(mxnAmount / roundingUnit) * roundingUnit
          : mxnAmount;
        calculatedTotalDisplay += roundedMxn;
      }
    }
    
    // Create order in database (pending status)
    const order = createOrder(
      customer_email,
      customer_first_name,
      customer_last_name,
      verifiedItems,
      calculatedTotalUsd,  // Original USD total
      currency,
      serverRate,
      language,
      undefined,
      user_id,
      customer_country
    );
    
    createdOrderId = order.id;
    
    // ✅ Update order with display total if MXN
    if (currency === 'MXN' && calculatedTotalDisplay > 0) {
      const db = openDatabase();
      db.prepare(`
        UPDATE shop_orders 
        SET total_amount_display = ?
        WHERE id = ?
      `).run(calculatedTotalDisplay, order.id);
    }
    
    console.log(`[Shop Checkout] Order created: ${order.order_reference}, user_id: ${user_id || 'guest'}, currency: ${currency}, rounding: ${roundingUnit}`);
    
    // ✅ Create Stripe line items in the customer's selected currency
    const lineItems = verifiedItems.map((item) => {
      const name = language === 'es' ? item.name_es : item.name_en;
      
      let unitAmountInSmallestUnit: number;
      let chargeCurrency: string;
      
      if (currency === 'MXN' && serverRate) {
        // Charge in MXN - calculate unit price in centavos
        const mxnUnitPrice = item.price_usd * serverRate;
        const roundedMxnUnit = roundingUnit > 1
          ? Math.floor(mxnUnitPrice / roundingUnit) * roundingUnit
          : mxnUnitPrice;
        unitAmountInSmallestUnit = Math.round(roundedMxnUnit * 100); // centavos
        chargeCurrency = 'mxn';
      } else {
        // Charge in USD - unit price in cents
        unitAmountInSmallestUnit = Math.round(item.price_usd * 100);
        chargeCurrency = 'usd';
      }
      
      return formatLineItem(
        name,
        unitAmountInSmallestUnit,
        item.quantity,
        chargeCurrency
      );
    });
    
    // Create Stripe Checkout session
    const session = await createCheckoutSession({
      lineItems,
      customerEmail: customer_email,
      metadata: {
        order_id: order.id.toString(),
        order_reference: order.order_reference,
        language,
        currency,
        exchange_rate: serverRate?.toString() || '',
        mxn_rounding_unit: roundingUnit.toString(),
        user_id: user_id?.toString() || '',
      },
    });
    
    // Update order with Stripe session ID
    const db = openDatabase();
    db.prepare(`
      UPDATE shop_orders 
      SET stripe_session_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(session.id, order.id);
    
    console.log(`[Shop Checkout] Created session ${session.id} for order ${order.order_reference}`);
    
    return NextResponse.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
    });
  } catch (error) {
    console.error('[Shop Checkout] Error creating session:', error);
    // If the order was already created, close it: with no Stripe session there is
    // nothing for the expiry webhook to close, so it would stay "pending" forever.
    if (createdOrderId !== null) {
      try {
        updateOrderStatus(createdOrderId, 'cancelled', 'failed');
        console.log(`[Shop Checkout] Marked order ${createdOrderId} cancelled after the failure`);
      } catch (markError) {
        console.error('[Shop Checkout] Could not mark the order cancelled:', markError);
      }
    }
    return NextResponse.json(
      {
        success: false,
        // The real error is logged above; never send it to the browser (it can
        // include provider details). The page shows its own localized message.
        error_code: 'checkout_failed',
      },
      { status: 500 }
    );
  }
}

