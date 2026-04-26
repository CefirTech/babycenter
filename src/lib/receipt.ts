import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fcfa } from './format';

export type ReceiptData = {
  numero_vente: string;
  created_at: string;
  vendeur_nom?: string | null;
  customer_nom?: string | null;
  mode_paiement: string;
  paiements?: { mode: string; montant: number }[] | null;
  sous_total: number;
  remise: number;
  total: number;
  montant_recu?: number | null;
  items: { product_nom: string; taille?: string | null; couleur?: string | null; prix_unitaire: number; quantite: number; remise_ligne?: number; total: number }[];
  statut?: string;
};

const BOUTIQUE = { nom: 'BABYCENTER', tagline: 'Mode enfants 0-16 ans', tel: 'Abidjan, Côte d\'Ivoire', merci: 'Merci pour votre achat !' };

/**
 * jsPDF (helvetica/WinAnsi) ne gère pas les espaces fines/insécables (U+00A0, U+202F, U+2009)
 * que `toLocaleString('fr-FR')` insère comme séparateurs de milliers.
 * Ces caractères s'affichent comme "/" dans le PDF. On les remplace par un espace standard.
 */
const safe = (s: string | number | null | undefined): string =>
  String(s ?? '').replace(/[\u00A0\u202F\u2009\u2007]/g, ' ');

const money = (n: number | null | undefined) => safe(fcfa(n));

const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  mtn_money: 'MTN Money',
  wave: 'Wave',
  carte: 'Carte',
  virement: 'Virement',
};
const modeLabel = (m: string) => MODE_LABELS[m] || safe(m.replace(/_/g, ' '));

/** Ticket de caisse format thermique 80mm — mise en page soignée */
export function printThermalReceipt(r: ReceiptData) {
  const widthMM = 80;
  const margin = 4;
  const innerW = widthMM - margin * 2;

  // Hauteur dynamique : entête + items (2 lignes) + totaux + paiements
  const itemsLines = r.items.length * 2;
  const paiementsLines = (r.paiements?.length ?? 1) + (r.montant_recu ? 2 : 0);
  const heightMM = 60 + itemsLines * 4 + paiementsLines * 4 + (r.remise > 0 ? 4 : 0) + 18;

  const doc = new jsPDF({ unit: 'mm', format: [widthMM, heightMM] });
  let y = 6;

  // En-tête
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(BOUTIQUE.nom, widthMM / 2, y, { align: 'center' }); y += 4;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7);
  doc.text(BOUTIQUE.tagline, widthMM / 2, y, { align: 'center' }); y += 3;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(BOUTIQUE.tel, widthMM / 2, y, { align: 'center' }); y += 4;

  // Filet
  doc.setLineWidth(0.3); doc.line(margin, y, widthMM - margin, y); y += 4;

  // Méta vente
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text(`Ticket N° ${safe(r.numero_vente)}`, margin, y); y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(safe(new Date(r.created_at).toLocaleString('fr-FR')), margin, y); y += 3.5;
  if (r.vendeur_nom) { doc.text(`Vendeur : ${safe(r.vendeur_nom)}`, margin, y); y += 3.5; }
  if (r.customer_nom) { doc.text(`Client : ${safe(r.customer_nom)}`, margin, y); y += 3.5; }

  if (r.statut === 'annulee') {
    y += 1;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 0, 0); doc.setFontSize(10);
    doc.text('** ANNULÉE **', widthMM / 2, y, { align: 'center' }); y += 4;
    doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  }

  y += 1;
  doc.setLineDashPattern([0.6, 0.6], 0); doc.line(margin, y, widthMM - margin, y);
  doc.setLineDashPattern([], 0); y += 4;

  // Items
  doc.setFontSize(8);
  r.items.forEach((it) => {
    doc.setFont('helvetica', 'bold');
    doc.text(safe(it.product_nom).slice(0, 40), margin, y); y += 3.2;
    doc.setFont('helvetica', 'normal');
    const variant = [it.taille, it.couleur].filter(Boolean).join(' • ');
    const left = `${it.quantite} x ${money(it.prix_unitaire)}${variant ? '   ' + safe(variant) : ''}`;
    doc.text(left, margin, y);
    doc.text(money(it.total), widthMM - margin, y, { align: 'right' });
    y += 4.2;
  });

  doc.setLineDashPattern([0.6, 0.6], 0); doc.line(margin, y, widthMM - margin, y);
  doc.setLineDashPattern([], 0); y += 4;

  // Totaux
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('Sous-total', margin, y);
  doc.text(money(r.sous_total), widthMM - margin, y, { align: 'right' }); y += 3.5;
  if (r.remise > 0) {
    doc.text('Remise', margin, y);
    doc.text('-' + money(r.remise), widthMM - margin, y, { align: 'right' }); y += 3.5;
  }

  // TOTAL en évidence (encadré)
  y += 1;
  doc.setFillColor(245, 230, 235);
  doc.rect(margin, y - 3.5, innerW, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('TOTAL', margin + 1.5, y);
  doc.text(money(r.total), widthMM - margin - 1.5, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  if (r.paiements && r.paiements.length > 0) {
    r.paiements.forEach((p) => {
      doc.text(modeLabel(p.mode), margin, y);
      doc.text(money(p.montant), widthMM - margin, y, { align: 'right' });
      y += 3.5;
    });
  } else {
    doc.text(`Paiement : ${modeLabel(r.mode_paiement)}`, margin, y); y += 3.5;
  }
  if (r.montant_recu && r.montant_recu > 0) {
    doc.text('Reçu', margin, y);
    doc.text(money(r.montant_recu), widthMM - margin, y, { align: 'right' }); y += 3.5;
    doc.text('Monnaie', margin, y);
    doc.text(money(r.montant_recu - r.total), widthMM - margin, y, { align: 'right' }); y += 3.5;
  }

  y += 4;
  doc.setLineDashPattern([0.6, 0.6], 0); doc.line(margin, y, widthMM - margin, y);
  doc.setLineDashPattern([], 0); y += 4;

  doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
  doc.text(BOUTIQUE.merci, widthMM / 2, y, { align: 'center' }); y += 3.5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.text('À bientôt chez Babycenter', widthMM / 2, y, { align: 'center' });

  doc.autoPrint();
  // Impression via iframe caché (évite les blocages de pop-up / adblockers)
  const blobUrl = doc.output('bloburl') as unknown as string;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = String(blobUrl);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      doc.save(`ticket-${Date.now()}.pdf`);
    }
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 60_000);
  };
  document.body.appendChild(iframe);
}

/** Ticket A4 (réimpression PDF) — mise en page premium */
export function downloadReceiptA4(r: ReceiptData) {
  const doc = new jsPDF();
  const pageW = 210;

  // Bandeau d'en-tête coloré
  doc.setFillColor(180, 90, 110);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text(BOUTIQUE.nom, 14, 16);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(BOUTIQUE.tagline, 14, 22);
  doc.text(BOUTIQUE.tel, 14, 27);

  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('TICKET DE CAISSE', pageW - 14, 16, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`N° ${safe(r.numero_vente)}`, pageW - 14, 22, { align: 'right' });
  doc.text(safe(new Date(r.created_at).toLocaleString('fr-FR')), pageW - 14, 27, { align: 'right' });

  doc.setTextColor(0);
  let y = 42;
  if (r.customer_nom) { doc.setFont('helvetica', 'bold'); doc.text('Client :', 14, y); doc.setFont('helvetica', 'normal'); doc.text(safe(r.customer_nom), 32, y); y += 5; }
  if (r.vendeur_nom) { doc.setFont('helvetica', 'bold'); doc.text('Vendeur :', 14, y); doc.setFont('helvetica', 'normal'); doc.text(safe(r.vendeur_nom), 32, y); y += 5; }
  if (r.statut === 'annulee') {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 0, 0); doc.setFontSize(12);
    doc.text('VENTE ANNULÉE', 14, y); y += 6;
    doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  }

  autoTable(doc, {
    startY: y + 4,
    head: [['Produit', 'Variante', 'PU', 'Qté', 'Remise', 'Total']],
    body: r.items.map((it) => [
      safe(it.product_nom),
      [it.taille, it.couleur].filter(Boolean).join(' • ') || '—',
      money(it.prix_unitaire),
      String(it.quantite),
      it.remise_ligne ? '-' + money(it.remise_ligne) : '—',
      money(it.total),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [180, 90, 110], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 245, 247] },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  let endY = (doc as any).lastAutoTable.finalY + 8;
  const right = pageW - 14;
  const labelX = 130;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Sous-total :', labelX, endY); doc.text(money(r.sous_total), right, endY, { align: 'right' }); endY += 5;
  if (r.remise > 0) {
    doc.text('Remise :', labelX, endY);
    doc.text('-' + money(r.remise), right, endY, { align: 'right' }); endY += 5;
  }

  // Bandeau TOTAL
  doc.setFillColor(180, 90, 110);
  doc.rect(labelX - 4, endY - 4, right - labelX + 6, 8, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('TOTAL', labelX, endY + 1.5);
  doc.text(money(r.total), right, endY + 1.5, { align: 'right' });
  doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  endY += 12;

  if (r.paiements && r.paiements.length > 0) {
    r.paiements.forEach((p) => {
      doc.text(modeLabel(p.mode), labelX, endY);
      doc.text(money(p.montant), right, endY, { align: 'right' });
      endY += 4.5;
    });
  } else {
    doc.text(`Paiement : ${modeLabel(r.mode_paiement)}`, labelX, endY); endY += 4.5;
  }
  if (r.montant_recu && r.montant_recu > 0) {
    doc.text('Reçu :', labelX, endY); doc.text(money(r.montant_recu), right, endY, { align: 'right' }); endY += 4.5;
    doc.text('Monnaie :', labelX, endY); doc.text(money(r.montant_recu - r.total), right, endY, { align: 'right' }); endY += 4.5;
  }

  // Pied de page
  doc.setDrawColor(180, 90, 110); doc.setLineWidth(0.5);
  doc.line(14, 278, pageW - 14, 278);
  doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 90, 110);
  doc.text(BOUTIQUE.merci, pageW / 2, 285, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120);
  doc.text('Babycenter — Abidjan, Côte d\'Ivoire', pageW / 2, 290, { align: 'center' });

  doc.save(`ticket-${safe(r.numero_vente)}.pdf`);
}
