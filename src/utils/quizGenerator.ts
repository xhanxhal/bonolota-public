import { VocabWord, QuizQuestion, QuizMode } from '../data/types';
import { getAllWords, getWordsByUnit } from '../data/units';

function generatePlausibleMisspellings(word: string): string[] {
  const variations = new Set<string>();
  const lower = word.toLowerCase();

  const replacements: [RegExp, string][] = [
    [/ll/g, 'l'],
    [/(?<!l)l(?!l)/g, 'll'],
    [/cc/g, 'c'],
    [/(?<!c)c(?=[eiy])/g, 's'],
    [/ss/g, 's'],
    [/(?<!s)s(?!s)/g, 'ss'],
    [/mm/g, 'm'],
    [/(?<!m)m(?!m)/g, 'mm'],
    [/pp/g, 'p'],
    [/(?<!p)p(?!p)/g, 'pp'],
    [/tt/g, 't'],
    [/(?<!t)t(?!t)/g, 'tt'],
    [/rr/g, 'r'],
    [/(?<!r)r(?!r)/g, 'rr'],
    [/nn/g, 'n'],
    [/(?<!n)n(?!n)/g, 'nn'],
    [/ie/g, 'ei'],
    [/ei/g, 'ie'],
    [/ance\b/g, 'ence'],
    [/ence\b/g, 'ance'],
    [/able\b/g, 'ible'],
    [/ible\b/g, 'able'],
    [/tion\b/g, 'sion'],
    [/sion\b/g, 'tion'],
    [/ous\b/g, 'us'],
    [/ant\b/g, 'ent'],
    [/ent\b/g, 'ant'],
    [/ery\b/g, 'ary'],
    [/ary\b/g, 'ery'],
    [/ph/g, 'f'],
    [/sc/g, 's'],
  ];

  for (const [pattern, repl] of replacements) {
    if (pattern.test(lower)) {
      const v = lower.replace(pattern, repl);
      if (v !== lower && v.length >= 3) {
        variations.add(v);
      }
    }
    if (variations.size >= 5) break;
  }

  // Transpose adjacent vowels
  for (let i = 0; i < lower.length - 1; i++) {
    const c1 = lower[i];
    const c2 = lower[i + 1];
    if (c1 !== c2 && 'aeiou'.includes(c1) && 'aeiou'.includes(c2)) {
      const swapped = lower.slice(0, i) + c2 + c1 + lower.slice(i + 2);
      if (swapped !== lower) variations.add(swapped);
    }
    if (variations.size >= 5) break;
  }

  // Single vowel alteration
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  for (let i = 1; i < lower.length - 1; i++) {
    if (variations.size >= 5) break;
    const ch = lower[i];
    if (vowels.includes(ch)) {
      const otherVowels = vowels.filter(v => v !== ch);
      const sub = otherVowels[i % otherVowels.length];
      const altered = lower.slice(0, i) + sub + lower.slice(i + 1);
      variations.add(altered);
    }
  }

  // Fallbacks if not enough variations
  if (variations.size < 3) {
    variations.add(lower.endsWith('e') ? lower.slice(0, -1) : lower + 'e');
    variations.add(lower + 's');
    variations.add(lower.length > 4 ? lower.slice(0, -1) : lower + 'y');
  }

  const isCapitalized = word[0] === word[0].toUpperCase();
  const list = Array.from(variations)
    .filter(v => v.toLowerCase() !== lower)
    .slice(0, 3)
    .map(v => isCapitalized ? v.charAt(0).toUpperCase() + v.slice(1) : v);

  return list;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getEligibleWordPool(
  unitIdOrIds: number | number[],
  selectedWordIds?: string[]
): VocabWord[] {
  let pool: VocabWord[] = [];
  if (Array.isArray(unitIdOrIds)) {
    if (unitIdOrIds.length === 0 || unitIdOrIds.includes(0)) {
      pool = getAllWords();
    } else {
      const set = new Set(unitIdOrIds);
      pool = getAllWords().filter(w => set.has(w.unitId));
    }
  } else {
    pool = unitIdOrIds === 0 ? getAllWords() : getWordsByUnit(unitIdOrIds);
  }

  if (selectedWordIds && selectedWordIds.length > 0) {
    return pool.filter(w => selectedWordIds.includes(w.id));
  }
  return pool;
}

export function generateQuizQuestions(
  unitIdOrIds: number | number[],
  mode: QuizMode,
  count?: number | null,
  selectedWordIds?: string[]
): QuizQuestion[] {
  const pool = getEligibleWordPool(unitIdOrIds);
  const eligibleWords = selectedWordIds && selectedWordIds.length > 0
    ? pool.filter(w => selectedWordIds.includes(w.id))
    : pool;

  if (eligibleWords.length === 0) return [];

  // If count is not specified or 0, use ALL available words from the selected units
  const effectiveCount = (count !== undefined && count !== null && count > 0)
    ? Math.min(count, eligibleWords.length)
    : eligibleWords.length;

  const shuffledTargets = shuffleArray(eligibleWords).slice(0, effectiveCount);
  const allGlobalWords = getAllWords();
  const questions: QuizQuestion[] = [];

  shuffledTargets.forEach((target, index) => {
    // Determine actual mode if mixed
    let currentMode = mode;
    if (mode === 'mixed') {
      // Exclude spelling from mixed quiz as requested
      const modes: QuizMode[] = ['en-to-bn', 'bn-to-en', 'fill-blank', 'context'];
      currentMode = modes[index % modes.length];
    }

    // Pick 3 distractors from the pool (or global fallback if pool is too small)
    let candidateDistractors = pool.filter(w => w.id !== target.id);
    if (candidateDistractors.length < 3) {
      candidateDistractors = allGlobalWords.filter(w => w.id !== target.id);
    }

    // Prioritize same part of speech for challenging, clean options
    const samePos = candidateDistractors.filter(w => w.partOfSpeech === target.partOfSpeech);
    const otherPos = candidateDistractors.filter(w => w.partOfSpeech !== target.partOfSpeech);
    
    const distractorPool = shuffleArray([...samePos, ...otherPos]);
    const chosenDistractors = distractorPool.slice(0, 3);

    const questionId = `q_${target.id}_${index}`;
    let questionText = '';
    let questionBangla = '';
    let explanation = '';
    let options: { id: string; text: string; isCorrect: boolean }[] = [];

    const primaryExample = target.examples[0] || {
      english: `We should consider the ${target.word.toLowerCase()} nature of this issue.`,
      bangla: 'আমাদের এই বিষয়ের প্রকৃতি বিবেচনা করা উচিত।'
    };

    if (currentMode === 'en-to-bn') {
      questionText = `What is the Bangla meaning of "${target.word}"?`;
      questionBangla = `"${target.word}" শব্দটির সঠিক বাংলা অর্থ কোনটি?`;
      explanation = `"${target.word}" means "${target.banglaMeaning}". Example: ${primaryExample.english}`;

      const rawOptions = [
        { id: `opt_${target.id}`, text: target.banglaMeaning, isCorrect: true },
        ...chosenDistractors.map(d => ({
          id: `opt_${d.id}`,
          text: d.banglaMeaning,
          isCorrect: false
        }))
      ];
      options = shuffleArray(rawOptions);

      questions.push({
        id: questionId,
        type: 'multiple-choice',
        question: questionText,
        questionBangla,
        targetWord: target,
        options,
        explanation,
        explanationBangla: primaryExample.bangla
      });
    } else if (currentMode === 'bn-to-en') {
      questionText = `Which English word corresponds to: "${target.banglaMeaning}"?`;
      questionBangla = `নিচের কোন ইংরেজি শব্দটির অর্থ "${target.banglaMeaning}"?`;
      explanation = `"${target.word}" is the English word for "${target.banglaMeaning}". Pronunciation: ${target.pronunciation}`;

      const rawOptions = [
        { id: `opt_${target.id}`, text: target.word, isCorrect: true },
        ...chosenDistractors.map(d => ({
          id: `opt_${d.id}`,
          text: d.word,
          isCorrect: false
        }))
      ];
      options = shuffleArray(rawOptions);

      questions.push({
        id: questionId,
        type: 'multiple-choice',
        question: questionText,
        questionBangla,
        targetWord: target,
        options,
        explanation,
        explanationBangla: primaryExample.bangla
      });
    } else if (currentMode === 'fill-blank') {
      // Replace target word in example sentence with blank
      const regex = new RegExp(`\\b${target.word}\\b`, 'gi');
      let sentenceWithBlank = primaryExample.english.replace(regex, '__________');
      if (!sentenceWithBlank.includes('__________')) {
        // Fallback if inflected
        sentenceWithBlank = `He showed a very __________ attitude towards the team.`;
      }

      questionText = `Fill in the blank: "${sentenceWithBlank}"`;
      questionBangla = `বাক্যটি সম্পূর্ণ করতে সঠিক শব্দ বাছাই করুন। (অর্থ: ${primaryExample.bangla})`;
      explanation = `Full sentence: "${primaryExample.english}" — ${primaryExample.bangla}`;

      const rawOptions = [
        { id: `opt_${target.id}`, text: target.word, isCorrect: true },
        ...chosenDistractors.map(d => ({
          id: `opt_${d.id}`,
          text: d.word,
          isCorrect: false
        }))
      ];
      options = shuffleArray(rawOptions);

      questions.push({
        id: questionId,
        type: 'fill-blank',
        question: questionText,
        questionBangla,
        targetWord: target,
        options,
        explanation,
        explanationBangla: primaryExample.bangla
      });
    } else if (currentMode === 'spelling') {
      questionText = `Which is the correct English spelling for: "${target.banglaMeaning}"?`;
      questionBangla = `নিচের কোন ইংরেজি বানানটি সঠিক? (বাংলা অর্থ: "${target.banglaMeaning}")`;
      explanation = `সঠিক বানান: "${target.word}" (${target.pronunciation}) — ${target.banglaMeaning}`;

      const misspelled = generatePlausibleMisspellings(target.word);
      while (misspelled.length < 3) {
        misspelled.push(target.word + (misspelled.length === 1 ? 'e' : 's'));
      }

      const rawOptions = [
        { id: `opt_${target.id}_corr`, text: target.word, isCorrect: true },
        ...misspelled.slice(0, 3).map((m, mIdx) => ({
          id: `opt_${target.id}_err_${mIdx}`,
          text: m,
          isCorrect: false
        }))
      ];
      options = shuffleArray(rawOptions);

      questions.push({
        id: questionId,
        type: 'spelling',
        question: questionText,
        questionBangla,
        targetWord: target,
        options,
        explanation,
        explanationBangla: primaryExample.bangla
      });
    } else {
      // Context & definition
      questionText = `Context: A word describing "${target.banglaMeaning}" (${target.partOfSpeech}).`;
      questionBangla = `প্রসঙ্গ: "${target.banglaMeaning}" অর্থবোধক উপযুক্ত শব্দটি চিহ্নিত করুন।`;
      explanation = `"${target.word}" (${target.partOfSpeech}) fits this description. Pronunciation: ${target.pronunciation}`;

      const rawOptions = [
        { id: `opt_${target.id}`, text: target.word, isCorrect: true },
        ...chosenDistractors.map(d => ({
          id: `opt_${d.id}`,
          text: d.word,
          isCorrect: false
        }))
      ];
      options = shuffleArray(rawOptions);

      questions.push({
        id: questionId,
        type: 'context',
        question: questionText,
        questionBangla,
        targetWord: target,
        options,
        explanation,
        explanationBangla: primaryExample.bangla
      });
    }
  });

  return questions;
}
