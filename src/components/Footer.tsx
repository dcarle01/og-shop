// SHOP_src_components_Footer.tsx
// Version: 1.0.1 | Created: 2026-01-28 | Last Modified: 2026-04-23 | Author: Open Gateways Team
// Description: Shop footer component with links and copyright

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="shop-footer">
      <div className="footer-content">
        {/* Logo */}
        <div className="footer-logo">
          <Image
          src="/assets/images/shared/OG_logo_2025.webp"
            alt="Open Gateways"
            width={180}
            height={38}
          />
        </div>
        
        {/* Tagline */}
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          {t.tagline}
        </p>
        
        {/* Links - to Open Gateways main website */}
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.8rem',
            fontStyle: 'italic',
            marginBottom: '8px',
            letterSpacing: '0.02em',
          }}
        >
          {t.exploreMainSite}
        </p>
        <div className="footer-links">
          <Link
            href={language === 'es'
              ? 'https://opengateways.com/es/bienvenido-a-opengateways'
              : 'https://opengateways.com/en/welcome-to-opengateways'}
            target="_blank"
          >
            {t.home}
          </Link>
          <Link
            href={language === 'es'
              ? 'https://opengateways.com/es/sesiones-privadas'
              : 'https://opengateways.com/en/private-sessions'}
            target="_blank"
          >
            {t.privateSessions}
          </Link>
          <Link
            href={language === 'es'
              ? 'https://opengateways.com/es/contactanos'
              : 'https://opengateways.com/en/contact-us'}
            target="_blank"
          >
            {t.contactUs}
          </Link>
          <Link
            href={language === 'es'
              ? 'https://opengateways.com/es/terminos-y-politicas#privacy'
              : 'https://opengateways.com/en/terms-and-policies#privacy'}
            target="_blank"
          >
            {t.privacyPolicy}
          </Link>
          <Link
            href={language === 'es'
              ? 'https://opengateways.com/es/terminos-y-politicas'
              : 'https://opengateways.com/en/terms-and-policies'}
            target="_blank"
          >
            {t.termsOfService}
          </Link>
        </div>
        
        {/* Contact Info */}
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          {t.questionsEmail}: <a href="mailto:info@opengateways.com" style={{ color: 'var(--color-primary)' }}>info@opengateways.com</a>
        </p>
        
        {/* Copyright */}
        <p className="footer-copyright">
          © {currentYear} Open Gateways – {t.allRightsReserved}
        </p>
      </div>
    </footer>
  );
}
