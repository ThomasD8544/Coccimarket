import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { badRequest, json } from '@/lib/http';
import { sendMail } from '@/lib/mailer';

const schema = z.object({
  to: z.string().email()
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest('Email destinataire invalide');

  await sendMail(
    parsed.data.to,
    '[CocciMarket] Test email notifications DLC',
    'Email de test OK. Si vous recevez ce message, la configuration SMTP fonctionne.'
  );

  return json({ ok: true });
}
