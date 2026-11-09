import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { hashSessionToken } from './crypto';
import { LicenseRecord, UserSessionData, AdminSessionData } from './types';

export const USER_COOKIE_NAME = 'bonolota_user_session';
export const ADMIN_COOKIE_NAME = 'bonolota_admin_session';
export const GUEST_COOKIE_NAME = 'bonolota_guest_id';

export interface AuthenticatedUserRequest extends Request {
  license?: LicenseRecord;
  userSession?: UserSessionData;
  isGuest?: boolean;
  guestId?: string;
  supportIdentifier?: string;
}

export interface AuthenticatedAdminRequest extends Request {
  adminSession?: AdminSessionData;
}

export function getCookieOptions(req?: Request) {
  const isProd = process.env.NODE_ENV === 'production';
  const isHttps = req ? (req.secure || req.headers['x-forwarded-proto'] === 'https') : isProd;
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ('none' as const) : ('lax' as const),
    path: '/',
    partitioned: isHttps,
  };
}

/**
 * Middleware: Requires a valid, unexpired, bound customer license session
 */
export async function requireCustomerAuth(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME];
    const headerToken = req.headers['x-session-token'];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16) 
      ? cookieToken 
      : (bearerToken && bearerToken.length >= 16) 
        ? bearerToken 
        : (typeof headerToken === 'string' && headerToken.length >= 16) 
          ? headerToken 
          : null;

    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({ ok: false, error: 'NO_SESSION', message: 'No active session found. Please enter your access key.' });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    if (!sessionHash) {
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'INVALID_TOKEN', message: 'Malformed session token.' });
      return;
    }

    const sessionData = await storage.getUserSession(sessionHash);

    if (!sessionData) {
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'SESSION_EXPIRED', message: 'Session expired or invalidated. Please re-activate.' });
      return;
    }

    const now = Date.now();
    if (now > sessionData.expiresAt) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'SUBSCRIPTION_EXPIRED', message: 'Subscription has expired.' });
      return;
    }

    const license = await storage.getLicenseById(sessionData.licenseId);
    if (!license) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'LICENSE_NOT_FOUND', message: 'License record not found.' });
      return;
    }

    // Verify license status
    if (license.status === 'revoked') {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(403).json({ ok: false, error: 'LICENSE_REVOKED', message: 'This license has been permanently revoked.' });
      return;
    }

    if (license.status === 'suspended') {
      res.status(403).json({ ok: false, error: 'LICENSE_SUSPENDED', message: 'This license is temporarily suspended. Contact support.' });
      return;
    }

    // Verify subscription expiry (fixed at creation time)
    if (now > license.expiresAt) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(403).json({ ok: false, error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription period has ended.' });
      return;
    }

    // Verify browser binding
    if (!license.browserBound || license.currentSessionHash !== sessionHash) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.status(403).json({
        ok: false,
        error: 'BINDING_INVALID',
        message: 'Browser binding is no longer valid. If you switched browsers or devices, please request a binding reset.',
      });
      return;
    }

    // Periodic activity touch (update lastActiveAt if > 5 minutes since last update)
    if (!license.lastActiveAt || now - license.lastActiveAt > 5 * 60 * 1000) {
      storage.updateLicense(license.id, { lastActiveAt: now }).catch(() => {});
    }

    req.license = license;
    req.userSession = sessionData;
    next();
  } catch (error) {
    console.error('[requireCustomerAuth] Error validating customer session:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'An error occurred while validating license.' });
  }
}

/**
 * Middleware: Flexible Customer OR Guest Support Session
 * Allows active students (with license) and visitors/unauthenticated students to reach support 1:1 safely.
 */
export async function requireSupportUserSession(
  req: AuthenticatedUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME];
    const headerToken = req.headers['x-session-token'];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16) 
      ? cookieToken 
      : (bearerToken && bearerToken.length >= 16) 
        ? bearerToken 
        : (typeof headerToken === 'string' && headerToken.length >= 16) 
          ? headerToken 
          : null;

    if (rawToken && typeof rawToken === 'string') {
      const sessionHash = hashSessionToken(rawToken);
      if (sessionHash) {
        const sessionData = await storage.getUserSession(sessionHash);
        if (sessionData && Date.now() <= sessionData.expiresAt) {
          const license = await storage.getLicenseById(sessionData.licenseId);
          if (license && license.status !== 'revoked') {
            req.license = license;
            req.userSession = sessionData;
            req.supportIdentifier = license.id;
            next();
            return;
          }
        }
      }
    }

    // Check if x-access-key was provided
    const headerKey = req.headers['x-access-key'];
    if (typeof headerKey === 'string' && headerKey.trim().length >= 8) {
      const cleanKey = headerKey.trim().toUpperCase();
      const allLicenses = await storage.listLicenses();
      const matched = allLicenses.find(l => 
        (l.plaintextKey && l.plaintextKey.toUpperCase() === cleanKey) || 
        (l.keyMasked && l.keyMasked.toUpperCase() === cleanKey)
      );
      if (matched && matched.status !== 'revoked') {
        req.license = matched;
        req.supportIdentifier = matched.id;
        next();
        return;
      }
    }

    // Fallback: Guest support session based on persistent guest cookie or client device ID
    const clientDeviceId = (typeof req.headers['x-device-id'] === 'string' && req.headers['x-device-id'].trim().length > 0)
      ? req.headers['x-device-id'].trim()
      : null;
    const cookieGuestId = req.cookies?.[GUEST_COOKIE_NAME];
    
    let guestId = cookieGuestId || clientDeviceId;
    if (!guestId || typeof guestId !== 'string' || guestId.length < 6) {
      guestId = `gst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      res.cookie(GUEST_COOKIE_NAME, guestId, {
        ...getCookieOptions(req),
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year persistence for guest support thread
      });
    }

    req.isGuest = true;
    req.guestId = guestId;
    req.supportIdentifier = `guest_${guestId}`;
    next();
  } catch (error) {
    console.error('[requireSupportUserSession] Error in support session handler:', error);
    const fallbackId = `gst_${Date.now().toString(36)}`;
    req.isGuest = true;
    req.guestId = fallbackId;
    req.supportIdentifier = `guest_${fallbackId}`;
    next();
  }
}

/**
 * Middleware: Requires a valid administrator session
 */
export async function requireAdminAuth(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME];
    const headerToken = req.headers['x-admin-token'];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16)
      ? cookieToken
      : (bearerToken && bearerToken.length >= 16)
        ? bearerToken
        : (typeof headerToken === 'string' && headerToken.length >= 16)
          ? headerToken
          : null;

    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({ ok: false, error: 'ADMIN_UNAUTHORIZED', message: 'Admin authentication required.' });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    if (!sessionHash) {
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'INVALID_TOKEN', message: 'Malformed admin token.' });
      return;
    }

    const adminSession = await storage.getAdminSession(sessionHash);

    if (!adminSession) {
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'ADMIN_SESSION_EXPIRED', message: 'Admin session expired. Please log in again.' });
      return;
    }

    if (Date.now() > adminSession.expiresAt) {
      await storage.deleteAdminSession(sessionHash);
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
      res.status(401).json({ ok: false, error: 'ADMIN_SESSION_EXPIRED', message: 'Admin session expired.' });
      return;
    }

    req.adminSession = adminSession;
    next();
  } catch (error) {
    console.error('[requireAdminAuth] Error validating admin session:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Admin verification error.' });
  }
}
