// SHOP_src_app_products_page.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-30 | Author: Open Gateways Team
// Description: Products listing page with filtering, sorting, and language selection
// ✅ Added content language filter for hybrid catalog organization

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import type { ProductWithCategory, Category } from '@/types';

interface LanguageCounts {
  en: number;
  es: number;
  both: number;
  neutral: number;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const { currency } = useCurrency();
  
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languageCounts, setLanguageCounts] = useState<LanguageCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state — restore from sessionStorage when returning from product detail
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const urlCat = searchParams.get('category');
    if (urlCat !== null) return urlCat;
    if (typeof window !== 'undefined' &&
        sessionStorage.getItem('og_products_returning') === '1')
      return sessionStorage.getItem('og_filter_category') || '';
    return '';
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const urlLang = searchParams.get('lang');
    if (urlLang !== null) return urlLang;
    if (typeof window !== 'undefined' &&
        sessionStorage.getItem('og_products_returning') === '1')
      return sessionStorage.getItem('og_filter_language') || language;
    return language;
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined' &&
        sessionStorage.getItem('og_products_returning') === '1')
      return sessionStorage.getItem('og_filter_sort') || 'featured';
    return 'featured';
  });

  // Auto-filter tracking refs (not state — no re-render needed)
  const userHasSetFilters = useRef(false);      // true once user manually changes any filter
  const isFirstMount = useRef(true);            // guards effects from firing on initial render
  const explicitLangInSession = useRef<'en' | 'es' | null>(null); // tracks explicit lang selection

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);
  
  // Fetch products with filters
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (sortBy) params.set('sort', sortBy);
        params.set('include_counts', 'true');  // Get language breakdown
        
        // Handle language filter
        if (selectedLanguage && selectedLanguage !== 'all') {
          params.set('lang', selectedLanguage);
          // Always include neutral (music) when filtering by language
          params.set('include_neutral', 'true');
          params.set('include_both', 'true');
        }
        
        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data.products || []);
        if (data.language_counts) {
          setLanguageCounts(data.language_counts);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, selectedLanguage, sortBy]);
  
  // Clear the returning flag once filters have been applied from it
  useEffect(() => {
    sessionStorage.removeItem('og_products_returning');
  }, []);

  // Persist filters to sessionStorage so back-navigation can restore them
  useEffect(() => {
    sessionStorage.setItem('og_filter_category', selectedCategory);
    sessionStorage.setItem('og_filter_language', selectedLanguage);
    sessionStorage.setItem('og_filter_sort', sortBy);
  }, [selectedCategory, selectedLanguage, sortBy]);

  // Auto-apply language filter when UI language changes (rules 3 & 4)
  useEffect(() => {
    if (isFirstMount.current) return;
    if (userHasSetFilters.current) return;
    explicitLangInSession.current = language as 'en' | 'es';
    setSelectedCategory('');
    setSelectedLanguage(language);
  }, [language]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply language filter when currency changes (rules 1 & 2)
  useEffect(() => {
    if (isFirstMount.current) return;
    if (userHasSetFilters.current) return;
    const wantLang = currency === 'MXN' ? 'es' : 'en';
    // Skip if user explicitly set the opposite language this session
    if (explicitLangInSession.current !== null && explicitLangInSession.current !== wantLang) return;
    setSelectedCategory('');
    setSelectedLanguage(wantLang);
  }, [currency]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Set isFirstMount false — must run AFTER lang/currency effects so those see isFirstMount=true on first render
  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const url = new URL(window.location.href);
    
    if (selectedCategory) {
      url.searchParams.set('category', selectedCategory);
    } else {
      url.searchParams.delete('category');
    }
    
    if (selectedLanguage && selectedLanguage !== 'all') {
      url.searchParams.set('lang', selectedLanguage);
    } else {
      url.searchParams.delete('lang');
    }
    
    window.history.replaceState({}, '', url.toString());
  }, [selectedCategory, selectedLanguage]);
  
  // Calculate "other language" count for the hint
  const otherLanguage = language === 'es' ? 'en' : 'es';
  const otherLanguageCount = languageCounts ? languageCounts[otherLanguage] : 0;
  
  return (
    <main className="products-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>{t.allProducts}</h1>
        </div>
        
        {/* Filters */}
        <div className="filters-bar">
          {/* Category Filter */}
          <div className="filter-group">
            <label htmlFor="category-filter">{t.filterByCategory}</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => { userHasSetFilters.current = true; setSelectedCategory(e.target.value); }}
              className="form-select form-input"
            >
              <option value="">{t.allProducts}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.icon} {language === 'es' ? cat.name_es : cat.name_en}
                </option>
              ))}
            </select>
          </div>
          
          {/* Language Filter */}
          <div className="filter-group">
            <label htmlFor="language-filter">{t.filterByLanguage}</label>
            <select
              id="language-filter"
              value={selectedLanguage}
              onChange={(e) => { userHasSetFilters.current = true; setSelectedLanguage(e.target.value); }}
              className="form-select form-input"
            >
              <option value="all">{t.allLanguages}</option>
              <option value="en">
                🇺🇸 {t.englishProducts}
                {languageCounts && ` (${languageCounts.en + languageCounts.both + languageCounts.neutral})`}
              </option>
              <option value="es">
                🇲🇽 {t.spanishProducts}
                {languageCounts && ` (${languageCounts.es + languageCounts.both + languageCounts.neutral})`}
              </option>
            </select>
          </div>
          
          {/* Sort */}
          <div className="filter-group">
            <label htmlFor="sort-filter">{t.sortBy}</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select form-input"
            >
              <option value="featured">Featured</option>
              <option value="newest">{t.newest}</option>
              <option value="price_asc">{t.priceLowHigh}</option>
              <option value="price_desc">{t.priceHighLow}</option>
            </select>
          </div>
        </div>
        
        {/* "Also available" hint */}
        {selectedLanguage && selectedLanguage !== 'all' && otherLanguageCount > 0 && (
          <div className="language-hint">
            <span className="hint-icon">💡</span>
            <span>
              {otherLanguageCount}{' '}
              {otherLanguageCount === 1
                ? (language === 'es' ? 'otro disponible en' : 'other available in')
                : (language === 'es' ? 'otros disponibles en' : 'others available in')
              }{' '}
              <button
                className="hint-link"
                onClick={() => { userHasSetFilters.current = true; setSelectedLanguage(otherLanguage); }}
              >
                {otherLanguage === 'en' ? '🇺🇸 English' : '🇲🇽 Español'}
              </button>
            </span>
          </div>
        )}
        
        {/* Products Grid */}
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>{t.loading}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>{t.noProductsFound}</h3>
            {selectedLanguage !== 'all' && (
              <button
                className="btn btn-secondary"
                onClick={() => { userHasSetFilters.current = true; setSelectedLanguage('all'); }}
              >
                {t.allLanguages}
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .products-page {
          padding: 40px 0 80px;
          min-height: calc(100vh - 200px);
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-header h1 {
          margin: 0;
          color: var(--color-text-primary);
        }
        
        .filters-bar {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
          padding: 20px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-radius: var(--border-radius-lg);
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 180px;
        }
        
        .filter-group label {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        
        .language-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          background: rgba(1, 132, 246, 0.1);
          border-radius: var(--border-radius-md);
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }
        
        .hint-icon {
          font-size: 1.1rem;
        }
        
        .hint-link {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
        }
        
        .hint-link:hover {
          text-decoration: underline;
        }
        
        .loading-container,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          text-align: center;
        }
        
        .loading-container p {
          margin-top: 16px;
          color: var(--color-text-muted);
        }
        
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          color: var(--color-text-muted);
          font-weight: 400;
          margin-bottom: 16px;
        }
        
        @media (max-width: 640px) {
          .filters-bar {
            flex-direction: column;
            gap: 16px;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .language-hint {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Suspense fallback={
        <div className="loading-container" style={{ padding: '100px 0', textAlign: 'center' }}>
          <div className="loading-spinner" />
        </div>
      }>
        <ProductsContent />
      </Suspense>
      <Footer />
    </>
  );
}

