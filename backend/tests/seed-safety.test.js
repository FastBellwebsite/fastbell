const { spawnSync } = require('child_process');
const path = require('path');
const assert = require('assert');

console.log('--- Running Seed Script Safety Guard Tests (Offline / No DB Writes) ---\n');

const seedScriptPath = path.resolve(__dirname, '..', 'prisma', 'seed.js');
let passed = 0;
let failed = 0;

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 1. Ordinary execution without opt-in flag is blocked
runTest('Default invocation (no opt-in flag) fails safely with code 1', () => {
  const result = spawnSync(process.execPath, [seedScriptPath], {
    env: { ...process.env, FASTBELL_ALLOW_SEED: '', NODE_ENV: 'development' },
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);
  assert.ok(
    result.stderr.includes('Seed execution is blocked by default'),
    `Expected stderr to explain default block, got: ${result.stderr}`
  );
  assert.ok(
    result.stderr.includes('FASTBELL_ALLOW_SEED=true'),
    `Expected instructions for explicit opt-in in stderr, got: ${result.stderr}`
  );
});

// 2. Production environment is strictly blocked even if opt-in flag is provided
runTest('Production environment blocks seed execution even if FASTBELL_ALLOW_SEED=true', () => {
  const result = spawnSync(process.execPath, [seedScriptPath], {
    env: { ...process.env, FASTBELL_ALLOW_SEED: 'true', NODE_ENV: 'production' },
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);
  assert.ok(
    result.stderr.includes('strictly blocked in production environment'),
    `Expected stderr to state production block, got: ${result.stderr}`
  );
  assert.ok(
    result.stderr.includes('bootstrapAdmin.js'),
    `Expected referral to bootstrapAdmin.js in stderr, got: ${result.stderr}`
  );
});

// 3. Production environment is strictly blocked if --confirm-seed CLI argument is passed
runTest('Production environment blocks seed execution even if --confirm-seed flag is passed', () => {
  const result = spawnSync(process.execPath, [seedScriptPath, '--confirm-seed'], {
    env: { ...process.env, FASTBELL_ALLOW_SEED: '', NODE_ENV: 'production' },
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 1, `Expected exit code 1, got ${result.status}`);
  assert.ok(
    result.stderr.includes('strictly blocked in production environment'),
    `Expected stderr to state production block, got: ${result.stderr}`
  );
});

// 4. Guard triggers immediately before database initialization or connection
runTest('Guard executes offline without attempting network/DB connections', () => {
  const startTime = Date.now();
  const result = spawnSync(process.execPath, [seedScriptPath], {
    env: {
      ...process.env,
      DATABASE_URL: 'mysql://invalid_user:invalid_pass@127.0.0.1:9999/non_existent_db',
      FASTBELL_ALLOW_SEED: 'false',
      NODE_ENV: 'development',
    },
    encoding: 'utf8',
    timeout: 3000,
  });

  const durationMs = Date.now() - startTime;
  assert.strictEqual(result.status, 1);
  assert.ok(
    durationMs < 2000,
    `Guard took too long (${durationMs}ms), may have attempted DB connection`
  );
  assert.ok(!result.stderr.includes('PrismaClientInitializationError'), 'Should exit before Prisma initializes');
});

console.log(`\nSeed Safety Tests: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
