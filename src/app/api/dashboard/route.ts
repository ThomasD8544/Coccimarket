import { NextRequest } from 'next/server';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { BatchState } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const settings = await prisma.setting.findUnique({ where: { id: 'singleton' } });
  const alertDaysBefore = settings?.alertDaysBefore ?? 2;
  const timezone = settings?.timezone ?? 'Europe/Paris';
  const today = startOfDay(toZonedTime(new Date(), timezone));

  const batches = await prisma.batch.findMany({
    where: { state: BatchState.ACTIVE, quantityRemaining: { gt: 0 } },
    include: { product: true }
  });

  let expired = 0;
  let soon = 0;
  let todayCount = 0;

  for (const batch of batches) {
    const diff = differenceInCalendarDays(startOfDay(toZonedTime(batch.dlcDate, timezone)), today);

    if (diff < 0) {
      expired += 1;
      continue;
    }

    if (diff === 0) {
      todayCount += 1;
      soon += 1;
      continue;
    }

    if (diff <= alertDaysBefore) {
      soon += 1;
    }
  }

  return json({
    counters: {
      toProcessToday: todayCount,
      toProcess48h: soon,
      expired
    },
    totalActive: batches.length,
    alertDaysBefore
  });
}
