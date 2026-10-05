const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FastBell foundation data...');

  const campus = await prisma.campus.upsert({
    where: { id: 'sns' },
    update: {
      name: 'SNS College of Technology',
      code: 'SNSCT',
      address: 'SNS College of Technology, Coimbatore, Tamil Nadu',
      latitude: 11.1271,
      longitude: 76.9966,
      serviceRadiusKm: 6,
      isActive: true,
    },
    create: {
      id: 'sns',
      name: 'SNS College of Technology',
      code: 'SNSCT',
      address: 'SNS College of Technology, Coimbatore, Tamil Nadu',
      latitude: 11.1271,
      longitude: 76.9966,
      serviceRadiusKm: 6,
      isActive: true,
    },
  });

  console.log(`Campus ready: ${campus.name} (${campus.id})`);
  console.log('Seeding completed successfully.');
}

main()
.catch((error) => {
  console.error(error);
  process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});
