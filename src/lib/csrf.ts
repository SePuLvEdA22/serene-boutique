import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://switchandtech.com',
  'https://www.switchandtech.com',
];

/**
 * Valida que la petición provenga de un origen de confianza.
 *
 * - Compara el `Origin` de forma EXACTA (no por prefijo) para evitar
 *   bypass tipo `https://switchandtech.com.evil.com`.
 * - Además del allowlist, permite cualquier origen que coincida con el
 *   dominio que sirve la propia API (cubre previews de Vercel, etc.).
 * - Acepta `Referer` como respaldo cuando no hay `Origin`.
 */
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    return false;
  }

  const source = origin || referer || '';

  try {
    const sourceOrigin = new URL(source).origin;
    if (ALLOWED_ORIGINS.includes(sourceOrigin)) return true;
    return sourceOrigin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function csrfSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function requireCsrf(request: Request): boolean {
  if (csrfSafeMethod(request.method)) return true;
  return validateRequestOrigin(request);
}

/**
 * Devuelve una respuesta 403 si el origen no es válido, o `null` si pasa.
 * Pensado para usarse al inicio de handlers que cambian estado:
 *   const blocked = csrfBlocked(request); if (blocked) return blocked;
 */
export function csrfBlocked(request: Request): NextResponse | null {
  if (requireCsrf(request)) return null;
  return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
}
