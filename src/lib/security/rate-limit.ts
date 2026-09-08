interface Window {
  start: number;
  count: number;
}

const buckets = new Map<string, Window>();

function clean(now: number, windowMs: number): void {
  for (const [key, window] of buckets) {
    if (now - window.start > windowMs) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
}

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = opts.now ?? Date.now();
  const { key, limit, windowMs } = opts;

  clean(now, windowMs);

  const window = buckets.get(key);
  if (!window) {
    buckets.set(key, { start: now, count: 1 });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      retryAfterSeconds: 0,
    };
  }

  const elapsed = now - window.start;
  if (elapsed > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      retryAfterSeconds: 0,
    };
  }

  if (window.count >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSeconds,
    };
  }

  window.count += 1;
  return {
    allowed: true,
    remaining: limit - window.count,
    limit,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
