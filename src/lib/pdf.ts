import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportListPDF(opts: {
  title: string;
  filename: string;
  head: string[];
  body: (string | number)[][];
}) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(opts.title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Babycenter — ${new Date().toLocaleString('fr-FR')}`, 14, 22);
  autoTable(doc, {
    head: [opts.head],
    body: opts.body,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [180, 90, 110] },
  });
  doc.save(opts.filename);
}
