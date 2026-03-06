import { NextRequest } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { updateSettingsSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const settings =
    (await prisma.setting.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.setting.create({ data: { id: 'singleton', alertDaysBefore: 2, dailyJobHour: 7, timezone: 'Europe/Paris' } }));

  return json({ settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid payload');

  const settings = await prisma.setting.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...parsed.data },
    update: parsed.data
  });

  return json({ settings });
}
