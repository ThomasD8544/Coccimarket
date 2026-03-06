import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { clearRuntimeCaches } from '@/lib/runtime-cache';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  await prisma.batch.delete({ where: { id: params.id } });
  clearRuntimeCaches();

  return json({ ok: true });
}
