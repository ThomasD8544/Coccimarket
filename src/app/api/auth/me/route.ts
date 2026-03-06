import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, requireUser } from '@/lib/auth';
import { json } from '@/lib/http';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  return json({ user: auth.user });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body?.action !== 'logout') {
    return json({ error: 'Invalid action' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
