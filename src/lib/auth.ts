// SHOP_src_lib_auth.ts
// Version: 1.0.0 | Created: 2026-01-29 | Author: Open Gateways Team
// Description: Authentication utilities for Open Gateways Shop
// Simplified from Schedule system - login only, no registration

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || '93100621955cef16f08e6bd7533099f455018f65f99e0436ba42f9bbc19aebf7';
const JWT_EXPIRY = '7d';
const JWT_ISSUER = 'opengateways';

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface UserForToken {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  language?: string;
}

// ============================================================================
// PASSWORD FUNCTIONS
// ============================================================================

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('[Shop Auth] Password verification error:', error);
    return false;
  }
}

// ============================================================================
// JWT FUNCTIONS
// ============================================================================

/**
 * Generate a JWT token for authenticated user
 */
export function generateToken(user: UserForToken): string {
  const payload = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    language: user.language || 'en',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: JWT_ISSUER,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[Shop Auth] Token verification error:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Extract token from cookie header
 */
export function extractTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }
  const tokenMatch = cookieHeader.match(/shop-auth-token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

