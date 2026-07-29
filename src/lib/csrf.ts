const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://switchandtech.com',
  'https://www.switchandtech.com',
];

export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    return false;
  }

  const source = origin || referer || '';

  if (ALLOWED_ORIGINS.some(allowed => source.startsWith(allowed))) {
    return true;
  }

  return false;
}

export function csrfSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function requireCsrf(request: Request): boolean {
  if (csrfSafeMethod(request.method)) return true;
  return validateRequestOrigin(request);
}
