import { NextRequest } from 'next/server';
import { BatchState } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { clearRuntimeCaches } from '@/lib/runtime-cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const batch = await prisma.batch.findUnique({ where: { id: params.id } });
  if (!batch) return json({ error: 'Batch not found' }, { status: 404 });

  const updated = await prisma.batch.update({
    where: { id: params.id },
    data: {
      state: BatchState.DISCARDED,
      quantityRemaining: 0
    }
  });

  clearRuntimeCaches();

  return json({ batch: updated });
}
