// SHOP_src_components_CartIndicator.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Cart indicator button with item count badge

'use client';

import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function CartIndicator() {
  const { cart, setIsCartOpen } = useCart();
  const { t } = useLanguage();
  
  return (
    <button 
      className="cart-indicator"
      onClick={() => setIsCartOpen(true)}
      aria-label={`${t.cart} (${cart.total_items} ${t.itemsInCart})`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      
      {cart.total_items > 0 && (
        <span className="cart-badge">
          {cart.total_items > 99 ? '99+' : cart.total_items}
        </span>
      )}
    </button>
  );
}
