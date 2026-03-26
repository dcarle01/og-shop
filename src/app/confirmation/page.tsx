// SHOP_src_app_confirmation_page.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Order confirmation page with download links

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';
import { useCart } from '@/lib/CartContext';
import type { OrderWithItems, DownloadTokenWithProduct } from '@/types';

interface ConfirmationData {
  order: OrderWithItems;
  downloadTokens: DownloadTokenWithProduct[];
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const { clearCart } = useCart();
  
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/checkout/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Payment verification failed');
        }
        
        setData({
          order: result.order,
          downloadTokens: result.downloadTokens,
        });
        
        // Clear the cart after successful payment
        clearCart();
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    verifyPayment();
  }, [sessionId, clearCart]);
  
  if (isLoading) {
    return (
      <div className="confirmation-loading">
        <div className="loading-spinner" />
        <p>{t.processing}</p>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="confirmation-error glass-card">
        <div className="error-icon">⚠️</div>
        <h2>{t.error}</h2>
        <p>{error || t.errorGeneric}</p>
        <Link href="/products" className="btn btn-primary">
          {t.continueShopping}
        </Link>
      </div>
    );
  }
  
  const { order, downloadTokens } = data;
  
  return (
    <div className="confirmation-success">
      {/* Success Header */}
      <div className="success-header">
        <div className="success-icon">✓</div>
        <h1>{t.orderConfirmed}</h1>
        <p>{t.thankYouOrder}</p>
      </div>
      
      {/* Order Details Card */}
      <div className="order-details glass-card">
        <div className="order-reference">
          <span className="label">{t.orderReference}:</span>
          <span className="value">{order.order_reference}</span>
        </div>
        
        {/* Order Items */}
        <div className="order-items">
          {order.items.map((item) => (
            <div key={item.id} className="order-item">
              <span className="item-name">
                {language === 'es' ? item.product_name_es : item.product_name_en}
                {item.quantity > 1 && ` × ${item.quantity}`}
              </span>
              <span className="item-price">
                ${item.total_price_usd.toFixed(2)} USD
              </span>
            </div>
          ))}
        </div>
        
        <div className="order-total">
          <span>{t.total}:</span>
          <span className="total-amount">${order.total_amount_usd.toFixed(2)} USD</span>
        </div>
      </div>
      
      {/* Download Links */}
      {downloadTokens.length > 0 && (
        <div className="downloads-section glass-card">
          <h2>{t.downloadLinks}</h2>
          <p className="downloads-info">
            {language === 'es'
              ? 'Haz clic en los enlaces a continuación para descargar tus productos. También te hemos enviado estos enlaces por correo electrónico.'
              : 'Click the links below to download your products. We\'ve also sent these links to your email.'}
          </p>
          
          <div className="download-list">
            {downloadTokens.map((token) => {
              const name = language === 'es' ? token.product_name_es : token.product_name_en;
              const expiresDate = new Date(token.expires_at).toLocaleDateString(
                language === 'es' ? 'es-MX' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
              );
              
              return (
                <div key={token.id} className="download-item">
                  <div className="download-info">
                    <h4>{name}</h4>
                    <p>
                      {token.max_downloads - token.download_count} {t.downloadsRemaining}<br />
                      {t.expiresOn}: {expiresDate}
                    </p>
                  </div>
                  <a
                    href={`/api/download/${token.token}`}
                    className="btn btn-primary download-btn"
                    download
                  >
                    📥 {t.downloadNow}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Email Confirmation */}
      <div className="email-notice">
        <span className="email-icon">📧</span>
        <p>{t.emailSent}: <strong>{order.customer_email}</strong></p>
      </div>
      
      {/* Continue Shopping */}
      <div className="continue-section">
        <Link href="/products" className="btn btn-secondary">
          {t.continueShopping}
        </Link>
      </div>
      
      <style jsx>{`
        .confirmation-success {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .success-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
          margin: 0 auto 20px;
        }
        
        .success-header h1 {
          margin: 0 0 8px;
          color: #38a169;
        }
        
        .success-header p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 1.1rem;
        }
        
        .order-details,
        .downloads-section {
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .order-reference {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
        }
        
        .order-reference .label {
          color: var(--color-text-muted);
        }
        
        .order-reference .value {
          font-weight: 600;
          color: var(--color-primary);
          font-size: 1.1rem;
        }
        
        .order-items {
          margin-bottom: 16px;
        }
        
        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        
        .item-name {
          color: var(--color-text-primary);
        }
        
        .item-price {
          color: var(--color-text-secondary);
        }
        
        .order-total {
          display: flex;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          font-weight: 500;
        }
        
        .total-amount {
          font-size: 1.25rem;
          color: var(--color-primary);
        }
        
        .downloads-section h2 {
          margin: 0 0 8px;
          color: var(--color-text-primary);
        }
        
        .downloads-info {
          margin: 0 0 24px;
          color: var(--color-text-muted);
          font-size: 0.95rem;
        }
        
        .download-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .download-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(1, 132, 246, 0.05);
          border-radius: 12px;
        }
        
        .download-info h4 {
          margin: 0 0 4px;
          color: var(--color-text-primary);
        }
        
        .download-info p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }
        
        .download-btn {
          white-space: nowrap;
        }
        
        .email-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: rgba(72, 187, 120, 0.1);
          border-radius: 12px;
          margin-bottom: 32px;
        }
        
        .email-icon {
          font-size: 24px;
        }
        
        .email-notice p {
          margin: 0;
          color: var(--color-text-secondary);
        }
        
        .continue-section {
          text-align: center;
        }
        
        @media (max-width: 640px) {
          .download-item {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          
          .download-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function ConfirmationPage() {
  const { t } = useLanguage();
  
  return (
    <>
      <Header />
      
      <main className="confirmation-page">
        <div className="container">
          <Suspense fallback={
            <div className="confirmation-loading">
              <div className="loading-spinner" />
              <p>{t.processing}</p>
            </div>
          }>
            <ConfirmationContent />
          </Suspense>
        </div>
      </main>
      
      <Footer />
      
      <style jsx>{`
        .confirmation-page {
          padding: 60px 0 80px;
          min-height: calc(100vh - 200px);
        }
        
        .confirmation-loading,
        .confirmation-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 40px;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .confirmation-loading p {
          margin-top: 16px;
          color: var(--color-text-muted);
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .confirmation-error h2 {
          margin: 0 0 8px;
          color: var(--color-error);
        }
        
        .confirmation-error p {
          margin: 0 0 24px;
          color: var(--color-text-muted);
        }
      `}</style>
    </>
  );
}
