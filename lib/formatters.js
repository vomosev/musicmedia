const DISPLAY_FALLBACK = '—';
const DEFAULT_TRUNCATE_LENGTH = 64;
const MAX_TRUNCATE_LENGTH = 1000;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function safeString(value) {
  try {
    return String(value);
  } catch {
    return '';
  }
}

function parseDate(value) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? new Date(timestamp) : null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value !== 'string') return null;

  const input = value.trim();
  if (!input) return null;

  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(input);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDate(value, fallback = DISPLAY_FALLBACK) {
  const date = parseDate(value);
  if (!date) return fallback;

  try {
    return dateFormatter.format(date);
  } catch {
    return fallback;
  }
}

export function formatCurrency(
  value,
  currency = 'USD',
  fallback = DISPLAY_FALLBACK,
) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    typeof value === 'boolean'
  ) {
    return fallback;
  }

  const amount =
    typeof value === 'string' ? Number(value.trim()) : Number(value);

  if (!Number.isFinite(amount)) return fallback;

  const requestedCurrency =
    typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim())
      ? currency.trim().toUpperCase()
      : 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: requestedCurrency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }
}

export function formatStatus(value, fallback = DISPLAY_FALLBACK) {
  if (value === null || value === undefined) return fallback;

  const normalized = safeString(value)
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!normalized) return fallback;

  const formatted = normalized
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return truncateText(formatted, 48, fallback);
}

export function truncateText(
  value,
  maxLength = DEFAULT_TRUNCATE_LENGTH,
  fallback = DISPLAY_FALLBACK,
) {
  if (value === null || value === undefined) return fallback;

  const text = safeString(value).trim().replace(/\s+/g, ' ');
  if (!text) return fallback;

  const parsedLength = Number(maxLength);
  const limit = Number.isFinite(parsedLength)
    ? Math.min(
        MAX_TRUNCATE_LENGTH,
        Math.max(1, Math.floor(parsedLength)),
      )
    : DEFAULT_TRUNCATE_LENGTH;

  const characters = Array.from(text);
  if (characters.length <= limit) return text;
  if (limit === 1) return '…';

  return `${characters.slice(0, limit - 1).join('').trimEnd()}…`;
}