import { NextRequest } from 'next/server';
import { BatchState } from '@prisma/client';
import { parseDateInParis, statusFromDlc } from '@/lib/dlc';
import { requireUser } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { createBatchSchema } from '@/lib/validators';
import { CACHE_TTL_MS, clearRuntimeCaches, getBatchesCache, getCache, setCache } from '@/lib/runtime-cache';

const batchesCache = getBatchesCache();

function buildBatchesCacheKey(userId: string, req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return `batches:${userId}:${searchParams.toString()}`;
}

function clearBatchesCache() {
  batchesCache.clear();
}

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const cacheKey = buildBatchesCacheKey(auth.user.id, req);
  const cached = getCache(batchesCache, cacheKey);
  if (cached) {
    return json(cached);
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const state = searchParams.get('state');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? 50);
  const pageSize = Math.min(200, Math.max(1, pageSizeRaw));

  const where = {
    ...(category ? { product: { category } } : {}),
    ...(location ? { location } : {}),
    ...(state ? { state: state as BatchState } : {})
  };

  const [batches, totalCount, settings] = await Promise.all([
    prisma.batch.findMany({
      where,
      include: { product: true },
      orderBy: [{ dlcDate: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.batch.count({ where }),
    prisma.setting.findUnique({ where: { id: 'singleton' } })
  ]);

  const data = batches.map((batch) => ({
    ...batch,
    status: statusFromDlc(batch.dlcDate, settings?.alertDaysBefore ?? 2)
  }));

  const payload = {
    batches: data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize))
    }
  };
  setCache(batchesCache, cacheKey, payload, CACHE_TTL_MS);

  return json(payload);
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

  clearBatchesCache();
  clearRuntimeCaches();

  return json({ batch }, { status: 201 });
}
