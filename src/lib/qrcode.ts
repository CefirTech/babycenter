import QRCode from 'qrcode';

/** Generate a QR code as a base64 PNG data URL. */
export async function generateQRDataUrl(content: string, size = 200): Promise<string> {
  return QRCode.toDataURL(content, {
    width: size,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

/** Generate a QR code for an order tracking URL. */
export async function orderQRDataUrl(numeroCommande: string): Promise<string> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return generateQRDataUrl(`${baseUrl}/compte/commandes/${numeroCommande}`);
}

/** Generate a QR code for a product page URL. */
export async function productQRDataUrl(slug: string): Promise<string> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return generateQRDataUrl(`${baseUrl}/produit/${slug}`);
}
