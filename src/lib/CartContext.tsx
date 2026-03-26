// SHOP_src_lib_CartContext.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-30 | Author: Open Gateways Team
// Description: Shopping cart context with localStorage persistence
// ✅ Added content_language support for cart items

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CartItem, Product } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal_usd: number;
}

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CART_STORAGE_KEY = 'og_shop_cart';

const emptyCart: Cart = {
  items: [],
  total_items: 0,
  subtotal_usd: 0,
};

// ============================================================================
// CONTEXT
// ============================================================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateCartTotals(items: CartItem[]): Cart {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal_usd = items.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);
  
  return {
    items,
    total_items,
    subtotal_usd,
  };
}

function loadCartFromStorage(): Cart {
  if (typeof window === 'undefined') {
    return emptyCart;
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.items && Array.isArray(parsed.items)) {
        return calculateCartTotals(parsed.items);
      }
    }
  } catch (error) {
    console.warn('Failed to load cart from storage:', error);
  }
  
  return emptyCart;
}

function saveCartToStorage(cart: Cart): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: cart.items }));
  } catch (error) {
    console.warn('Failed to save cart to storage:', error);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Load cart from localStorage on mount
  useEffect(() => {
    const loadedCart = loadCartFromStorage();
    setCart(loadedCart);
    setIsLoading(false);
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cart);
    }
  }, [cart, isLoading]);
  
  // Add product to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(currentCart => {
      const existingIndex = currentCart.items.findIndex(
        item => item.product_id === product.id
      );
      
      let newItems: CartItem[];
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        newItems = currentCart.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item with content_language
        const newItem: CartItem = {
          product_id: product.id,
          sku: product.sku,
          name_en: product.name_en,
          name_es: product.name_es,
          price_usd: product.price_usd,
          quantity,
          image_url: product.image_url,
          product_type: product.product_type,
          content_language: product.content_language,  // ✅ Include content language
        };
        newItems = [...currentCart.items, newItem];
      }
      
      return calculateCartTotals(newItems);
    });
    
    // Open cart drawer when item is added
    setIsCartOpen(true);
  }, []);
  
  // Remove product from cart
  const removeFromCart = useCallback((productId: number) => {
    setCart(currentCart => {
      const newItems = currentCart.items.filter(
        item => item.product_id !== productId
      );
      return calculateCartTotals(newItems);
    });
  }, []);
  
  // Update item quantity
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(currentCart => {
      const newItems = currentCart.items.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      );
      return calculateCartTotals(newItems);
    });
  }, [removeFromCart]);
  
  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart(emptyCart);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);
  
  // Check if product is in cart
  const isInCart = useCallback((productId: number): boolean => {
    return cart.items.some(item => item.product_id === productId);
  }, [cart.items]);
  
  // Get specific cart item
  const getCartItem = useCallback((productId: number): CartItem | undefined => {
    return cart.items.find(item => item.product_id === productId);
  }, [cart.items]);
  
  const value: CartContextType = {
    cart,
    isLoading,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

