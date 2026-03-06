import { NextRequest } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

type LoginFailure = {
  count: number;
  blockedUntil: number;
};

const rateBuckets = new Map<string, Bucket>();
const loginFailures = new Map<string, LoginFailure>();

export function clientIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return 'unknown';
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  rateBuckets.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetInMs: Math.max(0, current.resetAt - now)
  };
}

export function isLoginTemporarilyBlocked(key: string) {
  const now = Date.now();
  const failure = loginFailures.get(key);
  if (!failure) return { blocked: false, retryAfterMs: 0 };
  if (failure.blockedUntil <= now) {
    return { blocked: false, retryAfterMs: 0 };
  }
  return { blocked: true, retryAfterMs: failure.blockedUntil - now };
}

export function registerLoginFailure(key: string) {
  const now = Date.now();
  const current = loginFailures.get(key) ?? { count: 0, blockedUntil: 0 };
  const nextCount = current.count + 1;

  let blockedUntil = current.blockedUntil;
  if (nextCount >= 5) {
    // 15 minutes lock after repeated failures
    blockedUntil = now + 15 * 60 * 1000;
  }

  loginFailures.set(key, { count: nextCount, blockedUntil });
}

export function clearLoginFailures(key: string) {
  loginFailures.delete(key);
}
