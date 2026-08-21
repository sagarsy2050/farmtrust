export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '—';
  const symbols = { INR: '₹', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || '';
  return `${symbol}${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatUnit(value, unit = '') {
  if (value == null) return '';
  return `${value} ${unit || ''}`.trim();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
