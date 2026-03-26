// SHOP_src_app_layout.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-01-29 | Author: Open Gateways Team
// Description: Root layout for Open Gateways Shop
// ✅ Added AuthProvider for user authentication

import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import { CartProvider } from '@/lib/CartContext';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
  title: {
    default: 'Open Gateways Shop - Baratta Workshop Recordings',
    template: '%s | Open Gateways Shop',
  },
  description: 'Digital downloads of spiritual teachings, meditations, and workshops by Baratta. Instant access to transformative audio content.',
  keywords: ['spiritual teachings', 'meditation', 'digital downloads', 'Baratta', 'Open Gateways', 'channeling'],
  authors: [{ name: 'Open Gateways' }],
  creator: 'Open Gateways',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_MX',
    url: 'https://shop.opengateways.com',
    siteName: 'Open Gateways Shop',
    title: 'Open Gateways Shop - Spiritual Teachings & Digital Downloads',
    description: 'Digital downloads of spiritual teachings, meditations, and workshops by Baratta.',
    images: [
      {
        url: 'https://opengateways.com/assets/images/shared/og-shop-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Open Gateways Shop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Gateways Shop',
    description: 'Spiritual teachings and digital downloads by Baratta',
  },
  icons: {
    icon: '/assets/images/shared/favicon.ico',
    apple: '/assets/images/shared/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://opengateways.com" />
        <link rel="dns-prefetch" href="https://opengateways.com" />
        
        {/* Favicon links */}
        <link rel="icon" href="/assets/images/shared/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/shared/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/shared/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/assets/images/shared/apple-touch-icon.png" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

