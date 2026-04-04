export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmount(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!num) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatAmountRaw(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `₹${(num || 0).toLocaleString('en-IN')}`;
}

export function escapeHtml(str: string | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generateQuotationNumber(existingNumbers: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  const existingForYear = existingNumbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ''), 10))
    .filter((n) => !isNaN(n));

  const nextNum = existingForYear.length > 0 ? Math.max(...existingForYear) + 1 : 1;

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

export function calculateTotal(lineItems: Array<{ amt: number | '' }>): number {
  return lineItems.reduce((sum, item) => {
    const amt = typeof item.amt === 'number' ? item.amt : parseFloat(item.amt) || 0;
    return sum + amt;
  }, 0);
}

export function formatPax(adults: number, children: number): string {
  let pax = `${adults} adult${adults !== 1 ? 's' : ''}`;
  if (children > 0) {
    pax += `, ${children} child${children !== 1 ? 'ren' : ''}`;
  }
  return pax;
}

export function formatDateRange(from: string | undefined, to: string | undefined, nights: number): string {
  const fromStr = formatDate(from);
  const toStr = formatDate(to);

  let dateStr: string;
  if (fromStr !== '—' && toStr !== '—') {
    dateStr = `${fromStr} – ${toStr}`;
  } else if (fromStr !== '—') {
    dateStr = fromStr;
  } else {
    dateStr = '—';
  }

  return `${dateStr} · ${nights} nights`;
}
