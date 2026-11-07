import { useState, useEffect, useCallback } from 'react';
import { offlineDatabaseCache } from '../utils/offlineDatabaseCache';
import { setAuthorizedUnits } from '../data/units';
import { getClientDeviceId, getCanvasFingerprintHash } from '../utils/deviceFingerprint';
import { storage } from '../utils/storage';

export interface LicenseSessionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  expiresAt?: number;
  daysLeft?: number;
  isLifetime?: boolean;
  keyMasked?: string;
  keyPlaintext?: string;
  customerName?: string;
  error?: string | null;
}

const USER_TOKEN_KEY = 'bonolota_user_token';

export function collectClientBrowserMetadata() {
  if (typeof window === 'undefined') return {};
  try {
    const nav = window.navigator as any;
    const screen = window.screen;
    const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;

    return {
      screenResolution: screen ? `${screen.width}x${screen.height}` : undefined,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen?.colorDepth || 24,
      language: nav?.languages ? nav.languages.join(', ') : (nav?.language || undefined),
      timezone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || undefined,
      timezoneOffset: `UTC${new Date().getTimezoneOffset() <= 0 ? '+' : '-'}${Math.abs(Math.floor(new Date().getTimezoneOffset() / 60))}:00`,
      touchSupport: Boolean('ontouchstart' in window || (nav?.maxTouchPoints && nav.maxTouchPoints > 0)),
      cpuCores: nav?.hardwareConcurrency || undefined,
      deviceMemoryGb: nav?.deviceMemory || undefined,
      networkType: connection?.effectiveType || connection?.type || undefined,
      platform: nav?.userAgentData?.platform || nav?.platform || undefined,
      onlineStatus: nav?.onLine !== false,
      canvasFingerprintHash: getCanvasFingerprintHash(),
    };
  } catch {
    return {};
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(USER_TOKEN_KEY) : null;
  const deviceId = getClientDeviceId();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-device-id': deviceId,
  };
}

export function useLicenseAuth() {
  const [state, setState] = useState<LicenseSessionState>({
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const loadUnitsFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/content/units', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.units && Array.isArray(data.units)) {
          offlineDatabaseCache.syncAuthorizedUnits(data.units);
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch units from API, trying offline cache:', e);
    }
    return false;
  }, []);

  const syncProgressToServer = useCallback(async () => {
    try {
      const stats = storage.getLearningStats();
      await fetch('/api/auth/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ ...stats, clientMetadata: collectClientBrowserMetadata() }),
      });
    } catch {
      // Ignore network errors
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await fetch('/api/auth/session', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.authenticated) {
        // Load units from API
        await loadUnitsFromApi();
        if (data.keyPlaintext || data.keyMasked) {
          localStorage.setItem('bonolota_user_key', data.keyPlaintext || data.keyMasked);
        }
        setState({
          isLoading: false,
          isAuthenticated: true,
          expiresAt: data.expiresAt,
          daysLeft: data.daysLeft,
          isLifetime: Boolean(data.isLifetime || (data.daysLeft && data.daysLeft > 3650)),
          keyMasked: data.keyMasked,
          keyPlaintext: data.keyPlaintext,
          customerName: data.customerName,
          error: null,
        });
        // Sync streak and learning stats to server
        syncProgressToServer();
      } else {
        // Not authenticated
        localStorage.removeItem(USER_TOKEN_KEY);
        localStorage.removeItem('bonolota_user_key');
        setState({
          isLoading: false,
          isAuthenticated: false,
          expiresAt: undefined,
          daysLeft: undefined,
          error: null,
        });
      }
    } catch {
      setState({
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, [loadUnitsFromApi, syncProgressToServer]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const activateKey = async (key: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ key, name, deviceId: getClientDeviceId(), clientMetadata: collectClientBrowserMetadata() }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const token = data.token || data.sessionToken;
        if (token) {
          localStorage.setItem(USER_TOKEN_KEY, token);
        }
        localStorage.setItem('bonolota_user_key', data.keyPlaintext || data.maskedKey || key);
        await loadUnitsFromApi();
        setState({
          isLoading: false,
          isAuthenticated: true,
          expiresAt: data.expiresAt,
          daysLeft: data.daysLeft,
          isLifetime: Boolean(data.isLifetime || (data.daysLeft && data.daysLeft > 3650)),
          keyMasked: data.maskedKey,
          keyPlaintext: data.keyPlaintext,
          customerName: data.customerName || name,
          error: null,
        });
        return { success: true, message: data.message };
      } else {
        const errMessage = data.message || 'অ্যাক্টিভেশন সম্পন্ন করা যায়নি।';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errMessage,
        }));
        return { success: false, message: errMessage };
      }
    } catch {
      const errMessage = 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হচ্ছে না। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errMessage,
      }));
      return { success: false, message: errMessage };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch {
      // Ignore
    }
    localStorage.removeItem(USER_TOKEN_KEY);
    offlineDatabaseCache.clear();
    setAuthorizedUnits([]);
    setState({
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  };

  return {
    ...state,
    activateKey,
    logout,
    checkSession,
    syncProgressToServer,
    logStudentAction: async (actionType: string, details: string, activeSection?: string) => {
      try {
        await fetch('/api/auth/action-ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          credentials: 'include',
          body: JSON.stringify({ actionType, details, activeSection }),
        });
      } catch {
        // Non-blocking ping
      }
    },
  };
}
