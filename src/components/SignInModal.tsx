// SHOP_src_components_SignInModal.tsx
// Version: 1.0.0 | Created: 2026-03-14 | Author: Open Gateways Team
// Description: Sign-in modal for Shop header — bilingual, cart-aware
// ✅ Opens from Header Sign In button
// ✅ Shows "Proceed to Checkout" when cart has items
// ✅ Register link routes to /register (Shop-native)

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useLanguage } from '@/lib/LanguageContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { login } = useAuth();
  const { cart } = useCart();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartHasItems = cart.items.length > 0;

  // Portal mount guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Save the page that was showing when Sign In was opened
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const current = window.location.pathname + window.location.search;
      if (!current.startsWith('/register')) {
        sessionStorage.setItem('og_signin_origin', current);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        setEmail('');
        setPassword('');
        onClose();
      } else {
        setError(t.loginError);
      }
    } catch {
      setError(t.loginError);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.signIn}>
      <div className="modal-panel glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{t.signIn}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t.close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sign-in form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">{t.email}</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.password}</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary modal-submit"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? t.loggingIn : t.signIn}
          </button>
        </form>

        {/* Checkout CTA when cart has items */}
        {cartHasItems && (
          <div className="checkout-cta">
            <div className="cta-divider">
              <span>{t.orContinueAsGuest}</span>
            </div>
            <Link href="/checkout" className="btn btn-secondary checkout-btn" onClick={onClose}>
              🛒 {t.proceedToCheckout}
            </Link>
          </div>
        )}

        {/* Register link */}
        <div className="modal-footer">
          <span className="footer-text">{t.dontHaveAccount}</span>{' '}
          <Link href="/register" className="footer-link" onClick={onClose}>
            {t.createAccount}
          </Link>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .modal-panel {
          width: 100%;
          max-width: 420px;
          padding: 32px;
          border-radius: var(--border-radius-lg);
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-title {
          margin: 0;
          font-size: 1.4rem;
          color: var(--color-text-primary);
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 50%;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: rgba(0, 0, 0, 0.12);
          color: var(--color-text-primary);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .modal-error {
          padding: 10px 14px;
          background: rgba(245, 101, 101, 0.1);
          border: 1px solid var(--color-error);
          border-radius: 8px;
          color: var(--color-error);
          font-size: 0.875rem;
        }

        .modal-submit {
          width: 100%;
          margin-top: 4px;
        }

        /* Checkout CTA */
        .checkout-cta {
          margin-top: 20px;
        }

        .cta-divider {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .cta-divider::before,
        .cta-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }

        .cta-divider span {
          padding: 0 12px;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .checkout-btn {
          width: 100%;
          text-align: center;
          text-decoration: none;
          display: block;
        }

        /* Footer */
        .modal-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          text-align: center;
          font-size: 0.875rem;
        }

        .footer-text {
          color: var(--color-text-muted);
        }

        .footer-link {
          color: var(--color-primary);
          font-weight: 500;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>,
    document.body
  );
}
