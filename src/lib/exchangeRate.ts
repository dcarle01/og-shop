// SHOP_src_lib_exchangeRate.ts
// Version: 1.0.0 | Created: 2026-11-15 | Author: Open Gateways Team
// Description: Server-side USD -> MXN rate from Banco de México's official FIX
//   (SIE API series SF43718), with an hourly cache and a saved last-good rate.
//
// Used by /api/exchange-rate (the prices shoppers see) and by checkout (what
// Stripe charges), so both use the same server-side rate. Never trust a rate
// sent by the browser.

import { openDatabase } from '@/lib/database';

export interface UsdMxnRate {
  rate: number;                    // pesos per US dollar
  date: string;                    // Banxico's FIX date, DD/MM/YYYY
  source: 'banxico' | 'last-good';
}

const BANXICO_URL =
  'https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno';
const CACHE_MS = 60 * 60 * 1000;   // reuse a live Banxico rate for an hour
const RETRY_MS = 5 * 60 * 1000;    // after a failure, ask Banxico again in 5 min
const MIN_PLAUSIBLE = 5;           // reject anything outside this range
const MAX_PLAUSIBLE = 50;

const SETTING_CATEGORY = 'exchange_rate';
const SETTING_KEY = 'usd_mxn_last_good';

let memo: { value: UsdMxnRate | null; until: number } | null = null;

async function fetchBanxicoFix(): Promise<{ rate: number; date: string } | null> {
  const token = process.env.BANXICO_SIE_TOKEN;
  if (!token) {
    console.warn('[Exchange Rate] BANXICO_SIE_TOKEN is not set');
    return null;
  }
  try {
    const response = await fetch(BANXICO_URL, {
      headers: { 'Bmx-Token': token, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`[Exchange Rate] Banxico responded HTTP ${response.status}`);
      return null;
    }
    const body = await response.json();
    const point = body?.bmx?.series?.[0]?.datos?.[0];
    const rate = parseFloat(point?.dato);
    if (!point?.fecha || !Number.isFinite(rate) || rate < MIN_PLAUSIBLE || rate > MAX_PLAUSIBLE) {
      console.warn('[Exchange Rate] Unexpected Banxico response:', JSON.stringify(body).slice(0, 300));
      return null;
    }
    return { rate, date: String(point.fecha) };
  } catch (error) {
    console.warn('[Exchange Rate] Banxico request failed:', error);
    return null;
  }
}

function readLastGood(): { rate: number; date: string } | null {
  try {
    const row = openDatabase()
      .prepare(
        'SELECT setting_value FROM system_settings WHERE setting_category = ? AND setting_key = ?'
      )
      .get(SETTING_CATEGORY, SETTING_KEY) as { setting_value: string } | undefined;
    if (!row?.setting_value) return null;
    const saved = JSON.parse(row.setting_value);
    const rate = Number(saved?.rate);
    if (!Number.isFinite(rate) || rate < MIN_PLAUSIBLE || rate > MAX_PLAUSIBLE) return null;
    return { rate, date: String(saved?.date ?? '') };
  } catch (error) {
    console.warn('[Exchange Rate] Could not read the last good rate:', error);
    return null;
  }
}

function saveLastGood(value: { rate: number; date: string }): void {
  try {
    openDatabase()
      .prepare(`
        INSERT INTO system_settings
          (setting_category, setting_key, setting_value, setting_type, description, updated_at)
        VALUES (?, ?, ?, 'json', ?, datetime('now'))
        ON CONFLICT(setting_category, setting_key) DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = excluded.updated_at
      `)
      .run(
        SETTING_CATEGORY,
        SETTING_KEY,
        JSON.stringify({ rate: value.rate, date: value.date }),
        'Last USD->MXN FIX rate fetched from Banxico; Shop uses it when Banxico is unreachable'
      );
  } catch (error) {
    console.warn('[Exchange Rate] Could not save the last good rate:', error);
  }
}

/** The current USD->MXN rate, or null if no rate has ever been available. */
export async function getUsdMxnRate(): Promise<UsdMxnRate | null> {
  if (memo && Date.now() < memo.until) return memo.value;

  let value: UsdMxnRate | null = null;
  const live = await fetchBanxicoFix();
  if (live) {
    value = { ...live, source: 'banxico' };
    saveLastGood(live);
  } else {
    const lastGood = readLastGood();
    if (lastGood) {
      value = { ...lastGood, source: 'last-good' };
      console.warn(`[Exchange Rate] Banxico unavailable; using last good rate ${lastGood.rate} (FIX of ${lastGood.date})`);
    }
  }

  // A live rate is reused for an hour; after any failure Banxico is retried in 5 minutes.
  memo = { value, until: Date.now() + (value?.source === 'banxico' ? CACHE_MS : RETRY_MS) };
  if (value) console.log(`[Exchange Rate] USD/MXN ${value.rate} (FIX of ${value.date}, ${value.source})`);
  return value;
}