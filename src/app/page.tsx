// SHOP_src_app_page.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Shop homepage with hero, featured products, and categories

'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import FeaturedProducts from './FeaturedProducts';
import CategoryGrid from './CategoryGrid';

export default function HomePage() {
  const { language } = useLanguage();
  return (
    <>
      <Header />
      <CartDrawer />
      
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">
                {language === 'es' ? 'Grabaciones de talleres de Baratta' : 'Baratta Workshop Recordings'}
              </h1>
              <p className="hero-subtitle">
                {language === 'es' ? 'Descargas digitales disponibles al instante' : 'Digital downloads available instantly'}
              </p>
              <div className="hero-actions">
                <Link href="/products" className="btn btn-primary">
                  {language === 'es' ? 'Ver productos' : 'Browse Products'}
                </Link>
                <Link href="https://opengateways.com" className="btn btn-secondary" target="_blank">
                  {language === 'es' ? 'Conoce a Baratta' : 'Learn About Baratta'}
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Products */}
        <section className="section">
          <div className="container">
            <FeaturedProducts />
          </div>
        </section>
        
        {/* Categories */}
        <section className="section section-alt">
          <div className="container">
            <CategoryGrid />
          </div>
        </section>
        
        {/* Instant Access CTA */}
        <section className="section cta-section">
          <div className="container">
            <div className="cta-card glass-card">
              <div className="cta-icon">📥</div>
              <h2>Instant Access to Baratta&apos;s Loving Wisdom</h2>
              <p>
                All digital products are available for immediate download after purchase. 
                Start your journey today with these transformative workshops from Baratta.
              </p>
              <Link href="/products" className="btn btn-primary">
                Explore All Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      <style jsx>{`
        .hero-section {
          padding: 80px 0;
          text-align: center;
          background: linear-gradient(
            135deg, 
            rgba(1, 132, 246, 0.1) 0%, 
            rgba(1, 100, 201, 0.05) 50%,
            transparent 100%
          );
        }
        
        .hero-content {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .hero-title {
          font-size: 3rem;
          margin-bottom: 16px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--color-text-secondary);
          margin-bottom: 32px;
        }
        
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .section {
          padding: 60px 0;
        }
        
        .section-alt {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .cta-section {
          padding: 80px 0;
        }
        
        .cta-card {
          max-width: 600px;
          margin: 0 auto;
          padding: 48px;
          text-align: center;
        }
        
        .cta-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .cta-card h2 {
          margin-bottom: 16px;
          color: var(--color-primary);
        }
        
        .cta-card p {
          color: var(--color-text-secondary);
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        @media (max-width: 768px) {
          .hero-section {
            padding: 48px 0;
          }
          
          .hero-title {
            font-size: 2rem;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
          
          .section {
            padding: 40px 0;
          }
          
          .cta-card {
            padding: 32px 24px;
          }
        }
      `}</style>
    </>
  );
}
