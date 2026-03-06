import { BatchState } from '@prisma/client';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { prisma } from './prisma';
import { sendMail } from './mailer';
import { sendPush } from './push';

export function classifyNotification(diffDays: number, alertDaysBefore: number) {
  if (diffDays === alertDaysBefore) return 'PRE_ALERT';
  if (diffDays === 0) return 'D_DAY';
  if (diffDays === -1) return 'EXPIRED';
  return null;
}

export async function runNotificationJob(now = new Date()) {
  const settings =
    (await prisma.setting.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.setting.create({ data: { id: 'singleton', alertDaysBefore: 2, dailyJobHour: 7, timezone: 'Europe/Paris' } }));

  const timezone = settings.timezone || 'Europe/Paris';
  const dayStart = startOfDay(toZonedTime(now, timezone));

  const batches = await prisma.batch.findMany({
    where: {
      state: BatchState.ACTIVE,
      quantityRemaining: { gt: 0 }
    },
    include: {
      product: true
    }
  });

  const users = await prisma.user.findMany({
    where: {
      OR: [{ emailEnabled: true }, { pushEnabled: true }]
    },
    include: { pushSubscriptions: true }
  });

  let sent = 0;

  for (const batch of batches) {
    const diffDays = differenceInCalendarDays(
      startOfDay(toZonedTime(batch.dlcDate, timezone)),
      dayStart
    );

    const notificationType = classifyNotification(diffDays, settings.alertDaysBefore);
    if (!notificationType) continue;

    for (const user of users) {
      const alreadySent = await prisma.notificationLog.findUnique({
        where: {
          batchId_userId_type: {
            batchId: batch.id,
            userId: user.id,
            type: notificationType
          }
        }
      });

      if (alreadySent) continue;

      const subject = `[DLC] ${batch.product.name} - ${notificationType}`;
      const text = [
        `Produit: ${batch.product.name}`,
        `EAN: ${batch.product.ean}`,
        `DLC: ${batch.dlcDate.toISOString().slice(0, 10)}`,
        `Quantité restante: ${batch.quantityRemaining}`,
        `Emplacement: ${batch.location ?? 'Non renseigné'}`,
        `Type d'alerte: ${notificationType}`
      ].join('\n');

      if (user.emailEnabled) {
        await sendMail(user.email, subject, text);
      }

      if (user.pushEnabled && user.pushSubscriptions.length > 0) {
        for (const sub of user.pushSubscriptions) {
          await sendPush(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey
              }
            },
            {
              title: subject,
              body: `${batch.product.name} (${batch.quantityRemaining}) - DLC ${batch.dlcDate.toISOString().slice(0, 10)}`
            }
          ).catch(async () => {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          });
        }
      }

      await prisma.notificationLog.create({
        data: {
          batchId: batch.id,
          userId: user.id,
          type: notificationType,
          sentTo: user.email
        }
      });

      sent += 1;
    }
  }

  return { sent };
}
