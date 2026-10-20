const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// --------------------------------------------------
// 0. Safety Guard: Prevent Accidental Execution
// --------------------------------------------------
const isExplicitlyAllowed =
  process.env.FASTBELL_ALLOW_SEED === 'true' ||
  process.argv.includes('--confirm-seed');

if (!isExplicitlyAllowed || process.env.NODE_ENV === 'production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Seed execution is strictly blocked in production environment.');
    console.error('For production admin setup, use: node scripts/bootstrapAdmin.js');
  } else {
    console.error('CRITICAL: Seed execution is blocked by default to prevent accidental data overwrites.');
    console.error('To allow seeding in local development or demo environments, run with:');
    console.error('  FASTBELL_ALLOW_SEED=true npm run seed');
    console.error('or pass --confirm-seed flag:');
    console.error('  node prisma/seed.js --confirm-seed');
  }
  process.exit(1);
}

const prisma = new PrismaClient();

function loadFrontendSeed(fileName, exportName) {
  const filePath = path.resolve(
    __dirname,
    '..',
    '..',
    'frontend',
    'src',
    'data',
    'seed',
    fileName
  );

  let source = fs.readFileSync(filePath, 'utf8');

  source = source
    .replace(/import[\s\S]*?;\s*/g, '')
    .replace(
      new RegExp(
        'export\\s+const\\s+' +
          exportName +
          '\\s*:\\s*[^=]+='
      ),
      'const ' + exportName + ' ='
    );

  const match = source.match(
    new RegExp(
      'const\\s+' +
        exportName +
        '\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;?'
    )
  );

  if (!match) {
    throw new Error(`Could not parse ${exportName} from ${fileName}`);
  }

  return vm.runInNewContext('(' + match[1] + ')');
}

async function main() {
  console.log('Seeding FastBell foundation + catalog data (non-destructive mode)...');

  // --------------------------------------------------
  // 1. Campus
  // --------------------------------------------------

  const campus = await prisma.campus.upsert({
    where: { id: 'sns' },
    update: {}, // Non-destructive: do NOT overwrite existing campus details
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

  // --------------------------------------------------
  // 2. Load frontend seed data
  // --------------------------------------------------

  const categories = loadFrontendSeed(
    'categories.ts',
    'seedCategories'
  );

  const stores = loadFrontendSeed(
    'stores.ts',
    'seedStores'
  );

  const products = loadFrontendSeed(
    'products.ts',
    'seedProducts'
  );

  console.log(`Loaded ${categories.length} categories`);
  console.log(`Loaded ${stores.length} stores`);
  console.log(`Loaded ${products.length} products`);

  // --------------------------------------------------
  // 3. Seed categories (Non-destructive)
  // --------------------------------------------------

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        id: category.id,
      },
      update: {}, // Non-destructive: preserve existing category changes
      create: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.icon || null,
        isActive: true,
      },
    });
  }

  console.log('Categories seeded.');

  // --------------------------------------------------
  // 4. Create demo vendor users + profiles (Non-destructive)
  // --------------------------------------------------

  const vendorPasswordHash = await bcrypt.hash(
    'FastBell@123',
    10
  );

  const vendorUsers = [
    {
      vendorId: 'vendor-001',
      email: 'vendor001@fastbell.local',
      name: 'Campus Food Corner Vendor',
      phone: '9000000001',
    },
    {
      vendorId: 'vendor-002',
      email: 'vendor002@fastbell.local',
      name: 'Campus Essentials Vendor',
      phone: '9000000002',
    },
  ];

  for (const vendor of vendorUsers) {
    // Check if user already exists to protect credentials and role
    const existingUser = await prisma.user.findUnique({
      where: { email: vendor.email },
    });

    let userId;
    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          id: `user-${vendor.vendorId}`,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          passwordHash: vendorPasswordHash,
          role: 'VENDOR',
          isActive: true,
        },
      });
      userId = newUser.id;
      console.log(`Created demo vendor user: ${vendor.email}`);
    } else {
      userId = existingUser.id;
      console.log(`Vendor user already exists (${vendor.email}), preserving existing credentials and role.`);
    }

    const existingProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendor.vendorId },
    });

    if (!existingProfile) {
      await prisma.vendorProfile.create({
        data: {
          id: vendor.vendorId,
          userId,
          campusId: campus.id,
          verificationStatus: 'APPROVED',
        },
      });
      console.log(`Created vendor profile: ${vendor.vendorId}`);
    }
  }

  // --------------------------------------------------
  // 5. Seed stores (Non-destructive)
  // --------------------------------------------------

  for (const store of stores) {
    const existingStore = await prisma.store.findUnique({
      where: { id: store.id },
    });

    if (!existingStore) {
      await prisma.store.create({
        data: {
          id: store.id,
          vendorId: store.vendorId,
          campusId: store.campusId,
          name: store.name,
          categoryId: store.category,
          locationLabel: store.locationLabel || null,
          rating: store.rating ?? 0,
          distanceFromCampus: store.distanceFromCampus ?? null,
          deliveryMinutes: store.deliveryMinutes ?? null,
          latitude: store.latitude ?? null,
          longitude: store.longitude ?? null,
          city: store.city || null,
          imageUrl: store.image || null,
          isOpen: store.isOpen ?? true,
          isActive: true,
        },
      });
    }
  }

  console.log('Stores seeded.');

  // --------------------------------------------------
  // 6. Seed products (Non-destructive: never overwrite price or stock)
  // --------------------------------------------------

  for (const product of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          id: product.id,
          storeId: product.storeId,
          categoryId: product.categoryId,
          name: product.name,
          description: product.description || null,
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          imageUrl: product.image || null,
          stockQuantity: product.isAvailable ? 100 : 0,
          isAvailable: product.isAvailable ?? true,
        },
      });
    }
    // If product exists, preserve existing price, stockQuantity, and availability untouched!
  }

  console.log('Products seeded.');

  // --------------------------------------------------
  // 7. Final summary
  // --------------------------------------------------

  const categoryCount = await prisma.category.count();
  const storeCount = await prisma.store.count();
  const productCount = await prisma.product.count();

  console.log('');
  console.log('========================================');
  console.log('FastBell catalog seed completed!');
  console.log(`Categories: ${categoryCount}`);
  console.log(`Stores:     ${storeCount}`);
  console.log(`Products:   ${productCount}`);
  console.log('========================================');
}

main()
  .catch((error) => {
    console.error('SEED FAILED');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
