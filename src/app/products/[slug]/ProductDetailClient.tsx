// SHOP_src_app_products_[slug]_ProductDetailClient.tsx
// Version: 1.2.2 | Created: 2026-02-01 | Last Modified: 2026-03-29 | Author: Open Gateways Team
// Description: Product detail client component with add to cart functionality
// ✅ Dynamic text overlay image zone (650/550 aspect ratio)
// ✅ Music category (id=6) uses contained static cover art

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import ProductCard from '@/components/ProductCard';
import type { ProductWithCategory, ContentLanguage } from '@/types';

interface ProductDetailClientProps {
  product: ProductWithCategory;
  relatedProducts: ProductWithCategory[];
}

/**
 * Get language badge configuration based on content language
 */
function getLanguageBadge(contentLanguage: ContentLanguage): {
  flag: string;
  label: string;
  className: string;
} | null {
  switch (contentLanguage) {
    case 'en':
      return { flag: '🇺🇸', label: 'EN', className: 'badge-en' };
    case 'es':
      return { flag: '🇲🇽', label: 'ES', className: 'badge-es' };
    case 'both':
      return { flag: '🌐', label: 'EN/ES', className: 'badge-both' };
    case null:
    default:
      return null;
  }
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addToCart, isInCart } = useCart();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isAdding, setIsAdding] = useState(false);
  
  const name = language === 'es' ? product.name_es : product.name_en;
  const description = language === 'es' ? product.description_es : product.description_en;
  const shortDescription = language === 'es' ? product.short_description_es : product.short_description_en;
  const categoryName = product.category_name_en
    ? (language === 'es' ? product.category_name_es : product.category_name_en)
    : null;
  
  const inCart = isInCart(product.id);

  // Dynamic card config
  const useStaticImage = product.category_id === 6;
  // Text/shadow colours per category — background image now comes from the DB
  const CAT_STYLE: Record<number, { textColor: string; shadowColor: string }> = {
    1: { textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },
    2: { textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },
    3: { textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },
    4: { textColor: '#0058b5', shadowColor: 'rgba(80,80,80,0.55)' },
    5: { textColor: '#0058b5', shadowColor: 'rgba(80,80,80,0.55)' },
  };
  const DEFAULT_BG = '/assets/images/shop/bg-group1.jpg';
  const catStyle = CAT_STYLE[product.category_id ?? 1] ?? CAT_STYLE[1];
  const catBgImage = product.category_background_image || DEFAULT_BG;
  const nameSub = language === 'es' ? product.name_sub_es : product.name_sub_en;
    
  // Get language badge for this product
  const languageBadge = getLanguageBadge(product.content_language);
  
  const handleAddToCart = () => {
    if (inCart) return;
    
    setIsAdding(true);
    addToCart(product);
    
    setTimeout(() => setIsAdding(false), 1500);
  };
  
  return (
    <main className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">{t.home}</Link>
          <span className="separator">/</span>
          <Link href="/products">{t.products}</Link>
          {categoryName && (
            <>
              <span className="separator">/</span>
              <Link href={`/products?category=${product.category_slug}`}>{categoryName}</Link>
            </>
          )}
          <span className="separator">/</span>
          <span className="current">{name}</span>
        </nav>
        
        {/* Product Content */}
        <div className="product-layout">
          {/* Image zone — 650/550 aspect ratio */}
          <div className="product-image-section">
            <div className="product-image-container glass-card">
              {useStaticImage ? (
                /* ── Music: contained static cover art ───────────── */
                product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="product-image-contained"
                    priority
                  />
                ) : (
                  <div className="product-image-placeholder">
                    <span>🎵</span>
                  </div>
                )
              ) : (
                /* ── Dynamic: background image + title/subtitle overlay ── */
                <>
                  <div
                    className="detail-card-bg"
                    style={{ backgroundImage: `url(${catBgImage})` }}
                  />
                  <div className="detail-card-text-zone">
                    <div
                      className="detail-card-title"
                      style={{
                        color: catStyle.textColor,
                        textShadow: `1.5px 2px 4px ${catStyle.shadowColor}`,
                      }}
                    >
                      {name}
                    </div>
                    {nameSub && (
                      <div
                        className="detail-card-subtitle"
                        style={{
                          color: catStyle.textColor,
                          textShadow: `1.5px 2px 4px ${catStyle.shadowColor}`,
                        }}
                      >
                        {nameSub}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Info */}
          <div className="product-info-section">
            {/* Badges row: language + category */}
            {(languageBadge || categoryName) && (
              <div className="product-badges-row">
                {languageBadge && (
                  <span className={`product-language-badge ${languageBadge.className}`}>
                    {languageBadge.flag} {languageBadge.label}
                  </span>
                )}
                {categoryName && (
                  <span className="product-category-badge">{categoryName}</span>
                )}
              </div>
            )}
            
            <h1 className="product-title">{name}</h1>

            {product.content_language && product.content_language !== 'both' && product.content_language !== language && (
              <p className="product-recorded-in">
                {t.recordedInSingular} {product.content_language === 'en' ? t.englishProducts : t.spanishProducts}
              </p>
            )}

            {shortDescription && (
              <p className="product-short-desc">{shortDescription}</p>
            )}
            
            {/* Meta info */}
            <div className="product-meta">
              {product.duration_minutes && (
                <div className="meta-item">
                  <span className="meta-icon">⏱</span>
                  <span>{t.duration}: {product.duration_minutes} min</span>
                </div>
              )}
              {product.file_format && (
                <div className="meta-item">
                  <span className="meta-icon">📄</span>
                  <span>
                    {t.format}: {product.file_format.toUpperCase()}
                    {product.file_count && product.file_count > 1 && (
                      language === 'es'
                        ? ` que contiene ${product.file_count} ficheros MP3`
                        : ` containing ${product.file_count} MP3 files`
                    )}
                  </span>
                </div>
              )}
              {product.file_size_mb && (
                <div className="meta-item">
                  <span className="meta-icon">💾</span>
                  <span>{t.fileSize}: {product.file_size_mb} MB</span>
                </div>
              )}
            </div>
            
            {/* Price and Add to Cart */}
            <div className="product-purchase">
              <div className="product-price">{formatPrice(product.price_usd)}</div>
              
              <button
                className={`btn btn-primary add-to-cart-btn ${inCart || isAdding ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={inCart || isAdding}
              >
                {inCart || isAdding ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {t.addedToCart}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    {t.addToCart}
                  </>
                )}
              </button>
            </div>
            
            {/* Download info */}
            <div className="download-info glass-card">
              <div className="download-info-icon">📥</div>
              <div className="download-info-text">
                <strong>{t.instantAccess}</strong>
                <p>{language === 'es'
                  ? 'Descarga disponible inmediatamente después de la compra'
                  : 'Download available immediately after purchase'
                }</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Full Description */}
        {description && (
          <section className="product-description-section glass-card">
            <h2>{t.description}</h2>
            <div className="description-content" dangerouslySetInnerHTML={{ __html: description }} />
          </section>
        )}

        {/* Copyright notice */}
        {product.release_year && (
          <div className="copyright-notice">
            {language === 'es'
              ? `© ${product.release_year} Open Gateways, Inc. – Todos los derechos reservados.`
              : `Copyright © ${product.release_year} Open Gateways, Inc. – All rights reserved.`
            }
          </div>
        )}
       
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <h2>{t.relatedProducts}</h2>
            <div className="products-grid">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
      
      <style jsx>{`
        .product-detail-page {
          padding: 24px 0 80px;
        }
        
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        
        .breadcrumb a {
          color: var(--color-text-muted);
        }
        
        .breadcrumb a:hover {
          color: var(--color-primary);
        }
        
        .breadcrumb .separator {
          color: var(--color-text-muted);
          opacity: 0.5;
        }
        
        .breadcrumb .current {
          color: var(--color-text-primary);
        }
        
        .product-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
        }
        
        /* ── Image zone: 650/550 for all detail cards ──────────── */
        .product-image-container {
          position: relative;
          aspect-ratio: 650 / 550;
          overflow: hidden;
        }
        
        /* Music: contained static image with neutral background */
        .product-image-contained {
          object-fit: contain;
          background: linear-gradient(135deg, #dce6ee, #e8e4dc);
        }
        
        .product-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #dce6ee, #e8e4dc);
        }
        
        .product-image-placeholder span {
          font-size: 80px;
          opacity: 0.5;
        }
        
        /* Dynamic card background */
        .detail-card-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: top center;
          background-repeat: no-repeat;
        }
        
        /* Text overlay zone — same geometry as product list card */
        .detail-card-text-zone {
          position: absolute;
          left: 8.3%;
          right: 8.3%;
          top: 50.9%;
          bottom: 5.45%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .detail-card-title {
          font-family: 'PalatinoOG', 'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif;
          font-size: clamp(20px, 3.5vw, 36px);
          font-weight: normal;
          line-height: 1.35;
          text-align: center;
          letter-spacing: -0.01em;
          text-wrap: balance;
        }
        
        .detail-card-subtitle {
          font-family: 'MyriadProItalic', 'Palatino Linotype', Georgia, serif;
          font-size: clamp(15px, 2.5vw, 24px);
          font-weight: normal;
          font-style: italic;
          line-height: 1.4;
          text-align: center;
          margin-top: 10px;
          max-width: 75%;
          text-wrap: balance;
        }
        
        .product-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        
        .product-language-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: white;
        }
        
        .product-language-badge.badge-en {
          background: rgba(37, 99, 235, 0.9);
        }
        
        .product-language-badge.badge-es {
          background: rgba(22, 163, 74, 0.9);
        }
        
        .product-language-badge.badge-both {
          background: rgba(124, 58, 237, 0.9);
        }
        
        .product-category-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(1, 132, 246, 0.1);
          color: var(--color-primary);
          border-radius: 50px;
          font-size: 0.85rem;
        }
        
        .product-title {
          font-size: 2rem;
          margin: 0 0 8px 0;
          color: var(--color-text-primary);
        }
        
        .product-recorded-in {
          font-size: 1.58rem;
          color: var(--color-text-secondary);
          font-style: italic;
          margin: 0 0 16px 0;
        }
        
        .product-short-desc {
          font-size: 1.1rem;
          color: var(--color-text-secondary);
          margin: 0 0 24px 0;
          line-height: 1.6;
        }
        
        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        
        .meta-icon {
          font-size: 1rem;
        }
        
        .product-purchase {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .product-price {
          font-size: 2rem;
          font-weight: 500;
          color: var(--color-primary);
        }
        
        .add-to-cart-btn {
          font-size: 1rem;
          padding: 14px 32px;
        }
        
        .add-to-cart-btn.added {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }
        
        .download-info {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }
        
        .download-info-icon {
          font-size: 32px;
        }
        
        .download-info-text strong {
          display: block;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        
        .download-info-text p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        
        .product-description-section {
          padding: 32px;
          margin-bottom: 48px;
        }
        
        .product-description-section h2 {
          margin: 0 0 20px 0;
          color: var(--color-primary);
        }
        
        .description-content {
          color: var(--color-text-secondary);
          line-height: 1.7;
          white-space: pre-line;
        }

        .copyright-notice {
          margin-top: -32px;
          margin-bottom: 40px;
          padding: 8px 16px;
          font-size: 0.82rem;
          color: var(--color-text-muted);
          text-align: center;
        }
        
        .related-products-section {
          padding-top: 32px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .related-products-section h2 {
          margin: 0 0 24px 0;
          color: var(--color-text-primary);
        }
        
        @media (max-width: 768px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .product-title {
            font-size: 1.5rem;
          }
          
          .product-purchase {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .product-price {
            font-size: 1.5rem;
          }
          
          .add-to-cart-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

