import { BeginnerDictEntry } from './types';

export type { BeginnerDictEntry };

type DictRecord = Record<string, BeginnerDictEntry>;

let mergedMap: Map<string, BeginnerDictEntry> | null = null;
let preloadPromise: Promise<Map<string, BeginnerDictEntry>> | null = null;

const chunkCache: Partial<Record<'ad' | 'el' | 'mr' | 'sz', DictRecord>> = {};
const chunkPromises: Partial<Record<'ad' | 'el' | 'mr' | 'sz', Promise<DictRecord>>> = {};

function getChunkKey(word: string): 'ad' | 'el' | 'mr' | 'sz' {
  const c = word[0] || 'a';
  if (c <= 'd') return 'ad';
  if (c <= 'l') return 'el';
  if (c <= 'r') return 'mr';
  return 'sz';
}

async function loadChunk(key: 'ad' | 'el' | 'mr' | 'sz'): Promise<DictRecord> {
  const existing = chunkCache[key];
  if (existing) return existing;

  const pending = chunkPromises[key];
  if (pending) return pending;

  const promise = (async (): Promise<DictRecord> => {
    let record: DictRecord;
    if (key === 'ad') {
      record = (await import('./dict-a-d')).DICT_A_D;
    } else if (key === 'el') {
      record = (await import('./dict-e-l')).DICT_E_L;
    } else if (key === 'mr') {
      record = (await import('./dict-m-r')).DICT_M_R;
    } else {
      record = (await import('./dict-s-z')).DICT_S_Z;
    }
    chunkCache[key] = record;
    return record;
  })();

  chunkPromises[key] = promise;
  return promise;
}

export function normalizeWordCandidates(rawToken: string): string[] {
  const cleaned = rawToken
    .trim()
    .replace(/[’']/g, "'")
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
    .toLowerCase();

  if (!cleaned) return [];

  const candidates: string[] = [];
  const push = (w: string) => {
    if (w && !candidates.includes(w)) candidates.push(w);
  };

  push(cleaned);
  if (cleaned.endsWith("'s")) {
    push(cleaned.slice(0, -2));
  }
  if (cleaned.endsWith("'")) {
    push(cleaned.slice(0, -1));
  }
  if (cleaned.includes('-')) {
    for (const part of cleaned.split('-')) {
      push(part);
    }
  }
  if (cleaned.length > 3 && cleaned.endsWith('s')) {
    push(cleaned.slice(0, -1));
  }
  if (cleaned.length > 4 && cleaned.endsWith('es')) {
    push(cleaned.slice(0, -2));
  }
  if (cleaned.length > 4 && cleaned.endsWith('ed')) {
    push(cleaned.slice(0, -2));
    push(cleaned.slice(0, -1));
  }
  if (cleaned.length > 5 && cleaned.endsWith('ing')) {
    push(cleaned.slice(0, -3));
    push(cleaned.slice(0, -3) + 'e');
  }

  return candidates;
}

/**
 * Preload all 4 alphabetical static dictionary chunks in the background so
 * subsequent word clicks in Beginner Mode resolve synchronously in 0ms.
 */
export function preloadBeginnerDictionary(): Promise<Map<string, BeginnerDictEntry>> {
  if (mergedMap) return Promise.resolve(mergedMap);
  if (preloadPromise) return preloadPromise;

  preloadPromise = Promise.all([
    loadChunk('ad'),
    loadChunk('el'),
    loadChunk('mr'),
    loadChunk('sz'),
  ]).then(([ad, el, mr, sz]) => {
    const map = new Map<string, BeginnerDictEntry>();
    for (const record of [ad, el, mr, sz]) {
      for (const [k, v] of Object.entries(record)) {
        map.set(k, v);
      }
    }
    mergedMap = map;
    return map;
  });

  return preloadPromise;
}

/**
 * Synchronous 0ms lookup if the dictionary (or the target alphabetical chunk) is already in memory.
 */
export function getBeginnerWordIfLoaded(rawToken: string): BeginnerDictEntry | null {
  const candidates = normalizeWordCandidates(rawToken);
  if (candidates.length === 0) return null;

  if (mergedMap) {
    for (const c of candidates) {
      const hit = mergedMap.get(c);
      if (hit) return hit;
    }
    return null;
  }

  for (const c of candidates) {
    const chunk = chunkCache[getChunkKey(c)];
    if (chunk && chunk[c]) {
      return chunk[c];
    }
  }
  return null;
}

/**
 * Async lookup that loads only the needed alphabetical chunk (or uses the preloaded map)
 * and resolves locally with zero external API calls.
 */
export async function lookupBeginnerDictionaryWord(rawToken: string): Promise<BeginnerDictEntry | null> {
  const syncHit = getBeginnerWordIfLoaded(rawToken);
  if (syncHit) return syncHit;

  const candidates = normalizeWordCandidates(rawToken);
  if (candidates.length === 0) return null;

  const primaryChunkKey = getChunkKey(candidates[0]);
  const primaryChunk = await loadChunk(primaryChunkKey);
  for (const c of candidates) {
    if (getChunkKey(c) === primaryChunkKey && primaryChunk[c]) {
      return primaryChunk[c];
    }
  }

  // Fallback across all chunks if candidate crosses letter buckets
  const map = await preloadBeginnerDictionary();
  for (const c of candidates) {
    const hit = map.get(c);
    if (hit) return hit;
  }

  return null;
}
