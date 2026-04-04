import type { Quotation } from '@/types/quotation';

export async function generatePDF(
  element: HTMLElement,
  quotation: Quotation
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const customerName = (quotation.customer.name || 'Customer').replace(/\s+/g, '_');
  const destination = (quotation.trip.destination || 'Trip').replace(/\s+/g, '_');
  const quotationNumber = (quotation.number || 'QT').replace(/\s+/g, '_');

  const filename = `${quotationNumber}_${customerName}_${destination}.pdf`;

  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      windowWidth: 794,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: 'css' as const },
  };

  await html2pdf().set(options).from(element).save();
}
