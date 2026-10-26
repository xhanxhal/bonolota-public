import { useState, useEffect, useCallback } from 'react';
import { offlineDatabaseCache } from '../utils/offlineDatabaseCache';
import { setAuthorizedUnits } from '../data/units';

export interface LicenseSessionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  expiresAt?: number;
  daysLeft?: number;
  keyMasked?: string;
  error?: string | null;
}

export function useLicenseAuth() {
  const [state, setState] = useState<LicenseSessionState>({
    isLoading: true,
    isAuthenticated: false,
    isDemoMode: false,
    error: null,
  });

  const loadUnitsFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/content/units', {
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

  const checkSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.authenticated) {
        // Load units from API
        await loadUnitsFromApi();
        setState({
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: false,
          expiresAt: data.expiresAt,
          daysLeft: data.daysLeft,
          keyMasked: data.keyMasked,
          error: null,
        });
      } else {
        // Not authenticated
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          expiresAt: undefined,
          daysLeft: undefined,
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
      }));
    }
  }, [loadUnitsFromApi]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const activateKey = async (key: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        await loadUnitsFromApi();
        setState({
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: false,
          expiresAt: data.expiresAt,
          daysLeft: data.daysLeft,
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
    } catch (err) {
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
        credentials: 'include',
      });
    } catch {
      // Ignore
    }
    offlineDatabaseCache.clear();
    setAuthorizedUnits([]); // reset to demo Unit 1
    setState({
      isLoading: false,
      isAuthenticated: false,
      isDemoMode: false,
      error: null,
    });
  };

  const enableDemoMode = () => {
    setState(prev => ({
      ...prev,
      isDemoMode: true,
    }));
  };

  const exitDemoMode = () => {
    setState(prev => ({
      ...prev,
      isDemoMode: false,
    }));
  };

  return {
    ...state,
    activateKey,
    logout,
    checkSession,
    enableDemoMode,
    exitDemoMode,
  };
}
