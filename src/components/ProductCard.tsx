// SHOP_src_components_ProductCard.tsx
// Version: 2.1.0 | Created: 2026-01-28 | Last Modified: 2026-03-14 | Author: Open Gateways Team
// Description: Product card component — dynamic text overlay on background image
// ✅ Added content language badge for hybrid catalog organization
// ✅ Dynamic text overlay (title + subtitle) replaces per-product image files
// ✅ Music category (id=6) uses contained static cover art within 650/550 zone
// ✅ All cards use 650/550 aspect ratio
// ✅ Auto-scale: text that overflows zone is scaled down to fit without clipping

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import type { Product, ProductWithCategory, ContentLanguage } from '@/types';

interface ProductCardProps {
  product: Product | ProductWithCategory;
  showLanguageBadge?: boolean;  // Default: true
}

// Background image and text colour per category.
// Music (cat 6) uses static cover art — handled separately in the component.
const CAT_BG: Record<number, { bg: string; textColor: string; shadowColor: string }> = {
  1: { bg: '/assets/images/shop/bg-group4.jpg', textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },  // 3-Day Retreats
  2: { bg: '/assets/images/shop/bg-group3.jpg', textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },  // 2-Day Workshops
  3: { bg: '/assets/images/shop/bg-group2.jpg', textColor: '#ffffff', shadowColor: 'rgba(0,0,0,0.65)' },  // 1-Day Workshops
  4: { bg: '/assets/images/shop/bg-group1.jpg', textColor: '#0058b5', shadowColor: 'rgba(80,80,80,0.55)' }, // 3-Hour Sessions
  5: { bg: '/assets/images/shop/bg-group1.jpg', textColor: '#0058b5', shadowColor: 'rgba(80,80,80,0.55)' }, // 1-Hour Talks
};

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
      return null;  // No badge for language-neutral products (music)
  }
}

export default function ProductCard({ product, showLanguageBadge = true }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isAdding, setIsAdding] = useState(false);
  
  const name = language === 'es' ? product.name_es : product.name_en;
  const shortDescription = language === 'es'
    ? product.short_description_es
    : product.short_description_en;
  
  const inCart = isInCart(product.id);
  
  // Dynamic card config
  const useStaticImage = product.category_id === 6;
  const catConfig = CAT_BG[product.category_id ?? 1] ?? CAT_BG[1];
  const nameSub = language === 'es' ? product.name_sub_es : product.name_sub_en;

  // Auto-scale: shrink text to fit zone when title+subtitle overflow vertically
  const textZoneRef  = useRef<HTMLDivElement>(null);
  const textInnerRef = useRef<HTMLDivElement>(null);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    if (useStaticImage) return;
    const zone  = textZoneRef.current;
    const inner = textInnerRef.current;
    if (!zone || !inner) return;

    // Reset scale so we measure the natural (unscaled) size
    setFontScale(1);

    // Defer measurement until after paint so DOM reflects the reset
    const id = requestAnimationFrame(() => {
      const zoneH  = zone.clientHeight;
      const innerH = inner.scrollHeight;
      if (innerH > zoneH && zoneH > 0) {
        // Scale down with a small buffer so text never sits flush at the edge
        setFontScale((zoneH / innerH) * 0.97);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [name, nameSub, useStaticImage]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inCart) return;
    
    setIsAdding(true);
    addToCart(product);
    
    setTimeout(() => setIsAdding(false), 1500);
  };
  
  // Get category name if available
  const categoryName = 'category_name_en' in product
    ? (language === 'es' ? product.category_name_es : product.category_name_en)
    : null;
  
  // Get language badge
  const languageBadge = showLanguageBadge
    ? getLanguageBadge(product.content_language)
    : null;
  
  return (
    <article className="product-card glass-card-hover">
      <Link
        href={`/products/${product.slug}`}
        className="product-link"
        onClick={() => sessionStorage.setItem('og_products_returning', '1')}
      >
        {/* Image zone — 650/550 aspect ratio for all cards */}
        <div className="product-image-container">
          {useStaticImage ? (
            /* ── Music: contained static cover art ───────────────── */
            product.image_url ? (
              <Image
                src={product.image_url}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="product-image-contained"
              />
            ) : (
              <div className="product-image-placeholder">
                <span className="placeholder-icon">🎵</span>
              </div>
            )
          ) : (
            /* ── Dynamic: background image + title/subtitle overlay ─ */
            <>
              <div
                className="card-bg-image"
                style={{ backgroundImage: `url(${catConfig.bg})` }}
              />
              <div ref={textZoneRef} className="card-text-zone">
                <div
                  ref={textInnerRef}
                  className="card-text-inner"
                  style={{
                    transform: fontScale < 1 ? `scale(${fontScale})` : undefined,
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    className="card-title-text"
                    style={{
                      color: catConfig.textColor,
                      textShadow: `1.5px 2px 4px ${catConfig.shadowColor}`,
                    }}
                  >
                    {name}
                  </div>
                  {nameSub && (
                    <div
                      className="card-subtitle-text"
                      style={{
                        color: catConfig.textColor,
                        textShadow: `1.5px 2px 4px ${catConfig.shadowColor}`,
                      }}
                    >
                      {nameSub}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Language + category badges — top left, inline row */}
          {(languageBadge || categoryName) && (
            <div className="card-badges-row">
              {languageBadge && (
                <span className={`language-badge ${languageBadge.className}`}>
                  {languageBadge.flag} {languageBadge.label}
                </span>
              )}
              {categoryName && (
                <span className="product-category">
                  {categoryName}
                </span>
              )}
            </div>
          )}
          
          {/* Featured badge - top right */}
          {product.is_featured && (
            <span className="product-featured">★</span>
          )}
        </div>
        
        {/* Content */}
        <div className="product-content">
          <h3 className="product-title">{name}</h3>
          
          {shortDescription && (
            <p className="product-description">{shortDescription}</p>
          )}
          
          {/* Meta info */}
          <div className="product-meta">
            {product.duration_minutes && (
              <span className="product-duration">
                ⏱ {product.duration_minutes} min
              </span>
            )}
            {product.file_format && (
              <span className="product-format">
                {product.file_format.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Price and Add button */}
          <div className="product-footer">
            <span className="product-price">{formatPrice(product.price_usd)}</span>
            
            <button
              className={`product-add-btn ${inCart || isAdding ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={inCart || isAdding}
            >
              {inCart || isAdding ? (
                <>
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>{t.addedToCart}</span>
                </>
              ) : (
                <>
                  <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>{t.addToCart}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
      
      <style jsx>{`
        .product-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        
        /* ── Image zone: 650/550 for all cards ──────────────────── */
        .product-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 650 / 550;
          overflow: hidden;
        }
        
        /* Music: contained static image with neutral background */
        .product-image-contained {
          object-fit: contain;
          background: linear-gradient(135deg, #dce6ee, #e8e4dc);
        }
        
        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #dce6ee, #e8e4dc);
        }
        
        .placeholder-icon {
          font-size: 48px;
          opacity: 0.5;
        }
        
        /* Dynamic card: background image fills the zone */
        .card-bg-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: top center;
          background-repeat: no-repeat;
        }
        
        /* Text overlay zone — mirrors POC geometry:
           top: 250px+30px gap / 550px = 50.9%
           bottom: 30px / 550px = 5.45%
           left/right: 54px / 650px = 8.3% */
        .card-text-zone {
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
        
        /* Inner wrapper receives the scale transform when text overflows */
        .card-text-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .card-title-text {
          font-family: 'PalatinoOG', 'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif;
          font-size: clamp(16px, 4.15vw, 27px);
          font-weight: normal;
          line-height: 1.35;
          text-align: center;
          letter-spacing: -0.01em;
        }
        
        .card-subtitle-text {
          font-family: 'MyriadProItalic', 'Palatino Linotype', Georgia, serif;
          font-size: clamp(12px, 2.77vw, 18px);
          font-weight: normal;
          font-style: italic;
          line-height: 1.4;
          text-align: center;
          margin-top: 10px;
          max-width: 75%;
        }
        
        /* Badge row — top left, language + category inline */
        .card-badges-row {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          z-index: 2;
          max-width: calc(100% - 48px);
        }

        .language-badge {
          padding: 4px 10px;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        
        .badge-en {
          background: rgba(37, 99, 235, 0.9);
          color: white;
        }
        
        .badge-es {
          background: rgba(22, 163, 74, 0.9);
          color: white;
        }
        
        .badge-both {
          background: rgba(124, 58, 237, 0.9);
          color: white;
        }
        
        .product-category {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50px;
          font-size: 0.7rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        
        .product-featured {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
        }
        
        .product-content {
          padding: 20px;
        }
        
        .product-title {
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 8px 0;
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        
        .product-description {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .product-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }
        
        .product-duration,
        .product-format {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .product-format {
          padding: 2px 8px;
          background: #f1f5f9;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .product-price {
          font-family: 'Georgia', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-primary);
        }
        
        .product-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-family: 'Georgia', serif;
          font-size: 0.85rem;
          color: white;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          white-space: nowrap;
        }
        
        .product-add-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(1, 132, 246, 0.3);
        }
        
        .product-add-btn:disabled {
          cursor: default;
        }
        
        .product-add-btn.added {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }
        
        .product-add-btn .cart-icon,
        .product-add-btn .check-icon {
          width: 16px;
          height: 16px;
        }
        
        @media (max-width: 640px) {
          .product-content {
            padding: 16px;
          }
          
          .product-title {
            font-size: 1rem;
          }
          
          .product-price {
            font-size: 1.1rem;
          }
          
          .product-add-btn span {
            display: none;
          }
          
          .product-add-btn {
            padding: 10px;
          }
        }
      `}</style>
    </article>
  );
}


