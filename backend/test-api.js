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
