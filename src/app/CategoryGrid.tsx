// SHOP_src_app_CategoryGrid.tsx
// Version: 1.0.1 | Created: 2026-01-28 | Last Modified: 2026-04-22 | Author: Open Gateways Team
// Description: Category grid section for homepage

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import type { Category } from '@/types';

// Category icon mapping
const categoryIcons: Record<string, string> = {
  'meditations': '🧘',
  'workshops': '📚',
  'teachings': '✨',
  'music': '🎵',
  'development': '🌱',
  'default': '📦',
};

// Category background image mapping (by slug)
const categoryBackgroundImages: Record<string, string> = {
  '3-day-retreats': '/assets/images/shop/category4.jpg',
  '2-day-workshops': '/assets/images/shop/category3.jpg',
  '1-day-workshops': '/assets/images/shop/category2.jpg',
  '3-hour-workshops': '/assets/images/shop/category1.jpg',
  '1-hour-talks': '/assets/images/shop/category5.jpg',
  'music': '/assets/images/shop/category6.jpg',
};

// Category title style overrides for backgrounds where white-on-dark-shadow
// doesn't provide sufficient contrast. Slugs not listed here fall back to
// the default (white text with dark shadow).
// Dark-blue values mirror the convention used in ProductCard.tsx for
// light-background product cards.
const categoryTitleStyles: Record<string, { color: string; textShadow: string }> = {
  '3-hour-workshops': {
    color: '#0058b5',
    textShadow: '1.5px 2px 4px rgba(80,80,80,0.55)',
  },
  '1-hour-talks': {
    color: '#0058b5',
    textShadow: '1.5px 2px 4px rgba(80,80,80,0.55)',
  },
};

export default function CategoryGrid() {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCategories();
  }, []);
  
  if (isLoading) {
    return (
      <div className="category-loading">
        <div className="loading-spinner" />
      </div>
    );
  }
  
  if (categories.length === 0) {
    return null;
  }
  
  return (
    <div className="category-section">
      <h2 className="section-title">{t.browseCategories}</h2>
      
      <div className="category-grid">
        {categories.map((category) => {
          const name = language === 'es' ? category.name_es : category.name_en;
          const description = language === 'es' ? category.description_es : category.description_en;
          const icon = category.icon || categoryIcons[category.slug] || categoryIcons.default;
          const backgroundImage = categoryBackgroundImages[category.slug] || category.background_image || '';
          
          return (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="category-card glass-card glass-card-hover"
            >
              <div
                className="category-top-region"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
              >
                <div className="category-top-half">
                  <div className="category-icon">{icon}</div>
                </div>
                <div className="category-bottom-half">
                  <h3
                    className="category-title-overlay"
                    style={{
                      color: categoryTitleStyles[category.slug]?.color ?? '#ffffff',
                      textShadow: categoryTitleStyles[category.slug]?.textShadow
                        ?? '0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {name}
                  </h3>
                </div>
              </div>
              {description && (
                <div className="category-bottom-region">
                  <p className="category-description">{description}</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      
      <style jsx>{`
        .category-section {
          padding: 20px 0;
        }
        
        .section-title {
          text-align: center;
          margin-bottom: 40px;
          color: var(--color-text-primary);
        }
        
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }
        
        .category-card {
          display: flex;
          flex-direction: column;
          text-align: center;
          text-decoration: none;
          color: inherit;
          padding: 0;
          overflow: hidden;
        }
        
        .category-top-region {
          position: relative;
          width: 100%;
          height: 200px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          border-top-left-radius: var(--border-radius-lg);
          border-top-right-radius: var(--border-radius-lg);
        }
        
        .category-top-half {
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 8px;
        }
        
        .category-bottom-half {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
        }
        
        .category-icon {
          font-size: 56px;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .category-title-overlay {
          margin: 0;
          font-family: 'PalatinoOG', Georgia, 'Times New Roman', serif;
          font-size: 1.35rem;
          font-weight: 400;
          line-height: 1.2;
          text-align: center;
          text-wrap: balance;
        }
        
        .category-bottom-region {
          padding: 20px 18px;
          background: rgba(255, 255, 255, 0.6);
          flex: 1;
        }
        
        .category-description {
          margin: 0;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }
        
        .category-loading {
          display: flex;
          justify-content: center;
          padding: 60px 0;
        }
        
        @media (max-width: 640px) {
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .category-top-region {
            height: 160px;
          }
          
          .category-icon {
            font-size: 36px;
          }
          
          .category-title-overlay {
            font-size: 1.1rem;
          }
          
          .category-bottom-region {
            padding: 16px 14px;
          }
          
          .category-description {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
