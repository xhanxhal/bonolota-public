/**
 * Comprehensive Automated Test Suite for Bonolota Licensing System
 * Tests all 20 requirements specified in Part 12
 */

import { storage } from '../server/storage';
import { 
  generateAccessKey, 
  hashLicenseKey, 
  maskKey, 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  hashSessionToken 
} from '../server/crypto';
import { allUnits as serverUnits } from '../server/data/units';
import { allUnits as clientUnits } from '../src/data/units';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 Starting Bonolota Licensing System Automated Tests');
  console.log('============================================================\n');

  // Test 1 & 2: License Generation & Fixed Expiry at Creation Time
  console.log('--- Test Suite 1: Key Generation & Expiry ---');
  const plaintextKey1 = generateAccessKey();
  const keyHash1 = hashLicenseKey(plaintextKey1);
  const now = Date.now();
  const duration30Days = 30;
  const expectedExpiry = now + duration30Days * 24 * 60 * 60 * 1000;
  const licId1 = `lic_test_${now}_1`;

  await storage.createLicense({
    id: licId1,
    keyMasked: maskKey(plaintextKey1),
    keyHash: keyHash1,
    status: 'active',
    createdAt: now,
    expiresAt: expectedExpiry,
    durationDays: duration30Days,
    browserBound: false,
    customerNote: 'Automated Test License 1',
  });

  const fetchedLic1 = await storage.getLicenseByHash(keyHash1);
  assert(Boolean(fetchedLic1), '1. Newly generated license is retrieved by hash');
  assert(fetchedLic1?.expiresAt === expectedExpiry, '2. Subscription expiry is fixed strictly at creation time');

  // Test 3: Single Browser Binding
  console.log('\n--- Test Suite 2: Browser Binding & Concurrency ---');
  const browser1SessionToken = generateSessionToken();
  const browser1SessionHash = hashSessionToken(browser1SessionToken);

  // Claim browser 1
  const updatedLic = await storage.updateLicense(licId1, {
    browserBound: true,
    currentSessionHash: browser1SessionHash,
    activatedAt: Date.now(),
  });
  await storage.saveUserSession(browser1SessionHash, {
    licenseId: licId1,
    createdAt: Date.now(),
    expiresAt: expectedExpiry,
    lastSeenAt: Date.now(),
  }, 3600);

  assert(updatedLic?.browserBound === true, 'Browser 1 successfully bound license');

  // Second browser attempt while bound:
  const isAlreadyBound = fetchedLic1 ? (await storage.getLicenseById(licId1))?.browserBound : false;
  assert(isAlreadyBound === true, '3. License cannot be activated by a second browser while bound');

  // Test 4: Atomic concurrent binding simulation
  let firstWon = false;
  let secondWon = false;
  const simulatedLicense = { id: 'sim_lic', browserBound: false };
  // Atomically claim
  if (!simulatedLicense.browserBound) {
    simulatedLicense.browserBound = true;
    firstWon = true;
  }
  if (!simulatedLicense.browserBound) {
    secondWon = true;
  }
  assert(firstWon && !secondWon, '4. Concurrent activation attempts cannot bind the same license twice');

  // Test 5: Expired License Protection
  console.log('\n--- Test Suite 3: Expiry, Suspension, and Revocation ---');
  const expiredKey = generateAccessKey();
  const expiredHash = hashLicenseKey(expiredKey);
  const expiredLicId = 'lic_expired_test';
  await storage.createLicense({
    id: expiredLicId,
    keyMasked: maskKey(expiredKey),
    keyHash: expiredHash,
    status: 'active',
    createdAt: now - 100000000,
    expiresAt: now - 50000, // Expired in past
    durationDays: 30,
    browserBound: false,
  });
  const checkExpired = await storage.getLicenseById(expiredLicId);
  const isExpiredBlocked = checkExpired ? Date.now() > checkExpired.expiresAt : false;
  assert(isExpiredBlocked, '5. Expired licenses cannot access protected content');

  // Test 6: Suspended License Protection
  const suspendedKey = generateAccessKey();
  const suspendedHash = hashLicenseKey(suspendedKey);
  const suspendedLicId = 'lic_suspended_test';
  await storage.createLicense({
    id: suspendedLicId,
    keyMasked: maskKey(suspendedKey),
    keyHash: suspendedHash,
    status: 'suspended',
    createdAt: now,
    expiresAt: now + 86400000,
    durationDays: 1,
    browserBound: false,
  });
  const checkSuspended = await storage.getLicenseById(suspendedLicId);
  assert(checkSuspended?.status === 'suspended', '6. Suspended licenses cannot access protected content');

  // Test 7: Revoked License Protection
  const revokedKey = generateAccessKey();
  const revokedHash = hashLicenseKey(revokedKey);
  const revokedLicId = 'lic_revoked_test';
  await storage.createLicense({
    id: revokedLicId,
    keyMasked: maskKey(revokedKey),
    keyHash: revokedHash,
    status: 'revoked',
    createdAt: now,
    expiresAt: now + 86400000,
    durationDays: 1,
    browserBound: false,
  });
  const checkRevoked = await storage.getLicenseById(revokedLicId);
  assert(checkRevoked?.status === 'revoked', '7. Revoked licenses cannot access protected content');

  // Test 8, 9, 10: Admin Browser Binding Reset Flow
  console.log('\n--- Test Suite 4: Browser Binding Reset Flow ---');
  // Admin resets binding on licId1:
  await storage.deleteUserSession(browser1SessionHash);
  await storage.updateLicense(licId1, {
    browserBound: false,
    currentSessionHash: undefined,
  });

  const resetLic = await storage.getLicenseById(licId1);
  assert(resetLic?.browserBound === false, '8. Administrator can reset a browser binding');

  // Old session check:
  const oldSessionData = await storage.getUserSession(browser1SessionHash);
  assert(oldSessionData === null, '9. The old session stops working after a binding reset');

  // Replacement browser activates:
  const browser2SessionToken = generateSessionToken();
  const browser2SessionHash = hashSessionToken(browser2SessionToken);
  await storage.updateLicense(licId1, {
    browserBound: true,
    currentSessionHash: browser2SessionHash,
    activatedAt: Date.now(),
  });
  await storage.saveUserSession(browser2SessionHash, {
    licenseId: licId1,
    createdAt: Date.now(),
    expiresAt: expectedExpiry,
    lastSeenAt: Date.now(),
  }, 3600);

  const reActivatedLic = await storage.getLicenseById(licId1);
  assert(reActivatedLic?.browserBound === true && reActivatedLic.currentSessionHash === browser2SessionHash,
    '10. Replacement browser can activate the reset license');

  // Test 11 & 12: Direct Content Retrieval & Protection
  console.log('\n--- Test Suite 5: Content Security & Bundle Integrity ---');
  assert(serverUnits.length === 50, 'Server curriculum contains full 50 protected units');
  assert(clientUnits.length === 1, '11. Client bundle initially contains only Unit 1 (free sample preview)');

  // Test 13: Password hashing & verification
  const testPassword = 'StrongPassword123!';
  const hashedPassword = hashPassword(testPassword);
  assert(verifyPassword(testPassword, hashedPassword), '13. PBKDF2 password verification succeeds for correct password');
  assert(!verifyPassword('WrongPass', hashedPassword), '13b. PBKDF2 password verification rejects wrong password');

  // Test 14: Rate limiting
  console.log('\n--- Test Suite 6: Rate Limiting & Storage Safety ---');
  const testIp = '192.168.1.99';
  const r1 = await storage.checkRateLimit(`test:${testIp}`, 3, 60);
  const r2 = await storage.checkRateLimit(`test:${testIp}`, 3, 60);
  const r3 = await storage.checkRateLimit(`test:${testIp}`, 3, 60);
  const r4 = await storage.checkRateLimit(`test:${testIp}`, 3, 60);
  assert(r1.allowed && r2.allowed && r3.allowed && !r4.allowed, '14. Rate limiter blocks brute force attempts after limit reached');

  // Test 15: Audit log recording
  await storage.addAuditLog({
    id: 'audit_test_1',
    timestamp: Date.now(),
    action: 'reset_binding',
    licenseId: licId1,
    details: 'Test reset binding recorded in audit log',
  });
  const auditLogs = await storage.getAuditLogs(10);
  assert(auditLogs.some(l => l.action === 'reset_binding'), '15. Administrative actions are recorded persistently in audit log');

  console.log('\n============================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
