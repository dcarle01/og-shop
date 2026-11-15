// SHOP_src_app_api_exchange-rate_route.ts
// Version: 2.0.0 | Created: 2026-01-28 | Last Modified: 2026-11-15 | Author: Open Gateways Team
// Description: USD -> MXN rate for shoppers' price display: Banco de México's FIX
//   via src/lib/exchangeRate.ts. Checkout looks up its own rate on the server.

import { NextResponse } from 'next/server';
import { getUsdMxnRate } from '@/lib/exchangeRate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const value = await getUsdMxnRate();

  if (!value) {
    // No rate has ever been available: the shop falls back to USD only.
    return NextResponse.json({
      success: false,
      rate: null,
      currency: 'MXN',
      base: 'USD',
      error: 'No exchange rate available',
    });
  }

  return NextResponse.json({
    success: true,
    rate: value.rate,
    currency: 'MXN',
    base: 'USD',
    source: value.source,
    date: value.date,
  });
}