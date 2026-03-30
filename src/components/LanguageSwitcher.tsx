// SHOP_src_components_LanguageSwitcher.tsx
// Version: 1.0.1 | Created: 2026-01-28 | Last Modified: 2026-03-29 | Author: Open Gateways Team
// Description: Language switcher with flag icons - consistent with main site

'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import type { Language } from '@/types';

export default function LanguageSwitcher() {
  const { language, switchLanguage } = useLanguage();
  
  const handleSwitch = (lang: Language) => {
    if (lang !== language) {
      switchLanguage(lang);
    }
  };
  
  return (
    <div className="language-flags">
      <button
        type="button"
        className={`flag-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => handleSwitch('en')}
        aria-label="English"
        title="English"
      >
        <Image
          src="/assets/images/shared/us.svg"
          alt="English"
          width={24}
          height={18}
          className="flag"
          unoptimized
        />
      </button>
      <button
        type="button"
        className={`flag-btn ${language === 'es' ? 'active' : ''}`}
        onClick={() => handleSwitch('es')}
        aria-label="Español"
        title="Español"
      >
        <Image
          src="/assets/images/shared/mx.svg"
          alt="Español"
          width={24}
          height={18}
          className="flag"
          unoptimized
        />
      </button>
      
      <style jsx>{`
        .flag-btn {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          border-radius: 2px;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }
        
        .flag-btn:hover,
        .flag-btn.active {
          opacity: 1;
        }
        
        .flag-btn.active {
          box-shadow: 0 0 0 2px var(--color-primary);
        }
      `}</style>
    </div>
  );
}
