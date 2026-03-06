import { NextRequest, NextResponse } from 'next/server';
import { createToken, verifyPassword, AUTH_COOKIE } from '@/lib/auth';
import { json, badRequest } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest('Invalid payload');
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

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
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
