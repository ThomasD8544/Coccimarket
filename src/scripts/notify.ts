import cron from 'node-cron';
import { runNotificationJob } from '../lib/notification-job';
import { prisma } from '../lib/prisma';

async function runOnce() {
  const result = await runNotificationJob();
  console.log(`Notification job done. Sent: ${result.sent}`);
}

async function runCron() {
  const settings =
    (await prisma.setting.findUnique({ where: { id: 'singleton' } })) ??
    (await prisma.setting.create({ data: { id: 'singleton', alertDaysBefore: 2, dailyJobHour: 7, timezone: 'Europe/Paris' } }));

  const expression = `0 ${settings.dailyJobHour} * * *`;

  console.log(`Cron started: ${expression} (${settings.timezone})`);
  cron.schedule(expression, () => {
    runNotificationJob().then((r) => console.log(`Cron sent: ${r.sent}`));
  });
}

const once = process.argv.includes('--once');

if (once) {
  runOnce().finally(async () => {
    await prisma.$disconnect();
  });
} else {
  runCron();
}
