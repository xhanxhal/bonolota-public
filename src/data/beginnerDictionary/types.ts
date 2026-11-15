export interface BeginnerDictEntry {
  /** Part of speech */
  p: string;
  /** Multiple Bengali meanings */
  m: string;
  /** English definition */
  d: string;
  /** IPA phonetic if available */
  ph?: string;
  /** Synonyms if available */
  s?: string[];
  /** Antonyms if available */
  a?: string[];
}
