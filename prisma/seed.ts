import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@coccimarket.local' },
    update: {},
    create: {
      email: 'admin@coccimarket.local',
      passwordHash,
      role: UserRole.ADMIN,
      emailEnabled: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'employee@coccimarket.local' },
    update: {},
    create: {
      email: 'employee@coccimarket.local',
      passwordHash: await bcrypt.hash('employee1234', 10),
      role: UserRole.EMPLOYEE,
      emailEnabled: true
    }
  });

  await prisma.setting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      alertDaysBefore: Number(process.env.ALERT_DAYS_BEFORE ?? 2),
      dailyJobHour: 7,
      timezone: process.env.TZ ?? 'Europe/Paris'
    }
  });

  const products = [
    { ean: '3760123456789', name: 'Terrine de campagne', category: 'Charcuterie', supplier: 'Maison Dubois' },
    { ean: '3017620425035', name: 'Jambon blanc supérieur', category: 'Boucherie', supplier: 'Boucherie Centrale' },
    { ean: '3222475929615', name: 'Salade piémontaise', category: 'Traiteur', supplier: 'Atelier Frais' }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { ean: p.ean },
      update: p,
      create: p
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
