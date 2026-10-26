#!/usr/bin/env node

/**
 * Bonolota Admin Security Credentials Generator
 * 
 * Usage:
 *   node scripts/generate_admin_hash.js "YourStrongPassword"
 */

const crypto = require('crypto');

const password = process.argv[2];

if (!password) {
  console.log('\n❌ Error: Please provide a password as an argument.\n');
  console.log('Usage:');
  console.log('  node scripts/generate_admin_hash.js "MySecurePassword2026!"\n');
  process.exit(1);
}

// 1. Generate PBKDF2 Password Hash
const salt = crypto.randomBytes(16).toString('hex');
const iterations = 100000;
const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
const passwordHash = `pbkdf2:${iterations}:${salt}:${hash}`;

// 2. Generate cryptographically random secrets
const adminSessionSecret = crypto.randomBytes(32).toString('hex');
const licensePepper = crypto.randomBytes(32).toString('hex');
const adminRouteSecret = `x-admin-${crypto.randomBytes(8).toString('hex')}`;

console.log('\n============================================================');
console.log('🔐 Bonolota Security Credentials Generated');
console.log('============================================================\n');
console.log('Copy these environment variables into your Vercel Project Settings:');
console.log('(Settings → Environment Variables → Add)\n');

console.log(`ADMIN_PASSWORD_HASH="${passwordHash}"`);
console.log(`ADMIN_SESSION_SECRET="${adminSessionSecret}"`);
console.log(`LICENSE_PEPPER="${licensePepper}"`);
console.log(`ADMIN_ROUTE_SECRET="${adminRouteSecret}"`);

console.log('\n------------------------------------------------------------');
console.log(`🔑 Your Private Admin Portal URL will be:`);
console.log(`https://<YOUR-VERCEL-DOMAIN>/${adminRouteSecret}`);
console.log('------------------------------------------------------------');
console.log(`🔒 Your Admin Password: ${password}`);
console.log('Keep this password and private URL safe!\n');
