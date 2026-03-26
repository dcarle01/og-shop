// SHOP_src_app_products_[slug]_page.tsx
// Version: 1.1.0 | Created: 2026-01-28 | Last Modified: 2026-03-14 | Author: Open Gateways Team
// Description: Product detail page with add to cart
// ✅ Related products now keyword-scored via getRelatedProducts()

import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductDetailClient from './ProductDetailClient';
import { getProductBySlug, getRelatedProducts } from '@/lib/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Always render fresh from DB — prevents stale ISR cache serving old image URLs
export const dynamic = 'force-dynamic';

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const product = getProductBySlug(slug);
    
    if (!product) {
      return { title: 'Product Not Found | Open Gateways Shop' };
    }
    
    return {
      title: `${product.name_en} | Open Gateways Shop`,
      description: product.short_description_en || product.description_en || `${product.name_en} - Digital download from Open Gateways`,
      openGraph: {
        title: product.name_en,
        description: product.short_description_en || undefined,
        images: product.image_url ? [product.image_url] : undefined,
      },
    };
  } catch {
    return { title: 'Open Gateways Shop' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  let product;
  try {
    product = getProductBySlug(slug);
  } catch (error) {
    console.error('Error fetching product:', error);
    notFound();
  }
  
  if (!product) {
    notFound();
  }
  
  // Get related products by keyword scoring (falls back to same category)
  let relatedProducts: typeof product[] = [];
  try {
    relatedProducts = getRelatedProducts(product.id, 4);
  } catch {
    // Ignore errors for related products
  }
  
  return (
    <>
      <Header />
      <CartDrawer />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      <Footer />
    </>
  );
}


