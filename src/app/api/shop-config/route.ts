// SHOP_src_app_api_shop-config_route.ts
// Version: 1.0.0 | Created: 2026-01-29 | Author: Open Gateways Team
// Description: Public API endpoint to fetch shop configuration settings

import { NextResponse } from 'next/server';
import { openDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = openDatabase();
    
    // Get public shop settings
    const shopSettings = db.prepare(`
      SELECT setting_key, setting_value, setting_type
      FROM system_settings 
      WHERE setting_category = 'shop'
        AND is_public = 1
    `).all() as Array<{ setting_key: string; setting_value: string; setting_type: string }>;

    // Transform to a convenient format with proper type parsing
    const config: Record<string, number | string | boolean> = {};
    
    shopSettings.forEach(setting => {
      let value: number | string | boolean = setting.setting_value;
      
      // Parse value based on type
      if (setting.setting_type === 'number') {
        value = parseFloat(setting.setting_value) || 0;
      } else if (setting.setting_type === 'boolean') {
        value = setting.setting_value === '1' || setting.setting_value === 'true';
      }
      
      config[setting.setting_key] = value;
    });

    // Ensure mxn_price_rounding_unit has a default if not set
    if (config.mxn_price_rounding_unit === undefined) {
      config.mxn_price_rounding_unit = 1; // Fallback: no rounding
    }

    const response = NextResponse.json({
      success: true,
      data: config
    });
    
    // Cache for 5 minutes (settings don't change frequently)
    response.headers.set('Cache-Control', 'public, max-age=300');
    
    return response;

  } catch (error) {
    console.error('[Shop Config] Error fetching config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shop configuration',
      data: {
        mxn_price_rounding_unit: 1 // Fallback default
      }
    }, { status: 200 }); // Still return 200 with defaults on error
  }
}

