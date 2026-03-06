import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const AUTH_COOKIE = 'coccimarket_auth';

type JwtPayload = {
  userId: string;
  role: UserRole;
  email: string;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('JWT_SECRET is missing');
  }
  return value;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: JwtPayload) {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret()) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailEnabled: true,
      pushEnabled: true
    }
  });
}

export async function requireUser(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
  }
  return { user };
}

export async function requireAdmin(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth;
  if (auth.user.role !== UserRole.ADMIN) {
    return { error: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }) };
  }
  return { user: auth.user };
}

export { AUTH_COOKIE };
