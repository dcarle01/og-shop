// SHOP_src_app_api_checkout_create-session_route.ts
// Version: 1.2.0 | Created: 2026-01-28 | Last Modified: 2026-01-29 | Author: Open Gateways Team
// Description: Create Stripe Checkout session for cart
// ✅ Added user_id support for logged-in users
// ✅ Added MXN price rounding support - charges rounded MXN amount via Stripe

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, formatLineItem } from '@/lib/stripe';
import { createOrder, getProductById, openDatabase } from '@/lib/database';
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

// ✅ NEW: Calculate charge amount with MXN rounding
function calculateChargeAmount(
  priceUsd: number,
  currency: Currency,
  exchangeRate: number | null,
  roundingUnit: number
): number {
  // If USD or no exchange rate, return original USD price
  if (currency === 'USD' || !exchangeRate) {
    return priceUsd;
  }
  
  // Convert to MXN
  const mxnAmount = priceUsd * exchangeRate;
  
  // Apply rounding if unit > 1
  const roundedMxn = roundingUnit > 1
    ? Math.floor(mxnAmount / roundingUnit) * roundingUnit
    : mxnAmount;
  
  // Convert back to USD for Stripe
  return roundedMxn / exchangeRate;
}

export async function POST(request: NextRequest) {
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
      if (currency === 'MXN' && exchange_rate) {
        const mxnAmount = product.price_usd * exchange_rate * item.quantity;
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
      exchange_rate || null,
      language,
      undefined,
      user_id,
      customer_country
    );
    
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
      
      if (currency === 'MXN' && exchange_rate) {
        // Charge in MXN - calculate unit price in centavos
        const mxnUnitPrice = item.price_usd * exchange_rate;
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
        exchange_rate: exchange_rate?.toString() || '',
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
      },
      { status: 500 }
    );
  }
}

