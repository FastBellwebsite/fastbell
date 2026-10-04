const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial FastBell data...');

  // Create campuses if not exist
  let campus1 = await prisma.campus.findFirst({
    where: { name: 'PSG Tech Campus' },
  });

  if (!campus1) {
    campus1 = await prisma.campus.create({
      data: {
        name: 'PSG Tech Campus',
        location: 'Peelamedu, Coimbatore',
      },
    });
    console.log(`Created campus: ${campus1.name} (${campus1.id})`);
  }

  let campus2 = await prisma.campus.findFirst({
    where: { name: 'CIT Campus' },
  });

  if (!campus2) {
    campus2 = await prisma.campus.create({
      data: {
        name: 'CIT Campus',
        location: 'Civil Aerodrome Post, Coimbatore',
      },
    });
    console.log(`Created campus: ${campus2.name} (${campus2.id})`);
  }

  // Create sample vendor
  let vendor = await prisma.vendor.findFirst({
    where: { name: 'FastBell Campus Canteen' },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: 'FastBell Campus Canteen',
        description: 'Fresh and quick campus snacks, meals and beverages',
        phone: '9876501234',
        email: 'canteen@fastbell.local',
        campusId: campus1.id,
      },
    });
    console.log(`Created vendor: ${vendor.name} (${vendor.id})`);
  }

  // Create sample products
  const productCount = await prisma.product.count({
    where: { vendorId: vendor.id },
  });

  if (productCount === 0) {
    const p1 = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: 'Veg Burger',
        description: 'Crispy veggie patty with fresh lettuce and secret sauce',
        price: 80.00,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        category: 'Food',
        isAvailable: true,
      },
    });

    const p2 = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: 'Cold Coffee',
        description: 'Chilled rich espresso blended with creamy milk',
        price: 50.00,
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5',
        category: 'Beverages',
        isAvailable: true,
      },
    });

    const p3 = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: 'Campus Ruled Notebook 200 Pages',
        description: 'High quality long size ruled notebook for lectures and notes',
        price: 65.00,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
        category: 'Stationery',
        isAvailable: true,
      },
    });

    console.log(`Created products: ${p1.name}, ${p2.name}, ${p3.name}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
