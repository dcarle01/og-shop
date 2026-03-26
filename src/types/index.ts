// SHOP_src_types_index.ts
// Version: 1.3.0 | Created: 2026-01-28 | Last Modified: 2026-03-13 | Author: Open Gateways Team
// Description: TypeScript type definitions for Open Gateways Shop
// ✅ Added auth types for login functionality
// ✅ Added content_language for hybrid catalog organization
// ✅ Added name_sub_en / name_sub_es for dynamic product card text overlay

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductType = 'audio' | 'ebook' | 'video' | 'bundle';

/**
 * Content Language indicates the actual language of the product content:
 * - 'en': Product content is in English (e.g., English workshop recording)
 * - 'es': Product content is in Spanish (e.g., Spanish workshop recording)
 * - 'both': Translated pair - content available in both languages
 * - null: Language-neutral (e.g., instrumental music, meditations without speech)
 *
 * Note: This is separate from the UI language (name_en, name_es fields)
 * which are used for displaying product info in the user's preferred language.
 */
export type ContentLanguage = 'en' | 'es' | 'both' | null;

export interface Product {
  id: number;
  sku: string;
  slug: string;
  name_en: string;
  name_es: string;
  name_sub_en: string | null;  // ✅ NEW: Display subtitle in English
  name_sub_es: string | null;  // ✅ NEW: Display subtitle in Spanish
  description_en: string | null;
  description_es: string | null;
  short_description_en: string | null;
  short_description_es: string | null;
  price_usd: number;
  product_type: ProductType;
  category_id: number | null;
  content_language: ContentLanguage;  // ✅ NEW: Actual content language
  image_url: string | null;
  download_file_path: string | null;
  download_expiry_hours: number;
  max_downloads: number;
  file_format: string | null;
  file_size_mb: number | null;
  duration_minutes: number | null;
  file_count: number | null;
  release_year: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category_name_en?: string;
  category_name_es?: string;
  category_slug?: string;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: number;
  slug: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithProducts extends Category {
  products: Product[];
  product_count: number;
}

/**
 * Category with product counts broken down by content language
 */
export interface CategoryWithLanguageCounts extends Category {
  total_count: number;
  en_count: number;
  es_count: number;
  both_count: number;
  neutral_count: number;  // Language-neutral (music, etc.)
}

// ============================================================================
// PRODUCT QUERY OPTIONS
// ============================================================================

/**
 * Options for querying products with language filtering
 */
export interface ProductQueryOptions {
  category_id?: number;
  category_slug?: string;
  is_active?: boolean;
  is_featured?: boolean;
  content_language?: 'en' | 'es' | 'both';  // Filter by content language
  include_neutral?: boolean;                  // Include language-neutral products (default: true)
  include_both?: boolean;                     // Include 'both' (translated pairs) (default: true)
  limit?: number;
  offset?: number;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface CartItem {
  product_id: number;
  sku: string;
  name_en: string;
  name_es: string;
  price_usd: number;
  quantity: number;
  image_url: string | null;
  product_type: ProductType;
  content_language: ContentLanguage;  // ✅ NEW: For display badges in cart
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal_usd: number;
  currency: 'USD' | 'MXN';
  exchange_rate?: number;
  subtotal_display: number;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: number;
  order_reference: string;
  user_id: number | null;
  customer_email: string;
  customer_name: string;
  customer_first_name: string | null;
  customer_last_name: string | null;
  customer_country: string | null;
  total_amount_usd: number;
  currency: 'USD' | 'MXN';
  exchange_rate: number | null;
  total_amount_display: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  language: 'en' | 'es';
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_sku: string;
  product_name_en: string;
  product_name_es: string;
  quantity: number;
  unit_price_usd: number;
  total_price_usd: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// ============================================================================
// DOWNLOAD TYPES
// ============================================================================

export interface DownloadToken {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  token: string;
  download_count: number;
  max_downloads: number;
  expires_at: string;
  created_at: string;
}

export interface DownloadTokenWithProduct extends DownloadToken {
  product_name_en: string;
  product_name_es: string;
  download_file_path: string;
  file_format: string | null;
}

// ============================================================================
// USER TYPES (Shared with Schedule system)
// ============================================================================

export interface User {
  id: number;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone: string | null;
  country_code: string | null;
  timezone: string | null;
  language: 'en' | 'es';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Extended user with preferred_name (from database)
export interface ShopUser extends User {
  preferred_name: string | null;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: ShopUser;
  token?: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  iat: number;
  exp: number;
  iss: string;
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

export interface CheckoutSession {
  session_id: string;
  cart: Cart;
  customer_email: string;
  customer_name: string;
  customer_country: string | null;
  language: 'en' | 'es';
  currency: 'USD' | 'MXN';
  exchange_rate: number | null;
  created_at: string;
}

export interface CreateCheckoutRequest {
  cart: Cart;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_country?: string;
  language: 'en' | 'es';
  currency: 'USD' | 'MXN';
  exchange_rate?: number;
  user_id?: number;  // ✅ Added for logged-in users
}

export interface CreateCheckoutResponse {
  success: boolean;
  session_id?: string;
  checkout_url?: string;
  error?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProductsResponse {
  products: ProductWithCategory[];
  total: number;
  page: number;
  per_page: number;
  language_counts?: {        // ✅ NEW: Optional language breakdown
    en: number;
    es: number;
    both: number;
    neutral: number;
  };
}

export interface CategoriesResponse {
  categories: Category[];
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailLog {
  id: number;
  email_type: string;
  recipient_email: string;
  order_id: number | null;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  sent_at: string;
}

export interface OrderConfirmationEmailData {
  order: OrderWithItems;
  downloadTokens: DownloadTokenWithProduct[];
  language: 'en' | 'es';
}

// ============================================================================
// TRANSLATION TYPES
// ============================================================================

export interface ShopTranslations {
  // Common
  openGateways: string;
  onlineShop: string;
  loading: string;
  error: string;
  required: string;
  optional: string;
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  back: string;
  next: string;
  
  // Navigation
  home: string;
  products: string;
  categories: string;
  cart: string;
  checkout: string;
  myAccount: string;
  signIn: string;
  signOut: string;
  register: string;
  
  // Header/Footer
  welcomeTo: string;
  tagline: string;
  questionsCall: string;
  questionsEmail: string;
  followUs: string;
  allRightsReserved: string;
  privacyPolicy: string;
  termsOfService: string;
  contactUs: string;
  
  // Homepage
  heroTitle: string;
  heroSubtitle: string;
  featuredProducts: string;
  browseCategories: string;
  viewAll: string;
  instantAccess: string;
  instantAccessDescription: string;
  
  // Products
  allProducts: string;
  filterByCategory: string;
  sortBy: string;
  priceHighLow: string;
  priceLowHigh: string;
  newest: string;
  noProductsFound: string;
  addToCart: string;
  addedToCart: string;
  outOfStock: string;
  
  // Product Language Filter (✅ NEW)
  filterByLanguage: string;
  allLanguages: string;
  englishProducts: string;
  spanishProducts: string;
  bilingualProducts: string;
  alsoAvailableIn: string;
  productInEnglish: string;
  productInSpanish: string;
  productBilingual: string;
  
  // Product Detail
  productDetails: string;
  description: string;
  format: string;
  duration: string;
  fileSize: string;
  relatedProducts: string;
  
  // Cart
  yourCart: string;
  cartEmpty: string;
  cartEmptyMessage: string;
  continueShopping: string;
  subtotal: string;
  total: string;
  proceedToCheckout: string;
  removeItem: string;
  quantity: string;
  itemsInCart: string;
  
  // Checkout
  checkoutTitle: string;
  guestCheckout: string;
  haveAccount: string;
  signInToCheckout: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  selectCountry: string;
  payWithCard: string;
  processing: string;
  secureCheckout: string;
  orderSummary: string;
  
  // Login/Auth
  password: string;
  orContinueAsGuest: string;
  dontHaveAccount: string;
  registerAtSchedule: string;
  loggedInAs: string;
  loginError: string;
  loggingIn: string;
  logout: string;
  
  // Currency
  currency: string;
  usd: string;
  mxn: string;
  pricesIn: string;
  
  // Order Confirmation
  orderConfirmed: string;
  thankYouOrder: string;
  orderReference: string;
  downloadLinks: string;
  downloadNow: string;
  downloadsRemaining: string;
  expiresOn: string;
  emailSent: string;
  createAccountPrompt: string;
  createAccountBenefit: string;
  
  // Account
  purchaseHistory: string;
  downloads: string;
  accountSettings: string;
  myOrders: string;
  orderHistory: string;
  
  // Errors
  errorGeneric: string;
  errorPayment: string;
  errorCart: string;
  tryAgain: string;

  // Register
  createAccount: string;
  confirmPassword: string;
  passwordMismatch: string;
  passwordTooShort: string;
  emailAlreadyExists: string;
  registerSuccess: string;
  alreadyHaveAccount: string;
  registering: string;
  registerTitle: string;
  registerSubtitle: string;
}

export type Language = 'en' | 'es';
export type Currency = 'USD' | 'MXN';

