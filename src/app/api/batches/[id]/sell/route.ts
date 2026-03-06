import { NextRequest } from 'next/server';
import { BatchState } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { batchSellSchema } from '@/lib/validators';
import { clearRuntimeCaches } from '@/lib/runtime-cache';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = batchSellSchema.safeParse(body);

  if (!parsed.success) return badRequest('Invalid payload');

  const batch = await prisma.batch.findUnique({ where: { id: params.id } });
  if (!batch) return json({ error: 'Batch not found' }, { status: 404 });

  const remaining = Math.max(0, batch.quantityRemaining - parsed.data.quantity);

  const updated = await prisma.batch.update({
    where: { id: params.id },
    data: {
      quantityRemaining: remaining,
      state: remaining === 0 ? BatchState.DEPLETED : batch.state
    },
    include: { product: true }
  });

  clearRuntimeCaches();

  return json({ batch: updated });
}
