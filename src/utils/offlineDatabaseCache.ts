import { UnitInfo, VocabWord } from '../data/types';
import { getAllWords, getAllUnits, setAuthorizedUnits } from '../data/units';

const CACHE_KEY_PREFIX = 'bonolota_offline_vocab_';
const CACHE_METADATA_KEY = `${CACHE_KEY_PREFIX}metadata_v1`;
const CACHE_UNITS_KEY = `${CACHE_KEY_PREFIX}units_v1`;
const CACHE_WORDS_KEY = `${CACHE_KEY_PREFIX}words_v1`;
const CACHE_VERSION = '2.0.0';

export interface OfflineCacheMetadata {
  version: string;
  totalWords: number;
  totalUnits: number;
  lastCachedAt: string;
  isReady: boolean;
  sizeBytes: number;
}

export const offlineDatabaseCache = {
  /**
   * Initializes offline cache; if previously authenticated units are stored, loads them into memory
   */
  init(): OfflineCacheMetadata {
    if (typeof window === 'undefined') {
      return {
        version: CACHE_VERSION,
        totalWords: 0,
        totalUnits: 0,
        lastCachedAt: new Date().toISOString(),
        isReady: false,
        sizeBytes: 0,
      };
    }

    try {
      const cachedUnits = this.getCachedUnits();
      if (cachedUnits && cachedUnits.length > 1) {
        setAuthorizedUnits(cachedUnits);
      }
    } catch (e) {
      console.warn('Could not restore cached units on init:', e);
    }

    return this.getMetadata() || {
      version: CACHE_VERSION,
      totalWords: getAllWords().length,
      totalUnits: getAllUnits().length,
      lastCachedAt: new Date().toISOString(),
      isReady: true,
      sizeBytes: 0,
    };
  },

  /**
   * Refreshes local storage cache with current in-memory units
   */
  refreshCache(): OfflineCacheMetadata {
    return this.syncAuthorizedUnits(getAllUnits());
  },

  /**
   * Caches authorized units when received from the server
   */
  syncAuthorizedUnits(units: UnitInfo[]): OfflineCacheMetadata {
    if (typeof window === 'undefined' || !Array.isArray(units) || units.length === 0) {
      return {
        version: CACHE_VERSION,
        totalWords: 0,
        totalUnits: 0,
        lastCachedAt: new Date().toISOString(),
        isReady: false,
        sizeBytes: 0,
      };
    }

    try {
      setAuthorizedUnits(units);
      const words = units.flatMap(u => u.words);

      const unitsJson = JSON.stringify(units);
      const wordsJson = JSON.stringify(words);

      localStorage.setItem(CACHE_UNITS_KEY, unitsJson);
      localStorage.setItem(CACHE_WORDS_KEY, wordsJson);

      const sizeBytes = (unitsJson.length + wordsJson.length) * 2;

      const metadata: OfflineCacheMetadata = {
        version: CACHE_VERSION,
        totalWords: words.length,
        totalUnits: units.length,
        lastCachedAt: new Date().toISOString(),
        isReady: true,
        sizeBytes,
      };

      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
      return metadata;
    } catch (e) {
      console.warn('Failed to cache authorized units:', e);
      return {
        version: CACHE_VERSION,
        totalWords: getAllWords().length,
        totalUnits: getAllUnits().length,
        lastCachedAt: new Date().toISOString(),
        isReady: true,
        sizeBytes: 0,
      };
    }
  },

  getMetadata(): OfflineCacheMetadata | null {
    if (typeof window === 'undefined') return null;
    try {
      const meta = localStorage.getItem(CACHE_METADATA_KEY);
      return meta ? JSON.parse(meta) : null;
    } catch {
      return null;
    }
  },

  getCachedUnits(): UnitInfo[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(CACHE_UNITS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached units:', e);
    }
    return null;
  },

  getCachedWords(): VocabWord[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(CACHE_WORDS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached words:', e);
    }
    return null;
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CACHE_METADATA_KEY);
      localStorage.removeItem(CACHE_UNITS_KEY);
      localStorage.removeItem(CACHE_WORDS_KEY);
      setAuthorizedUnits([]); // reset to sample
    } catch {
      // Ignore
    }
  },
};
