import { NextRequest } from 'next/server';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { BatchState } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { CACHE_TTL_MS, getCache, getDashboardCache, setCache } from '@/lib/runtime-cache';

type DashboardPayload = {
  counters: {
    toProcessToday: number;
    toProcess48h: number;
    expired: number;
  };
  totalActive: number;
  alertDaysBefore: number;
};

const dashboardCache = getDashboardCache();

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const cacheKey = `dashboard:${auth.user.id}`;
  const cached = getCache(dashboardCache, cacheKey);
  if (cached) {
    return json(cached as DashboardPayload);
  }

  const settings = await prisma.setting.findUnique({ where: { id: 'singleton' } });
  const alertDaysBefore = settings?.alertDaysBefore ?? 2;
  const timezone = settings?.timezone ?? 'Europe/Paris';
  const today = startOfDay(toZonedTime(new Date(), timezone));

  const batches = await prisma.batch.findMany({
    where: { state: BatchState.ACTIVE, quantityRemaining: { gt: 0 } },
    select: { dlcDate: true }
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

  const payload: DashboardPayload = {
    counters: {
      toProcessToday: todayCount,
      toProcess48h: soon,
      expired
    },
    totalActive: batches.length,
    alertDaysBefore
  };

  setCache(dashboardCache, cacheKey, payload, CACHE_TTL_MS);

  return json(payload);
}
