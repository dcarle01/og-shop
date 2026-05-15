// SHOP_src_app_FeaturedProducts.tsx
// Version: 1.0.2 | Created: 2026-01-28 | Last Modified: 2026-04-23 | Author: Open Gateways Team
// Description: Featured products section for homepage

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import ProductCard from '@/components/ProductCard';
import type { ProductWithCategory } from '@/types';

export default function FeaturedProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const response = await fetch('/api/products?featured=true&limit=6');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeatured();
  }, []);
  
  if (isLoading) {
    return (
            <section className="section featured-section-loading">
            <div className="container">
            <div className="featured-loading">
            <div className="loading-spinner" />
            <p>{t.loading}</p>
            </div>
            </div>
            <style jsx>{`
          .featured-section-loading {
            padding: 40px 0;
          }
          .featured-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 0;
            color: var(--color-text-muted);
          }
          .featured-loading p {
            margin-top: 16px;
          }
        `}</style>
            </section>
            );
  }
  
  if (error || products.length === 0) {
    return null; // Don't show section if no featured products
  }
  
  return (
          <section className="section featured-section">
          <div className="container">
          <div className="featured-products">
          <div className="section-header">
          <h2>{products.length === 1 ? t.featuredProduct : t.featuredProducts}</h2>
          <Link href="/products" className="view-all-link">
          {t.viewAll} →
          </Link>
          </div>
          
          <div className="products-grid">
          {products.map((product) => (
                                      <ProductCard key={product.id} product={product} />
                                      ))}
          </div>
          </div>
          </div>
          
          <style jsx>{`
        .featured-section {
          padding: 40px 0;
        }
        
        @media (max-width: 768px) {
          .featured-section {
            padding: 32px 0;
          }
        }
        .featured-products {
          padding: 20px 0;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .section-header h2 {
          margin: 0;
          color: var(--color-text-primary);
        }
        
        .view-all-link {
          color: var(--color-primary);
          font-size: 0.95rem;
          transition: transform 0.2s ease;
        }
        
        .view-all-link:hover {
          transform: translateX(4px);
        }
        
        .featured-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          color: var(--color-text-muted);
        }
        
        /* Scoped override: cap card width at 368px (the 3-column layout width)
           and center the grid so 1-2 featured products appear balanced rather
           than left-aligned. Uses auto-fit so empty tracks collapse. */
        .featured-products :global(.products-grid) {
          grid-template-columns: repeat(auto-fit, minmax(280px, 368px));
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .featured-products :global(.products-grid) {
            grid-template-columns: repeat(auto-fit, minmax(240px, 368px));
          }
        }
        
        @media (max-width: 480px) {
          .featured-products :global(.products-grid) {
            grid-template-columns: 1fr;
          }
        }
        
        .featured-loading p {
          margin-top: 16px;
        }
      `}</style>
    </section>
  );
}
