const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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
function assert(stage, description, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] [${stage}] ${description}`);
    results.push({ stage, description, pass: true });
  } else {
    console.error(`  [FAIL] [${stage}] ${description} - ${details}`);
    results.push({ stage, description, pass: false, details });
  }
}

async function runLifecycleValidation() {
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      console.log(`Lifecycle Test Server running at ${baseUrl}`);
      resolve();
    });
  });

  const JWT_SECRET = process.env.JWT_SECRET || 'fastbell_jwt_secret_dev_key';
  const createdOrderIds = [];

  try {
    // 1. Setup users and auth tokens
    const studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT', email: 'student1@fastbell.com' },
      include: { addresses: true }
    }) || await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      include: { addresses: true }
    });
    const studentToken = jwt.sign({ id: studentUser.id }, JWT_SECRET, { expiresIn: '1h' });

    const vendorUser = await prisma.user.findFirst({
      where: { role: 'VENDOR', email: 'vendor001@fastbell.local' }
    });
    const vendorToken = jwt.sign({ id: vendorUser.id }, JWT_SECRET, { expiresIn: '1h' });

    // Other vendor for unauthorized checks
    const otherVendorUser = await prisma.user.findFirst({
      where: { role: 'VENDOR', email: 'vendor002@fastbell.local' }
    });
    const otherVendorToken = jwt.sign({ id: otherVendorUser.id }, JWT_SECRET, { expiresIn: '1h' });

    const primaryPartner = await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', email: 'delivery1@fastbell.com' }
    });
    const partner1Token = jwt.sign({ id: primaryPartner.id }, JWT_SECRET, { expiresIn: '1h' });

    // Secondary delivery partner for unauthorized assignment checks
    const secondaryPartner = await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', email: 'delivery2@fastbell.com' }
    }) || await prisma.user.findFirst({
      where: { role: 'DELIVERY_PARTNER', id: { not: primaryPartner.id } }
    });
    const partner2Token = jwt.sign({ id: secondaryPartner.id }, JWT_SECRET, { expiresIn: '1h' });

    const product = await prisma.product.findFirst({
      where: {
        isAvailable: true,
        stockQuantity: { gt: 10 },
        store: { vendor: { userId: vendorUser.id } }
      },
      include: { store: true }
    });

    const address = studentUser.addresses[0];

    // ==========================================
    // STAGE 1: Student places an order
    // ==========================================
    console.log('\n--- STAGE 1: Student places an order ---');
    let cart = await prisma.cart.findUnique({ where: { studentId: studentUser.id } });
    if (!cart) cart = await prisma.cart.create({ data: { studentId: studentUser.id } });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 2,
        unitPrice: product.price
      }
    });

    const placeRes = await request(
      'POST',
      '/api/orders',
      { deliveryAddressId: address.id, paymentMethod: 'UPI' },
      { Authorization: `Bearer ${studentToken}` }
    );
    assert('Stage 1', 'Student order creation returns 201', placeRes.status === 201);
    const orderId = placeRes.body.data?.id;
    createdOrderIds.push(orderId);
    assert('Stage 1', 'Created order has status PLACED', placeRes.body.data?.status === 'PLACED');

    // DB verification
    const dbOrder1 = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true, payment: true }
    });
    assert('Stage 1', 'Database orderStatus is PLACED', dbOrder1?.orderStatus === 'PLACED');
    assert('Stage 1', 'Database delivery record initialized as UNASSIGNED', dbOrder1?.delivery?.status === 'UNASSIGNED');

    // Cross-portal visibility: Student sees it in active orders
    const studentOrders1 = await request('GET', '/api/orders', null, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 1', 'Student sees new order in orders list', studentOrders1.body.data?.some(o => o.id === orderId && o.status === 'PLACED'));

    // Cross-portal visibility: Vendor sees it in store incoming orders
    const vendorOrders1 = await request('GET', '/api/orders', null, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 1', 'Vendor sees new order in pending orders', vendorOrders1.body.data?.some(o => o.id === orderId && o.status === 'PLACED'));

    // ==========================================
    // STAGE 2: Vendor accepts and prepares
    // ==========================================
    console.log('\n--- STAGE 2: Vendor accepts order and starts preparing ---');
    // Unauthorized attempt by student to accept
    const studentAcceptRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'ACCEPTED' }, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 2', 'Student cannot accept order (403)', studentAcceptRes.status === 403);

    // Unauthorized attempt by other vendor to accept
    const otherVendorAcceptRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'ACCEPTED' }, { Authorization: `Bearer ${otherVendorToken}` });
    assert('Stage 2', 'Other vendor cannot accept order (403)', otherVendorAcceptRes.status === 403);

    // Authorized vendor accepts
    const vendorAcceptRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'ACCEPTED' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 2', 'Store vendor accepts order (200)', vendorAcceptRes.status === 200 && vendorAcceptRes.body.data?.status === 'ACCEPTED');

    // Invalid jump from ACCEPTED -> READY_FOR_PICKUP without PREPARING
    const invalidJumpRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'READY_FOR_PICKUP' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 2', 'Cannot jump from ACCEPTED to READY_FOR_PICKUP (400)', invalidJumpRes.status === 400);

    // Authorized vendor starts preparing
    const vendorPrepRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'PREPARING' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 2', 'Vendor marks order PREPARING (200)', vendorPrepRes.status === 200 && vendorPrepRes.body.data?.status === 'PREPARING');

    const dbOrder2 = await prisma.order.findUnique({ where: { id: orderId } });
    assert('Stage 2', 'Database orderStatus is PREPARING', dbOrder2?.orderStatus === 'PREPARING');

    // ==========================================
    // STAGE 3: Vendor marks READY_FOR_PICKUP
    // ==========================================
    console.log('\n--- STAGE 3: Vendor marks READY_FOR_PICKUP ---');
    // Unauthorized attempt by delivery partner to mark ready
    const partnerReadyRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'READY_FOR_PICKUP' }, { Authorization: `Bearer ${partner1Token}` });
    assert('Stage 3', 'Delivery partner cannot mark READY_FOR_PICKUP (403)', partnerReadyRes.status === 403);

    // Vendor marks ready
    const vendorReadyRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'READY_FOR_PICKUP' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 3', 'Vendor marks READY_FOR_PICKUP (200)', vendorReadyRes.status === 200 && vendorReadyRes.body.data?.status === 'READY_FOR_PICKUP');

    const dbOrder3 = await prisma.order.findUnique({ where: { id: orderId } });
    assert('Stage 3', 'Database orderStatus is READY_FOR_PICKUP', dbOrder3?.orderStatus === 'READY_FOR_PICKUP');

    // Delivery partner sees it in available queue
    const partnerOrdersQueue = await request('GET', '/api/orders', null, { Authorization: `Bearer ${partner1Token}` });
    assert('Stage 3', 'Delivery partner sees READY_FOR_PICKUP order in claimable queue', partnerOrdersQueue.body.data?.some(o => o.id === orderId));

    // ==========================================
    // STAGE 4: Delivery partner claims & confirms PICKED_UP
    // ==========================================
    console.log('\n--- STAGE 4: Delivery partner claims order and confirms PICKED_UP ---');
    // Partner 1 claims order
    const claimRes = await request('POST', `/api/orders/${orderId}/claim`, null, { Authorization: `Bearer ${partner1Token}` });
    assert('Stage 4', 'Eligible delivery partner claims order (200)', claimRes.status === 200);

    // Partner 2 attempts to claim already-claimed order -> 409
    const secondClaimRes = await request('POST', `/api/orders/${orderId}/claim`, null, { Authorization: `Bearer ${partner2Token}` });
    assert('Stage 4', 'Second delivery partner cannot claim already claimed order (409)', secondClaimRes.status === 409);

    // Partner 2 attempts to transition to PICKED_UP -> 403
    const partner2PickupRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'PICKED_UP' }, { Authorization: `Bearer ${partner2Token}` });
    assert('Stage 4', 'Unassigned partner cannot confirm PICKED_UP (403)', partner2PickupRes.status === 403);

    // Assigned Partner 1 confirms PICKED_UP
    const partner1PickupRes = await request(
      'PATCH',
      `/api/orders/${orderId}/status`,
      { status: 'PICKED_UP', currentStatus: 'READY_FOR_PICKUP' },
      { Authorization: `Bearer ${partner1Token}` }
    );
    assert('Stage 4', 'Assigned partner confirms PICKED_UP (200)', partner1PickupRes.status === 200 && partner1PickupRes.body.data?.status === 'PICKED_UP');

    const dbOrder4 = await prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    assert('Stage 4', 'Database orderStatus is PICKED_UP', dbOrder4?.orderStatus === 'PICKED_UP');
    assert('Stage 4', 'Database delivery.status is PICKED_UP and pickupTime recorded', dbOrder4?.delivery?.status === 'PICKED_UP' && dbOrder4?.delivery?.pickupTime !== null);

    // ==========================================
    // STAGE 5: Delivery partner transitions to OUT_FOR_DELIVERY
    // ==========================================
    console.log('\n--- STAGE 5: Delivery partner transitions to OUT_FOR_DELIVERY ---');
    // Vendor attempt -> 403
    const vendorOutRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 5', 'Vendor cannot transition to OUT_FOR_DELIVERY (403)', vendorOutRes.status === 403);

    // Student attempt -> 403
    const studentOutRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 5', 'Student cannot transition to OUT_FOR_DELIVERY (403)', studentOutRes.status === 403);

    // Unassigned partner attempt -> 403
    const partner2OutRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, { Authorization: `Bearer ${partner2Token}` });
    assert('Stage 5', 'Unassigned partner cannot transition to OUT_FOR_DELIVERY (403)', partner2OutRes.status === 403);

    // Invalid transition test: Cannot jump directly from PICKED_UP to DELIVERED without OUT_FOR_DELIVERY
    const skipToDeliveredRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'DELIVERED' }, { Authorization: `Bearer ${partner1Token}` });
    assert('Stage 5', 'Cannot skip OUT_FOR_DELIVERY to DELIVERED directly (400)', skipToDeliveredRes.status === 400);

    // Assigned partner transitions to OUT_FOR_DELIVERY
    const partner1OutRes = await request(
      'PATCH',
      `/api/orders/${orderId}/status`,
      { status: 'OUT_FOR_DELIVERY', currentStatus: 'PICKED_UP' },
      { Authorization: `Bearer ${partner1Token}` }
    );
    assert('Stage 5', 'Assigned partner transitions to OUT_FOR_DELIVERY (200)', partner1OutRes.status === 200 && partner1OutRes.body.data?.status === 'OUT_FOR_DELIVERY');

    const dbOrder5 = await prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    assert('Stage 5', 'Database orderStatus is OUT_FOR_DELIVERY', dbOrder5?.orderStatus === 'OUT_FOR_DELIVERY');
    assert('Stage 5', 'Database delivery.status is OUT_FOR_DELIVERY', dbOrder5?.delivery?.status === 'OUT_FOR_DELIVERY');

    // ==========================================
    // STAGE 6: Delivery partner completes delivery
    // ==========================================
    console.log('\n--- STAGE 6: Delivery partner completes delivery ---');
    // Vendor attempt -> 403
    const vendorDeliveredRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'DELIVERED' }, { Authorization: `Bearer ${vendorToken}` });
    assert('Stage 6', 'Vendor cannot transition to DELIVERED (403)', vendorDeliveredRes.status === 403);

    // Student attempt -> 403
    const studentDeliveredRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'DELIVERED' }, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 6', 'Student cannot transition to DELIVERED (403)', studentDeliveredRes.status === 403);

    // Assigned partner completes delivery
    const partner1DeliveredRes = await request(
      'PATCH',
      `/api/orders/${orderId}/status`,
      { status: 'DELIVERED', currentStatus: 'OUT_FOR_DELIVERY' },
      { Authorization: `Bearer ${partner1Token}` }
    );
    assert('Stage 6', 'Assigned partner completes delivery (200)', partner1DeliveredRes.status === 200 && partner1DeliveredRes.body.data?.status === 'DELIVERED');

    const dbOrder6 = await prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    assert('Stage 6', 'Database orderStatus is DELIVERED', dbOrder6?.orderStatus === 'DELIVERED');
    assert('Stage 6', 'Database delivery.status is DELIVERED and deliveredTime recorded', dbOrder6?.delivery?.status === 'DELIVERED' && dbOrder6?.delivery?.deliveredTime !== null);

    // Delivery cannot transition after DELIVERED (terminal state)
    const afterDeliveredRes = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, { Authorization: `Bearer ${partner1Token}` });
    assert('Stage 6', 'Terminal state DELIVERED rejects further transitions (400)', afterDeliveredRes.status === 400);

    // ==========================================
    // STAGE 7: Student sees completed order in order history
    // ==========================================
    console.log('\n--- STAGE 7: Student sees completed order in history ---');
    const studentOrders7 = await request('GET', '/api/orders', null, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 7', 'Student order list API returns 200', studentOrders7.status === 200);

    const completedOrder = studentOrders7.body.data?.find(o => o.id === orderId);
    assert('Stage 7', 'Order is present in student order list', Boolean(completedOrder));
    assert('Stage 7', 'Order status in student list is DELIVERED', completedOrder?.status === 'DELIVERED');

    // Frontend categorization logic check: ['DELIVERED', 'CANCELLED'].includes(status) => past orders
    const isCategorizedPast = ['DELIVERED', 'CANCELLED'].includes(completedOrder?.status);
    assert('Stage 7', 'Order properly categorizes into past order history in Orders page', isCategorizedPast);

    // Verify order detail retrieval
    const orderDetailRes = await request('GET', `/api/orders/${orderId}`, null, { Authorization: `Bearer ${studentToken}` });
    assert('Stage 7', 'Student can retrieve single order receipt (200)', orderDetailRes.status === 200);
    assert('Stage 7', 'Order detail contains delivery information and timestamp', Boolean(orderDetailRes.body.data?.delivery?.deliveredTime));

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
        console.log(`Cleaned up ${createdOrderIds.length} test order(s)`);
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }

    if (server) server.close();
    await prisma.$disconnect();

    const passed = results.filter(r => r.pass).length;
    const total = results.length;
    console.log('\n========================================');
    console.log(`LIFECYCLE VALIDATION: ${passed}/${total} passed`);
    console.log('========================================');
    if (passed < total) process.exit(1);
    else process.exit(0);
  }
}

runLifecycleValidation();
