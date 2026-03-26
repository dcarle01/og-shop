// SHOP_src_app_api_exchange-rate_route.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Exchange rate API for USD to MXN conversion

import { NextResponse } from 'next/server';

// Cache the exchange rate for 1 hour
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Default fallback rate (update periodically)
const DEFAULT_RATE = 17.50;

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (cachedRate && (now - cachedRate.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        rate: cachedRate.rate,
        currency: 'MXN',
        base: 'USD',
        cached: true,
        timestamp: cachedRate.timestamp,
      });
    }
    
    // Try to fetch fresh rate from external API
    let rate = DEFAULT_RATE;
    let source = 'fallback';
    
    try {
      // Option 1: Use exchangerate-api.com (free tier available)
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      
      if (apiKey) {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/MXN`,
          { next: { revalidate: 3600 } } // Cache for 1 hour
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.result === 'success' && data.conversion_rate) {
            rate = data.conversion_rate;
            source = 'exchangerate-api';
          }
        }
      } else {
        // Option 2: Use a free, no-key API as fallback
        const response = await fetch(
          'https://api.exchangerate.host/latest?base=USD&symbols=MXN',
          { next: { revalidate: 3600 } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rates?.MXN) {
            rate = data.rates.MXN;
            source = 'exchangerate.host';
          }
        }
      }
    } catch (fetchError) {
      console.warn('[Exchange Rate] Failed to fetch from external API:', fetchError);
      // Use fallback rate
    }
    
    // Update cache
    cachedRate = { rate, timestamp: now };
    
    console.log(`[Exchange Rate] USD/MXN: ${rate} (source: ${source})`);
    
    return NextResponse.json({
      success: true,
      rate,
      currency: 'MXN',
      base: 'USD',
      source,
      timestamp: now,
    });
  } catch (error) {
    console.error('[Exchange Rate] Error:', error);
    
    // Return fallback rate on error
    return NextResponse.json({
      success: true,
      rate: DEFAULT_RATE,
      currency: 'MXN',
      base: 'USD',
      source: 'fallback',
      timestamp: Date.now(),
    });
  }
}
