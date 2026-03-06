import { NextRequest } from 'next/server';
import { statusFromDlc } from '@/lib/dlc';
import { requireUser } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: { product: true }
  });

  if (!batch) return json({ error: 'Not found' }, { status: 404 });

  const settings = await prisma.setting.findUnique({ where: { id: 'singleton' } });

  return json({
    batch: {
      ...batch,
      status: statusFromDlc(batch.dlcDate, settings?.alertDaysBefore ?? 2)
    }
  });
}
