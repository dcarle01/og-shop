// SHOP_src_components_CartDrawer.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Sliding cart drawer panel with items and checkout

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCartOpen, setIsCartOpen]);
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);
  
  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="cart-drawer-header">
          <h2>{t.yourCart}</h2>
          <button
            className="cart-drawer-close"
            onClick={() => setIsCartOpen(false)}
            aria-label={t.close}
          >
            ✕
          </button>
        </div>
        
        {/* Items */}
        <div className="cart-drawer-items">
          {cart.items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h3>{t.cartEmpty}</h3>
              <p>{t.cartEmptyMessage}</p>
              <Link
                href="/products"
                className="btn btn-primary"
                onClick={() => setIsCartOpen(false)}
              >
                {t.continueShopping}
              </Link>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product_id} className="cart-item">
                {/* Image */}
                <div className="cart-item-image">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={language === 'es' ? item.name_es : item.name_en}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="cart-item-placeholder">🎵</div>
                  )}
                </div>
                
                {/* Details */}
                <div className="cart-item-details">
                  <h4 className="cart-item-name">
                    {language === 'es' ? item.name_es : item.name_en}
                  </h4>
                  <p className="cart-item-price">{formatPrice(item.price_usd)}</p>
                  
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      {t.removeItem}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>{t.subtotal}</span>
              <span className="cart-subtotal-amount">{formatPrice(cart.subtotal_usd)}</span>
            </div>
            
            <Link
              href="/checkout"
              className="btn btn-primary checkout-btn"
              onClick={() => setIsCartOpen(false)}
            >
              {t.proceedToCheckout}
            </Link>
            
            <button
              className="continue-shopping-btn"
              onClick={() => setIsCartOpen(false)}
            >
              {t.continueShopping}
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          height: 100%;
        }
        
        .cart-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .cart-empty h3 {
          margin: 0 0 8px 0;
          color: var(--color-text-primary);
        }
        
        .cart-empty p {
          margin: 0 0 24px 0;
          color: var(--color-text-muted);
        }
        
        .cart-item {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }
        
        .cart-item-image {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        
        .cart-item-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        
        .cart-item-details {
          flex: 1;
          min-width: 0;
        }
        
        .cart-item-name {
          margin: 0 0 4px 0;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        
        .cart-item-price {
          margin: 0 0 12px 0;
          color: var(--color-primary);
          font-weight: 500;
        }
        
        .cart-item-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f5f9;
          border-radius: 50px;
          padding: 4px;
        }
        
        .quantity-controls button {
          width: 28px;
          height: 28px;
          border: none;
          background: white;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }
        
        .quantity-controls button:hover {
          background: #e2e8f0;
        }
        
        .quantity-controls span {
          min-width: 24px;
          text-align: center;
          font-weight: 500;
        }
        
        .cart-item-remove {
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s ease;
        }
        
        .cart-item-remove:hover {
          color: var(--color-error);
        }
        
        .cart-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-size: 1.1rem;
        }
        
        .cart-subtotal-amount {
          font-weight: 600;
          color: var(--color-primary);
          font-size: 1.25rem;
        }
        
        .checkout-btn {
          width: 100%;
          margin-bottom: 12px;
        }
        
        .continue-shopping-btn {
          width: 100%;
          background: none;
          border: none;
          color: var(--color-text-muted);
          font-family: var(--font-primary);
          font-size: 0.95rem;
          cursor: pointer;
          padding: 8px;
          transition: color 0.2s ease;
        }
        
        .continue-shopping-btn:hover {
          color: var(--color-primary);
        }
      `}</style>
    </>
  );
}
