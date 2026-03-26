// SHOP_src_components_Footer.tsx
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Shop footer component with links and copyright

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
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
        
        {/* Links */}
        <div className="footer-links">
          <Link href="https://opengateways.com" target="_blank">
            {t.home}
          </Link>
          <Link href="/products">
            {t.products}
          </Link>
          <Link href="https://opengateways.com/en/contact-us.html" target="_blank">
            {t.contactUs}
          </Link>
          <Link href="https://opengateways.com/en/terms-and-policies.html" target="_blank">
            {t.privacyPolicy}
          </Link>
          <Link href="https://opengateways.com/en/terms-and-policies.html" target="_blank">
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
