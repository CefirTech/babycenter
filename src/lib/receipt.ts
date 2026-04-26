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

const BOUTIQUE = { nom: 'Babycenter', tel: 'Abidjan, Côte d\'Ivoire', merci: 'Merci pour votre achat !' };

/** Ticket de caisse format thermique 80mm */
export function printThermalReceipt(r: ReceiptData) {
  const widthMM = 80;
  const lineH = 4;
  const itemsH = r.items.length * lineH * 2;
  const baseH = 90;
  const heightMM = baseH + itemsH;

  const doc = new jsPDF({ unit: 'mm', format: [widthMM, heightMM] });
  let y = 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(BOUTIQUE.nom, widthMM / 2, y, { align: 'center' }); y += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(BOUTIQUE.tel, widthMM / 2, y, { align: 'center' }); y += 5;

  doc.setFontSize(8);
  doc.text(`Ticket : ${r.numero_vente}`, 3, y); y += 3;
  doc.text(new Date(r.created_at).toLocaleString('fr-FR'), 3, y); y += 3;
  if (r.vendeur_nom) { doc.text(`Vendeuse : ${r.vendeur_nom}`, 3, y); y += 3; }
  if (r.customer_nom) { doc.text(`Cliente : ${r.customer_nom}`, 3, y); y += 3; }
  if (r.statut === 'annulee') {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 0, 0);
    doc.text('** ANNULÉE **', widthMM / 2, y, { align: 'center' }); y += 4;
    doc.setTextColor(0); doc.setFont('helvetica', 'normal');
  }
  y += 1;
  doc.setLineDashPattern([0.5, 0.5], 0); doc.line(3, y, widthMM - 3, y); y += 3;

  // Items
  doc.setFontSize(8);
  r.items.forEach((it) => {
    const variant = [it.taille, it.couleur].filter(Boolean).join(' • ');
    doc.text(it.product_nom.slice(0, 38), 3, y); y += 3;
    const left = `${it.quantite} x ${fcfa(it.prix_unitaire)}${variant ? '  ' + variant : ''}`;
    doc.text(left, 3, y);
    doc.text(fcfa(it.total), widthMM - 3, y, { align: 'right' });
    y += 4;
  });
  doc.line(3, y, widthMM - 3, y); y += 4;

  doc.text('Sous-total', 3, y); doc.text(fcfa(r.sous_total), widthMM - 3, y, { align: 'right' }); y += 3;
  if (r.remise > 0) { doc.text('Remise', 3, y); doc.text('-' + fcfa(r.remise), widthMM - 3, y, { align: 'right' }); y += 3; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TOTAL', 3, y); doc.text(fcfa(r.total), widthMM - 3, y, { align: 'right' }); y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

  if (r.paiements && r.paiements.length > 0) {
    r.paiements.forEach((p) => { doc.text(p.mode.replace(/_/g, ' '), 3, y); doc.text(fcfa(p.montant), widthMM - 3, y, { align: 'right' }); y += 3; });
  } else {
    doc.text(`Paiement : ${r.mode_paiement.replace(/_/g, ' ')}`, 3, y); y += 3;
  }
  if (r.montant_recu && r.montant_recu > 0) {
    doc.text('Reçu', 3, y); doc.text(fcfa(r.montant_recu), widthMM - 3, y, { align: 'right' }); y += 3;
    doc.text('Monnaie', 3, y); doc.text(fcfa(r.montant_recu - r.total), widthMM - 3, y, { align: 'right' }); y += 3;
  }
  y += 3;
  doc.setFont('helvetica', 'italic');
  doc.text(BOUTIQUE.merci, widthMM / 2, y, { align: 'center' });

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
      // fallback : téléchargement
      doc.save(`ticket-${Date.now()}.pdf`);
    }
    // Nettoyage différé pour laisser le temps à la boîte d'impression
    setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 60_000);
  };
  document.body.appendChild(iframe);
}

/** Ticket A4 (réimpression PDF) */
export function downloadReceiptA4(r: ReceiptData) {
  const doc = new jsPDF();
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text(BOUTIQUE.nom, 14, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(BOUTIQUE.tel, 14, 24);

  doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text('TICKET DE CAISSE', 196, 18, { align: 'right' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`N° ${r.numero_vente}`, 196, 24, { align: 'right' });
  doc.text(new Date(r.created_at).toLocaleString('fr-FR'), 196, 29, { align: 'right' });

  let y = 40;
  if (r.customer_nom) { doc.text(`Cliente : ${r.customer_nom}`, 14, y); y += 5; }
  if (r.vendeur_nom) { doc.text(`Vendeuse : ${r.vendeur_nom}`, 14, y); y += 5; }
  if (r.statut === 'annulee') {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 0, 0);
    doc.text('VENTE ANNULÉE', 14, y); y += 6;
    doc.setTextColor(0); doc.setFont('helvetica', 'normal');
  }

  autoTable(doc, {
    startY: y + 4,
    head: [['Produit', 'Variante', 'PU', 'Qté', 'Remise', 'Total']],
    body: r.items.map((it) => [
      it.product_nom,
      [it.taille, it.couleur].filter(Boolean).join(' • ') || '—',
      fcfa(it.prix_unitaire),
      String(it.quantite),
      it.remise_ligne ? '-' + fcfa(it.remise_ligne) : '—',
      fcfa(it.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [180, 90, 110] },
  });

  // @ts-ignore
  let endY = (doc as any).lastAutoTable.finalY + 8;
  const right = 196;
  doc.setFontSize(10);
  doc.text('Sous-total :', 140, endY); doc.text(fcfa(r.sous_total), right, endY, { align: 'right' }); endY += 5;
  if (r.remise > 0) { doc.text('Remise :', 140, endY); doc.text('-' + fcfa(r.remise), right, endY, { align: 'right' }); endY += 5; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('TOTAL :', 140, endY); doc.text(fcfa(r.total), right, endY, { align: 'right' }); endY += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);

  if (r.paiements && r.paiements.length > 0) {
    r.paiements.forEach((p) => { doc.text(p.mode.replace(/_/g, ' '), 140, endY); doc.text(fcfa(p.montant), right, endY, { align: 'right' }); endY += 4; });
  } else {
    doc.text(`Paiement : ${r.mode_paiement.replace(/_/g, ' ')}`, 140, endY); endY += 4;
  }
  if (r.montant_recu && r.montant_recu > 0) {
    doc.text('Reçu :', 140, endY); doc.text(fcfa(r.montant_recu), right, endY, { align: 'right' }); endY += 4;
    doc.text('Monnaie :', 140, endY); doc.text(fcfa(r.montant_recu - r.total), right, endY, { align: 'right' }); endY += 4;
  }

  doc.setFontSize(9); doc.setFont('helvetica', 'italic');
  doc.text(BOUTIQUE.merci, 105, 280, { align: 'center' });
  doc.save(`ticket-${r.numero_vente}.pdf`);
}
