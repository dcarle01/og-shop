// SHOP_src_app_api_auth_login_route.ts
// Version: 1.0.0 | Created: 2026-01-29 | Author: Open Gateways Team
// Description: Login API endpoint for Open Gateways Shop
// Simplified from Schedule - no email verification or password change checks

import { NextRequest, NextResponse } from 'next/server';
import { openDatabase } from '@/lib/database';
import { verifyPassword, generateToken, isValidEmail } from '@/lib/auth';

// ============================================================================
// TYPES
// ============================================================================

interface LoginRequest {
  email: string;
  password: string;
}

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  phone: string | null;
  timezone: string | null;
  language: string;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// POST - Login
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json();

    console.log('[Shop Login] Attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('[Shop Login] Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      console.log('[Shop Login] Invalid email format');
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      }, { status: 400 });
    }

    // Get user from database
    const normalizedEmail = email.toLowerCase().trim();
    const db = openDatabase();
    
    const user = db.prepare(`
      SELECT 
        id, email, password_hash, first_name, middle_name, last_name,
        preferred_name, phone, timezone, language,
        email_verified, created_at, updated_at
      FROM users 
      WHERE email = ?
    `).get(normalizedEmail) as UserRow | undefined;

    if (!user) {
      console.log('[Shop Login] User not found:', normalizedEmail);
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }

    console.log('[Shop Login] User found:', {
      id: user.id,
      email: user.email,
      has_password_hash: !!user.password_hash,
    });

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('[Shop Login] Invalid password for:', user.email);
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      }, { status: 401 });
    }

    console.log('[Shop Login] Success for:', user.email);

    // Create user object without password hash
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      preferred_name: user.preferred_name,
      phone: user.phone,
      timezone: user.timezone,
      language: user.language || 'en',
      email_verified: Boolean(user.email_verified),
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('[Shop Login] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

