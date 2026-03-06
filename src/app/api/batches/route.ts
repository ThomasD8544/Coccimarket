import { NextRequest } from 'next/server';
import { BatchState } from '@prisma/client';
import { parseDateInParis, statusFromDlc } from '@/lib/dlc';
import { requireUser } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { createBatchSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const state = searchParams.get('state');

  const batches = await prisma.batch.findMany({
    where: {
      ...(category ? { product: { category } } : {}),
      ...(location ? { location } : {}),
      ...(state ? { state: state as BatchState } : {})
    },
    include: { product: true },
    orderBy: [{ dlcDate: 'asc' }, { createdAt: 'desc' }]
  });

  const settings = await prisma.setting.findUnique({ where: { id: 'singleton' } });

  const data = batches.map((batch) => ({
    ...batch,
    status: statusFromDlc(batch.dlcDate, settings?.alertDaysBefore ?? 2)
  }));

  return json({ batches: data });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = createBatchSchema.safeParse(body);

  if (!parsed.success) return badRequest('Invalid payload');

  const dlcDate = parseDateInParis(parsed.data.dlcDate);

  const product = parsed.data.productId
    ? await prisma.product.findUnique({ where: { id: parsed.data.productId } })
    : await prisma.product.findUnique({ where: { ean: parsed.data.ean } });

  const finalProduct =
    product ||
    (await prisma.product.create({
      data: {
        ean: parsed.data.ean,
        name: parsed.data.name,
        category: parsed.data.category,
        supplier: parsed.data.supplier
      }
    }));

  const batch = await prisma.batch.create({
    data: {
      productId: finalProduct.id,
      quantityInitial: parsed.data.quantityInitial,
      quantityRemaining: parsed.data.quantityInitial,
      dlcDate,
      lotNumber: parsed.data.lotNumber,
      location: parsed.data.location,
      state: BatchState.ACTIVE
    },
    include: { product: true }
  });

  return json({ batch }, { status: 201 });
}
