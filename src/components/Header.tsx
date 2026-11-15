// SHOP_src_components_Header.tsx
// Version: 1.2.0 | Created: 2026-01-28 | Last Modified: 2026-11-15 | Author: Open Gateways Team
// Description: Shop header component with navigation, cart indicator, and auth
// ✅ Added Sign In / My Account dropdown

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { CurrencySelector, useCurrency } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import CartIndicator from './CartIndicator';
import SignInModal from './SignInModal';

export default function Header() {
  const { t, language, switchLanguage } = useLanguage();
  const { currency, setCurrency, exchangeRate, isLoading: currencyLoading } = useCurrency();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Phone menu: close on a tap outside it. pointerdown rather than mousedown,
  // because iOS doesn't fire mouse events when you tap a non-clickable area.
  useEffect(() => {
    if (!showMobileMenu) return;
    function handlePointerDownOutside(event: PointerEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [showMobileMenu]);

  // Close it on any navigation, including the browser's back button.
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Auto-open Sign In modal when returning from /register
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('og_open_signin') === '1') {
        sessionStorage.removeItem('og_open_signin');
        setShowSignInModal(true);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Sign In (desktop button and phone menu). On /register, go back to where the
  // shopper came from and open the modal there.
  const openSignIn = () => {
    if (pathname === '/register') {
      const origin = (typeof window !== 'undefined'
        && sessionStorage.getItem('og_signin_origin')) || '/products';
      sessionStorage.setItem('og_open_signin', '1');
      router.push(origin);
    } else {
      setShowSignInModal(true);
    }
  };
  
  // Get display name (first name or email prefix)
  const displayName = user?.preferred_name || user?.first_name || user?.email?.split('@')[0] || 'User';
  
  return (
    <header className="shop-header">
      <div className="header-content">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <Image
            src="/assets/images/shared/OG_logo_2025.webp"
            alt="Open Gateways"
            width={180}
            height={38}
          />
          <span className="header-logo-text">{t.onlineShop}</span>
        </Link>
        
        {/* Navigation - Desktop */}
        <nav className="header-nav">
          <Link href="/" className="nav-link">{t.home}</Link>
          <Link href="/products" className="nav-link">{t.products}</Link>
        </nav>
        
        {/* Actions */}
        <div className="header-actions">
          <CurrencySelector />
          <LanguageSwitcher />
          
          {/* User Account / Sign In */}
          <div className="user-menu-container" ref={menuRef}>
            {isAuthenticated && user ? (
              // Logged in - show account dropdown
              <>
                <button
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <span className="user-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">{displayName}</span>
                  <svg className={`chevron ${showUserMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12">
                    <path d="M2 4L6 8L10 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-email">{user.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      {t.logout}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Not logged in - show Sign In button (opens modal)
              <button
                className="sign-in-link"
                onClick={openSignIn}
                aria-label={t.signIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <span>{t.signIn}</span>
              </button>
            )}
          </div>

          <SignInModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} />
          
          <CartIndicator />

          {/* Phones and tablets (below 1024px): one menu holds the pages, currency,
              language and account, which don't fit in the header row here. */}
          <div className="mobile-menu-container" ref={mobileMenuRef}>
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label={language === 'es' ? 'Menú' : 'Menu'}
              aria-expanded={showMobileMenu}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showMobileMenu ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            {showMobileMenu && (
              <div className="mobile-menu-panel">
                <button
                  type="button"
                  className={`mobile-menu-item ${pathname === '/' ? 'active' : ''}`}
                  onClick={() => { setShowMobileMenu(false); router.push('/'); }}
                >
                  {t.home}
                </button>
                <button
                  type="button"
                  className={`mobile-menu-item ${pathname?.startsWith('/products') ? 'active' : ''}`}
                  onClick={() => { setShowMobileMenu(false); router.push('/products'); }}
                >
                  {t.products}
                </button>
                <div className="mobile-menu-divider" />
                <div className="mobile-menu-label">{t.currency}</div>
                <div className="mobile-menu-choices">
                  <button
                    type="button"
                    className={`mobile-menu-choice ${currency === 'USD' ? 'active' : ''}`}
                    onClick={() => setCurrency('USD')}
                  >
                    USD
                  </button>
                  {/* MXN is offered only when a USD->MXN rate is available */}
                  {(currencyLoading || exchangeRate !== null) && (
                    <button
                      type="button"
                      className={`mobile-menu-choice ${currency === 'MXN' ? 'active' : ''}`}
                      onClick={() => setCurrency('MXN')}
                    >
                      MXN
                    </button>
                  )}
                </div>
                <div className="mobile-menu-label">{language === 'es' ? 'Idioma' : 'Language'}</div>
                <div className="mobile-menu-choices">
                  <button
                    type="button"
                    className={`mobile-menu-choice ${language === 'en' ? 'active' : ''}`}
                    onClick={() => switchLanguage('en')}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`mobile-menu-choice ${language === 'es' ? 'active' : ''}`}
                    onClick={() => switchLanguage('es')}
                  >
                    Español
                  </button>
                </div>
                <div className="mobile-menu-divider" />
                {isAuthenticated && user ? (
                  <>
                    <div className="mobile-menu-account">
                      <strong>{displayName}</strong>
                      {user.email}
                    </div>
                    <button
                      type="button"
                      className="mobile-menu-item logout"
                      onClick={() => { setShowMobileMenu(false); logout(); }}
                    >
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="mobile-menu-item"
                    onClick={() => { setShowMobileMenu(false); openSignIn(); }}
                  >
                    {t.signIn}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .header-nav {
          display: flex;
          gap: 24px;
        }
        
        .nav-link {
          color: #2b7ae6;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.2s ease;
        }
        
        .nav-link:hover {
          color: var(--color-primary);
        }
        
        /* User Menu Styles */
        .user-menu-container {
          position: relative;
        }
        
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--border-radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .user-menu-trigger:hover {
          background: rgba(255, 255, 255, 0.7);
        }
        
        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .user-name {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .chevron {
          color: var(--color-text-muted);
          transition: transform 0.2s ease;
        }
        
        .chevron.open {
          transform: rotate(180deg);
        }
        
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: white;
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
        }
        
        .dropdown-header {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.02);
        }
        
        .dropdown-email {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          word-break: break-all;
        }
        
        .dropdown-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }
        
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: none;
          border: none;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .dropdown-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        
        .logout-item {
          color: var(--color-error);
        }
        
        .logout-item:hover {
          background: rgba(245, 101, 101, 0.08);
        }
        
        /* Sign In Link */
        .sign-in-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--border-radius-full);
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .sign-in-link:hover {
          background: rgba(255, 255, 255, 0.7);
          color: var(--color-primary);
        }
        
        .sign-in-link svg {
          flex-shrink: 0;
        }
        
        /* Desktop row (1024px+): keep the logo and its title from being squeezed. */
        :global(.header-logo) {
          flex-shrink: 0;
        }
        
        .header-logo-text {
          white-space: nowrap;
        }
        
        /* Phone menu (shown below 1024px) */
        .mobile-menu-container {
          position: relative;
          display: none;
        }
        
        .mobile-menu-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--border-radius-full);
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        
        .mobile-menu-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          max-height: 80vh;
          overflow-y: auto;
          padding: 8px 0;
          background: white;
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }
        
        .mobile-menu-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          text-align: left;
          background: none;
          border: none;
          font-size: 0.95rem;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        
        .mobile-menu-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        
        .mobile-menu-item.active {
          color: var(--color-primary);
          font-weight: 500;
          background: rgba(43, 122, 230, 0.06);
        }
        
        .mobile-menu-item.logout {
          color: var(--color-error);
        }
        
        .mobile-menu-divider {
          height: 1px;
          margin: 8px 0;
          background: rgba(0, 0, 0, 0.08);
        }
        
        .mobile-menu-label {
          padding: 4px 16px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
        }
        
        .mobile-menu-choices {
          display: flex;
          gap: 8px;
          padding: 4px 16px 8px;
        }
        
        .mobile-menu-choice {
          flex: 1;
          padding: 8px 12px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: var(--border-radius-md);
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        
        .mobile-menu-choice.active {
          border-color: var(--color-primary);
          color: var(--color-primary);
          font-weight: 500;
          background: rgba(43, 122, 230, 0.06);
        }
        
        .mobile-menu-account {
          padding: 4px 16px 8px;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          overflow-wrap: anywhere;
        }
        
        .mobile-menu-account strong {
          display: block;
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        
        /* Below 1024px the full row doesn't fit: logo, cart and the menu only. */
        @media (max-width: 1023px) {
          .header-nav,
          .header-logo-text,
          .user-menu-container,
          .header-actions :global(.currency-selector),
          .header-actions :global(.language-flags) {
            display: none;
          }
          
          .mobile-menu-container {
            display: block;
          }
        }
        
        @media (max-width: 768px) {
          .header-nav {
            display: none;
          }
          
          .user-name {
            display: none;
          }
          
          .sign-in-link span {
            display: none;
          }
          
          .sign-in-link {
            padding: 8px;
          }
        }
        
        @media (max-width: 560px) {
          :global(.header-logo img) {
            content: url('/assets/images/shared/favicon.ico');
            height: 36px !important;
            width: 36px !important;
            aspect-ratio: 1 / 1 !important;
            object-fit: contain !important;
          }
          
          :global(.header-actions) {
            margin-left: 12px;
          }
          
          :global(.header-content) {
            padding: 12px 12px 12px 12px;
            gap: 0;
          }
        }
      `}</style>
    </header>
  );
}

