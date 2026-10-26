import { VocabWord, UnitInfo } from '../data/types';

// Bengali numeral conversion map
const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

/**
 * Converts Bengali digits to English digits
 */
export function bengaliToEnglishDigits(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d);
}

/**
 * Parses a search query to check if the user is looking for a specific unit number.
 * Supports: '5', '০৫', 'unit 5', 'unit-5', 'unit5', 'u5', 'u-5', 'ইউনিট ৫', 'ইউনিট-৫', 'দিন ৫', 'day 5', etc.
 */
export function parseUnitNumber(query: string): number | null {
  if (!query) return null;
  const normalized = bengaliToEnglishDigits(query.toLowerCase().trim());
  const match = normalized.match(/^(?:unit[-_\s]*|u[-_]?|ইউনিট[-_\s]*|day[-_\s]*|দিন[-_\s]*|#)?(\d{1,2})$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 50) return num;
  }
  return null;
}

/**
 * Calculates Damerau-Levenshtein distance between two strings.
 * Accounts for insertion, deletion, substitution, and adjacent transposition.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const d: number[][] = [];
  for (let i = 0; i <= la; i++) d[i] = [i];
  for (let j = 0; j <= lb; j++) d[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost  // substitution
      );
      // adjacent transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[la][lb];
}

/**
 * Extracts the consonant skeleton of an English word (strips vowels and non-letters).
 * E.g., 'trust' -> 'trst', 'credulity' -> 'crdlt', 'cadaverous' -> 'cdvrs'
 */
export function getConsonantSkeleton(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiouy]/g, '');
}

/**
 * Checks whether `sub` is a strict subsequence of `main` (preserving letter order).
 */
export function isSubsequence(sub: string, main: string): boolean {
  let i = 0;
  for (let j = 0; j < main.length && i < sub.length; j++) {
    if (sub[i] === main[j]) i++;
  }
  return i === sub.length;
}

export interface WordSearchResult {
  score: number;
  isFuzzy: boolean;
  matchReason:
    | 'exact'
    | 'prefix'
    | 'substring'
    | 'bn-exact'
    | 'bn-prefix'
    | 'bn-substring'
    | 'synonym-exact'
    | 'synonym-prefix'
    | 'synonym-sub'
    | 'consonant-skeleton'
    | 'skeleton-prefix'
    | 'edit-distance-1'
    | 'edit-distance-2'
    | 'prefix-typo'
    | 'subsequence'
    | 'bn-typo'
    | 'synonym-typo'
    | 'pronunciation'
    | 'example'
    | 'none';
}

/**
 * Calculates a multi-tier relevance score and fuzzy status for a vocabulary word.
 * Supports exact matching, prefix, substring, consonant skeleton (trst -> trust),
 * and Damerau-Levenshtein typo tolerance (turst, credulety, aberant).
 */
export function getWordSearchDetails(w: VocabWord, rawQuery: string): WordSearchResult {
  if (!rawQuery) return { score: 0, isFuzzy: false, matchReason: 'none' };
  const q = rawQuery.toLowerCase().trim();
  if (!q) return { score: 0, isFuzzy: false, matchReason: 'none' };

  const wordLower = (w.word || '').toLowerCase();
  const meaningLower = (w.banglaMeaning || '').toLowerCase();
  const pronLower = (w.pronunciation || '').toLowerCase();

  // Tier 1: Exact English word match
  if (wordLower === q) {
    return { score: 1000, isFuzzy: false, matchReason: 'exact' };
  }

  // Tier 2: English word starts with query
  if (wordLower.startsWith(q)) {
    return {
      score: 600 - Math.min(100, wordLower.length - q.length),
      isFuzzy: false,
      matchReason: 'prefix',
    };
  }

  // Tier 3: English word contains query as substring
  if (wordLower.includes(q)) {
    return {
      score: 400 - Math.min(100, wordLower.indexOf(q) * 5),
      isFuzzy: false,
      matchReason: 'substring',
    };
  }

  // Tier 4: Bengali meaning exact match
  if (meaningLower === q) {
    return { score: 500, isFuzzy: false, matchReason: 'bn-exact' };
  }

  // Tier 5: Bengali meaning starts with query
  if (meaningLower.startsWith(q)) {
    return { score: 350, isFuzzy: false, matchReason: 'bn-prefix' };
  }

  // Tier 6: Bengali meaning contains query
  if (meaningLower.includes(q)) {
    return { score: 250, isFuzzy: false, matchReason: 'bn-substring' };
  }

  // Tier 7: Synonyms exact/prefix/substring
  if (w.synonyms && Array.isArray(w.synonyms)) {
    for (const syn of w.synonyms) {
      const sLower = syn.toLowerCase();
      if (sLower === q) return { score: 220, isFuzzy: false, matchReason: 'synonym-exact' };
      if (sLower.startsWith(q)) return { score: 180, isFuzzy: false, matchReason: 'synonym-prefix' };
      if (sLower.includes(q)) return { score: 140, isFuzzy: false, matchReason: 'synonym-sub' };
    }
  }

  // Tier 8: Bengali typo tolerance (for common spelling slips like স/শ/ষ or missing matra)
  if (/[\u0980-\u09FF]/.test(q) && q.length >= 3) {
    const meaningWords = meaningLower.split(/[\s,।;:()\/\[\]-]+/);
    for (const mw of meaningWords) {
      if (mw.length >= 3 && Math.abs(mw.length - q.length) <= 1) {
        if (damerauLevenshtein(mw, q) === 1) {
          return { score: 230, isFuzzy: true, matchReason: 'bn-typo' };
        }
      }
    }
  }

  // Tier 9: English Typo Tolerance & Fuzzy Matching
  const qClean = q.replace(/[^a-z]/g, '');
  const wClean = wordLower.replace(/[^a-z]/g, '');

  // CRITICAL: First letter MUST match! A word starting with 'b' like 'book' must never match 'admonish' or 'alcove'.
  if (qClean.length >= 3 && wClean.length >= 3 && qClean[0] === wClean[0]) {
    // 9a. Consonant Skeleton Match (e.g. 'trst' -> 'trust', 'crdlt' -> 'credulity')
    // When someone types without vowels or uses consonants
    const qSkel = getConsonantSkeleton(qClean);
    const wSkel = getConsonantSkeleton(wClean);

    if (qSkel.length >= 3) {
      if (qSkel === wSkel) {
        return {
          score: 390 - Math.abs(wClean.length - qClean.length) * 10,
          isFuzzy: true,
          matchReason: 'consonant-skeleton',
        };
      }
      if (wSkel.startsWith(qSkel) && Math.abs(wClean.length - qClean.length) <= 3) {
        return {
          score: 270 - Math.min(40, (wSkel.length - qSkel.length) * 5),
          isFuzzy: true,
          matchReason: 'skeleton-prefix',
        };
      }
    }

    // 9b. Whole word Damerau-Levenshtein distance (typos, transpositions like 'turst', substitutions like 'trost')
    const dist = damerauLevenshtein(wClean, qClean);
    if (dist === 1) {
      return {
        score: 360,
        isFuzzy: true,
        matchReason: 'edit-distance-1',
      };
    }
    if (dist === 2 && qClean.length >= 5 && Math.abs(wClean.length - qClean.length) <= 2) {
      return {
        score: 240,
        isFuzzy: true,
        matchReason: 'edit-distance-2',
      };
    }

    // 9c. Fuzzy prefix for longer words (e.g., user typed 5+ chars of a longer word with 1 typo)
    if (qClean.length >= 5 && wClean.length > qClean.length && Math.abs(wClean.length - qClean.length) <= 4) {
      const prefix = wClean.slice(0, qClean.length);
      if (damerauLevenshtein(prefix, qClean) === 1) {
        return {
          score: 240,
          isFuzzy: true,
          matchReason: 'prefix-typo',
        };
      }
    }

    // 9d. Subsequence match (all letters of query present in correct order in target word)
    if (isSubsequence(qClean, wClean) && (wClean.length - qClean.length) <= 2) {
      return {
        score: 250 - (wClean.length - qClean.length) * 15,
        isFuzzy: true,
        matchReason: 'subsequence',
      };
    }
  }

  // Tier 10: Pronunciation match (query must be at least 3 chars)
  if (q.length >= 3 && pronLower.includes(q)) {
    return { score: 100, isFuzzy: false, matchReason: 'pronunciation' };
  }

  // NOTE: Example sentences are NOT searched. Searching words inside example sentences causes
  // unrelated vocabulary words (like 'Admonish' having 'books' in an example sentence) to appear.

  return { score: 0, isFuzzy: false, matchReason: 'none' };
}

/**
 * Calculates a multi-tier relevance score for a vocabulary word against a search query.
 * Higher score = higher relevance. Returns 0 if no match.
 */
export function getWordSearchScore(w: VocabWord, rawQuery: string): number {
  return getWordSearchDetails(w, rawQuery).score;
}

/**
 * Checks whether a match was made via fuzzy/typo-tolerant matching.
 */
export function isFuzzyWordMatch(w: VocabWord, rawQuery: string): boolean {
  return getWordSearchDetails(w, rawQuery).isFuzzy;
}

export interface ScoredWord {
  word: VocabWord;
  score: number;
  isFuzzy: boolean;
  matchReason: string;
}

/**
 * Filters and ranks words with scoring details.
 */
export function filterAndRankScoredWords(words: VocabWord[], rawQuery: string): ScoredWord[] {
  if (!rawQuery || !rawQuery.trim()) return [];
  const q = rawQuery.toLowerCase().trim();

  const scored: ScoredWord[] = [];
  for (const w of words) {
    const details = getWordSearchDetails(w, q);
    if (details.score > 0) {
      scored.push({
        word: w,
        score: details.score,
        isFuzzy: details.isFuzzy,
        matchReason: details.matchReason,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Filters and ranks words by search relevance score.
 */
export function filterAndRankWords(words: VocabWord[], rawQuery: string): VocabWord[] {
  if (!rawQuery || !rawQuery.trim()) return words;
  const scored = filterAndRankScoredWords(words, rawQuery);
  return scored.map((s) => s.word);
}

export interface UnitSearchResult {
  filteredUnits: UnitInfo[];
  matchedWords: VocabWord[];
  wordsByUnit: Record<number, VocabWord[]>;
  exactUnitNumber: number | null;
  hasFuzzyMatches: boolean;
}

/**
 * Intelligent search across units and words for Dashboard
 */
export function searchUnitsAndWords(allUnits: UnitInfo[], allWords: VocabWord[], rawQuery: string): UnitSearchResult {
  if (!rawQuery || !rawQuery.trim()) {
    return {
      filteredUnits: allUnits,
      matchedWords: [],
      wordsByUnit: {},
      exactUnitNumber: null,
      hasFuzzyMatches: false,
    };
  }

  const q = rawQuery.toLowerCase().trim();
  const unitNum = parseUnitNumber(q);

  // If query is an exact unit number (e.g. '5', 'ইউনিট ৫', 'unit 5')
  if (unitNum !== null) {
    const exactUnit = allUnits.find((u) => u.id === unitNum);
    const otherUnits = allUnits.filter((u) => u.id !== unitNum && (`${u.id}`.includes(`${unitNum}`) || `${u.number}`.includes(`${unitNum}`)));
    const matched = exactUnit ? [exactUnit, ...otherUnits] : otherUnits;

    return {
      filteredUnits: matched,
      matchedWords: exactUnit ? exactUnit.words : [],
      wordsByUnit: exactUnit ? { [exactUnit.id]: exactUnit.words } : {},
      exactUnitNumber: unitNum,
      hasFuzzyMatches: false,
    };
  }

  // Filter & score all words with fuzzy tolerance
  const scoredWords = filterAndRankScoredWords(allWords, q);
  const matchedWords = scoredWords.map((s) => s.word);
  const hasFuzzyMatches = scoredWords.some((s) => s.isFuzzy);

  const wordsByUnit: Record<number, VocabWord[]> = {};
  for (const w of matchedWords) {
    if (!wordsByUnit[w.unitId]) {
      wordsByUnit[w.unitId] = [];
    }
    wordsByUnit[w.unitId].push(w);
  }

  // Filter units by title, subtitle, description, or containing matched words
  const scoredUnits: { unit: UnitInfo; score: number }[] = [];

  for (const u of allUnits) {
    let unitScore = 0;
    const titleLower = (u.title || '').toLowerCase();
    const subLower = (u.subtitle || '').toLowerCase();
    const descLower = (u.description || '').toLowerCase();

    // Check direct unit text matches
    if (titleLower.includes(q)) unitScore += 300;
    if (subLower.includes(q)) unitScore += 200;
    if (descLower.includes(q)) unitScore += 100;

    // Check matched words in this unit
    const unitMatchedWords = wordsByUnit[u.id];
    if (unitMatchedWords && unitMatchedWords.length > 0) {
      // Sum the scores of the top words in this unit
      for (const w of unitMatchedWords.slice(0, 5)) {
        unitScore += getWordSearchScore(w, q);
      }
    }

    if (unitScore > 0) {
      scoredUnits.push({ unit: u, score: unitScore });
    }
  }

  scoredUnits.sort((a, b) => b.score - a.score);

  return {
    filteredUnits: scoredUnits.map((s) => s.unit),
    matchedWords,
    wordsByUnit,
    exactUnitNumber: null,
    hasFuzzyMatches,
  };
}
