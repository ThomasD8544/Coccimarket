import { PrismaClient, BatchState } from '@prisma/client';

const prisma = new PrismaClient();

const produitsTraiteur = [
  { ean: '3761000000011', name: 'Rillettes de saumon maison', category: 'Poisson', supplier: 'Atelier Marée', defaultShelfLifeDays: 4 },
  { ean: '3761000000012', name: 'Terrine de campagne', category: 'Charcuterie', supplier: 'Maison Dubois', defaultShelfLifeDays: 7 },
  { ean: '3761000000013', name: 'Salade piémontaise', category: 'Salades', supplier: 'Traiteur Central', defaultShelfLifeDays: 3 },
  { ean: '3761000000014', name: 'Taboulé oriental', category: 'Salades', supplier: 'Traiteur Central', defaultShelfLifeDays: 4 },
  { ean: '3761000000015', name: 'Carottes râpées citron', category: 'Entrées', supplier: 'Fresh Prep', defaultShelfLifeDays: 4 },
  { ean: '3761000000016', name: 'Céleri rémoulade', category: 'Entrées', supplier: 'Fresh Prep', defaultShelfLifeDays: 4 },
  { ean: '3761000000017', name: 'Quiche lorraine part', category: 'Plats cuisinés', supplier: 'Boulangerie Fine', defaultShelfLifeDays: 2 },
  { ean: '3761000000018', name: 'Lasagnes bolognaise barquette', category: 'Plats cuisinés', supplier: 'Casa Pasta', defaultShelfLifeDays: 3 },
  { ean: '3761000000019', name: 'Gratin dauphinois', category: 'Accompagnements', supplier: 'Casa Pasta', defaultShelfLifeDays: 3 },
  { ean: '3761000000020', name: 'Poulet rôti émincé', category: 'Volailles', supplier: 'Ferme du Midi', defaultShelfLifeDays: 2 },
  { ean: '3761000000021', name: 'Rosbif tranché', category: 'Viandes', supplier: 'Boucherie Martin', defaultShelfLifeDays: 3 },
  { ean: '3761000000022', name: 'Jambon blanc supérieur', category: 'Charcuterie', supplier: 'Maison Dubois', defaultShelfLifeDays: 5 },
  { ean: '3761000000023', name: 'Tarte tomate chèvre', category: 'Plats cuisinés', supplier: 'Boulangerie Fine', defaultShelfLifeDays: 2 },
  { ean: '3761000000024', name: 'Saumon fumé tranché', category: 'Poisson', supplier: 'Atelier Marée', defaultShelfLifeDays: 5 },
  { ean: '3761000000025', name: 'Crevettes cocktail', category: 'Poisson', supplier: 'Atelier Marée', defaultShelfLifeDays: 2 },
  { ean: '3761000000026', name: 'Salade de lentilles', category: 'Salades', supplier: 'Traiteur Central', defaultShelfLifeDays: 4 },
  { ean: '3761000000027', name: 'Betteraves vinaigrette', category: 'Entrées', supplier: 'Fresh Prep', defaultShelfLifeDays: 5 },
  { ean: '3761000000028', name: 'Wrap poulet crudités', category: 'Snacking', supplier: 'Snack Lab', defaultShelfLifeDays: 2 },
  { ean: '3761000000029', name: 'Sandwich jambon emmental', category: 'Snacking', supplier: 'Snack Lab', defaultShelfLifeDays: 2 },
  { ean: '3761000000030', name: 'Pâtes au pesto', category: 'Salades', supplier: 'Casa Pasta', defaultShelfLifeDays: 3 }
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const products = [] as { id: string; name: string }[];

  for (const p of produitsTraiteur) {
    const product = await prisma.product.upsert({
      where: { ean: p.ean },
      update: {
        name: p.name,
        category: p.category,
        supplier: p.supplier,
        defaultShelfLifeDays: p.defaultShelfLifeDays
      },
      create: p
    });
    products.push({ id: product.id, name: product.name });
  }

  const now = new Date();
  let created = 0;

  for (let i = 0; i < 100; i++) {
    const p = products[rand(0, products.length - 1)];
    const qtyInitial = rand(3, 24);
    const sold = rand(0, Math.floor(qtyInitial * 0.7));
    const discarded = Math.random() < 0.08;

    const shiftDays = rand(-2, 8); // certains déjà périmés, d'autres à venir
    const dlc = new Date(now);
    dlc.setDate(dlc.getDate() + shiftDays);

    const quantityRemaining = discarded ? 0 : Math.max(0, qtyInitial - sold);
    const state = discarded ? BatchState.DISCARDED : quantityRemaining === 0 ? BatchState.DEPLETED : BatchState.ACTIVE;

    await prisma.batch.create({
      data: {
        productId: p.id,
        quantityInitial: qtyInitial,
        quantityRemaining,
        dlcDate: dlc,
        lotNumber: `STG-${now.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
        location: ['Vitrine A', 'Vitrine B', 'Froid 1', 'Froid 2', 'Réserve'][rand(0, 4)],
        state
      }
    });

    created++;
  }

  const countProducts = await prisma.product.count();
  const countBatches = await prisma.batch.count();

  console.log(`✅ Seed staging terminé: +${created} lots créés`);
  console.log(`📦 Produits total: ${countProducts}`);
  console.log(`🧾 Lots total: ${countBatches}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
