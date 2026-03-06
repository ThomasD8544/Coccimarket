import { NextRequest } from 'next/server';
import { createProductSchema } from '@/lib/validators';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const ean = searchParams.get('ean');

  if (ean) {
    const product = await prisma.product.findUnique({ where: { ean } });
    return json({ product });
  }

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    take: 200
  });

  return json({ products });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) return badRequest('Invalid payload');

  const product = await prisma.product.upsert({
    where: { ean: parsed.data.ean },
    update: parsed.data,
    create: parsed.data
  });

  return json({ product }, { status: 201 });
}
