/**
 * FastBell - One-Time Initial Administrator Bootstrap Script
 *
 * Security guarantees:
 * 1. Strictly refuses to execute if ANY administrator account already exists.
 * 2. Strictly refuses to reuse an email address already registered for another role.
 * 3. Interactively prompts for the password with masked/hidden input (no echoing to stdout).
 * 4. Never hardcodes, logs, or prints passwords or hashes.
 * 5. Uses the project's existing bcrypt configuration (10 salt rounds) via src/utils/password.js.
 * 6. Does not alter existing orders, delivery assignments, or delivery partner verification statuses.
 */

const path = require('path');
const readline = require('readline');

// Load environment configuration
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = require('../src/utils/prisma');
const { hashPassword } = require('../src/utils/password');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHiddenPassword(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const stdin = process.stdin;

    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question('', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char) => {
      // Ctrl+C
      if (char === '\u0003') {
        stdin.setRawMode(wasRaw);
        process.stdout.write('\n');
        process.exit(1);
      }
      // Enter / Return
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(wasRaw);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
        return;
      }
      // Backspace
      if (char === '\u0008' || char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
        }
        return;
      }
      password += char;
    };

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('====================================================');
  console.log('       FastBell One-Time Admin Bootstrap Tool       ');
  console.log('====================================================\n');

  try {
    // 1. Guard: verify that no administrator account exists
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (existingAdminCount > 0) {
      console.error(`❌ Bootstrap Aborted: ${existingAdminCount} administrator account(s) already exist.`);
      console.error('This script can only be used to create the initial administrator.\n');
      process.exit(1);
    }

    // 2. Prompt for Name
    const nameInput = await askQuestion('Admin Name [FastBell Admin]: ');
    const name = nameInput || 'FastBell Admin';

    // 3. Prompt for Email
    const emailInput = await askQuestion('Admin Email Address: ');
    const normalizedEmail = emailInput.trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      console.error('\n❌ Error: A valid email address is required.');
      process.exit(1);
    }

    // 4. Guard: verify that email is not already claimed
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, role: true },
    });

    if (existingUser) {
      console.error(`\n❌ Bootstrap Aborted: The email "${normalizedEmail}" is already registered with role "${existingUser.role}".`);
      process.exit(1);
    }

    // 5. Prompt for Password securely (hidden input)
    const password = await askHiddenPassword('Admin Password (min 16 characters): ');
    if (!password || password.length < 16) {
      console.error('\n❌ Error: Password must be at least 16 characters long.');
      process.exit(1);
    }

    const confirmPassword = await askHiddenPassword('Confirm Admin Password (min 16 characters): ');
    if (password !== confirmPassword) {
      console.error('\n❌ Error: Passwords do not match.');
      process.exit(1);
    }

    // 6. Hash password using existing bcrypt config (10 salt rounds)
    const passwordHash = await hashPassword(password);

    // 7. Create the initial administrator account
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('\n✅ Initial administrator account successfully created:');
    console.log(`   User ID   : ${newAdmin.id}`);
    console.log(`   Name      : ${newAdmin.name}`);
    console.log(`   Email     : ${newAdmin.email}`);
    console.log(`   Role      : ${newAdmin.role}`);
    console.log(`   Created At: ${newAdmin.createdAt.toISOString()}\n`);
    console.log('You can now log in at: http://localhost:5173/auth/admin\n');
  } catch (error) {
    console.error('\n❌ An unexpected error occurred during bootstrap:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
