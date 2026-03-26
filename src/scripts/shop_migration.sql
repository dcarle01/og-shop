-- ============================================================================
-- OPEN GATEWAYS SHOP - DATABASE MIGRATION
-- ============================================================================
-- Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
-- Description: Creates shop tables in shared opengateways.db
-- 
-- USAGE:
--   sqlite3 /path/to/opengateways.db < shop_migration.sql
--
-- Or run in DB Browser for SQLite
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Product categories for organizing the shop

CREATE TABLE IF NOT EXISTS shop_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_es VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_es TEXT,
    icon VARCHAR(50),                          -- Emoji or icon identifier
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Digital products available for purchase

CREATE TABLE IF NOT EXISTS shop_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,           -- Product SKU (e.g., OG-MED-001)
    slug VARCHAR(100) UNIQUE NOT NULL,         -- URL-friendly slug
    name_en VARCHAR(255) NOT NULL,
    name_es VARCHAR(255) NOT NULL,
    description_en TEXT,                       -- Full description (can include HTML)
    description_es TEXT,
    short_description_en VARCHAR(500),         -- Brief description for cards
    short_description_es VARCHAR(500),
    price_usd DECIMAL(10,2) NOT NULL,          -- Price in USD (base currency)
    product_type VARCHAR(50) DEFAULT 'audio',  -- audio, ebook, video, bundle
    category_id INTEGER REFERENCES shop_categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),                    -- Product image URL
    download_file_path VARCHAR(500),           -- Path to downloadable file
    download_expiry_hours INTEGER DEFAULT 168, -- Download link validity (7 days)
    max_downloads INTEGER DEFAULT 5,           -- Max download attempts per purchase
    file_format VARCHAR(50),                   -- mp3, pdf, zip, etc.
    file_size_mb DECIMAL(10,2),               -- File size in MB
    duration_minutes INTEGER,                  -- For audio/video products
    is_active INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Customer orders

CREATE TABLE IF NOT EXISTS shop_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_reference VARCHAR(20) UNIQUE NOT NULL,  -- Format: OG-XXXXXX-XXXX
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- NULL for guest checkout
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100),
    customer_last_name VARCHAR(100),
    customer_country VARCHAR(2),               -- ISO country code
    total_amount_usd DECIMAL(10,2) NOT NULL,   -- Total in USD
    currency VARCHAR(3) DEFAULT 'USD',         -- Display currency (USD or MXN)
    exchange_rate DECIMAL(10,4),               -- MXN/USD rate at time of purchase
    total_amount_display DECIMAL(10,2),        -- Total in display currency
    order_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
    stripe_session_id VARCHAR(255),            -- Stripe Checkout session ID
    stripe_payment_intent_id VARCHAR(255),     -- Stripe Payment Intent ID
    language VARCHAR(2) DEFAULT 'en',          -- en or es
    notes TEXT,                                -- Admin notes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME                      -- When order was completed
);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
-- Individual items in each order

CREATE TABLE IF NOT EXISTS shop_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES shop_products(id),
    product_sku VARCHAR(50) NOT NULL,          -- Snapshot of SKU at purchase
    product_name_en VARCHAR(255) NOT NULL,     -- Snapshot of name at purchase
    product_name_es VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price_usd DECIMAL(10,2) NOT NULL,     -- Price per unit at purchase
    total_price_usd DECIMAL(10,2) NOT NULL     -- quantity * unit_price
);

-- ============================================================================
-- DOWNLOAD TOKENS TABLE
-- ============================================================================
-- Secure download tokens for purchased products

CREATE TABLE IF NOT EXISTS shop_download_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    order_item_id INTEGER NOT NULL REFERENCES shop_order_items(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES shop_products(id),
    token VARCHAR(36) UNIQUE NOT NULL,         -- UUID token for download URL
    download_count INTEGER DEFAULT 0,          -- Number of times downloaded
    max_downloads INTEGER DEFAULT 5,           -- Maximum allowed downloads
    expires_at DATETIME NOT NULL,              -- Token expiration date
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EMAIL LOGS TABLE
-- ============================================================================
-- Track sent emails for orders

CREATE TABLE IF NOT EXISTS shop_email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_type VARCHAR(50) NOT NULL,           -- order_confirmation, download_reminder, etc.
    recipient_email VARCHAR(255) NOT NULL,
    order_id INTEGER REFERENCES shop_orders(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'sent',         -- sent, failed, pending
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_shop_categories_slug ON shop_categories(slug);
CREATE INDEX IF NOT EXISTS idx_shop_categories_active ON shop_categories(is_active);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_slug ON shop_products(slug);
CREATE INDEX IF NOT EXISTS idx_shop_products_sku ON shop_products(sku);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_featured ON shop_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_shop_products_type ON shop_products(product_type);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_shop_orders_reference ON shop_orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_email ON shop_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_shop_orders_stripe_session ON shop_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_payment ON shop_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_created ON shop_orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_product ON shop_order_items(product_id);

-- Download tokens indexes
CREATE INDEX IF NOT EXISTS idx_shop_download_tokens_token ON shop_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_shop_download_tokens_order ON shop_download_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_download_tokens_expires ON shop_download_tokens(expires_at);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_shop_email_logs_order ON shop_email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_email_logs_type ON shop_email_logs(email_type);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment these sections to add sample categories and products

-- Sample Categories
INSERT OR IGNORE INTO shop_categories (slug, name_en, name_es, description_en, description_es, icon, sort_order, is_active)
VALUES 
    ('meditations', 'Guided Meditations', 'Meditaciones Guiadas', 
     'Peaceful guided meditations channeled by Baratta', 
     'Meditaciones guiadas pacíficas canalizadas por Baratta',
     '🧘', 1, 1),
    ('workshops', 'Workshop Recordings', 'Grabaciones de Talleres',
     'Recordings from live workshops and teachings',
     'Grabaciones de talleres en vivo y enseñanzas',
     '📚', 2, 1),
    ('teachings', 'Spiritual Teachings', 'Enseñanzas Espirituales',
     'Deep spiritual wisdom and guidance',
     'Sabiduría y guía espiritual profunda',
     '✨', 3, 1),
    ('music', 'Healing Music', 'Música Sanadora',
     'Original healing and meditation music',
     'Música original de sanación y meditación',
     '🎵', 4, 1);

-- Sample Products
INSERT OR IGNORE INTO shop_products (
    sku, slug, name_en, name_es, 
    short_description_en, short_description_es,
    description_en, description_es,
    price_usd, product_type, category_id,
    download_file_path, file_format, duration_minutes,
    is_active, is_featured, sort_order
)
VALUES 
    -- Meditation 1
    ('OG-MED-001', 'morning-awakening-meditation',
     'Morning Awakening Meditation', 'Meditación de Despertar Matutino',
     'Start your day with clarity and peace', 'Comienza tu día con claridad y paz',
     '<p>This beautiful 20-minute guided meditation, channeled by Baratta, helps you begin each day with intention, clarity, and inner peace.</p><p>Perfect for daily practice, this meditation guides you through gentle breathing exercises and visualization techniques to set a positive tone for your entire day.</p>',
     '<p>Esta hermosa meditación guiada de 20 minutos, canalizada por Baratta, te ayuda a comenzar cada día con intención, claridad y paz interior.</p><p>Perfecta para la práctica diaria, esta meditación te guía a través de ejercicios de respiración suaves y técnicas de visualización para establecer un tono positivo para todo tu día.</p>',
     12.00, 'audio', 1,
     'meditations/morning-awakening.mp3', 'MP3', 20,
     1, 1, 1),
     
    -- Meditation 2
    ('OG-MED-002', 'deep-relaxation-journey',
     'Deep Relaxation Journey', 'Viaje de Relajación Profunda',
     'Release tension and find deep calm', 'Libera la tensión y encuentra calma profunda',
     '<p>Allow Baratta''s soothing voice to guide you into a state of profound relaxation. This 30-minute meditation helps release physical tension and quiet the mind.</p>',
     '<p>Permite que la voz calmante de Baratta te guíe a un estado de relajación profunda. Esta meditación de 30 minutos ayuda a liberar la tensión física y calmar la mente.</p>',
     15.00, 'audio', 1,
     'meditations/deep-relaxation.mp3', 'MP3', 30,
     1, 1, 2),
     
    -- Workshop
    ('OG-WKS-001', 'understanding-your-soul-path',
     'Understanding Your Soul Path', 'Entendiendo Tu Camino del Alma',
     'Discover your unique spiritual journey', 'Descubre tu viaje espiritual único',
     '<p>This comprehensive 90-minute workshop recording explores the nature of the soul''s journey and how to align with your unique spiritual path.</p><p>Topics include: Soul contracts, Life lessons, Spiritual growth markers, and Connecting with your higher self.</p>',
     '<p>Esta grabación completa de taller de 90 minutos explora la naturaleza del viaje del alma y cómo alinearte con tu camino espiritual único.</p><p>Los temas incluyen: Contratos del alma, Lecciones de vida, Marcadores de crecimiento espiritual y Conexión con tu yo superior.</p>',
     35.00, 'audio', 2,
     'workshops/soul-path-workshop.mp3', 'MP3', 90,
     1, 1, 1),
     
    -- Teaching
    ('OG-TCH-001', 'masculine-feminine-balance',
     'Masculine & Feminine Energy Balance', 'Equilibrio de Energía Masculina y Femenina',
     'Understand and balance your inner energies', 'Entiende y equilibra tus energías internas',
     '<p>Baratta shares profound insights on the masculine and feminine energies that exist within all of us, and how balancing these forces leads to greater harmony and wholeness.</p>',
     '<p>Baratta comparte profundas percepciones sobre las energías masculinas y femeninas que existen dentro de todos nosotros, y cómo equilibrar estas fuerzas conduce a una mayor armonía e integridad.</p>',
     18.00, 'audio', 3,
     'teachings/masculine-feminine.mp3', 'MP3', 45,
     1, 0, 1);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful

-- SELECT 'Tables created:' as info;
-- SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'shop_%';

-- SELECT 'Categories count:' as info, COUNT(*) as count FROM shop_categories;
-- SELECT 'Products count:' as info, COUNT(*) as count FROM shop_products;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
