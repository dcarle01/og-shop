#!/bin/bash
# ============================================================================
# OPEN GATEWAYS SHOP - DATABASE MIGRATION RUNNER
# ============================================================================
# Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
# 
# USAGE:
#   chmod +x run_shop_migration.sh
#   ./run_shop_migration.sh
#
# Or specify a custom database path:
#   ./run_shop_migration.sh /path/to/opengateways.db
# ============================================================================

# Default database path
DEFAULT_DB_PATH="/home/openga9/public_html/assets/database/opengateways.db"

# Use provided path or default
DB_PATH="${1:-$DEFAULT_DB_PATH}"

# Script directory (where migration SQL is located)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/shop_migration.sql"

echo "============================================"
echo "Open Gateways Shop - Database Migration"
echo "============================================"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at: $DB_PATH"
    echo ""
    echo "Please specify the correct path:"
    echo "  ./run_shop_migration.sh /path/to/opengateways.db"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "ERROR: Migration file not found at: $MIGRATION_FILE"
    exit 1
fi

echo "Database: $DB_PATH"
echo "Migration: $MIGRATION_FILE"
echo ""

# Create backup
BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
echo "Creating backup: $BACKUP_PATH"
cp "$DB_PATH" "$BACKUP_PATH"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create backup"
    exit 1
fi

echo "Backup created successfully."
echo ""

# Run migration
echo "Running migration..."
echo ""

sqlite3 "$DB_PATH" < "$MIGRATION_FILE"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Migration failed!"
    echo "Restoring from backup..."
    cp "$BACKUP_PATH" "$DB_PATH"
    exit 1
fi

echo ""
echo "Migration completed successfully!"
echo ""

# Verify tables
echo "Verifying tables..."
echo ""

sqlite3 "$DB_PATH" << 'EOF'
.headers on
.mode column

SELECT '=== Shop Tables Created ===' as '';
SELECT name as table_name FROM sqlite_master 
WHERE type='table' AND name LIKE 'shop_%' 
ORDER BY name;

SELECT '' as '';
SELECT '=== Categories ===' as '';
SELECT id, slug, name_en, is_active FROM shop_categories;

SELECT '' as '';
SELECT '=== Products ===' as '';
SELECT id, sku, name_en, price_usd, is_active, is_featured FROM shop_products;

SELECT '' as '';
SELECT '=== Table Row Counts ===' as '';
SELECT 'shop_categories' as table_name, COUNT(*) as rows FROM shop_categories
UNION ALL
SELECT 'shop_products', COUNT(*) FROM shop_products
UNION ALL
SELECT 'shop_orders', COUNT(*) FROM shop_orders
UNION ALL
SELECT 'shop_order_items', COUNT(*) FROM shop_order_items
UNION ALL
SELECT 'shop_download_tokens', COUNT(*) FROM shop_download_tokens
UNION ALL
SELECT 'shop_email_logs', COUNT(*) FROM shop_email_logs;
EOF

echo ""
echo "============================================"
echo "Migration complete!"
echo ""
echo "Backup saved at: $BACKUP_PATH"
echo ""
echo "Next steps:"
echo "  1. Copy shop files to shop.opengateways.com"
echo "  2. Create .env.local with your API keys"
echo "  3. Run: npm install && npm run dev"
echo "============================================"
