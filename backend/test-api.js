const http = require('http');
const app = require('./src/app');

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
    server.close();
  }
}

runTests();
