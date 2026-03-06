import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { json } from '@/lib/http';
import { runNotificationJob } from '@/lib/notification-job';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  const result = await runNotificationJob();

  return json({ result });
}
