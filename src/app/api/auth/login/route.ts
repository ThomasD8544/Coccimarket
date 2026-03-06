import { NextRequest, NextResponse } from 'next/server';
import { createToken, verifyPassword, AUTH_COOKIE } from '@/lib/auth';
import { json, badRequest } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';
import {
  clearLoginFailures,
  clientIp,
  consumeRateLimit,
  isLoginTemporarilyBlocked,
  registerLoginFailure
} from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rateKey = `login:${ip}`;
  const rate = consumeRateLimit(rateKey, 20, 60 * 1000);
  if (!rate.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest('Invalid payload');
  }

  const email = parsed.data.email.toLowerCase();
  const loginKey = `login-fail:${email}:${ip}`;
  const blocked = isLoginTemporarilyBlocked(loginKey);
  if (blocked.blocked) {
    return json(
      { error: 'Compte temporairement bloqué après trop de tentatives. Réessaie dans quelques minutes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(blocked.retryAfterMs / 1000)) }
      }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    registerLoginFailure(loginKey);
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    registerLoginFailure(loginKey);
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  clearLoginFailures(loginKey);

  const token = createToken({
    userId: user.id,
    role: user.role,
    email: user.email
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailEnabled: user.emailEnabled,
      pushEnabled: user.pushEnabled
    }
  });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    priority: 'high'
  });

  return response;
}
