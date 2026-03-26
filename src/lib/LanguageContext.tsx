// SHOP_src_lib_LanguageContext.tsx
// Version: 1.2.0 | Created: 2026-01-28 | Last Modified: 2026-01-30 | Author: Open Gateways Team
// Description: Language context and translations for Open Gateways Shop
// ✅ All Spanish text uses informal (tú) form
// ✅ Added auth/login translations
// ✅ Added language filter translations for hybrid catalog organization

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { Language, ShopTranslations } from '@/types';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations: Record<Language, ShopTranslations> = {
  en: {
    // Common
    openGateways: 'Open Gateways',
    onlineShop: 'Online Shop',
    loading: 'Loading...',
    error: 'Error',
    required: 'Required',
    optional: 'Optional',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    back: 'Back',
    next: 'Next',
    
    // Navigation
    home: 'Home',
    products: 'Products',
    categories: 'Categories',
    cart: 'Cart',
    checkout: 'Checkout',
    myAccount: 'My Account',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    register: 'Register',
    
    // Header/Footer
    welcomeTo: 'Welcome to',
    tagline: 'Channeled Wisdom for Your Journey',
    questionsCall: 'Questions? Call',
    questionsEmail: 'Questions? Email us',
    followUs: 'Follow Us',
    allRightsReserved: 'All Rights Reserved',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contactUs: 'Contact Us',
    
    // Homepage
    heroTitle: 'Baratta Workshop Recordings',
    heroSubtitle: 'Digital downloads available instantly',
    featuredProducts: 'Featured Products',
    browseCategories: 'Browse Categories',
    viewAll: 'View All',
    instantAccess: 'Instant Access to Baratta\'s Loving Wisdom',
    instantAccessDescription: 'All digital products are available for immediate download after purchase. Start your journey today with these transformative workshops from Baratta.',
    
    // Products
    allProducts: 'All Products',
    filterByCategory: 'Filter by Category',
    sortBy: 'Sort By',
    priceHighLow: 'Price: High to Low',
    priceLowHigh: 'Price: Low to High',
    newest: 'Newest',
    noProductsFound: 'No products found',
    addToCart: 'Add to Cart',
    addedToCart: 'Added!',
    outOfStock: 'Out of Stock',
    
    // Product Language Filter (✅ NEW)
    filterByLanguage: 'Filter by Language',
    allLanguages: 'All Languages',
    englishProducts: 'English',
    spanishProducts: 'Spanish',
    bilingualProducts: 'Bilingual',
    alsoAvailableIn: 'other(s) available in',
    productInEnglish: 'In English',
    productInSpanish: 'In Spanish',
    productBilingual: 'Bilingual (EN/ES)',
    
    // Product Detail
    productDetails: 'Product Details',
    description: 'Description',
    format: 'Format',
    duration: 'Duration',
    fileSize: 'File Size',
    relatedProducts: 'Related Products',
    
    // Cart
    yourCart: 'Your Cart',
    cartEmpty: 'Your cart is empty',
    cartEmptyMessage: 'Browse our products and add items to your cart',
    continueShopping: 'Continue Shopping',
    subtotal: 'Subtotal',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    removeItem: 'Remove',
    quantity: 'Quantity',
    itemsInCart: 'items in cart',
    
    // Checkout
    checkoutTitle: 'Checkout',
    guestCheckout: 'Guest Checkout',
    haveAccount: 'Have an account?',
    signInToCheckout: 'Sign in for faster checkout',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    country: 'Country',
    selectCountry: 'Select Country',
    payWithCard: 'Pay with Card',
    processing: 'Processing...',
    secureCheckout: 'Secure checkout powered by Stripe',
    orderSummary: 'Order Summary',
    
    // Login/Auth
    password: 'Password',
    orContinueAsGuest: 'or continue as guest',
    dontHaveAccount: "Don't have an account?",
    registerAtSchedule: 'Register at schedule.opengateways.com',
    loggedInAs: 'Logged in as',
    loginError: 'Invalid email or password',
    loggingIn: 'Signing in...',
    logout: 'Logout',
    
    // Currency
    currency: 'Currency',
    usd: 'USD',
    mxn: 'MXN',
    pricesIn: 'Prices shown in',
    
    // Order Confirmation
    orderConfirmed: 'Order Confirmed!',
    thankYouOrder: 'Thank you for your purchase',
    orderReference: 'Order Reference',
    downloadLinks: 'Your Download Links',
    downloadNow: 'Download Now',
    downloadsRemaining: 'downloads remaining',
    expiresOn: 'Expires on',
    emailSent: 'A confirmation email has been sent to your email address',
    createAccountPrompt: 'Create an Account',
    createAccountBenefit: 'Create an account to access your purchases anytime and receive exclusive offers',
    
    // Account
    purchaseHistory: 'Purchase History',
    downloads: 'Downloads',
    accountSettings: 'Account Settings',
    myOrders: 'My Orders',
    orderHistory: 'Order History',
    
    // Errors
    errorGeneric: 'Something went wrong. Please try again.',
    errorPayment: 'Payment failed. Please check your card details.',
    errorCart: 'Unable to update cart. Please try again.',
    tryAgain: 'Try Again',

    // Register
    createAccount: 'Create Account',
    confirmPassword: 'Confirm Password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    emailAlreadyExists: 'An account with this email already exists',
    registerSuccess: 'Account created! Signing you in…',
    alreadyHaveAccount: 'Already have an account?',
    registering: 'Creating account…',
    registerTitle: 'Create Your Account',
    registerSubtitle: 'Join Open Gateways to access your purchases anytime',
  },
  
  es: {
    // Common
    openGateways: 'Open Gateways',
    onlineShop: 'Tienda en línea',
    loading: 'Cargando...',
    error: 'Error',
    required: 'Requerido',
    optional: 'Opcional',
    close: 'Cerrar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    back: 'Atrás',
    next: 'Siguiente',
    
    // Navigation
    home: 'Inicio',
    products: 'Productos',
    categories: 'Categorías',
    cart: 'Carrito',
    checkout: 'Pagar',
    myAccount: 'Mi Cuenta',
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    register: 'Registrarse',
    
    // Header/Footer
    welcomeTo: 'Bienvenido a',
    tagline: 'Sabiduría canalizada para tu camino',
    questionsCall: '¿Preguntas? Llámanos',
    questionsEmail: '¿Preguntas? Escríbenos',
    followUs: 'Síguenos',
    allRightsReserved: 'Todos los derechos reservados',
    privacyPolicy: 'Política de privacidad',
    termsOfService: 'Términos de servicio',
    contactUs: 'Contáctanos',
    
    // Homepage
    heroTitle: 'Grabaciones de talleres de Baratta',
    heroSubtitle: 'Descargas digitales disponibles al instante',
    featuredProducts: 'Productos destacados',
    browseCategories: 'Explorar categorías',
    viewAll: 'Ver Todo',
    instantAccess: 'Acceso instantáneo a la sabiduría amorosa de Baratta',
    instantAccessDescription: 'Todos los productos digitales están disponibles para descarga inmediata después de la compra. Comienza tu viaje hoy con estas talleres transformadores de Baratta.',
    
    // Products
    allProducts: 'Todos los productos',
    filterByCategory: 'Filtrar por categoría',
    sortBy: 'Ordenar por',
    priceHighLow: 'Precio: mayor a menor',
    priceLowHigh: 'Precio: menor a mayor',
    newest: 'Más recientes',
    noProductsFound: 'No se encontraron productos',
    addToCart: 'Agregar al carrito',
    addedToCart: '¡Agregado!',
    outOfStock: 'Agotado',
    
    // Product Language Filter (✅ NEW)
    filterByLanguage: 'Filtrar por idioma',
    allLanguages: 'Todos los idiomas',
    englishProducts: 'Inglés',
    spanishProducts: 'Español',
    bilingualProducts: 'Bilingüe',
    alsoAvailableIn: 'otro(s) disponible en',
    productInEnglish: 'En inglés',
    productInSpanish: 'En español',
    productBilingual: 'Bilingüe (EN/ES)',
    
    // Product Detail
    productDetails: 'Detalles del producto',
    description: 'Descripción',
    format: 'Formato',
    duration: 'Duración',
    fileSize: 'Tamaño del archivo',
    relatedProducts: 'Productos relacionados',
    
    // Cart
    yourCart: 'Tu Carrito',
    cartEmpty: 'Tu carrito está vacío',
    cartEmptyMessage: 'Explora nuestros productos y agrega artículos a tu carrito',
    continueShopping: 'Seguir comprando',
    subtotal: 'Subtotal',
    total: 'Total',
    proceedToCheckout: 'Proceder al pago',
    removeItem: 'Eliminar',
    quantity: 'Cantidad',
    itemsInCart: 'artículos en el carrito',
    
    // Checkout
    checkoutTitle: 'Pago',
    guestCheckout: 'Pago como invitado',
    haveAccount: '¿Tienes una cuenta?',
    signInToCheckout: 'Inicia sesión para un pago más rápido',
    email: 'Correo electrónico',
    firstName: 'Nombre(s)',
    lastName: 'Apellido(s)',
    country: 'País',
    selectCountry: 'Selecciona un país',
    payWithCard: 'Pagar con tarjeta',
    processing: 'Procesando...',
    secureCheckout: 'Pago seguro con Stripe',
    orderSummary: 'Resumen del pedido',
    
    // Login/Auth
    password: 'Contraseña',
    orContinueAsGuest: 'o continúa como invitado',
    dontHaveAccount: '¿No tienes cuenta?',
    registerAtSchedule: 'Regístrate en schedule.opengateways.com',
    loggedInAs: 'Conectado como',
    loginError: 'Correo o contraseña inválidos',
    loggingIn: 'Iniciando sesión...',
    logout: 'Cerrar sesión',
    
    // Currency
    currency: 'Moneda',
    usd: 'USD',
    mxn: 'MXN',
    pricesIn: 'Precios mostrados en',
    
    // Order Confirmation
    orderConfirmed: '¡Pedido confirmado!',
    thankYouOrder: 'Gracias por tu compra',
    orderReference: 'Referencia del pedido',
    downloadLinks: 'Tus enlaces de descarga',
    downloadNow: 'Descargar ahora',
    downloadsRemaining: 'descargas restantes',
    expiresOn: 'Expira el',
    emailSent: 'Se ha enviado un correo de confirmación a tu dirección de correo electrónico',
    createAccountPrompt: 'Crear una cuenta',
    createAccountBenefit: 'Crea una cuenta para acceder a tus compras en cualquier momento y recibir ofertas exclusivas',
    
    // Account
    purchaseHistory: 'Historial de compras',
    downloads: 'Descargas',
    accountSettings: 'Configuración de cuenta',
    myOrders: 'Mis pedidos',
    orderHistory: 'Historial de pedidos',
    
    // Errors
    errorGeneric: 'Algo salió mal. Por favor intenta de nuevo.',
    errorPayment: 'El pago falló. Por favor verifica los datos de tu tarjeta.',
    errorCart: 'No se pudo actualizar el carrito. Por favor intenta de nuevo.',
    tryAgain: 'Intentar de nuevo',

    // Register
    createAccount: 'Crear cuenta',
    confirmPassword: 'Confirmar contraseña',
    passwordMismatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres',
    emailAlreadyExists: 'Ya existe una cuenta con este correo electrónico',
    registerSuccess: '¡Cuenta creada! Iniciando sesión…',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    registering: 'Creando cuenta…',
    registerTitle: 'Crea tu cuenta',
    registerSubtitle: 'Únete a Open Gateways para acceder a tus compras en cualquier momento',
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

interface LanguageContextType {
  language: Language;
  translations: typeof translations;
  switchLanguage: (lang: Language) => void;
  t: ShopTranslations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Check cookie first
    const savedLang = Cookies.get('lang') as Language | undefined;
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      setLanguage(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        setLanguage('es');
      }
    }
    setIsInitialized(true);
  }, []);
  
  const switchLanguage = (newLang: Language) => {
    setLanguage(newLang);
    
    // Save to cookie with 1-year expiry
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    
    // Get domain for cross-subdomain cookie
    const domain = typeof window !== 'undefined' && window.location.hostname.includes('opengateways.com')
      ? '.opengateways.com'
      : undefined;
    
    Cookies.set('lang', newLang, {
      expires,
      domain,
      path: '/',
    });
  };
  
  const value: LanguageContextType = {
    language,
    translations,
    switchLanguage,
    t: translations[language],
  };
  
  // Prevent flash of wrong language
  if (!isInitialized) {
    return null;
  }
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export for external use
export { translations };

