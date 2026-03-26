// SHOP_src_app_FeaturedProducts.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
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
      <div className="featured-loading">
        <div className="loading-spinner" />
        <p>{t.loading}</p>
      </div>
    );
  }
  
  if (error || products.length === 0) {
    return null; // Don't show section if no featured products
  }
  
  return (
    <div className="featured-products">
      <div className="section-header">
        <h2>{t.featuredProducts}</h2>
        <Link href="/products" className="view-all-link">
          {t.viewAll} →
        </Link>
      </div>
      
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      <style jsx>{`
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
        
        .featured-loading p {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
