// SHOP_src_lib_emailService.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Email service for order confirmations and download links

import { Resend } from 'resend';
import type { OrderWithItems, DownloadTokenWithProduct, Language } from '@/types';
import { logEmail } from './database';

// ============================================================================
// RESEND CLIENT
// ============================================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// CONSTANTS
// ============================================================================

const FROM_EMAIL = process.env.EMAIL_FROM || 'Open Gateways Shop <shop@opengateways.com>';
const SHOP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.opengateways.com';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface OrderConfirmationData {
  order: OrderWithItems;
  downloadTokens: DownloadTokenWithProduct[];
  language: Language;
}

function getOrderConfirmationSubject(orderReference: string, language: Language): string {
  return language === 'es'
    ? `Confirmación de Pedido - ${orderReference}`
    : `Order Confirmation - ${orderReference}`;
}

function formatDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(language === 'es' ? 'es-MX' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const { order, downloadTokens, language } = data;
  
  const t = {
    en: {
      greeting: `Hello ${order.customer_first_name || order.customer_name.split(' ')[0]}`,
      thankYou: 'Thank you for your purchase!',
      orderConfirmed: 'Your order has been confirmed.',
      orderDetails: 'Order Details',
      orderReference: 'Order Reference',
      orderDate: 'Order Date',
      items: 'Items',
      total: 'Total',
      downloadSection: 'Your Download Links',
      downloadInstructions: 'Click the links below to download your products. Each link is valid for',
      days: 'days',
      downloads: 'downloads',
      downloadNow: 'Download Now',
      expiresOn: 'Expires on',
      remainingDownloads: 'remaining downloads',
      questions: 'Questions? Contact us at',
      footer: 'Thank you for choosing Open Gateways',
      copyright: '© Open Gateways - All Rights Reserved',
    },
    es: {
      greeting: `Hola ${order.customer_first_name || order.customer_name.split(' ')[0]}`,
      thankYou: '¡Gracias por tu compra!',
      orderConfirmed: 'Tu pedido ha sido confirmado.',
      orderDetails: 'Detalles del Pedido',
      orderReference: 'Referencia del Pedido',
      orderDate: 'Fecha del Pedido',
      items: 'Artículos',
      total: 'Total',
      downloadSection: 'Tus Enlaces de Descarga',
      downloadInstructions: 'Haz clic en los enlaces a continuación para descargar tus productos. Cada enlace es válido por',
      days: 'días',
      downloads: 'descargas',
      downloadNow: 'Descargar Ahora',
      expiresOn: 'Expira el',
      remainingDownloads: 'descargas restantes',
      questions: '¿Preguntas? Contáctanos en',
      footer: 'Gracias por elegir Open Gateways',
      copyright: '© Open Gateways - Todos los Derechos Reservados',
    },
  };
  
  const text = t[language];
  
  // Generate order items HTML
  const itemsHtml = order.items.map(item => {
    const name = language === 'es' ? item.product_name_es : item.product_name_en;
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${item.total_price_usd.toFixed(2)} USD</td>
      </tr>
    `;
  }).join('');
  
  // Generate download links HTML
  const downloadsHtml = downloadTokens.map(token => {
    const name = language === 'es' ? token.product_name_es : token.product_name_en;
    const expiresDate = formatDate(token.expires_at, language);
    const downloadUrl = `${SHOP_URL}/api/download/${token.token}`;
    
    return `
      <div style="margin-bottom: 20px; padding: 16px; background: #f7fafc; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px;">${name}</h4>
        <p style="margin: 0 0 12px 0; color: #718096; font-size: 14px;">
          ${text.expiresOn}: ${expiresDate}<br>
          ${token.max_downloads} ${text.remainingDownloads}
        </p>
        <a href="${downloadUrl}" 
           style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #0184f6 0%, #0164c9 100%); 
                  color: white; text-decoration: none; border-radius: 50px; font-size: 14px; font-weight: 500;">
          ${text.downloadNow}
        </a>
      </div>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${text.orderConfirmed}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 30px 0;">
      <img src="https://opengateways.com/assets/images/shared/OG_logo_2025.webp" alt="Open Gateways" 
           style="width: 180px; height: 38px;">
      <h1 style="margin: 16px 0 0 0; color: #0184f6; font-size: 24px; font-weight: 400;">Open Gateways</h1>
    </div>
    
    <!-- Main Content Card -->
    <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Greeting -->
      <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, rgba(1, 132, 246, 0.1) 0%, rgba(1, 100, 201, 0.05) 100%);">
        <h2 style="margin: 0 0 8px 0; color: #2d3748; font-size: 22px;">${text.greeting}</h2>
        <p style="margin: 0; color: #0184f6; font-size: 18px; font-weight: 500;">${text.thankYou}</p>
        <p style="margin: 8px 0 0 0; color: #718096;">${text.orderConfirmed}</p>
      </div>
      
      <!-- Order Details -->
      <div style="padding: 30px;">
        <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px; border-bottom: 2px solid #0184f6; padding-bottom: 8px;">
          ${text.orderDetails}
        </h3>
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #718096;">${text.orderReference}:</td>
            <td style="padding: 8px 0; color: #2d3748; font-weight: 500; text-align: right;">${order.order_reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #718096;">${text.orderDate}:</td>
            <td style="padding: 8px 0; color: #2d3748; text-align: right;">${formatDate(order.created_at, language)}</td>
          </tr>
        </table>
        
        <!-- Items Table -->
        <h4 style="margin: 24px 0 12px 0; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${text.items}
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 500; color: #2d3748;">
              ${text.total}:
            </td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 600; color: #0184f6; font-size: 18px;">
              $${order.total_amount_usd.toFixed(2)} USD
            </td>
          </tr>
        </table>
        
        <!-- Download Section -->
        ${downloadTokens.length > 0 ? `
          <div style="margin-top: 30px;">
            <h3 style="margin: 0 0 8px 0; color: #2d3748; font-size: 18px; border-bottom: 2px solid #0184f6; padding-bottom: 8px;">
              ${text.downloadSection}
            </h3>
            <p style="margin: 0 0 20px 0; color: #718096; font-size: 14px;">
              ${text.downloadInstructions} 7 ${text.days} / ${downloadTokens[0]?.max_downloads || 5} ${text.downloads}.
            </p>
            ${downloadsHtml}
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 30px; color: #718096; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">${text.questions} <a href="mailto:info@opengateways.com" style="color: #0184f6;">info@opengateways.com</a></p>
      <p style="margin: 16px 0 0 0; font-weight: 500; color: #4a5568;">${text.footer}</p>
      <p style="margin: 8px 0 0 0; font-size: 12px;">${text.copyright}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send order confirmation email with download links
 */
export async function sendOrderConfirmationEmail(
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  const { order, language } = data;
  
  try {
    const subject = getOrderConfirmationSubject(order.order_reference, language);
    const html = generateOrderConfirmationHtml(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject,
      html,
    });
    
    if (result.error) {
      logEmail('order_confirmation', order.customer_email, order.id, 'failed', result.error.message);
      return { success: false, error: result.error.message };
    }
    
    logEmail('order_confirmation', order.customer_email, order.id, 'sent');
    console.log(`[Shop Email] Order confirmation sent to ${order.customer_email} for order ${order.order_reference}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logEmail('order_confirmation', order.customer_email, order.id, 'failed', errorMessage);
    console.error('[Shop Email] Failed to send order confirmation:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send download link reminder email
 */
export async function sendDownloadReminderEmail(
  email: string,
  customerName: string,
  downloadTokens: DownloadTokenWithProduct[],
  language: Language
): Promise<{ success: boolean; error?: string }> {
  try {
    const t = language === 'es'
      ? {
          subject: 'Recordatorio: Tus descargas expiran pronto',
          greeting: `Hola ${customerName.split(' ')[0]}`,
          message: 'Tus enlaces de descarga expirarán pronto. Asegúrate de descargar tus productos antes de que expiren.',
          downloadNow: 'Descargar Ahora',
        }
      : {
          subject: 'Reminder: Your downloads expire soon',
          greeting: `Hello ${customerName.split(' ')[0]}`,
          message: 'Your download links will expire soon. Make sure to download your products before they expire.',
          downloadNow: 'Download Now',
        };
    
    const downloadsHtml = downloadTokens.map(token => {
      const name = language === 'es' ? token.product_name_es : token.product_name_en;
      const downloadUrl = `${SHOP_URL}/api/download/${token.token}`;
      
      return `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-weight: 500;">${name}</p>
          <a href="${downloadUrl}" style="color: #0184f6;">${t.downloadNow}</a>
        </div>
      `;
    }).join('');
    
    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <h2>${t.greeting}</h2>
        <p>${t.message}</p>
        ${downloadsHtml}
      </div>
    `;
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: t.subject,
      html,
    });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    console.log(`[Shop Email] Download reminder sent to ${email}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Shop Email] Failed to send download reminder:', error);
    return { success: false, error: errorMessage };
  }
}
