const http = require('http');
const app = require('./src/app');
const prisma = require('./src/utils/prisma');

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
        } catch (e) {
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
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    console.log('\n--- 1. Testing Root / Health API ---');
    const health = await request('GET', '/');
    assert('GET / returns 200', health.status === 200);
    assert(
      'GET / message is "Backend API is running"',
      health.body && health.body.message === 'Backend API is running'
    );

    console.log('\n--- 2. Testing Campuses API ---');
    const campusesRes = await request('GET', '/api/campuses');
    assert('GET /api/campuses returns 200', campusesRes.status === 200);
    assert('GET /api/campuses returns array data', Array.isArray(campusesRes.body.data) && campusesRes.body.data.length > 0);
    const campusId = campusesRes.body.data[0].id;

    const singleCampusRes = await request('GET', `/api/campuses/${campusId}`);
    assert('GET /api/campuses/:id returns 200', singleCampusRes.status === 200);
    assert('GET /api/campuses/:id has matching id', singleCampusRes.body.data.id === campusId);

    const nonExistentCampus = await request('GET', '/api/campuses/non-existent-uuid');
    assert('GET non-existent campus returns 404', nonExistentCampus.status === 404);

    console.log('\n--- 3. Testing Authentication & User Registration ---');
    const testEmail1 = `user_${Date.now()}@fastbell.local`;
    const testPassword1 = 'SecurePass123';

    // Negative registration tests
    const invalidEmailRes = await request('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'not-an-email',
      phone: '9876543210',
      password: testPassword1,
      campusId,
    });
    assert('Register with invalid email returns 400', invalidEmailRes.status === 400);

    const missingPassRes = await request('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@fastbell.local',
      phone: '9876543210',
      password: '',
      campusId,
    });
    assert('Register with missing password returns 400', missingPassRes.status === 400);

    const invalidCampusRes = await request('POST', '/api/auth/register', {
      name: 'Test User',
      email: 'test@fastbell.local',
      phone: '9876543210',
      password: testPassword1,
      campusId: 'invalid-campus-id',
    });
    assert('Register with non-existent campus returns 400', invalidCampusRes.status === 400);

    // Successful registration
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Ganesh FastBell',
      email: testEmail1,
      phone: '9876543210',
      password: testPassword1,
      campusId,
    });
    assert('Register with valid data returns 201', regRes.status === 201);
    assert('Register returns JWT token', typeof regRes.body.token === 'string');
    assert('Register does NOT expose passwordHash', !regRes.body.user.passwordHash && !regRes.body.passwordHash);
    const token1 = regRes.body.token;
    const user1Id = regRes.body.user.id;

    // Duplicate email registration
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Duplicate User',
      email: testEmail1,
      phone: '9876543210',
      password: testPassword1,
      campusId,
    });
    assert('Register with duplicate email returns 409', dupRes.status === 409);

    console.log('\n--- 4. Testing Login ---');
    const wrongPassRes = await request('POST', '/api/auth/login', {
      email: testEmail1,
      password: 'WrongPassword',
    });
    assert('Login with wrong password returns 401', wrongPassRes.status === 401);

    const wrongEmailRes = await request('POST', '/api/auth/login', {
      email: 'unknown_email@fastbell.local',
      password: testPassword1,
    });
    assert('Login with unknown email returns 401', wrongEmailRes.status === 401);

    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail1,
      password: testPassword1,
    });
    assert('Login with correct credentials returns 200', loginRes.status === 200);
    assert('Login returns token', typeof loginRes.body.token === 'string');
    assert('Login does NOT return passwordHash', !loginRes.body.user.passwordHash);

    console.log('\n--- 5. Testing Auth & User Protected Routes ---');
    const noTokenRes = await request('GET', '/api/auth/me');
    assert('GET /api/auth/me without token returns 401', noTokenRes.status === 401);

    const invalidTokenRes = await request('GET', '/api/auth/me', null, {
      Authorization: 'Bearer invalid.token.payload',
    });
    assert('GET /api/auth/me with invalid token returns 401', invalidTokenRes.status === 401);

    const authMeRes = await request('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/auth/me with valid token returns 200', authMeRes.status === 200);
    assert('GET /api/auth/me has correct user id', authMeRes.body.user.id === user1Id);

    const userProfileRes = await request('GET', '/api/users/me', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/users/me returns 200', userProfileRes.status === 200);
    assert('GET /api/users/me includes campus details', userProfileRes.body.data.campus !== undefined);
    assert('GET /api/users/me does NOT contain passwordHash', userProfileRes.body.data.passwordHash === undefined);

    const updateProfileRes = await request(
      'PUT',
      '/api/users/me',
      { name: 'Ganesh Updated', phone: '9998887776' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('PUT /api/users/me returns 200', updateProfileRes.status === 200);
    assert('PUT /api/users/me updates name', updateProfileRes.body.data.name === 'Ganesh Updated');
    assert('PUT /api/users/me updates phone', updateProfileRes.body.data.phone === '9998887776');

    // Password change
    const wrongOldPassRes = await request(
      'PUT',
      '/api/users/me/password',
      { currentPassword: 'IncorrectOldPassword', newPassword: 'BrandNewPassword123' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Change password with wrong currentPassword returns 400', wrongOldPassRes.status === 400);

    const changePassRes = await request(
      'PUT',
      '/api/users/me/password',
      { currentPassword: testPassword1, newPassword: 'BrandNewPassword123' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Change password with valid passwords returns 200', changePassRes.status === 200);

    // Verify login with new password
    const loginNewPassRes = await request('POST', '/api/auth/login', {
      email: testEmail1,
      password: 'BrandNewPassword123',
    });
    assert('Login with newly updated password returns 200', loginNewPassRes.status === 200);

    console.log('\n--- 6. Testing Address CRUD & Ownership Isolation ---');
    // Register second user for cross-user tests
    const testEmail2 = `user2_${Date.now()}@fastbell.local`;
    const reg2Res = await request('POST', '/api/auth/register', {
      name: 'User Two',
      email: testEmail2,
      phone: '9123456780',
      password: 'Password123',
      campusId,
    });
    const token2 = reg2Res.body.token;

    // Create address for user 1
    const createAddrRes = await request(
      'POST',
      '/api/addresses',
      {
        label: 'Hostel Room',
        addressLine: 'Block B, Room 304, Campus Hostel',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        postalCode: '641004',
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert('POST /api/addresses returns 201', createAddrRes.status === 201);
    const address1Id = createAddrRes.body.data.id;
    assert('Address userId matches user 1', createAddrRes.body.data.userId === user1Id);

    // User 1 lists addresses
    const listAddrRes1 = await request('GET', '/api/addresses', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/addresses returns user 1 address', listAddrRes1.status === 200 && listAddrRes1.body.data.length >= 1);

    // User 2 lists addresses (should be empty for user 2)
    const listAddrRes2 = await request('GET', '/api/addresses', null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('GET /api/addresses for user 2 does NOT return user 1 address', listAddrRes2.status === 200 && listAddrRes2.body.data.length === 0);

    // User 2 attempts to GET user 1's address
    const crossGetRes = await request('GET', `/api/addresses/${address1Id}`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 accessing user 1 address returns 404', crossGetRes.status === 404);

    // User 2 attempts to UPDATE user 1's address
    const crossUpdateRes = await request(
      'PUT',
      `/api/addresses/${address1Id}`,
      { addressLine: 'Hacked Address' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 updating user 1 address returns 404', crossUpdateRes.status === 404);

    // User 1 updates own address
    const updateAddrRes = await request(
      'PUT',
      `/api/addresses/${address1Id}`,
      { label: 'Hostel Room Updated', addressLine: 'Block C, Room 102' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('User 1 updating own address returns 200', updateAddrRes.status === 200);
    assert('Updated address has new label', updateAddrRes.body.data.label === 'Hostel Room Updated');

    // User 2 attempts to DELETE user 1's address
    const crossDeleteRes = await request('DELETE', `/api/addresses/${address1Id}`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 deleting user 1 address returns 404', crossDeleteRes.status === 404);

    // User 1 deletes own address
    const deleteAddrRes = await request('DELETE', `/api/addresses/${address1Id}`, null, {
      Authorization: `Bearer ${token1}` },
    );
    assert('User 1 deleting own address returns 200', deleteAddrRes.status === 200);

    // Confirm address is deleted
    const getDeletedRes = await request('GET', `/api/addresses/${address1Id}`, null, {
      Authorization: `Bearer ${token1}` },
    );
    assert('Fetching deleted address returns 404', getDeletedRes.status === 404);

    console.log('\n--- 7. Testing Vendors API ---');
    const vendorsRes = await request('GET', '/api/vendors');
    assert('GET /api/vendors returns 200', vendorsRes.status === 200);
    assert('GET /api/vendors returns vendor list', Array.isArray(vendorsRes.body.data) && vendorsRes.body.data.length > 0);
    const vendorId = vendorsRes.body.data[0].id;

    // Filter by campus
    const vendorCampusRes = await request('GET', `/api/vendors?campusId=${campusId}`);
    assert('GET /api/vendors?campusId= returns 200', vendorCampusRes.status === 200);

    // Get single vendor
    const singleVendorRes = await request('GET', `/api/vendors/${vendorId}`);
    assert('GET /api/vendors/:id returns 200', singleVendorRes.status === 200);
    assert('GET /api/vendors/:id contains products array', Array.isArray(singleVendorRes.body.data.products));

    // Get vendor products
    const vendorProductsRes = await request('GET', `/api/vendors/${vendorId}/products`);
    assert('GET /api/vendors/:id/products returns 200', vendorProductsRes.status === 200);
    assert('GET /api/vendors/:id/products returns products list', Array.isArray(vendorProductsRes.body.data));

    // Non-existent vendor
    const nonExistentVendorRes = await request('GET', '/api/vendors/non-existent-id');
    assert('GET non-existent vendor returns 404', nonExistentVendorRes.status === 404);

    console.log('\n--- 8. Testing Products API ---');
    const productsRes = await request('GET', '/api/products');
    assert('GET /api/products returns 200', productsRes.status === 200);
    assert('GET /api/products returns product array', Array.isArray(productsRes.body.data) && productsRes.body.data.length > 0);
    const productId = productsRes.body.data[0].id;

    // Filter by category
    const categoryRes = await request('GET', '/api/products?category=Food');
    assert('GET /api/products?category=Food returns 200', categoryRes.status === 200);
    assert('All returned products have category Food', categoryRes.body.data.every((p) => p.category === 'Food'));

    // Filter by campusId
    const prodCampusRes = await request('GET', `/api/products?campusId=${campusId}`);
    assert('GET /api/products?campusId= returns 200', prodCampusRes.status === 200);

    // Filter by vendorId
    const prodVendorRes = await request('GET', `/api/products?vendorId=${vendorId}`);
    assert('GET /api/products?vendorId= returns 200', prodVendorRes.status === 200);

    // Search products
    const searchRes = await request('GET', '/api/products?search=Burger');
    assert('GET /api/products?search=Burger returns 200', searchRes.status === 200);
    assert('Search result contains Veg Burger', searchRes.body.data.some((p) => p.name.includes('Burger')));

    // Get single product
    const singleProdRes = await request('GET', `/api/products/${productId}`);
    assert('GET /api/products/:id returns 200', singleProdRes.status === 200);
    assert('GET /api/products/:id contains vendor info', singleProdRes.body.data.vendor && singleProdRes.body.data.vendor.name !== undefined);

    // Non-existent product
    const nonExistentProdRes = await request('GET', '/api/products/non-existent-product-id');
    assert('GET non-existent product returns 404', nonExistentProdRes.status === 404);

    console.log('\n--- 9. Testing Cart Module ---');
    // Ensure an unavailable product exists for negative testing
    let unavailableProduct = await prisma.product.findFirst({
      where: { isAvailable: false },
    });
    if (!unavailableProduct) {
      unavailableProduct = await prisma.product.create({
        data: {
          vendorId: vendorId,
          name: 'Seasonal Mango Shake (Unavailable)',
          description: 'Available only in peak summer season',
          price: 90.00,
          category: 'Beverages',
          isAvailable: false,
        },
      });
    }

    // 1. Unauthenticated GET /api/cart fails with 401
    const unauthCartRes = await request('GET', '/api/cart');
    assert('GET /api/cart without token returns 401', unauthCartRes.status === 401);

    // 2. Authenticated user gets empty cart
    const emptyCartRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/cart returns 200 for authenticated user', emptyCartRes.status === 200);
    assert('Empty cart data has cartId', !!emptyCartRes.body.data.cartId);
    assert('Empty cart has empty items array', Array.isArray(emptyCartRes.body.data.items) && emptyCartRes.body.data.items.length === 0);
    assert('Empty cart totalItems is 0', emptyCartRes.body.data.totalItems === 0);
    assert('Empty cart subtotal is "0.00"', emptyCartRes.body.data.subtotal === '0.00');

    const repeatEmptyCartRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Repeated GET /api/cart returns same cart id', repeatEmptyCartRes.body.data.cartId === emptyCartRes.body.data.cartId);
    assert('Repeated GET /api/cart does not create multiple carts', (await prisma.cart.count({ where: { userId: user1Id } })) === 1);

    // 3. Add Item Validation: Missing productId -> 400
    const addMissingProductRes = await request(
      'POST',
      '/api/cart/items',
      { quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with missing productId returns 400', addMissingProductRes.status === 400);

    // 4. Add Item Validation: Missing quantity -> 400
    const addMissingQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with missing quantity returns 400', addMissingQtyRes.status === 400);

    // 5. Add Item Validation: Quantity = 0 -> 400
    const addZeroQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: 0 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with quantity = 0 returns 400', addZeroQtyRes.status === 400);

    // 6. Add Item Validation: Negative quantity -> 400
    const addNegQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: -2 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with negative quantity returns 400', addNegQtyRes.status === 400);

    // 7. Add Item Validation: Decimal quantity -> 400
    const addDecQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: 1.5 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with decimal quantity returns 400', addDecQtyRes.status === 400);

    // 8. Add Item Validation: String quantity -> 400
    const addStrQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: 'two' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with string quantity returns 400', addStrQtyRes.status === 400);

    // 9. Add Item Validation: Null quantity -> 400
    const addNullQtyRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: null },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item with null quantity returns 400', addNullQtyRes.status === 400);

    // 10. Add Item Validation: Non-existing product -> 404
    const addNonExistRes = await request(
      'POST',
      '/api/cart/items',
      { productId: 'non-existing-uuid-product', quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add non-existing product returns 404', addNonExistRes.status === 404);

    // 11. Add Item Validation: Unavailable product -> 400
    const addUnavailableRes = await request(
      'POST',
      '/api/cart/items',
      { productId: unavailableProduct.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add unavailable product returns 400', addUnavailableRes.status === 400);
    assert(
      'Add unavailable product message indicates unavailable',
      addUnavailableRes.body.message.toLowerCase().includes('unavailable')
    );

    // 12. Add Item Validation: Client provides spoofed price -> Backend uses DB price
    const addSpoofPriceRes = await request(
      'POST',
      '/api/cart/items',
      { productId: productId, quantity: 1, price: 0.01 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add item succeeds while ignoring spoofed client price', addSpoofPriceRes.status === 200);
    const addedItem1 = addSpoofPriceRes.body.data.items.find((i) => i.product.id === productId);
    assert('Database price is preserved and not client price', addedItem1 && addedItem1.product.price !== '0.01');

    // Clear cart before systematic flow
    await request('DELETE', '/api/cart', null, { Authorization: `Bearer ${token1}` });

    // 13. Add valid product 1 (quantity 1)
    // Find Veg Burger (80.00) and Cold Coffee (50.00)
    const allProds = await request('GET', '/api/products');
    const burger = allProds.body.data.find((p) => p.name.includes('Burger')) || allProds.body.data[0];
    const coffee = allProds.body.data.find((p) => p.name.includes('Coffee')) || allProds.body.data[1];

    const addBurgerRes1 = await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add 1x Burger returns 200', addBurgerRes1.status === 200);
    assert('Cart items count is 1', addBurgerRes1.body.data.items.length === 1);
    assert('Burger item quantity is 1', addBurgerRes1.body.data.items[0].quantity === 1);
    assert('Burger itemTotal is "80.00"', addBurgerRes1.body.data.items[0].itemTotal === '80.00');
    assert('Cart totalItems is 1', addBurgerRes1.body.data.totalItems === 1);
    assert('Cart subtotal is "80.00"', addBurgerRes1.body.data.subtotal === '80.00');
    const burgerCartItemId = addBurgerRes1.body.data.items[0].id;

    // 14. Add valid product 2 (quantity 2)
    const addCoffeeRes = await request(
      'POST',
      '/api/cart/items',
      { productId: coffee.id, quantity: 2 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add 2x Coffee returns 200', addCoffeeRes.status === 200);
    assert('Cart items count is 2', addCoffeeRes.body.data.items.length === 2);
    const coffeeItem = addCoffeeRes.body.data.items.find((i) => i.product.id === coffee.id);
    assert('Coffee item quantity is 2', coffeeItem && coffeeItem.quantity === 2);
    assert('Coffee itemTotal is "100.00"', coffeeItem && coffeeItem.itemTotal === '100.00');
    assert('Cart totalItems is 3 (1 burger + 2 coffee)', addCoffeeRes.body.data.totalItems === 3);
    assert('Cart subtotal is "180.00" (80 + 100)', addCoffeeRes.body.data.subtotal === '180.00');
    const coffeeCartItemId = coffeeItem.id;

    // 15. Duplicate prevention: Add same product again (Burger +2)
    const addBurgerRes2 = await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 2 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Add existing product again returns 200', addBurgerRes2.status === 200);
    assert('Cart items count is STILL 2 (no duplicate CartItem created)', addBurgerRes2.body.data.items.length === 2);
    const updatedBurgerItem = addBurgerRes2.body.data.items.find((i) => i.product.id === burger.id);
    assert('Burger quantity increased from 1 to 3', updatedBurgerItem && updatedBurgerItem.quantity === 3);
    assert('Burger itemTotal updated to "240.00"', updatedBurgerItem && updatedBurgerItem.itemTotal === '240.00');
    assert('Cart totalItems is 5 (3 burger + 2 coffee)', addBurgerRes2.body.data.totalItems === 5);
    assert('Cart subtotal is "340.00" (240 + 100)', addBurgerRes2.body.data.subtotal === '340.00');

    // 16. GET /api/cart returns the full cart with product details
    const getCartRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/cart returns 200 with populated items', getCartRes.status === 200);
    assert('GET /api/cart subtotal matches "340.00"', getCartRes.body.data.subtotal === '340.00');
    assert('Product details include name, price, imageUrl, category, isAvailable',
      !!getCartRes.body.data.items[0].product.name &&
      !!getCartRes.body.data.items[0].product.price &&
      getCartRes.body.data.items[0].product.isAvailable === true
    );

    // 17. Update Item: Unauthenticated -> 401
    const unauthUpdateRes = await request('PUT', `/api/cart/items/${coffeeCartItemId}`, { quantity: 4 });
    assert('PUT /api/cart/items/:id unauthenticated returns 401', unauthUpdateRes.status === 401);

    // 18. Update Item: Quantity = 0 -> 400
    const updateZeroQtyRes = await request(
      'PUT',
      `/api/cart/items/${coffeeCartItemId}`,
      { quantity: 0 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('PUT /api/cart/items/:id with quantity = 0 returns 400', updateZeroQtyRes.status === 400);

    // 19. Update Item: Negative quantity -> 400
    const updateNegQtyRes = await request(
      'PUT',
      `/api/cart/items/${coffeeCartItemId}`,
      { quantity: -3 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('PUT /api/cart/items/:id with negative quantity returns 400', updateNegQtyRes.status === 400);

    // 20. Update Item: Decimal quantity -> 400
    const updateDecQtyRes = await request(
      'PUT',
      `/api/cart/items/${coffeeCartItemId}`,
      { quantity: 3.5 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('PUT /api/cart/items/:id with decimal quantity returns 400', updateDecQtyRes.status === 400);

    // 21. Update Item: Non-existing CartItem -> 404
    const updateNonExistRes = await request(
      'PUT',
      '/api/cart/items/non-existing-cart-item-id',
      { quantity: 2 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('PUT non-existing cart item returns 404', updateNonExistRes.status === 404);

    // 22. Security: Cross-user GET /api/cart -> User 2 gets own empty cart
    const user2CartRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 GET /api/cart does NOT see User 1 items', user2CartRes.status === 200 && user2CartRes.body.data.items.length === 0);

    // 23. Security: User 2 tries to update User 1's CartItem -> 404
    const crossUpdateCartItemRes = await request(
      'PUT',
      `/api/cart/items/${coffeeCartItemId}`,
      { quantity: 10 },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 updating User 1 CartItem returns 404', crossUpdateCartItemRes.status === 404);

    // 24. Security: User 2 tries to delete User 1's CartItem -> 404
    const crossDeleteCartItemRes = await request(
      'DELETE',
      `/api/cart/items/${coffeeCartItemId}`,
      null,
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 deleting User 1 CartItem returns 404', crossDeleteCartItemRes.status === 404);

    // 25. Update own CartItem (update coffee quantity from 2 to 4)
    const updateCoffeeRes = await request(
      'PUT',
      `/api/cart/items/${coffeeCartItemId}`,
      { quantity: 4 },
      { Authorization: `Bearer ${token1}` }
    );
    assert('User 1 updating own CartItem returns 200', updateCoffeeRes.status === 200);
    const updatedCoffee = updateCoffeeRes.body.data.items.find((i) => i.id === coffeeCartItemId);
    assert('Coffee quantity is now 4', updatedCoffee && updatedCoffee.quantity === 4);
    assert('Coffee itemTotal is now "200.00"', updatedCoffee && updatedCoffee.itemTotal === '200.00');
    assert('Subtotal is updated to "440.00" (240 + 200)', updateCoffeeRes.body.data.subtotal === '440.00');

    // 26. Delete Item: Unauthenticated -> 401
    const unauthDeleteRes = await request('DELETE', `/api/cart/items/${coffeeCartItemId}`);
    assert('DELETE /api/cart/items/:id unauthenticated returns 401', unauthDeleteRes.status === 401);

    // 27. Delete Item: Non-existing item -> 404
    const deleteNonExistRes = await request(
      'DELETE',
      '/api/cart/items/non-existing-cart-item-id',
      null,
      { Authorization: `Bearer ${token1}` }
    );
    assert('DELETE non-existing cart item returns 404', deleteNonExistRes.status === 404);

    // 28. Delete own CartItem (delete coffee)
    const deleteCoffeeRes = await request(
      'DELETE',
      `/api/cart/items/${coffeeCartItemId}`,
      null,
      { Authorization: `Bearer ${token1}` }
    );
    assert('User 1 deleting own CartItem returns 200', deleteCoffeeRes.status === 200);
    assert('Cart items count reduced to 1', deleteCoffeeRes.body.data.items.length === 1);
    assert('Subtotal reduced to "240.00"', deleteCoffeeRes.body.data.subtotal === '240.00');

    // 29. Clear Cart: Unauthenticated -> 401
    const unauthClearRes = await request('DELETE', '/api/cart');
    assert('DELETE /api/cart unauthenticated returns 401', unauthClearRes.status === 401);

    // 30. Clear Cart: User 1 clears cart
    const clearCartRes = await request('DELETE', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('DELETE /api/cart returns 200', clearCartRes.status === 200);

    // 31. Verify all items removed & cart still exists
    const postClearGetRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Cart has 0 items after clearing', postClearGetRes.body.data.items.length === 0);
    assert('Cart totalItems is 0 after clearing', postClearGetRes.body.data.totalItems === 0);
    assert('Cart subtotal is "0.00" after clearing', postClearGetRes.body.data.subtotal === '0.00');
    assert('Cart record still exists with valid cartId', !!postClearGetRes.body.data.cartId);

    // 32. Clear already-empty cart
    const clearEmptyRes = await request('DELETE', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('DELETE /api/cart on already-empty cart returns 200', clearEmptyRes.status === 200);

    // 33. Database integrity checks: Existing User/Product data remains intact
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    assert('User records remain intact in database', userCount >= 2);
    assert('Product records remain intact in database', productCount >= 3);

    console.log('\n--- 10. Testing Order Module ---');
    // 1. Order APIs require authentication
    const unauthCreateOrderRes = await request('POST', '/api/orders');
    assert('POST /api/orders without token returns 401', unauthCreateOrderRes.status === 401);

    const unauthListOrdersRes = await request('GET', '/api/orders');
    assert('GET /api/orders without token returns 401', unauthListOrdersRes.status === 401);

    const unauthGetOrderRes = await request('GET', '/api/orders/non-existing-order-id');
    assert('GET /api/orders/:id without token returns 401', unauthGetOrderRes.status === 401);

    const invalidTokenOrdersRes = await request('GET', '/api/orders', null, {
      Authorization: 'Bearer invalid-token',
    });
    assert('GET /api/orders with invalid token returns 401', invalidTokenOrdersRes.status === 401);

    // 2. Empty cart cannot create order
    const orderCountBeforeEmpty = await prisma.order.count({ where: { userId: user1Id } });
    const emptyOrderRes = await request('POST', '/api/orders', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('POST /api/orders with empty cart returns 400', emptyOrderRes.status === 400);
    assert('Empty cart order response says cart is empty', emptyOrderRes.body.message === 'Cart is empty');
    const orderCountAfterEmpty = await prisma.order.count({ where: { userId: user1Id } });
    assert('No order is created from empty cart', orderCountAfterEmpty === orderCountBeforeEmpty);

    // 3. Create order from a valid cart with multiple items
    const orderCartBefore = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    const orderCartId = orderCartBefore.body.data.cartId;

    await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 2 },
      { Authorization: `Bearer ${token1}` }
    );
    await request(
      'POST',
      '/api/cart/items',
      { productId: coffee.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );

    const orderCountBeforeCreate = await prisma.order.count({ where: { userId: user1Id } });
    const createOrderRes = await request(
      'POST',
      '/api/orders',
      {
        userId: 'spoofed-user-id',
        totalAmount: '0.01',
        price: '0.01',
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert('POST /api/orders with valid cart returns 201', createOrderRes.status === 201);
    assert('Created order status is PENDING', createOrderRes.body.data.status === 'PENDING');
    assert('Created order has two order items', createOrderRes.body.data.items.length === 2);
    assert('Created order total uses database prices', createOrderRes.body.data.totalAmount === '210.00');
    assert('Client supplied totalAmount is ignored', createOrderRes.body.data.totalAmount !== '0.01');

    const createdOrderId = createOrderRes.body.data.id;
    const burgerOrderItem = createOrderRes.body.data.items.find((i) => i.product.id === burger.id);
    const coffeeOrderItemForCreate = createOrderRes.body.data.items.find((i) => i.product.id === coffee.id);
    assert('Burger order item quantity is 2', burgerOrderItem && burgerOrderItem.quantity === 2);
    assert('Coffee order item quantity is 1', coffeeOrderItemForCreate && coffeeOrderItemForCreate.quantity === 1);
    assert('Burger price snapshot is "80.00"', burgerOrderItem && burgerOrderItem.price === '80.00');
    assert('Coffee price snapshot is "50.00"', coffeeOrderItemForCreate && coffeeOrderItemForCreate.price === '50.00');
    assert('Burger item total is "160.00"', burgerOrderItem && burgerOrderItem.itemTotal === '160.00');
    assert('Coffee item total is "50.00"', coffeeOrderItemForCreate && coffeeOrderItemForCreate.itemTotal === '50.00');

    const dbCreatedOrder = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { items: true },
    });
    assert('Order is persisted in database', !!dbCreatedOrder);
    assert('Order belongs to authenticated user only', dbCreatedOrder && dbCreatedOrder.userId === user1Id);
    assert('Order total is persisted as "210.00"', dbCreatedOrder && dbCreatedOrder.totalAmount.toFixed(2) === '210.00');
    assert('OrderItems are persisted in database', dbCreatedOrder && dbCreatedOrder.items.length === 2);
    assert('Order count increased by one', (await prisma.order.count({ where: { userId: user1Id } })) === orderCountBeforeCreate + 1);

    const cartAfterOrderRes = await request('GET', '/api/cart', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Cart is empty after successful order', cartAfterOrderRes.body.data.items.length === 0);
    assert('Cart totalItems is 0 after successful order', cartAfterOrderRes.body.data.totalItems === 0);
    assert('Cart record remains after successful order', cartAfterOrderRes.body.data.cartId === orderCartId);

    // 4. Users can list and read only their own orders
    const listOrdersRes = await request('GET', '/api/orders', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders returns 200', listOrdersRes.status === 200);
    assert('GET /api/orders returns an array', Array.isArray(listOrdersRes.body.data));
    assert('GET /api/orders includes created order', listOrdersRes.body.data.some((o) => o.id === createdOrderId));

    const getOwnOrderRes = await request('GET', `/api/orders/${createdOrderId}`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders/:id returns own order', getOwnOrderRes.status === 200);
    assert('GET /api/orders/:id has matching id', getOwnOrderRes.body.data.id === createdOrderId);
    assert('GET /api/orders/:id returns order items', getOwnOrderRes.body.data.items.length === 2);

    const getUser2OrdersRes = await request('GET', '/api/orders', null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 GET /api/orders returns 200', getUser2OrdersRes.status === 200);
    assert('User 2 order list does not include User 1 order', !getUser2OrdersRes.body.data.some((o) => o.id === createdOrderId));

    const crossGetOrderRes = await request('GET', `/api/orders/${createdOrderId}`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 reading User 1 order returns 404', crossGetOrderRes.status === 404);

    const nonExistingOrderRes = await request('GET', '/api/orders/non-existing-order-id', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET non-existing order returns 404', nonExistingOrderRes.status === 404);

    // 5. Historical price snapshot does not change when Product.price changes later
    await prisma.product.update({
      where: { id: burger.id },
      data: { price: 120.00 },
    });
    const historicalOrderRes = await request('GET', `/api/orders/${createdOrderId}`, null, {
      Authorization: `Bearer ${token1}`,
    });
    const historicalBurgerItem = historicalOrderRes.body.data.items.find((i) => i.product.id === burger.id);
    assert('Historical order keeps original burger price snapshot', historicalBurgerItem && historicalBurgerItem.price === '80.00');
    assert('Historical order total remains unchanged after product price change', historicalOrderRes.body.data.totalAmount === '210.00');
    await prisma.product.update({
      where: { id: burger.id },
      data: { price: 80.00 },
    });

    // 6. Unavailable products block order creation and keep cart unchanged
    await request('DELETE', '/api/cart', null, { Authorization: `Bearer ${token1}` });
    await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    const cartForUnavailable = await prisma.cart.findFirst({ where: { userId: user1Id } });
    await prisma.cartItem.create({
      data: {
        cartId: cartForUnavailable.id,
        productId: unavailableProduct.id,
        quantity: 1,
      },
    });
    const orderCountBeforeUnavailable = await prisma.order.count({ where: { userId: user1Id } });
    const unavailableOrderRes = await request('POST', '/api/orders', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Order with unavailable product returns 400', unavailableOrderRes.status === 400);
    assert(
      'Unavailable product order message is clear',
      unavailableOrderRes.body.message === 'One or more products are currently unavailable'
    );
    assert('Unavailable product does not create order', (await prisma.order.count({ where: { userId: user1Id } })) === orderCountBeforeUnavailable);
    assert('Cart remains unchanged when unavailable product blocks order', (await prisma.cartItem.count({ where: { cartId: cartForUnavailable.id } })) === 2);
    await request('DELETE', '/api/cart', null, { Authorization: `Bearer ${token1}` });

    // 7. Invalid cart quantity blocks order creation and keeps cart unchanged
    await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    const cartForInvalidQuantity = await prisma.cart.findFirst({ where: { userId: user1Id } });
    const invalidQuantityItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cartForInvalidQuantity.id,
        productId: burger.id,
      },
    });
    await prisma.cartItem.update({
      where: { id: invalidQuantityItem.id },
      data: { quantity: 0 },
    });
    const orderCountBeforeInvalidQuantity = await prisma.order.count({ where: { userId: user1Id } });
    const invalidQuantityOrderRes = await request('POST', '/api/orders', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Order with invalid cart quantity returns 400', invalidQuantityOrderRes.status === 400);
    assert('Invalid quantity order message is clear', invalidQuantityOrderRes.body.message === 'Cart contains invalid item quantity');
    assert('Invalid quantity does not create order', (await prisma.order.count({ where: { userId: user1Id } })) === orderCountBeforeInvalidQuantity);
    const invalidQuantityItemAfterFail = await prisma.cartItem.findUnique({
      where: { id: invalidQuantityItem.id },
    });
    assert('CartItem remains when invalid quantity blocks order', invalidQuantityItemAfterFail && invalidQuantityItemAfterFail.quantity === 0);
    await request('DELETE', '/api/cart', null, { Authorization: `Bearer ${token1}` });

    // 8. Database relationship prevents CartItems for missing products
    let missingProductCartItemRejected = false;
    try {
      await prisma.cartItem.create({
        data: {
          cartId: cartForInvalidQuantity.id,
          productId: 'missing-product-id',
          quantity: 1,
        },
      });
    } catch (error) {
      missingProductCartItemRejected = true;
    }
    assert('Database rejects CartItem with missing product', missingProductCartItemRejected === true);

    // 9. User 2 can create their own independent order
    await request(
      'POST',
      '/api/cart/items',
      { productId: coffee.id, quantity: 2 },
      { Authorization: `Bearer ${token2}` }
    );
    const user2OrderRes = await request('POST', '/api/orders', null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 can create own order', user2OrderRes.status === 201);
    assert('User 2 order total is correct', user2OrderRes.body.data.totalAmount === '100.00');
    assert('User 2 order has own item quantity', user2OrderRes.body.data.items[0].quantity === 2);

    console.log('\n--- 11. Testing Payment Module ---');
    // 1. Payment APIs require authentication
    const unauthPaymentCreateRes = await request('POST', '/api/payments');
    assert('POST /api/payments without token returns 401', unauthPaymentCreateRes.status === 401);

    const unauthPaymentGetRes = await request('GET', '/api/payments/non-existing-payment-id');
    assert('GET /api/payments/:id without token returns 401', unauthPaymentGetRes.status === 401);

    const unauthOrderPaymentRes = await request('GET', `/api/orders/${user2OrderRes.body.data.id}/payment`);
    assert('GET /api/orders/:orderId/payment without token returns 401', unauthOrderPaymentRes.status === 401);

    const invalidTokenPaymentRes = await request('POST', '/api/payments', null, {
      Authorization: 'Bearer invalid-token',
    });
    assert('POST /api/payments with invalid token returns 401', invalidTokenPaymentRes.status === 401);

    // 2. Payment validation
    const missingOrderIdPaymentRes = await request(
      'POST',
      '/api/payments',
      { paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment with missing orderId returns 400', missingOrderIdPaymentRes.status === 400);

    const missingMethodPaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: createdOrderId },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment with missing paymentMethod returns 400', missingMethodPaymentRes.status === 400);

    const unsupportedMethodPaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: createdOrderId, paymentMethod: 'CASH_ON_DELIVERY' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment with unsupported paymentMethod returns 400', unsupportedMethodPaymentRes.status === 400);

    const nonExistingOrderPaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: 'non-existing-order-id', paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment for non-existing order returns 404', nonExistingOrderPaymentRes.status === 404);

    // 3. Create a new user 1 order for payment tests
    await request('DELETE', '/api/cart', null, { Authorization: `Bearer ${token1}` });
    await request(
      'POST',
      '/api/cart/items',
      { productId: burger.id, quantity: 1 },
      { Authorization: `Bearer ${token1}` }
    );
    await request(
      'POST',
      '/api/cart/items',
      { productId: coffee.id, quantity: 2 },
      { Authorization: `Bearer ${token1}` }
    );
    const paymentOrderRes = await request('POST', '/api/orders', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('Created fresh order for payment tests', paymentOrderRes.status === 201);
    const paymentOrderId = paymentOrderRes.body.data.id;

    const orderPaymentBeforeCreateRes = await request('GET', `/api/orders/${paymentOrderId}/payment`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders/:orderId/payment returns 404 before payment exists', orderPaymentBeforeCreateRes.status === 404);

    const paymentCountBeforeCreate = await prisma.payment.count();
    const createPaymentRes = await request(
      'POST',
      '/api/payments',
      {
        orderId: paymentOrderId,
        paymentMethod: 'UPI',
        userId: 'spoofed-user-id',
        amount: '1.00',
        currency: 'USD',
        status: 'SUCCESS',
        transactionId: 'client-txn-id',
        gatewayReference: 'client-gateway-reference',
        cardNumber: '4111111111111111',
        cvv: '123',
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert('POST /api/payments for own order returns 201', createPaymentRes.status === 201);
    assert('Payment response has correct orderId', createPaymentRes.body.data.orderId === paymentOrderId);
    assert('Payment amount uses Order.totalAmount', createPaymentRes.body.data.amount === '180.00');
    assert('Payment currency is INR', createPaymentRes.body.data.currency === 'INR');
    assert('Payment method is UPI', createPaymentRes.body.data.paymentMethod === 'UPI');
    assert('Payment initial status is PENDING', createPaymentRes.body.data.status === 'PENDING');
    assert('Client supplied SUCCESS status is ignored', createPaymentRes.body.data.status !== 'SUCCESS');
    assert('Client supplied amount is ignored', createPaymentRes.body.data.amount !== '1.00');
    assert('Client supplied currency is ignored', createPaymentRes.body.data.currency !== 'USD');
    assert('Client supplied transactionId is ignored', createPaymentRes.body.data.transactionId === null);
    assert('Client supplied gatewayReference is ignored', createPaymentRes.body.data.gatewayReference === null);
    assert('Payment response does not expose card number', createPaymentRes.body.data.cardNumber === undefined);
    assert('Payment response does not expose CVV', createPaymentRes.body.data.cvv === undefined);
    assert('Payment count increased by one', (await prisma.payment.count()) === paymentCountBeforeCreate + 1);

    const paymentId = createPaymentRes.body.data.id;
    const dbPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
    assert('Payment is persisted in database', !!dbPayment);
    assert('Database payment amount equals order total', dbPayment && dbPayment.amount.toFixed(2) === paymentOrderRes.body.data.totalAmount);
    assert('Database payment transactionId remains null', dbPayment && dbPayment.transactionId === null);
    assert('Database payment gatewayReference remains null', dbPayment && dbPayment.gatewayReference === null);

    // 4. Duplicate pending payment returns existing payment instead of creating another
    const duplicatePendingPaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: paymentOrderId, paymentMethod: 'CARD' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Duplicate PENDING payment request returns 200', duplicatePendingPaymentRes.status === 200);
    assert('Duplicate PENDING payment returns existing payment id', duplicatePendingPaymentRes.body.data.id === paymentId);
    assert('Duplicate PENDING payment does not create another payment', (await prisma.payment.count({ where: { orderId: paymentOrderId } })) === 1);

    // 5. Payment retrieval and ownership checks
    const getOwnPaymentRes = await request('GET', `/api/payments/${paymentId}`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/payments/:id returns own payment', getOwnPaymentRes.status === 200);
    assert('GET /api/payments/:id has matching id', getOwnPaymentRes.body.data.id === paymentId);

    const getOrderPaymentRes = await request('GET', `/api/orders/${paymentOrderId}/payment`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders/:orderId/payment returns own payment', getOrderPaymentRes.status === 200);
    assert('GET /api/orders/:orderId/payment has matching payment id', getOrderPaymentRes.body.data.id === paymentId);

    const crossUserPaymentCreateRes = await request(
      'POST',
      '/api/payments',
      { orderId: paymentOrderId, paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 cannot create payment for User 1 order', crossUserPaymentCreateRes.status === 404);

    const crossUserGetPaymentRes = await request('GET', `/api/payments/${paymentId}`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 cannot read User 1 payment by id', crossUserGetPaymentRes.status === 404);

    const crossUserOrderPaymentRes = await request('GET', `/api/orders/${paymentOrderId}/payment`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 cannot read User 1 payment through order endpoint', crossUserOrderPaymentRes.status === 404);

    const missingPaymentRes = await request('GET', '/api/payments/non-existing-payment-id', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET non-existing payment returns 404', missingPaymentRes.status === 404);

    // 6. Already successfully paid order cannot create another payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS' },
    });
    const successDuplicatePaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: paymentOrderId, paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment for already paid order returns 409', successDuplicatePaymentRes.status === 409);
    assert('Already paid order still has only one payment', (await prisma.payment.count({ where: { orderId: paymentOrderId } })) === 1);

    // 7. Cancelled and invalid order states are not eligible for payment
    const cancelledOrder = await prisma.order.create({
      data: {
        userId: user1Id,
        status: 'CANCELLED',
        totalAmount: 75.00,
      },
    });
    const cancelledOrderPaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: cancelledOrder.id, paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment for cancelled order returns 400', cancelledOrderPaymentRes.status === 400);

    const completedOrder = await prisma.order.create({
      data: {
        userId: user1Id,
        status: 'COMPLETED',
        totalAmount: 85.00,
      },
    });
    const invalidStatePaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: completedOrder.id, paymentMethod: 'UPI' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Payment for invalid order state returns 400', invalidStatePaymentRes.status === 400);

    // 8. User 2 can create payment for own order independently
    const user2PaymentRes = await request(
      'POST',
      '/api/payments',
      { orderId: user2OrderRes.body.data.id, paymentMethod: 'WALLET' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 can create payment for own order', user2PaymentRes.status === 201);
    assert('User 2 payment amount is correct', user2PaymentRes.body.data.amount === user2OrderRes.body.data.totalAmount);
    assert('User 2 payment method is WALLET', user2PaymentRes.body.data.paymentMethod === 'WALLET');

    console.log('\n--- 12. Testing Delivery Module ---');
    // 1. Delivery APIs require authentication
    const unauthDeliveryCreateRes = await request('POST', '/api/deliveries');
    assert('POST /api/deliveries without token returns 401', unauthDeliveryCreateRes.status === 401);

    const unauthDeliveryGetRes = await request('GET', '/api/deliveries/non-existing-delivery-id');
    assert('GET /api/deliveries/:id without token returns 401', unauthDeliveryGetRes.status === 401);

    const unauthOrderDeliveryRes = await request('GET', `/api/orders/${paymentOrderId}/delivery`);
    assert('GET /api/orders/:orderId/delivery without token returns 401', unauthOrderDeliveryRes.status === 401);

    const unauthDeliveryStatusRes = await request('PUT', '/api/deliveries/non-existing-delivery-id/status', {
      status: 'PREPARING',
    });
    assert('PUT /api/deliveries/:id/status without token returns 401', unauthDeliveryStatusRes.status === 401);

    const invalidTokenDeliveryRes = await request('POST', '/api/deliveries', null, {
      Authorization: 'Bearer invalid-token',
    });
    assert('POST /api/deliveries with invalid token returns 401', invalidTokenDeliveryRes.status === 401);

    // 2. Delivery validation and payment gating
    const missingOrderIdDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      {},
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery with missing orderId returns 400', missingOrderIdDeliveryRes.status === 400);

    const nonExistingOrderDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: 'non-existing-order-id' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery for non-existing order returns 404', nonExistingOrderDeliveryRes.status === 404);

    const unpaidOrderDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: createdOrderId },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery before successful payment returns 400', unpaidOrderDeliveryRes.status === 400);

    const cancelledOrderDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: cancelledOrder.id },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery for cancelled order returns 400', cancelledOrderDeliveryRes.status === 400);

    const orderDeliveryBeforeCreateRes = await request('GET', `/api/orders/${paymentOrderId}/delivery`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders/:orderId/delivery returns 404 before delivery exists', orderDeliveryBeforeCreateRes.status === 404);

    // 3. Create delivery for a paid order
    const deliveryCountBeforeCreate = await prisma.delivery.count();
    const createDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      {
        orderId: paymentOrderId,
        status: 'DELIVERED',
        userId: 'spoofed-user-id',
      },
      { Authorization: `Bearer ${token1}` }
    );
    assert('POST /api/deliveries for paid own order returns 201', createDeliveryRes.status === 201);
    assert('Delivery response has correct orderId', createDeliveryRes.body.data.orderId === paymentOrderId);
    assert('Delivery initial status is PENDING', createDeliveryRes.body.data.status === 'PENDING');
    assert('Client supplied delivery status is ignored on create', createDeliveryRes.body.data.status !== 'DELIVERED');
    assert('Delivery count increased by one', (await prisma.delivery.count()) === deliveryCountBeforeCreate + 1);

    const deliveryId = createDeliveryRes.body.data.id;
    const dbDelivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    assert('Delivery is persisted in database', !!dbDelivery);
    assert('Database delivery status is PENDING', dbDelivery && dbDelivery.status === 'PENDING');

    // 4. Duplicate delivery returns existing delivery instead of creating another
    const duplicateDeliveryRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: paymentOrderId },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Duplicate delivery request returns 200', duplicateDeliveryRes.status === 200);
    assert('Duplicate delivery returns existing delivery id', duplicateDeliveryRes.body.data.id === deliveryId);
    assert('Duplicate delivery does not create another delivery', (await prisma.delivery.count({ where: { orderId: paymentOrderId } })) === 1);

    // 5. Delivery retrieval and ownership checks
    const getOwnDeliveryRes = await request('GET', `/api/deliveries/${deliveryId}`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/deliveries/:id returns own delivery', getOwnDeliveryRes.status === 200);
    assert('GET /api/deliveries/:id has matching id', getOwnDeliveryRes.body.data.id === deliveryId);

    const getOrderDeliveryRes = await request('GET', `/api/orders/${paymentOrderId}/delivery`, null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET /api/orders/:orderId/delivery returns own delivery', getOrderDeliveryRes.status === 200);
    assert('GET /api/orders/:orderId/delivery has matching delivery id', getOrderDeliveryRes.body.data.id === deliveryId);

    const crossUserDeliveryCreateRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: paymentOrderId },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 cannot create delivery for User 1 order', crossUserDeliveryCreateRes.status === 404);

    const crossUserGetDeliveryRes = await request('GET', `/api/deliveries/${deliveryId}`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 cannot read User 1 delivery by id', crossUserGetDeliveryRes.status === 404);

    const crossUserOrderDeliveryRes = await request('GET', `/api/orders/${paymentOrderId}/delivery`, null, {
      Authorization: `Bearer ${token2}`,
    });
    assert('User 2 cannot read User 1 delivery through order endpoint', crossUserOrderDeliveryRes.status === 404);

    const missingDeliveryRes = await request('GET', '/api/deliveries/non-existing-delivery-id', null, {
      Authorization: `Bearer ${token1}`,
    });
    assert('GET non-existing delivery returns 404', missingDeliveryRes.status === 404);

    // 6. Delivery status validation and transition rules
    const missingStatusRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      {},
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery status update with missing status returns 400', missingStatusRes.status === 400);

    const invalidStatusRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'LOST' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery status update with invalid status returns 400', invalidStatusRes.status === 400);

    const invalidTransitionRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'DELIVERED' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery invalid transition PENDING -> DELIVERED returns 400', invalidTransitionRes.status === 400);

    const preparingRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'PREPARING' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery transition PENDING -> PREPARING returns 200', preparingRes.status === 200);
    assert('Delivery status is PREPARING', preparingRes.body.data.status === 'PREPARING');

    const outForDeliveryRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'out_for_delivery' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery transition PREPARING -> OUT_FOR_DELIVERY returns 200', outForDeliveryRes.status === 200);
    assert('Delivery status is OUT_FOR_DELIVERY', outForDeliveryRes.body.data.status === 'OUT_FOR_DELIVERY');

    const deliveredRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'DELIVERED' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery transition OUT_FOR_DELIVERY -> DELIVERED returns 200', deliveredRes.status === 200);
    assert('Delivery status is DELIVERED', deliveredRes.body.data.status === 'DELIVERED');

    const deliveredBackwardsRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'PREPARING' },
      { Authorization: `Bearer ${token1}` }
    );
    assert('Delivery invalid transition DELIVERED -> PREPARING returns 400', deliveredBackwardsRes.status === 400);

    const crossUserStatusUpdateRes = await request(
      'PUT',
      `/api/deliveries/${deliveryId}/status`,
      { status: 'CANCELLED' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 cannot update User 1 delivery status', crossUserStatusUpdateRes.status === 404);

    const user2PaymentRecord = await prisma.payment.findUnique({
      where: { id: user2PaymentRes.body.data.id },
    });
    await prisma.payment.update({
      where: { id: user2PaymentRecord.id },
      data: { status: 'SUCCESS' },
    });
    const user2DeliveryRes = await request(
      'POST',
      '/api/deliveries',
      { orderId: user2OrderRes.body.data.id },
      { Authorization: `Bearer ${token2}` }
    );
    assert('User 2 can create delivery for own paid order', user2DeliveryRes.status === 201);

    const user2CancelDeliveryRes = await request(
      'PUT',
      `/api/deliveries/${user2DeliveryRes.body.data.id}/status`,
      { status: 'CANCELLED' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('Delivery transition PENDING -> CANCELLED returns 200', user2CancelDeliveryRes.status === 200);

    const cancelledForwardRes = await request(
      'PUT',
      `/api/deliveries/${user2DeliveryRes.body.data.id}/status`,
      { status: 'OUT_FOR_DELIVERY' },
      { Authorization: `Bearer ${token2}` }
    );
    assert('Delivery invalid transition CANCELLED -> OUT_FOR_DELIVERY returns 400', cancelledForwardRes.status === 400);

    console.log('\n========================================');
    const total = results.length;
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    server.close();
  }
}

runTests();
