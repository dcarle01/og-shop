// SHOP_src_app_api_categories_route.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Categories listing API endpoint

import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/database';

export async function GET() {
  try {
    const categories = getAllCategories(false); // Only active categories
    
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('[Shop API] Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
