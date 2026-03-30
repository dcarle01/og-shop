// SHOP_src_lib_database.ts
// Version: 1.1.2 | Created: 2026-01-28 | Last Modified: 2026-03-29 | Author: Open Gateways Team
// Description: Database operations for Open Gateways Shop system
// Uses shared opengateways.db with Schedule system
// ✅ Added content_language filtering for hybrid catalog organization

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type {
  Product,
  ProductWithCategory,
  Category,
  CategoryWithProducts,
  CategoryWithLanguageCounts,
  ProductQueryOptions,
  Order,
  OrderItem,
  OrderWithItems,
  DownloadToken,
  DownloadTokenWithProduct,
  User,
  CartItem,
  OrderStatus,
  PaymentStatus,
} from '@/types';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let db: Database.Database | null = null;

export function openDatabase(): Database.Database {
  if (!db) {
    const possiblePaths = [
      process.env.DATABASE_PATH,
      path.join(process.cwd(), 'assets', 'database', 'opengateways.db'),
      '/home/openga9/public_html/assets/database/opengateways.db',
    ].filter(Boolean);
    
    let dbPath: string | null = null;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath!)) {
        dbPath = testPath!;
        console.log(`[Shop DB] Found database at: ${dbPath}`);
        break;
      }
    }
    
    if (!dbPath) {
      throw new Error('Database file not found in any expected location');
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    console.log('[Shop DB] Database connection established');
  }
  
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[Shop DB] Database connection closed');
  }
}

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * Get all products with optional filtering by category, language, and status.
 *
 * Language filtering behavior:
 * - If content_language is specified (e.g., 'en'), returns products in that language
 * - include_neutral (default: true) also includes language-neutral products (music)
 * - include_both (default: true) also includes bilingual products
 *
 * Examples:
 * - getAllProducts({ content_language: 'es' })
 *     → Spanish products + music + bilingual products
 * - getAllProducts({ content_language: 'es', include_neutral: false })
 *     → Only Spanish products + bilingual products
 * - getAllProducts({ content_language: 'es', include_both: false })
 *     → Spanish products + music only
 */
export function getAllProducts(options?: ProductQueryOptions): ProductWithCategory[] {
  const database = openDatabase();
  
  let query = `
    SELECT 
      p.*,
      c.name_en as category_name_en,
      c.name_es as category_name_es,
      c.slug as category_slug,
      c.background_image as category_background_image
    FROM shop_products p
    LEFT JOIN shop_categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  
  // Filter by active status
  if (options?.is_active !== undefined) {
    query += ' AND p.is_active = ?';
    params.push(options.is_active ? 1 : 0);
  }
  
  // Filter by featured status
  if (options?.is_featured !== undefined) {
    query += ' AND p.is_featured = ?';
    params.push(options.is_featured ? 1 : 0);
  }
  
  // Filter by category ID
  if (options?.category_id) {
    query += ' AND p.category_id = ?';
    params.push(options.category_id);
  }
  
  // Filter by category slug
  if (options?.category_slug) {
    query += ' AND c.slug = ?';
    params.push(options.category_slug);
  }
  
  // Filter by content language
  if (options?.content_language) {
    const includeNeutral = options.include_neutral !== false;  // Default true
    const includeBoth = options.include_both !== false;        // Default true
    
    const langConditions: string[] = [];
    langConditions.push('p.content_language = ?');
    params.push(options.content_language);
    
    if (includeNeutral) {
      langConditions.push('p.content_language IS NULL');
    }
    
    if (includeBoth && options.content_language !== 'both') {
      langConditions.push("p.content_language = 'both'");
    }
    
    query += ` AND (${langConditions.join(' OR ')})`;
  }
  
  query += ' ORDER BY p.sort_order ASC, p.created_at DESC';
  
  // Apply limit and offset
  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
    
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }
  
  const stmt = database.prepare(query);
  return stmt.all(...params) as ProductWithCategory[];
}

/**
 * Get product counts by content language for a given category (or all products)
 */
export function getProductLanguageCounts(categorySlug?: string): {
  total: number;
  en: number;
  es: number;
  both: number;
  neutral: number;
} {
  const database = openDatabase();
  
  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN p.content_language = 'en' THEN 1 ELSE 0 END) as en_count,
      SUM(CASE WHEN p.content_language = 'es' THEN 1 ELSE 0 END) as es_count,
      SUM(CASE WHEN p.content_language = 'both' THEN 1 ELSE 0 END) as both_count,
      SUM(CASE WHEN p.content_language IS NULL THEN 1 ELSE 0 END) as neutral_count
    FROM shop_products p
    LEFT JOIN shop_categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params: string[] = [];
  
  if (categorySlug) {
    query += ' AND c.slug = ?';
    params.push(categorySlug);
  }
  
  const stmt = database.prepare(query);
  const result = stmt.get(...params) as {
    total: number;
    en_count: number;
    es_count: number;
    both_count: number;
    neutral_count: number;
  };
  
  return {
    total: result.total || 0,
    en: result.en_count || 0,
    es: result.es_count || 0,
    both: result.both_count || 0,
    neutral: result.neutral_count || 0,
  };
}

export function getProductBySlug(slug: string): ProductWithCategory | null {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      p.*,
      c.name_en as category_name_en,
      c.name_es as category_name_es,
      c.slug as category_slug,
      c.background_image as category_background_image
    FROM shop_products p
    LEFT JOIN shop_categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `);
  
  return stmt.get(slug) as ProductWithCategory | null;
}

export function getProductById(id: number): Product | null {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_products WHERE id = ?');
  return stmt.get(id) as Product | null;
}

/**
 * Get featured products, optionally filtered by content language
 */
export function getFeaturedProducts(
  limit: number = 6,
  contentLanguage?: 'en' | 'es'
): ProductWithCategory[] {
  return getAllProducts({
    is_active: true,
    is_featured: true,
    limit,
    content_language: contentLanguage,
    include_neutral: true,
    include_both: true,
  });
}

/**
 * Get products in the "other" language for cross-sell suggestions
 * E.g., if viewing Spanish products, this returns English products in same category
 */
export function getOtherLanguageProducts(
  categoryId: number,
  currentLanguage: 'en' | 'es',
  limit: number = 3
): ProductWithCategory[] {
  const otherLanguage = currentLanguage === 'en' ? 'es' : 'en';
  return getAllProducts({
    is_active: true,
    category_id: categoryId,
    content_language: otherLanguage,
    include_neutral: false,
    include_both: false,
    limit,
  });
}

/**
 * Get related products scored by keyword overlap.
 * Scoring:
 *   +2  if candidate's first keyword matches this product's first keyword
 *   +1  for each additional shared keyword
 * Falls back to same-category products if no keyword matches are found.
 */
export function getRelatedProducts(
  productId: number,
  limit: number = 4
): ProductWithCategory[] {
  const database = openDatabase();

  // Fetch the source product's keywords and category
  const source = database.prepare(
    'SELECT keywords, category_id FROM shop_products WHERE id = ?'
  ).get(productId) as { keywords: string | null; category_id: number | null } | undefined;

  if (!source) return [];

  // ── Keyword-based scoring ────────────────────────────────────────────────
  if (source.keywords) {
    const tags = source.keywords.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      const firstTag = tags[0];

      // Build score expression:
      //   +2 if candidate's first keyword (before first comma) equals firstTag
      //   +1 per shared keyword (using wrapped LIKE: ',keywords,' LIKE '%,tag,%')
      const firstTagExpr = `
        CASE WHEN TRIM(SUBSTR(keywords, 1,
          CASE WHEN INSTR(keywords, ',') > 0
               THEN INSTR(keywords, ',') - 1
               ELSE LENGTH(keywords) END
        )) = ? THEN 2 ELSE 0 END
      `;
      const tagExprs = tags.map(() =>
        "CASE WHEN (',' || keywords || ',') LIKE ? THEN 1 ELSE 0 END"
      );
      const scoreExpr = [firstTagExpr, ...tagExprs].join(' + ');

      const scoreParams: (string | number)[] = [firstTag, ...tags.map(t => `%,${t},%`)];

      const query = `
        SELECT
          p.*,
          c.name_en as category_name_en,
          c.name_es as category_name_es,
          c.slug    as category_slug,
          c.background_image as category_background_image,
          (${scoreExpr}) AS score
        FROM shop_products p
        LEFT JOIN shop_categories c ON p.category_id = c.id
        WHERE p.id != ?
          AND p.is_active = 1
          AND p.keywords IS NOT NULL
          AND (${scoreExpr}) > 0
        ORDER BY score DESC, p.sort_order ASC
        LIMIT ?
      `;

      const results = database.prepare(query).all(
        ...scoreParams,          // SELECT score expression
        productId,               // WHERE id != ?
        ...scoreParams,          // WHERE score > 0 expression
        limit
      ) as ProductWithCategory[];

      if (results.length > 0) return results;
    }
  }

  // ── Fallback: same category ──────────────────────────────────────────────
  if (source.category_id) {
    return getAllProducts({
      is_active: true,
      category_id: source.category_id,
      limit: limit + 1,           // +1 to account for filtering self out
    }).filter((p: ProductWithCategory) => p.id !== productId).slice(0, limit);
  }

  return [];
}

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export function getAllCategories(includeInactive: boolean = false): Category[] {
  const database = openDatabase();
  
  let query = 'SELECT * FROM shop_categories';
  if (!includeInactive) {
    query += ' WHERE is_active = 1';
  }
  query += ' ORDER BY sort_order ASC, name_en ASC';
  
  const stmt = database.prepare(query);
  return stmt.all() as Category[];
}

/**
 * Get all categories with product counts broken down by content language
 */
export function getCategoriesWithLanguageCounts(): CategoryWithLanguageCounts[] {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      c.*,
      COUNT(p.id) as total_count,
      SUM(CASE WHEN p.content_language = 'en' AND p.is_active = 1 THEN 1 ELSE 0 END) as en_count,
      SUM(CASE WHEN p.content_language = 'es' AND p.is_active = 1 THEN 1 ELSE 0 END) as es_count,
      SUM(CASE WHEN p.content_language = 'both' AND p.is_active = 1 THEN 1 ELSE 0 END) as both_count,
      SUM(CASE WHEN p.content_language IS NULL AND p.is_active = 1 THEN 1 ELSE 0 END) as neutral_count
    FROM shop_categories c
    LEFT JOIN shop_products p ON c.id = p.category_id
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `);
  
  return stmt.all() as CategoryWithLanguageCounts[];
}

export function getCategoryBySlug(slug: string): Category | null {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_categories WHERE slug = ? AND is_active = 1');
  return stmt.get(slug) as Category | null;
}

export function getCategoryWithProducts(
  slug: string,
  contentLanguage?: 'en' | 'es'
): CategoryWithProducts | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;
  
  const products = getAllProducts({
    category_id: category.id,
    is_active: true,
    content_language: contentLanguage,
  });
  
  return {
    ...category,
    products,
    product_count: products.length,
  };
}

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

function generateOrderReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OG-${timestamp}-${random}`;
}

export function createOrder(
  customerEmail: string,
  customerFirstName: string,
  customerLastName: string,
  items: CartItem[],
  totalAmountUsd: number,
  currency: 'USD' | 'MXN',
  exchangeRate: number | null,
  language: 'en' | 'es',
  stripeSessionId?: string,
  userId?: number,
  customerCountry?: string
): Order {
  const database = openDatabase();
  
  const orderReference = generateOrderReference();
  const customerName = `${customerFirstName} ${customerLastName}`.trim();
  const totalAmountDisplay = currency === 'MXN' && exchangeRate
    ? totalAmountUsd * exchangeRate
    : totalAmountUsd;
  
  const insertOrder = database.prepare(`
    INSERT INTO shop_orders (
      order_reference, user_id, customer_email, customer_name, 
      customer_first_name, customer_last_name, customer_country,
      total_amount_usd, currency, exchange_rate, total_amount_display,
      order_status, payment_status, stripe_session_id, language,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, datetime('now'), datetime('now'))
  `);
  
  const result = insertOrder.run(
    orderReference,
    userId || null,
    customerEmail,
    customerName,
    customerFirstName,
    customerLastName,
    customerCountry || null,
    totalAmountUsd,
    currency,
    exchangeRate,
    totalAmountDisplay,
    stripeSessionId || null,
    language
  );
  
  const orderId = result.lastInsertRowid as number;
  
  // Insert order items
  const insertItem = database.prepare(`
    INSERT INTO shop_order_items (
      order_id, product_id, product_sku, product_name_en, product_name_es,
      quantity, unit_price_usd, total_price_usd
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const item of items) {
    insertItem.run(
      orderId,
      item.product_id,
      item.sku,
      item.name_en,
      item.name_es,
      item.quantity,
      item.price_usd,
      item.price_usd * item.quantity
    );
  }
  
  return getOrderById(orderId)!;
}

export function getOrderById(id: number): Order | null {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_orders WHERE id = ?');
  return stmt.get(id) as Order | null;
}

export function getOrderByReference(reference: string): Order | null {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_orders WHERE order_reference = ?');
  return stmt.get(reference) as Order | null;
}

export function getOrderByStripeSession(sessionId: string): Order | null {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_orders WHERE stripe_session_id = ?');
  return stmt.get(sessionId) as Order | null;
}

export function getOrderItems(orderId: number): OrderItem[] {
  const database = openDatabase();
  
  const stmt = database.prepare('SELECT * FROM shop_order_items WHERE order_id = ?');
  return stmt.all(orderId) as OrderItem[];
}

export function getOrderWithItems(orderId: number): OrderWithItems | null {
  const order = getOrderById(orderId);
  if (!order) return null;
  
  const items = getOrderItems(orderId);
  return { ...order, items };
}

export function updateOrderStatus(
  orderId: number,
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus,
  paymentIntentId?: string
): void {
  const database = openDatabase();
  
  let query = `
    UPDATE shop_orders 
    SET order_status = ?, updated_at = datetime('now')
  `;
  const params: (string | number)[] = [orderStatus];
  
  if (paymentStatus) {
    query += ', payment_status = ?';
    params.push(paymentStatus);
  }
  
  if (paymentIntentId) {
    query += ', stripe_payment_intent_id = ?';
    params.push(paymentIntentId);
  }
  
  if (orderStatus === 'completed') {
    query += ', completed_at = datetime("now")';
  }
  
  query += ' WHERE id = ?';
  params.push(orderId);
  
  database.prepare(query).run(...params);
}

export function getUserOrders(userId: number): Order[] {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT * FROM shop_orders 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `);
  
  return stmt.all(userId) as Order[];
}

// ============================================================================
// DOWNLOAD TOKEN OPERATIONS
// ============================================================================

export function createDownloadTokens(orderId: number): DownloadToken[] {
  const database = openDatabase();
  
  // Get order items
  const items = getOrderItems(orderId);
  const tokens: DownloadToken[] = [];
  
  const insertToken = database.prepare(`
    INSERT INTO shop_download_tokens (
      order_id, order_item_id, product_id, token, 
      max_downloads, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now', '+7 days'), datetime('now'))
  `);
  
  for (const item of items) {
    // Get product to check download settings
    const product = getProductById(item.product_id);
    if (!product) continue;
    
    const token = uuidv4();
    const result = insertToken.run(
      orderId,
      item.id,
      item.product_id,
      token,
      product.max_downloads
    );
    
    const tokenId = result.lastInsertRowid as number;
    const createdToken = database.prepare(
      'SELECT * FROM shop_download_tokens WHERE id = ?'
    ).get(tokenId) as DownloadToken;
    
    tokens.push(createdToken);
  }
  
  return tokens;
}

export function getDownloadToken(token: string): DownloadTokenWithProduct | null {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      dt.*,
      p.name_en as product_name_en,
      p.name_es as product_name_es,
      p.download_file_path,
      p.file_format
    FROM shop_download_tokens dt
    JOIN shop_products p ON dt.product_id = p.id
    WHERE dt.token = ?
  `);
  
  return stmt.get(token) as DownloadTokenWithProduct | null;
}

export function isDownloadValid(token: DownloadTokenWithProduct): {
  valid: boolean;
  reason?: string;
} {
  // Check if expired
  const expiresAt = new Date(token.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, reason: 'expired' };
  }
  
  // Check download count
  if (token.download_count >= token.max_downloads) {
    return { valid: false, reason: 'max_downloads_reached' };
  }
  
  return { valid: true };
}

/**
 * Validate a download token and return the token data if valid
 */
export function validateDownloadToken(token: string): {
  valid: boolean;
  downloadToken?: DownloadTokenWithProduct;
  error?: string;
} {
  const downloadToken = getDownloadToken(token);
  
  if (!downloadToken) {
    return { valid: false, error: 'Token not found or expired' };
  }
  
  const validation = isDownloadValid(downloadToken);
  
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.reason === 'expired'
        ? 'Download link has expired'
        : 'Maximum downloads reached',
      downloadToken,
    };
  }
  
  return { valid: true, downloadToken };
}


export function incrementDownloadCount(tokenId: number): void {
  const database = openDatabase();
  
  database.prepare(`
    UPDATE shop_download_tokens 
    SET download_count = download_count + 1
    WHERE id = ?
  `).run(tokenId);
}

export function getOrderDownloadTokens(orderId: number): DownloadTokenWithProduct[] {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT 
      dt.*,
      p.name_en as product_name_en,
      p.name_es as product_name_es,
      p.download_file_path,
      p.file_format
    FROM shop_download_tokens dt
    JOIN shop_products p ON dt.product_id = p.id
    WHERE dt.order_id = ?
  `);
  
  return stmt.all(orderId) as DownloadTokenWithProduct[];
}

// ============================================================================
// USER OPERATIONS (Shared with Schedule system)
// ============================================================================

export function getUserById(id: number): User | null {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT id, email, first_name, middle_name, last_name, phone, 
           country_code, timezone, language, email_verified, created_at, updated_at
    FROM users WHERE id = ?
  `);
  
  return stmt.get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const database = openDatabase();
  
  const stmt = database.prepare(`
    SELECT id, email, first_name, middle_name, last_name, phone, 
           country_code, timezone, language, email_verified, created_at, updated_at
    FROM users WHERE email = ?
  `);
  
  return stmt.get(email) as User | null;
}

export function linkOrderToUser(orderId: number, userId: number): void {
  const database = openDatabase();
  
  database.prepare(`
    UPDATE shop_orders 
    SET user_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(userId, orderId);
}

// ============================================================================
// EMAIL LOG OPERATIONS
// ============================================================================

export function logEmail(
  emailType: string,
  recipientEmail: string,
  orderId?: number,
  status: 'sent' | 'failed' | 'pending' = 'sent',
  errorMessage?: string
): void {
  const database = openDatabase();
  
  database.prepare(`
    INSERT INTO shop_email_logs (
      email_type, recipient_email, order_id, status, error_message, sent_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(emailType, recipientEmail, orderId || null, status, errorMessage || null);
}

// ============================================================================
// STATISTICS (For admin dashboard)
// ============================================================================

export function getShopStats(): {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeProducts: number;
  productsByLanguage: {
    en: number;
    es: number;
    both: number;
    neutral: number;
  };
} {
  const database = openDatabase();
  
  const totalOrders = (database.prepare(
    'SELECT COUNT(*) as count FROM shop_orders'
  ).get() as { count: number }).count;
  
  const completedOrders = (database.prepare(
    "SELECT COUNT(*) as count FROM shop_orders WHERE order_status = 'completed'"
  ).get() as { count: number }).count;
  
  const totalRevenue = (database.prepare(
    "SELECT COALESCE(SUM(total_amount_usd), 0) as total FROM shop_orders WHERE payment_status = 'paid'"
  ).get() as { total: number }).total;
  
  const totalProducts = (database.prepare(
    'SELECT COUNT(*) as count FROM shop_products'
  ).get() as { count: number }).count;
  
  const activeProducts = (database.prepare(
    'SELECT COUNT(*) as count FROM shop_products WHERE is_active = 1'
  ).get() as { count: number }).count;
  
  const languageCounts = getProductLanguageCounts();
  
  return {
    totalOrders,
    completedOrders,
    totalRevenue,
    totalProducts,
    activeProducts,
    productsByLanguage: {
      en: languageCounts.en,
      es: languageCounts.es,
      both: languageCounts.both,
      neutral: languageCounts.neutral,
    },
  };
}

// ============================================================================
// SCHEMA INITIALIZATION
// ============================================================================

export function initializeShopTables(): void {
  const database = openDatabase();
  
  database.exec(`
    -- Categories table
    CREATE TABLE IF NOT EXISTS shop_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      name_es VARCHAR(255) NOT NULL,
      description_en TEXT,
      description_es TEXT,
      icon VARCHAR(50),
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Products table (with content_language)
    CREATE TABLE IF NOT EXISTS shop_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku VARCHAR(50) UNIQUE NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      name_es VARCHAR(255) NOT NULL,
      description_en TEXT,
      description_es TEXT,
      short_description_en VARCHAR(500),
      short_description_es VARCHAR(500),
      price_usd DECIMAL(10,2) NOT NULL,
      product_type VARCHAR(50) DEFAULT 'audio',
      category_id INTEGER REFERENCES shop_categories(id),
      content_language VARCHAR(4) DEFAULT NULL,
      image_url VARCHAR(500),
      download_file_path VARCHAR(500),
      download_expiry_hours INTEGER DEFAULT 168,
      max_downloads INTEGER DEFAULT 5,
      file_format VARCHAR(50),
      file_size_mb DECIMAL(10,2),
      duration_minutes INTEGER,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Orders table
    CREATE TABLE IF NOT EXISTS shop_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_reference VARCHAR(20) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      customer_email VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_first_name VARCHAR(100),
      customer_last_name VARCHAR(100),
      customer_country VARCHAR(2),
      total_amount_usd DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      exchange_rate DECIMAL(10,4),
      total_amount_display DECIMAL(10,2),
      order_status VARCHAR(20) DEFAULT 'pending',
      payment_status VARCHAR(20) DEFAULT 'pending',
      stripe_session_id VARCHAR(255),
      stripe_payment_intent_id VARCHAR(255),
      language VARCHAR(2) DEFAULT 'en',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );
    
    -- Order items table
    CREATE TABLE IF NOT EXISTS shop_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES shop_products(id),
      product_sku VARCHAR(50) NOT NULL,
      product_name_en VARCHAR(255) NOT NULL,
      product_name_es VARCHAR(255) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price_usd DECIMAL(10,2) NOT NULL,
      total_price_usd DECIMAL(10,2) NOT NULL
    );
    
    -- Download tokens table
    CREATE TABLE IF NOT EXISTS shop_download_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
      order_item_id INTEGER NOT NULL REFERENCES shop_order_items(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES shop_products(id),
      token VARCHAR(36) UNIQUE NOT NULL,
      download_count INTEGER DEFAULT 0,
      max_downloads INTEGER DEFAULT 5,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Email logs table
    CREATE TABLE IF NOT EXISTS shop_email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_type VARCHAR(50) NOT NULL,
      recipient_email VARCHAR(255) NOT NULL,
      order_id INTEGER REFERENCES shop_orders(id),
      status VARCHAR(20) DEFAULT 'sent',
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);
    CREATE INDEX IF NOT EXISTS idx_shop_products_active ON shop_products(is_active);
    CREATE INDEX IF NOT EXISTS idx_shop_products_slug ON shop_products(slug);
    CREATE INDEX IF NOT EXISTS idx_shop_products_content_language ON shop_products(content_language);
    CREATE INDEX IF NOT EXISTS idx_shop_products_active_language ON shop_products(is_active, content_language);
    CREATE INDEX IF NOT EXISTS idx_shop_orders_reference ON shop_orders(order_reference);
    CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_shop_orders_email ON shop_orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_shop_orders_stripe ON shop_orders(stripe_session_id);
    CREATE INDEX IF NOT EXISTS idx_shop_download_tokens_token ON shop_download_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_shop_download_tokens_order ON shop_download_tokens(order_id);
  `);
  
  console.log('✅ Shop tables initialized successfully');
}

