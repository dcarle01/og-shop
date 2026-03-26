// SHOP_src_app_checkout_page.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-29 | Author: Open Gateways Team
// Description: Checkout page with guest checkout and optional login
// ✅ Added inline login section for registered users

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/AuthContext';


export default function CheckoutPage() {
  const { cart } = useCart();
  const { language, t } = useLanguage();
  const { currency, exchangeRate, formatPrice } = useCurrency();
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Checkout form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Pre-fill form when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      });
    }
  }, [isAuthenticated, user]);
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    
    try {
      const result = await login(loginEmail, loginPassword);
      
      if (!result.success) {
        setLoginError(t.loginError);
      } else {
        // Clear login form on success
        setLoginEmail('');
        setLoginPassword('');
      }
    } catch (error) {
      setLoginError(t.loginError);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    // Reset form to empty
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
    });
  };
  
  // Empty cart view
  if (cart.items.length === 0) {
    return (
      <>
        <Header />
        <CartDrawer />
        <main className="checkout-page">
          <div className="container">
            <div className="empty-cart-message glass-card">
              <div className="empty-icon">🛒</div>
              <h2>{t.cartEmpty}</h2>
              <p>{t.cartEmptyMessage}</p>
              <Link href="/products" className="btn btn-primary">
                {t.continueShopping}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <style jsx>{`
          .checkout-page {
            min-height: calc(100vh - 80px);
            padding: 40px 0 60px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
          }
          .empty-cart-message {
            max-width: 420px;
            margin: 80px auto;
            padding: 48px;
            text-align: center;
          }
          .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }
          .empty-cart-message h2 {
            margin: 0 0 8px 0;
            font-size: 1.6rem;
            color: var(--color-text-primary);
          }
          .empty-cart-message p {
            margin: 0 0 28px 0;
            color: var(--color-text-muted);
            font-size: 1rem;
            line-height: 1.5;
          }
        `}</style>
      </>
    );
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = language === 'es' ? 'Correo inválido' : 'Invalid email';
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t.required;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t.required;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: {
            items: cart.items,
            subtotal_usd: cart.subtotal_usd,
          },
          customer_email: formData.email,
          customer_first_name: formData.firstName,
          customer_last_name: formData.lastName,
          language,
          currency,
          exchange_rate: exchangeRate,
          user_id: isAuthenticated && user ? user.id : undefined,  // ✅ Pass user_id if logged in
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }
      
      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setSubmitError(error instanceof Error ? error.message : t.errorGeneric);
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  return (
    <>
      <Header />
      <CartDrawer />
      
      <main className="checkout-page">
        <div className="container">
          <h1 className="page-title">{t.checkoutTitle}</h1>
          
          <div className="checkout-layout">
            {/* Checkout Form Section */}
            <div className="checkout-form-section">
              
              {/* Login Section */}
              {!authLoading && (
                <div className="login-section glass-card">
                  {isAuthenticated && user ? (
                    // Logged in state
                    <div className="logged-in-status">
                      <span className="logged-in-icon">✓</span>
                      <span className="logged-in-text">
                        {t.loggedInAs} <strong>{user.email}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="logout-link"
                      >
                        {t.logout}
                      </button>
                    </div>
                  ) : (
                    // Login form
                    <>
                      <div className="login-header">
                        <h3>{t.haveAccount}</h3>
                        <p className="login-subtitle">{t.signInToCheckout}</p>
                      </div>
                      
                      <form onSubmit={handleLogin} className="login-form">
                        <div className="login-fields">
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder={t.email}
                            className="form-input login-input"
                            autoComplete="email"
                            required
                          />
                          <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder={t.password}
                            className="form-input login-input"
                            autoComplete="current-password"
                            required
                          />
                          <button
                            type="submit"
                            className="btn btn-secondary login-btn"
                            disabled={isLoggingIn}
                          >
                            {isLoggingIn ? t.loggingIn : t.signIn}
                          </button>
                        </div>
                        
                        {loginError && (
                          <div className="login-error">{loginError}</div>
                        )}
                      </form>
                      
                      <p className="register-prompt">
                        {t.dontHaveAccount}{' '}
                        <Link href="/register" className="register-link">
                          {t.createAccount}
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {/* Divider */}
              {!isAuthenticated && !authLoading && (
                <div className="section-divider">
                  <span>{t.orContinueAsGuest}</span>
                </div>
              )}
              
              {/* Guest Checkout Form */}
              <div className="checkout-form glass-card">
                <h2>{isAuthenticated ? t.checkoutTitle : t.guestCheckout}</h2>
                
                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      {t.email} <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="your@email.com"
                      autoComplete="email"
                      readOnly={isAuthenticated}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                  
                  {/* Name Row */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        {t.firstName} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.firstName ? 'error' : ''}`}
                        autoComplete="given-name"
                        readOnly={isAuthenticated}
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        {t.lastName} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.lastName ? 'error' : ''}`}
                        autoComplete="family-name"
                        readOnly={isAuthenticated}
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                  </div>
                  
                  {/* Submit Error */}
                  {submitError && (
                    <div className="submit-error">
                      {submitError}
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading-spinner" />
                        {t.processing}
                      </>
                    ) : (
                      <>
                        🔒 {t.payWithCard}
                      </>
                    )}
                  </button>
                  
                  <p className="secure-note">{t.secureCheckout}</p>
                </form>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="order-summary-section">
              <div className="order-summary glass-card">
                <h2>{t.orderSummary}</h2>
                
                <div className="summary-items">
                  {cart.items.map(item => (
                    <div key={item.product_id} className="summary-item">
                      <div className="item-info">
                        <span className="item-name">
                          {language === 'es' ? item.name_es : item.name_en}
                        </span>
                        {item.quantity > 1 && (
                          <span className="item-qty">× {item.quantity}</span>
                        )}
                      </div>
                      <span className="item-price">
                        {formatPrice(item.price_usd * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="summary-total">
                  <span>{t.total}</span>
                  <span className="total-amount">{formatPrice(cart.subtotal_usd)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <style jsx>{`
        .checkout-page {
          padding: 40px 0 80px;
          min-height: calc(100vh - 200px);
        }
        
        .page-title {
          margin: 0 0 32px 0;
          color: var(--color-text-primary);
        }
        
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        
        /* Login Section Styles */
        .login-section {
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .login-header h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          color: var(--color-text-primary);
        }
        
        .login-subtitle {
          margin: 0 0 16px 0;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        
        .login-form {
          margin-bottom: 12px;
        }
        
        .login-fields {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .login-input {
          flex: 1;
          min-width: 150px;
        }
        
        .login-btn {
          white-space: nowrap;
        }
        
        .login-error {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid var(--color-error);
          border-radius: 6px;
          color: var(--color-error);
          font-size: 0.85rem;
        }
        
        .register-prompt {
          margin: 0;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }
        
        .register-link {
          color: var(--color-primary);
          text-decoration: none;
        }
        
        .register-link:hover {
          text-decoration: underline;
        }
        
        .logged-in-status {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .logged-in-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--color-success);
          color: white;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .logged-in-text {
          flex: 1;
          color: var(--color-text-secondary);
        }
        
        .logout-link {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }
        
        .logout-link:hover {
          color: var(--color-primary);
        }
        
        /* Section Divider */
        .section-divider {
          display: flex;
          align-items: center;
          margin: 0 0 24px 0;
          text-align: center;
        }
        
        .section-divider::before,
        .section-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }
        
        .section-divider span {
          padding: 0 16px;
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        
        /* Checkout Form */
        .checkout-form,
        .order-summary {
          padding: 32px;
        }
        
        .checkout-form h2,
        .order-summary h2 {
          margin: 0 0 24px 0;
          font-size: 1.25rem;
          color: var(--color-text-primary);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .required {
          color: var(--color-error);
        }
        
        .optional {
          color: var(--color-text-muted);
          font-weight: 400;
        }
        
        .form-input.error {
          border-color: var(--color-error);
        }
        
        .form-input[readonly] {
          background-color: rgba(0, 0, 0, 0.03);
          cursor: not-allowed;
        }
        
        .error-message {
          display: block;
          margin-top: 4px;
          font-size: 0.85rem;
          color: var(--color-error);
        }
        
        .submit-error {
          padding: 12px;
          margin-bottom: 16px;
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid var(--color-error);
          border-radius: 8px;
          color: var(--color-error);
          font-size: 0.9rem;
        }
        
        .submit-btn {
          width: 100%;
          font-size: 1.1rem;
          padding: 16px;
          margin-top: 8px;
        }
        
        .submit-btn:disabled {
          opacity: 0.7;
        }
        
        .secure-note {
          text-align: center;
          margin: 16px 0 0;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }
        
        .summary-items {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
        }
        
        .item-info {
          display: flex;
          gap: 8px;
        }
        
        .item-name {
          color: var(--color-text-primary);
        }
        
        .item-qty {
          color: var(--color-text-muted);
        }
        
        .item-price {
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        
        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .total-amount {
          font-size: 1.5rem;
          color: var(--color-primary);
        }
        
        .empty-cart-message {
          max-width: 400px;
          margin: 80px auto;
          padding: 48px;
          text-align: center;
        }
        
        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        .empty-cart-message h2 {
          margin: 0 0 8px 0;
        }
        
        .empty-cart-message p {
          margin: 0 0 24px 0;
          color: var(--color-text-muted);
        }
        
        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }
          
          .order-summary-section {
            order: -1;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .checkout-form,
          .order-summary {
            padding: 24px;
          }
          
          .login-fields {
            flex-direction: column;
          }
          
          .login-input {
            width: 100%;
          }
          
          .login-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

