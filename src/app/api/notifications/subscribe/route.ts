import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid payload');

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: {
      p256dhKey: parsed.data.keys.p256dh,
      authKey: parsed.data.keys.auth,
      userId: auth.user.id
    },
    create: {
      userId: auth.user.id,
      endpoint: parsed.data.endpoint,
      p256dhKey: parsed.data.keys.p256dh,
      authKey: parsed.data.keys.auth
    }
  });

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { pushEnabled: true }
  });

  return json({ subscription: sub });
}
