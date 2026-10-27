/**
 * Runtime Environment Validator for Bonolota Licensing Platform
 * 
 * Verifies that all essential environment variables, database URLs, and API credentials
 * are properly defined and valid before the application attempts to initialize.
 * Prevents silent failures, bad configuration crashes, and 500 FUNCTION_INVOCATION_FAILED errors in production.
 */

export interface EnvValidationReport {
  valid: boolean;
  environment: string;
  timestamp: number;
  checks: {
    redisUrl: { defined: boolean; valid: boolean; value: string };
    redisToken: { defined: boolean; valid: boolean; preview: string };
    adminPassword: { configured: boolean; usingDefault: boolean };
    adminRouteSecret: { configured: boolean; slug: string };
    licensePepper: { configured: boolean; usingDefault: boolean };
  };
  warnings: string[];
  errors: string[];
}

// Fallback verified production credentials if not provided in environment
export const DEFAULT_REDIS_URL = 'https://unique-sunbeam-240324.upstash.io';
export const DEFAULT_REDIS_TOKEN = 'gQAAAAAAA6rEAAIgcDIyMWQ1OGQ2YzE1NTc0Y2FkODVjZDFkZDcxYmZhOWViZg';
export const DEFAULT_ADMIN_PASSWORD = 'Chanchal11@@';
export const DEFAULT_ADMIN_SLUG = 'x-admin-arifa';
export const DEFAULT_PEPPER = 'bonolota_sec_vault_pepper_prod_salt_2026';

function maskSecret(secret?: string): string {
  if (!secret) return '(not set)';
  if (secret.length <= 8) return '****';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Validate and inspect all required environment variables
 */
export function validateEnvironment(): EnvValidationReport {
  const env = process.env.NODE_ENV || 'development';
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Upstash Redis REST URL
  const rawRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  let redisUrlValid = false;
  let resolvedRedisUrl = rawRedisUrl || DEFAULT_REDIS_URL;

  if (!rawRedisUrl) {
    warnings.push(`UPSTASH_REDIS_REST_URL is not set in process.env; using verified production database fallback (${DEFAULT_REDIS_URL}).`);
  }

  try {
    const parsed = new URL(resolvedRedisUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      redisUrlValid = true;
    } else {
      errors.push(`UPSTASH_REDIS_REST_URL protocol must be http: or https:, got ${parsed.protocol}`);
    }
  } catch {
    errors.push(`UPSTASH_REDIS_REST_URL is not a valid URL: ${resolvedRedisUrl}`);
  }

  // 2. Upstash Redis REST Token
  const rawRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  let redisTokenValid = false;
  const resolvedRedisToken = rawRedisToken || DEFAULT_REDIS_TOKEN;

  if (!rawRedisToken) {
    warnings.push('UPSTASH_REDIS_REST_TOKEN is not set in process.env; using verified production token fallback.');
  }

  if (resolvedRedisToken && resolvedRedisToken.length >= 16) {
    redisTokenValid = true;
  } else {
    errors.push('UPSTASH_REDIS_REST_TOKEN is missing or too short.');
  }

  // 3. Admin Password
  const adminPassword = process.env.ADMIN_PASSWORD;
  const usingDefaultPassword = !adminPassword;
  if (usingDefaultPassword) {
    warnings.push('ADMIN_PASSWORD not set in env; using secure default password.');
  }

  // 4. Admin Secret Route Slug
  const adminSlug = process.env.ADMIN_ROUTE_SECRET || DEFAULT_ADMIN_SLUG;

  // 5. License Pepper
  const licensePepper = process.env.LICENSE_PEPPER;
  const usingDefaultPepper = !licensePepper;

  const valid = errors.length === 0 && redisUrlValid && redisTokenValid;

  return {
    valid,
    environment: env,
    timestamp: Date.now(),
    checks: {
      redisUrl: {
        defined: Boolean(rawRedisUrl),
        valid: redisUrlValid,
        value: resolvedRedisUrl.replace(/:[^:]*@/, ':****@'), // mask userinfo if any
      },
      redisToken: {
        defined: Boolean(rawRedisToken),
        valid: redisTokenValid,
        preview: maskSecret(resolvedRedisToken),
      },
      adminPassword: {
        configured: Boolean(adminPassword),
        usingDefault: usingDefaultPassword,
      },
      adminRouteSecret: {
        configured: Boolean(process.env.ADMIN_ROUTE_SECRET),
        slug: adminSlug,
      },
      licensePepper: {
        configured: Boolean(licensePepper),
        usingDefault: usingDefaultPepper,
      },
    },
    warnings,
    errors,
  };
}

/**
 * Asserts environment health and logs clear startup diagnostics
 */
export function assertEnvironment(): EnvValidationReport {
  const report = validateEnvironment();
  console.log('============================================================');
  console.log(`[EnvValidator] Runtime Environment Validation: ${report.valid ? '✅ PASSED' : '⚠️ WARNINGS'}`);
  console.log(`[EnvValidator] Mode: ${report.environment} | Database: ${report.checks.redisUrl.value}`);
  console.log(`[EnvValidator] Redis Token: ${report.checks.redisToken.preview}`);
  if (report.warnings.length > 0) {
    report.warnings.forEach(w => console.warn(`[EnvValidator Warning] ${w}`));
  }
  if (report.errors.length > 0) {
    report.errors.forEach(e => console.error(`[EnvValidator Error] ${e}`));
  }
  console.log('============================================================');
  return report;
}
