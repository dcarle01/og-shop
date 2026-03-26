// SHOP_src_app_CategoryGrid.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
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
          
          return (
            <Link 
              key={category.id} 
              href={`/products?category=${category.slug}`}
              className="category-card glass-card glass-card-hover"
            >
              <div className="category-icon">{icon}</div>
              <h3 className="category-name">{name}</h3>
              {description && (
                <p className="category-description">{description}</p>
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
          align-items: center;
          text-align: center;
          padding: 32px 24px;
          text-decoration: none;
          color: inherit;
        }
        
        .category-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .category-name {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: var(--color-text-primary);
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
          
          .category-card {
            padding: 24px 16px;
          }
          
          .category-icon {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
