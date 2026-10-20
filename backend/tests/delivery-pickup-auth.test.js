require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    results.push({ description, pass: true });
  } else {
    console.error(`  [FAIL] ${description} - ${details}`);
    results.push({ description, pass: false, details });
  }
}

async function runTests() {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`PICKED_UP Authorization Test Server running at ${baseUrl}`);
      resolve();
    });
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'fastbell_jwt_secret_dev_key';
  const createdOrderIds = [];
  const createdUserIds = [];

  try {
    // 1. Identify vendor
    const vendorUser = await prisma.user.findFirst({
      where: { role: 'VENDOR', email: 'vendor001@fastbell.local' }
    });
    if (!vendorUser) throw new Error('Vendor user not found');
    const vendorToken = jwt.sign({ id: vendorUser.id }, JWT_SECRET, { expiresIn: '1h' });

    // 2. Identify in-stock product owned by this vendor
    const product = await prisma.product.findFirst({
      where: {
        isAvailable: true,
        stockQuantity: { gt: 10 },
        store: { vendor: { userId: vendorUser.id } }
      },
      include: { store: true }
    });
    if (!product) throw new Error('No in-stock product found for vendor');

    // 3. Primary approved delivery partner
    const primaryPartner = await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', email: 'delivery1@fastbell.com' }
    });
    if (!primaryPartner) throw new Error('Primary delivery partner not found');
    const partner1Token = jwt.sign({ id: primaryPartner.id }, JWT_SECRET, { expiresIn: '1h' });

    // 4. Secondary approved delivery partner (for unassigned tests)
    let secondaryPartner = await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', email: 'partner2@fastbell.test' }
    });
    if (!secondaryPartner) {
      secondaryPartner = await prisma.user.create({
        data: {
          name: 'Partner Two',
          email: 'partner2@fastbell.test',
          passwordHash: 'dummy-hash',
          role: 'DELIVERY_PARTNER',
          isActive: true,
          deliveryPartnerProfile: {
            create: {
              campusId: 'sns',
              verificationStatus: 'APPROVED',
              availabilityStatus: 'AVAILABLE'
            }
          }
        }
      });
      createdUserIds.push(secondaryPartner.id);
    }
    const partner2Token = jwt.sign({ id: secondaryPartner.id }, JWT_SECRET, { expiresIn: '1h' });

    // 5. Unapproved delivery partner
    let unapprovedPartner = await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', email: 'unapproved@fastbell.test' }
    });
    if (!unapprovedPartner) {
      unapprovedPartner = await prisma.user.create({
        data: {
          name: 'Partner Unapproved',
          email: 'unapproved@fastbell.test',
          passwordHash: 'dummy-hash',
          role: 'DELIVERY_PARTNER',
          isActive: true,
          deliveryPartnerProfile: {
            create: {
              campusId: 'sns',
              verificationStatus: 'PENDING',
              availabilityStatus: 'OFFLINE'
            }
          }
        }
      });
      createdUserIds.push(unapprovedPartner.id);
    }
    const unapprovedPartnerToken = jwt.sign({ id: unapprovedPartner.id }, JWT_SECRET, { expiresIn: '1h' });

    // 6. Student user
    const studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: { addresses: true }
    });
    if (!studentUser) throw new Error('Student user not found');
    const studentToken = jwt.sign({ id: studentUser.id }, JWT_SECRET, { expiresIn: '1h' });

    const address = studentUser.addresses?.[0] ||
      await prisma.address.create({
        data: {
          userId: studentUser.id,
          label: 'Primary Delivery',
          addressLine: 'Room 204, Campus Hostel',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          isDefault: true
        }
      });

    // Helper to order the product
    const createOrder = async () => {
      let cart = await prisma.cart.findUnique({ where: { studentId: studentUser.id } });
      if (!cart) cart = await prisma.cart.create({ data: { studentId: studentUser.id } });
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: 1,
          unitPrice: product.price
        }
      });

      const res = await request(
        'POST',
        '/api/orders',
        {
          deliveryAddressId: address.id,
          paymentMethod: 'UPI'
        },
        { Authorization: `Bearer ${studentToken}` }
      );
      if (res.status !== 201 || !res.body.data?.id) {
        throw new Error(`Failed to create order: ${res.status} ${JSON.stringify(res.body)}`);
      }
      createdOrderIds.push(res.body.data.id);
      return res.body.data.id;
    };

    console.log('\n--- Scenario 1: Assigned delivery partner transitions READY_FOR_PICKUP -> PICKED_UP ---');
    const order1Id = await createOrder();
    await request('PATCH', `/api/orders/${order1Id}/status`, { status: 'ACCEPTED' }, { Authorization: `Bearer ${vendorToken}` });
    await request('PATCH', `/api/orders/${order1Id}/status`, { status: 'PREPARING' }, { Authorization: `Bearer ${vendorToken}` });
    const readyRes = await request('PATCH', `/api/orders/${order1Id}/status`, { status: 'READY_FOR_PICKUP' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Order moved to READY_FOR_PICKUP (200)', readyRes.status === 200 && readyRes.body.data.status === 'READY_FOR_PICKUP');

    const claimRes = await request('POST', `/api/orders/${order1Id}/claim`, null, { Authorization: `Bearer ${partner1Token}` });
    assert('Partner 1 claimed order (200)', claimRes.status === 200);

    const pickupRes = await request(
      'PATCH',
      `/api/orders/${order1Id}/status`,
      { status: 'PICKED_UP', currentStatus: 'READY_FOR_PICKUP' },
      { Authorization: `Bearer ${partner1Token}` }
    );
    assert('Assigned partner transitions order to PICKED_UP (200)', pickupRes.status === 200);
    assert('Response status is PICKED_UP', pickupRes.body.data?.status === 'PICKED_UP');
    assert('Response message confirms status update', pickupRes.body.message === 'Order status updated to PICKED_UP');

    console.log('\n--- Scenario 2: Vendor attempting the same transition is rejected with 403 ---');
    // Reset order1 back to READY_FOR_PICKUP
    await prisma.order.update({
      where: { id: order1Id },
      data: { orderStatus: 'READY_FOR_PICKUP' }
    });
    await prisma.delivery.update({
      where: { orderId: order1Id },
      data: { status: 'ASSIGNED', pickupTime: null }
    });

    const vendorPickupRes = await request(
      'PATCH',
      `/api/orders/${order1Id}/status`,
      { status: 'PICKED_UP', currentStatus: 'READY_FOR_PICKUP' },
      { Authorization: `Bearer ${vendorToken}` }
    );
    assert('Vendor transition to PICKED_UP is rejected with 403', vendorPickupRes.status === 403);
    assert(
      'Vendor error message strictly identifies unauthorized transition',
      vendorPickupRes.body.message === 'Vendors are not authorized to transition orders to PICKED_UP.'
    );

    console.log('\n--- Scenario 3: Unassigned or different delivery partner is rejected with 403 ---');
    const partner2PickupRes = await request(
      'PATCH',
      `/api/orders/${order1Id}/status`,
      { status: 'PICKED_UP', currentStatus: 'READY_FOR_PICKUP' },
      { Authorization: `Bearer ${partner2Token}` }
    );
    assert('Different partner transition to PICKED_UP is rejected with 403', partner2PickupRes.status === 403);
    assert(
      'Unassigned error message states partner is not assigned',
      partner2PickupRes.body.message === 'Unauthorized: You are not assigned to deliver this order.'
    );

    console.log('\n--- Scenario 4: Invalid order status transition is rejected with 400 ---');
    // Create an order in PLACED state and assign partner 1 to it
    const placedOrderId = await createOrder();
    await prisma.delivery.update({
      where: { orderId: placedOrderId },
      data: { deliveryPartnerId: primaryPartner.id, status: 'ASSIGNED' }
    });

    const invalidTransitionRes = await request(
      'PATCH',
      `/api/orders/${placedOrderId}/status`,
      { status: 'PICKED_UP' },
      { Authorization: `Bearer ${partner1Token}` }
    );
    assert('Invalid transition from PLACED to PICKED_UP returns 400', invalidTransitionRes.status === 400);
    assert(
      'Error message identifies invalid transition',
      invalidTransitionRes.body.message === 'Invalid status transition from PLACED to PICKED_UP.'
    );

    console.log('\n--- Scenario 5: Non-approved delivery partner is rejected with 403 ---');
    // Assign unapproved partner to order1
    await prisma.delivery.update({
      where: { orderId: order1Id },
      data: { deliveryPartnerId: unapprovedPartner.id, status: 'ASSIGNED' }
    });

    const unapprovedPickupRes = await request(
      'PATCH',
      `/api/orders/${order1Id}/status`,
      { status: 'PICKED_UP', currentStatus: 'READY_FOR_PICKUP' },
      { Authorization: `Bearer ${unapprovedPartnerToken}` }
    );
    assert('Unapproved partner transition is rejected with 403', unapprovedPickupRes.status === 403);
    assert(
      'Unapproved partner error message explains profile verification status',
      unapprovedPickupRes.body.message === 'Delivery partner account is not approved. Access to delivery orders is restricted.'
    );

    console.log('\n--- Scenario 6: Unauthenticated request is rejected with 401 ---');
    const unauthRes = await request(
      'PATCH',
      `/api/orders/${order1Id}/status`,
      { status: 'PICKED_UP' }
    );
    assert('Unauthenticated request is rejected with 401', unauthRes.status === 401);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    // Cleanup created test records
    try {
      if (createdOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await prisma.delivery.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await prisma.payment.deleteMany({ where: { orderId: { in: createdOrderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.deliveryPartnerProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }

    if (server) {
      server.close();
    }
    await prisma.$disconnect();

    const passed = results.filter((r) => r.pass).length;
    const total = results.length;
    console.log(`\n========================================`);
    console.log(`RESULTS: ${passed}/${total} tests passed`);
    console.log(`========================================`);
    if (passed < total) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
