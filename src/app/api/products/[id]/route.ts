import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return badRequest('Invalid payload');

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name,
      category: body.category,
      supplier: body.supplier,
      defaultShelfLifeDays: body.defaultShelfLifeDays
    }
  });

  return json({ product });
}
