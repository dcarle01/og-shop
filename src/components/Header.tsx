// SHOP_src_components_Header.tsx
// Version: 1.1.1 | Created: 2026-01-28 | Last Modified: 2026-04-22 | Author: Open Gateways Team
// Description: Shop header component with navigation, cart indicator, and auth
// ✅ Added Sign In / My Account dropdown

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { CurrencySelector } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import CartIndicator from './CartIndicator';
import SignInModal from './SignInModal';

export default function Header() {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
                onClick={() => {
                  if (pathname === '/register') {
                    const origin = (typeof window !== 'undefined'
                      && sessionStorage.getItem('og_signin_origin')) || '/products';
                    sessionStorage.setItem('og_open_signin', '1');
                    router.push(origin);
                  } else {
                    setShowSignInModal(true);
                  }
                }}
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

