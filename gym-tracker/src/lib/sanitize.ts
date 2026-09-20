/**
 * Strips HTML tags and control characters from free-text user input before
 * it is persisted or rendered. Defends against stored-XSS via exercise
 * names / notes, since Firestore has no built-in output escaping.
 */
export function sanitizeText(value: string, maxLength = 500): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeNumber(value: unknown, { min = 0, max = 100000 } = {}): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(min, n))
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function sanitizeDate(value: string): string {
  return DATE_RE.test(value) ? value : new Date().toISOString().slice(0, 10)
}
