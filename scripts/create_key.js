#!/usr/bin/env node

/**
 * Fast CLI Key Generator for Bonolota
 * 
 * Usage:
 *   node scripts/create_key.js [days] [customer_note]
 * Example:
 *   node scripts/create_key.js 30 "Tanvir - 017xxxxxxxx - bKash TrxID #8A92B1"
 */

import { storage } from '../server/storage';
import { generateAccessKey, hashLicenseKey, maskKey } from '../server/crypto';

async function main() {
  const args = process.argv.slice(2);
  const rawArg = (args[0] || '30').toLowerCase();
  const isLife = rawArg === 'lifetime' || rawArg === 'life' || rawArg === 'forever' || rawArg === '0';
  const days = isLife ? 36500 : parseInt(rawArg, 10);
  const note = args[1] || (isLife ? 'Lifetime Access' : 'Created via CLI');

  if (!isLife && (isNaN(days) || days <= 0)) {
    console.error('❌ Please provide a valid number of days (e.g. 30, 90, 180, 365, or "lifetime")');
    process.exit(1);
  }

  const plaintextKey = generateAccessKey();
  const keyHash = hashLicenseKey(plaintextKey);
  const masked = maskKey(plaintextKey);
  const now = Date.now();
  const expiresAt = now + (days * 24 * 60 * 60 * 1000);
  const licenseId = `lic_${now}_${Math.random().toString(36).substring(2, 7)}`;

  await storage.createLicense({
    id: licenseId,
    keyMasked: masked,
    keyHash,
    status: 'active',
    createdAt: now,
    expiresAt,
    durationDays: days,
    isLifetime: isLife,
    browserBound: false,
    customerNote: note,
  });

  console.log('\n============================================================');
  console.log('🎉 BONOLOTA ACCESS KEY GENERATED SUCCESSFULLY');
  console.log('============================================================\n');
  console.log(`🔑 Key (Send to Customer): \x1b[32m\x1b[1m${plaintextKey}\x1b[0m`);
  console.log(`⏱️ Duration: ${isLife ? '👑 আজীবন (Lifetime Access)' : `${days} Days`}`);
  console.log(`📅 Expires At: ${isLife ? '👑 আজীবন (Lifetime Access - Unlimited)' : new Date(expiresAt).toLocaleDateString()}`);
  console.log(`📝 Customer Note: ${note}`);
  console.log('\n============================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
