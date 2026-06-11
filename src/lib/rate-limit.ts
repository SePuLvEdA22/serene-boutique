const store = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxRequests: 10, windowMs: 60_000 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowMs };
  }

  entry.count += 1;

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';
  const url = new URL(request.url);
  return `${ip}:${url.pathname}`;
}
