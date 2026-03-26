// SHOP_src_app_api_products_route.ts
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-30 | Author: Open Gateways Team
// Description: Products listing API endpoint with content language filtering
// ✅ Added content_language filter for hybrid catalog organization

import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getCategoryBySlug, getProductLanguageCounts } from '@/lib/database';
import type { ProductQueryOptions } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const categorySlug = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'featured';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Language filtering parameters
    const contentLang = searchParams.get('lang') as 'en' | 'es' | null;
    const includeNeutral = searchParams.get('include_neutral') !== 'false';  // Default true
    const includeBoth = searchParams.get('include_both') !== 'false';        // Default true
    const includeCounts = searchParams.get('include_counts') === 'true';
    
    // Build options
    const options: ProductQueryOptions = {
      is_active: true,
    };
    
    // Handle category filter
    if (categorySlug) {
      const category = getCategoryBySlug(categorySlug);
      if (category) {
        options.category_id = category.id;
        options.category_slug = categorySlug;
      }
    }
    
    // Handle featured filter
    if (featured) {
      options.is_featured = true;
    }
    
    // Handle content language filter
    if (contentLang && (contentLang === 'en' || contentLang === 'es')) {
      options.content_language = contentLang;
      options.include_neutral = includeNeutral;
      options.include_both = includeBoth;
    }
    
    // Handle limit
    if (limit && limit > 0) {
      options.limit = limit;
    }
    
    // Get products
    const products = getAllProducts(options);
    
    // Sort products
    switch (sort) {
      case 'price_asc':
        products.sort((a, b) => a.price_usd - b.price_usd);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price_usd - a.price_usd);
        break;
      case 'newest':
        products.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'language':
        // Group by content language: user's language first, then both, then other, then neutral
        products.sort((a, b) => {
          const langOrder = (lang: string | null, userLang: string | null) => {
            if (lang === userLang) return 0;
            if (lang === 'both') return 1;
            if (lang === null) return 3;  // Neutral last
            return 2;  // Other language
          };
          const orderA = langOrder(a.content_language, contentLang);
          const orderB = langOrder(b.content_language, contentLang);
          if (orderA !== orderB) return orderA - orderB;
          return a.sort_order - b.sort_order;
        });
        break;
      case 'featured':
      default:
        // Featured first, then by sort_order
        products.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return a.sort_order - b.sort_order;
        });
        break;
    }
    
    // Build response
    const response: {
      success: boolean;
      products: typeof products;
      total: number;
      language_counts?: {
        en: number;
        es: number;
        both: number;
        neutral: number;
      };
    } = {
      success: true,
      products,
      total: products.length,
    };
    
    // Optionally include language counts for filter UI
    if (includeCounts) {
      response.language_counts = getProductLanguageCounts(categorySlug || undefined);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Shop API] Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

