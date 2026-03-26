// SHOP_src_lib_CurrencyContext.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-29 | Author: Open Gateways Team
// Description: Currency context for USD/MXN support with exchange rate conversion
// ✅ Added MXN price rounding support for cleaner peso prices

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import Cookies from 'js-cookie';
import type { Currency } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number | null;
  mxnRoundingUnit: number;  // ✅ NEW: Rounding unit for MXN prices
  isLoading: boolean;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceUsd: number) => string;
  convertPrice: (priceUsd: number) => number;
  getDisplayPrice: (priceUsd: number) => { amount: number; formatted: string; currency: Currency };
  getCheckoutPriceUsd: (priceUsd: number) => number;  // ✅ NEW: Get USD price for Stripe (accounts for MXN rounding)
}

// ============================================================================
// CONTEXT
// ============================================================================

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ============================================================================
// API FETCHING
// ============================================================================

async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch('/api/exchange-rate');
    if (response.ok) {
      const data = await response.json();
      if (data.rate) {
        return data.rate;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rate from API:', error);
  }
  return 17.50; // Default MXN/USD rate
}

async function fetchShopConfig(): Promise<{ mxn_price_rounding_unit: number }> {
  try {
    const response = await fetch('/api/shop-config');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return {
          mxn_price_rounding_unit: data.data.mxn_price_rounding_unit || 1
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch shop config from API:', error);
  }
  return { mxn_price_rounding_unit: 1 }; // Default: no rounding
}

// ============================================================================
// PROVIDER
// ============================================================================

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [mxnRoundingUnit, setMxnRoundingUnit] = useState<number>(1);  // ✅ NEW
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize currency from cookie or browser locale
  useEffect(() => {
    const savedCurrency = Cookies.get('currency') as Currency | undefined;
    
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'MXN')) {
      setCurrencyState(savedCurrency);
    } else {
      // Auto-detect based on timezone or locale
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = navigator.language;
      
      // If user is in Mexico, default to MXN
      if (timezone?.includes('Mexico') || locale?.toLowerCase().includes('mx')) {
        setCurrencyState('MXN');
      }
    }
    
    // Fetch exchange rate and shop config in parallel
    Promise.all([
      fetchExchangeRate(),
      fetchShopConfig()
    ])
      .then(([rate, config]) => {
        setExchangeRate(rate);
        setMxnRoundingUnit(config.mxn_price_rounding_unit);
        setIsLoading(false);
      })
      .catch(() => {
        setExchangeRate(17.50);
        setMxnRoundingUnit(1);
        setIsLoading(false);
      });
  }, []);
  
  // Save currency preference
  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    const domain = typeof window !== 'undefined' && window.location.hostname.includes('opengateways.com')
      ? '.opengateways.com'
      : undefined;
    
    Cookies.set('currency', newCurrency, {
      expires,
      domain,
      path: '/',
    });
  }, []);
  
  // ✅ UPDATED: Convert USD price to selected currency with optional rounding
  const convertPrice = useCallback((priceUsd: number): number => {
    if (currency === 'USD' || !exchangeRate) {
      return priceUsd;
    }
    
    // Convert to MXN
    const mxnAmount = priceUsd * exchangeRate;
    
    // Apply rounding if rounding unit > 1
    if (mxnRoundingUnit > 1) {
      return Math.floor(mxnAmount / mxnRoundingUnit) * mxnRoundingUnit;
    }
    
    return mxnAmount;
  }, [currency, exchangeRate, mxnRoundingUnit]);
  
  // ✅ NEW: Get the USD price that should be charged (accounts for MXN rounding)
  // When customer pays in MXN, we charge the rounded MXN amount converted back to USD
  const getCheckoutPriceUsd = useCallback((priceUsd: number): number => {
    if (currency === 'USD' || !exchangeRate) {
      return priceUsd;
    }
    
    // Get the rounded MXN amount
    const roundedMxn = convertPrice(priceUsd);
    
    // Convert back to USD - this is what Stripe will charge
    return roundedMxn / exchangeRate;
  }, [currency, exchangeRate, convertPrice]);
  
  // Format price with currency symbol
  const formatPrice = useCallback((priceUsd: number): string => {
    const amount = convertPrice(priceUsd);
    
    const formatter = new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'MXN' && mxnRoundingUnit >= 1 ? 0 : 2,  // ✅ No decimals for rounded MXN
      maximumFractionDigits: currency === 'MXN' && mxnRoundingUnit >= 1 ? 0 : 2,
    });
    
    return formatter.format(amount);
  }, [currency, convertPrice, mxnRoundingUnit]);
  
  // Get display price with all info
  const getDisplayPrice = useCallback((priceUsd: number): {
    amount: number;
    formatted: string;
    currency: Currency;
  } => {
    const amount = convertPrice(priceUsd);
    const formatted = formatPrice(priceUsd);
    
    return { amount, formatted, currency };
  }, [convertPrice, formatPrice, currency]);
  
  const value: CurrencyContextType = {
    currency,
    exchangeRate,
    mxnRoundingUnit,
    isLoading,
    setCurrency,
    formatPrice,
    convertPrice,
    getDisplayPrice,
    getCheckoutPriceUsd,
  };
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// ============================================================================
// CURRENCY SELECTOR COMPONENT
// ============================================================================

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className = '' }: CurrencySelectorProps) {
  const { currency, setCurrency } = useCurrency();
  
  return (
    <div className={`currency-selector ${className}`}>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="currency-select"
        aria-label="Select currency"
      >
        <option value="USD">$ USD</option>
        <option value="MXN">$ MXN</option>
      </select>
      
      <style jsx>{`
        .currency-selector {
          display: inline-flex;
          align-items: center;
        }
        
        .currency-select {
          padding: 6px 12px;
          font-size: 14px;
          font-family: 'Georgia', serif;
          color: #4a5568;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .currency-select:hover {
          border-color: #0184f6;
        }
        
        .currency-select:focus {
          outline: none;
          border-color: #0184f6;
          box-shadow: 0 0 0 2px rgba(1, 132, 246, 0.2);
        }
      `}</style>
    </div>
  );
}

