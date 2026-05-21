import { CurrencyCode } from '../../../types';

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : NaN;
}

export function formatMoneyInput(value: string) {
  const normalized = value.replace(/,/g, '');
  if (!normalized) return '';

  const [integerPart, decimalPart] = normalized.split('.');
  const safeInteger = integerPart.replace(/\D/g, '');
  const safeDecimal = decimalPart?.replace(/\D/g, '').slice(0, 2);
  const groupedInteger = safeInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (normalized.includes('.')) {
    return `${groupedInteger || '0'}.${safeDecimal ?? ''}`;
  }
  return groupedInteger;
}

export function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
