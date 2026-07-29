const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

function escapeChar(c: string): string {
  return ENTITY_MAP[c] || c;
}

export function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"']/g, escapeChar);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeHtml(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
