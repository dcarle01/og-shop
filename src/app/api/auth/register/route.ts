// SHOP_src_app_api_auth_register/route.ts
// Version: 1.0.0 | Created: 2026-03-14 | Author: Open Gateways Team
// Description: Shop registration API — creates account in shared users table
// ✅ Validates input, checks for duplicate email
// ✅ Hashes password with bcrypt
// ✅ Does NOT require email verification for shop accounts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { openDatabase } from '@/lib/database';
import { generateToken, isValidEmail } from '@/lib/auth';

// ============================================================================
// POST — Register
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, password, language } = body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!first_name?.trim() || !last_name?.trim() || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const lang = language === 'es' ? 'es' : 'en';

    // ── Check for duplicate email ─────────────────────────────────────────
    const db = openDatabase();

    const existing = db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).get(normalizedEmail);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'email_exists' },
        { status: 409 }
      );
    }

    // ── Hash password ─────────────────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, 12);

    // ── Insert user ───────────────────────────────────────────────────────
    const result = db.prepare(`
      INSERT INTO users (
        email, password_hash,
        first_name, last_name,
        language, timezone,
        email_verified,
        created_at, updated_at
      ) VALUES (
        ?, ?,
        ?, ?,
        ?, 'America/Mexico_City',
        0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `).run(
      normalizedEmail, password_hash,
      first_name.trim(), last_name.trim(),
      lang
    );

    const userId = result.lastInsertRowid as number;

    console.log('[Shop Register] Created user id:', userId, 'email:', normalizedEmail);

    // ── Return token (auto-login) ─────────────────────────────────────────
    const token = generateToken({
      id:         userId,
      email:      normalizedEmail,
      first_name: first_name.trim(),
      last_name:  last_name.trim(),
      language:   lang,
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id:             userId,
        email:          normalizedEmail,
        first_name:     first_name.trim(),
        last_name:      last_name.trim(),
        middle_name:    null,
        preferred_name: null,
        phone:          null,
        country_code:   null,
        timezone:       'America/Mexico_City',
        language:       lang,
        email_verified: false,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[Shop Register] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:   'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
