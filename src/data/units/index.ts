import { UnitInfo, VocabWord } from '../types';
import { unit01 } from './unit-01';

// Initial state contains Unit 1 as free sample preview
let currentUnits: UnitInfo[] = [unit01];
let listeners: Array<() => void> = [];

export const allUnits: UnitInfo[] = currentUnits;

/**
 * Updates the in-memory authorized units after fetching from protected API
 */
export const setAuthorizedUnits = (units: UnitInfo[]): void => {
  if (Array.isArray(units) && units.length > 0) {
    currentUnits = units;
  } else {
    currentUnits = [unit01];
  }
  // keep allUnits reference synchronized in case of direct reference
  allUnits.length = 0;
  allUnits.push(...currentUnits);
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in units change listener:', e);
    }
  });
};

/**
 * Subscribe to changes when new units are unlocked/loaded
 */
export const subscribeUnitsChange = (listener: () => void): (() => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const getAllUnits = (): UnitInfo[] => {
  return currentUnits;
};

export const getUnitById = (id: number): UnitInfo | undefined => {
  return currentUnits.find(u => u.id === id);
};

export const getWordsByUnit = (unitId: number): VocabWord[] => {
  const unit = currentUnits.find(u => u.id === unitId);
  return unit ? unit.words : [];
};

export const getAllWords = (): VocabWord[] => {
  return currentUnits.flatMap(u => u.words);
};

export const getWordById = (wordId: string): VocabWord | undefined => {
  for (const u of currentUnits) {
    const found = u.words.find(w => w.id === wordId);
    if (found) return found;
  }
  return undefined;
};

export const getTotalWordCount = (): number => {
  return currentUnits.reduce((acc, u) => acc + u.words.length, 0);
};

export const isFullCurriculumUnlocked = (): boolean => {
  return currentUnits.length > 1;
};
