const priceFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

export const MISSING = '—';

export function formatPrice(value) {
  const amount = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return MISSING;
  }
  return priceFormatter.format(amount);
}

export function formatName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  return name === '' ? 'Unnamed item' : name;
}

export function formatStock(value) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return MISSING;
  }
  return value === 0 ? 'Out of stock' : `${value} in stock`;
}
