import { GoogleGenAI, Type } from '@google/genai';
import { getAllWords } from './data/units';
import { VocabWord } from './data/types';

export interface WordLookupResult {
  word: string;
  baseWord?: string;
  pos: string;
  phonetic?: string;
  meaning: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  source: 'curriculum' | 'lexicon' | 'gemini' | 'dictionary';
}

interface CoreLexiconEntry {
  pos: string;
  meaning: string;
  definition: string;
  synonyms?: string[];
  antonyms?: string[];
}

const CORE_LEXICON: Record<string, CoreLexiconEntry> = {
  a: { pos: 'article', meaning: 'একটি, এক', definition: 'Used before a singular countable noun when referring to something non-specific.' },
  an: { pos: 'article', meaning: 'একটি, এক', definition: 'Used instead of "a" before words beginning with a vowel sound.' },
  the: { pos: 'article', meaning: 'টি, টা, খানা, নির্দিষ্ট', definition: 'Used to refer to specific or previously mentioned people, places, or things.' },
  and: { pos: 'conjunction', meaning: 'এবং, ও, আর', definition: 'Used to connect words, phrases, or clauses of equal grammatical rank.' },
  or: { pos: 'conjunction', meaning: 'অথবা, বা, কিংবা', definition: 'Used to link alternatives or possibilities.' },
  but: { pos: 'conjunction', meaning: 'কিন্তু, তবে, ব্যতীত', definition: 'Used to introduce a phrase or clause contrasting with what was just stated.', synonyms: ['however', 'yet', 'nevertheless'] },
  yet: { pos: 'conjunction', meaning: 'তবুও, এখনো, তথাপি', definition: 'Despite that; up until the present time.', synonyms: ['still', 'nevertheless', 'however'] },
  so: { pos: 'conjunction', meaning: 'তাই, সুতরাং, এত', definition: 'And for this reason; therefore; to such a great extent.', synonyms: ['therefore', 'thus', 'consequently'] },
  nor: { pos: 'conjunction', meaning: 'এবং না, নতুবা', definition: 'Used before the second or further of two or more alternatives to indicate that none is true.' },
  for: { pos: 'preposition', meaning: 'জন্য, কারণে, ধরে', definition: 'Intended to be given to or used by; because of; during a period of time.' },
  in: { pos: 'preposition', meaning: 'মধ্যে, ভেতরে, এ', definition: 'Expressing the situation of something enclosed or surrounded by something else.', antonyms: ['out', 'outside'] },
  on: { pos: 'preposition', meaning: 'উপরে, এ, চালু', definition: 'Physically in contact with and supported by a surface.', antonyms: ['off'] },
  at: { pos: 'preposition', meaning: 'তে, প্রতি, নিকটে', definition: 'Expressing location or arrival in a particular place or position; expressing time.' },
  to: { pos: 'preposition', meaning: 'প্রতি, দিকে, পর্যন্ত, তে', definition: 'Expressing motion in the direction of a particular location or state.' },
  from: { pos: 'preposition', meaning: 'থেকে, হতে, কারণে', definition: 'Indicating the point in space or time at which a journey, process, or action starts.' },
  of: { pos: 'preposition', meaning: 'এর, র, সম্পর্কিত', definition: 'Expressing the relationship between a part and a whole or belonging.' },
  by: { pos: 'preposition', meaning: 'দ্বারা, দিয়ে, পাশে, মধ্যে', definition: 'Identifying the agent performing an action; near or beside.' },
  with: { pos: 'preposition', meaning: 'সাথে, নিয়ে, দ্বারা', definition: 'Accompanied by another person or thing; having or possessing.', antonyms: ['without'] },
  without: { pos: 'preposition', meaning: 'ছাড়া, ব্যতীত, বিনা', definition: 'In the absence of; lacking.', synonyms: ['lacking'], antonyms: ['with'] },
  within: { pos: 'preposition', meaning: 'ভেতরে, মধ্যে, সীমার মধ্যে', definition: 'Inside something; occurring inside a particular period or limit.', synonyms: ['inside'], antonyms: ['outside', 'beyond'] },
  into: { pos: 'preposition', meaning: 'ভেতরে, মধ্যে (গতি বোঝাতে)', definition: 'Expressing movement or action with the result that someone or something becomes enclosed or enters.' },
  onto: { pos: 'preposition', meaning: 'উপরে (গতি বোঝাতে)', definition: 'Moving to a location on the surface of something.' },
  upon: { pos: 'preposition', meaning: 'উপরে, পরক্ষণেই', definition: 'More formal term for "on" or "on top of"; immediately after.' },
  about: { pos: 'preposition', meaning: 'সম্পর্কে, বিষয়ে, প্রায়', definition: 'On the subject of; concerning; approximately.', synonyms: ['concerning', 'regarding', 'approximately'] },
  around: { pos: 'preposition', meaning: 'চারপাশে, চারদিকে, প্রায়', definition: 'Located or situated on every side; approximately.', synonyms: ['surrounding', 'about'] },
  through: { pos: 'preposition', meaning: 'মধ্য দিয়ে, জুড়ে, মাধ্যমে', definition: 'Moving in one side and out of the other side of an opening or space.', synonyms: ['via', 'across'] },
  across: { pos: 'preposition', meaning: 'আড়াআড়িভাবে, ওপারে, জুড়ে', definition: 'From one side to the other of a place, area, or surface.' },
  among: { pos: 'preposition', meaning: 'মাঝে, মধ্যে (অনেকের মধ্যে)', definition: 'Situated more or less centrally in relation to several other things.', synonyms: ['amidst', 'between'] },
  between: { pos: 'preposition', meaning: 'মাঝে, মধ্যে (দুইয়ের মধ্যে)', definition: 'At, into, or across the space separating two objects or regions.' },
  beyond: { pos: 'preposition', meaning: 'বাইরে, ছাড়িয়ে, ওপারে', definition: 'At or to the further side of; outside the range or limits of.', antonyms: ['within'] },
  toward: { pos: 'preposition', meaning: 'দিকে, অভিমুখে, প্রতি', definition: 'In the direction of.', synonyms: ['towards'] },
  towards: { pos: 'preposition', meaning: 'দিকে, অভিমুখে, প্রতি', definition: 'In the direction of.', synonyms: ['toward'] },
  against: { pos: 'preposition', meaning: 'বিরুদ্ধে, বিপরীতে, ঘেঁষে', definition: 'In opposition to; in physical contact with.', antonyms: ['for', 'with'] },
  under: { pos: 'preposition', meaning: 'নিচে, অধীনে', definition: 'Extending or directly below something.', synonyms: ['beneath', 'below'], antonyms: ['above', 'over'] },
  over: { pos: 'preposition', meaning: 'উপরে, জুড়ে, শেষ', definition: 'Extending directly upwards from; across from side to side.', synonyms: ['above'], antonyms: ['under', 'below'] },
  before: { pos: 'preposition', meaning: 'আগে, পূর্বে, সামনে', definition: 'During the period of time preceding a particular event or time; in front of.', synonyms: ['prior to', 'earlier'], antonyms: ['after', 'behind'] },
  after: { pos: 'preposition', meaning: 'পরে, পেছনে, অনুসারে', definition: 'In the time following an event or another period of time.', synonyms: ['following', 'subsequently'], antonyms: ['before'] },
  during: { pos: 'preposition', meaning: 'সময়কালে, চলাকালীন', definition: 'Throughout the course or duration of a period of time.', synonyms: ['throughout'] },
  while: { pos: 'conjunction', meaning: 'যখন, যে সময়, যদিও', definition: 'During the time that; at the same time as; whereas.', synonyms: ['whilst', 'whereas'] },
  as: { pos: 'conjunction', meaning: 'যেহেতু, যেমন, হিসাবে', definition: 'Used in comparisons; during the time of being; because.' },
  than: { pos: 'conjunction', meaning: 'চেয়ে, অপেক্ষা', definition: 'Used to introduce the second element in a comparison.' },
  that: { pos: 'pronoun', meaning: 'যে, ওইটি, যা, যেটি', definition: 'Used to identify a specific person or thing; introducing a clause.' },
  this: { pos: 'pronoun', meaning: 'এই, এটি, ইহা', definition: 'Used to identify a specific person or thing close at hand.', antonyms: ['that'] },
  these: { pos: 'pronoun', meaning: 'এইগুলো, এরা', definition: 'Plural form of "this".', antonyms: ['those'] },
  those: { pos: 'pronoun', meaning: 'ওইগুলো, তারা', definition: 'Plural form of "that".', antonyms: ['these'] },
  which: { pos: 'pronoun', meaning: 'কোনটি, যা, যেটি', definition: 'Asking for information specifying one or more people or things from a definite set.' },
  who: { pos: 'pronoun', meaning: 'কে, কারা, যিনি, যারা', definition: 'What or which person or people.' },
  whom: { pos: 'pronoun', meaning: 'কাকে, যাদেরকে, যাকে', definition: 'Used instead of "who" as the object of a verb or preposition.' },
  whose: { pos: 'pronoun', meaning: 'কার, কাদের, যার, যাদের', definition: 'Belonging to or associated with which person.' },
  what: { pos: 'pronoun', meaning: 'কী, যা', definition: 'Asking for information specifying something.' },
  where: { pos: 'adverb', meaning: 'কোথায়, যেখানে', definition: 'In or to what place or position.' },
  when: { pos: 'adverb', meaning: 'কখন, যখন', definition: 'At what time; at or during the time that.' },
  why: { pos: 'adverb', meaning: 'কেন, যে কারণে', definition: 'For what reason or purpose.' },
  how: { pos: 'adverb', meaning: 'কীভাবে, কেমন, কত', definition: 'In what way or manner; by what means.' },
  i: { pos: 'pronoun', meaning: 'আমি', definition: 'Used by a speaker to refer to himself or herself.' },
  me: { pos: 'pronoun', meaning: 'আমাকে', definition: 'Object form of "I".' },
  my: { pos: 'pronoun', meaning: 'আমার', definition: 'Belonging to or associated with the speaker.' },
  we: { pos: 'pronoun', meaning: 'আমরা', definition: 'Used by a speaker to refer to himself or herself and one or more others.' },
  us: { pos: 'pronoun', meaning: 'আমাদেরকে', definition: 'Object form of "we".' },
  our: { pos: 'pronoun', meaning: 'আমাদের', definition: 'Belonging to or associated with the speaker and others.' },
  you: { pos: 'pronoun', meaning: 'তুমি, আপনি, তোমরা', definition: 'Used to refer to the person or people that the speaker is addressing.' },
  your: { pos: 'pronoun', meaning: 'তোমার, আপনার, তোমাদের', definition: 'Belonging to or associated with the person being addressed.' },
  he: { pos: 'pronoun', meaning: 'সে, তিনি (পুরুষ)', definition: 'Used to refer to a man, boy, or male animal previously mentioned.' },
  him: { pos: 'pronoun', meaning: 'তাকে, তাঁকে (পুরুষ)', definition: 'Object form of "he".' },
  his: { pos: 'pronoun', meaning: 'তার, তাঁর (পুরুষ)', definition: 'Belonging to or associated with a male person previously mentioned.' },
  she: { pos: 'pronoun', meaning: 'সে, তিনি (নারী)', definition: 'Used to refer to a woman, girl, or female animal previously mentioned.' },
  her: { pos: 'pronoun', meaning: 'তার, তাকে (নারী)', definition: 'Belonging to or object form referring to a female person.' },
  it: { pos: 'pronoun', meaning: 'এটি, ইহা, এটা', definition: 'Used to refer to a thing previously mentioned or easily identified.' },
  its: { pos: 'pronoun', meaning: 'এর, এটির, ইহার', definition: 'Belonging to or associated with a thing previously mentioned.' },
  they: { pos: 'pronoun', meaning: 'তারা, তাঁরা, এগুলো', definition: 'Used to refer to two or more people or things previously mentioned.' },
  them: { pos: 'pronoun', meaning: 'তাদেরকে, ওগুলোকে', definition: 'Object form of "they".' },
  their: { pos: 'pronoun', meaning: 'তাদের, তাঁদের', definition: 'Belonging to or associated with the people or things previously mentioned.' },
  is: { pos: 'verb', meaning: 'হয়, আছে', definition: 'Third person singular present form of "be".' },
  am: { pos: 'verb', meaning: 'হই, আছি', definition: 'First person singular present form of "be".' },
  are: { pos: 'verb', meaning: 'হয়, আছ, আছেন', definition: 'Present tense plural and second person singular form of "be".' },
  was: { pos: 'verb', meaning: 'ছিল, ছিলেন, হয়েছিল', definition: 'First and third person singular past tense of "be".' },
  were: { pos: 'verb', meaning: 'ছিল, ছিলেন, হয়েছিল', definition: 'Past tense plural and second person singular form of "be".' },
  be: { pos: 'verb', meaning: 'হওয়া, থাকা', definition: 'To exist; occur; take place.', synonyms: ['exist', 'live'] },
  been: { pos: 'verb', meaning: 'হয়েছে, ছিল', definition: 'Past participle of "be".' },
  being: { pos: 'verb', meaning: 'হচ্ছে, সত্তা, অস্তিত্ব', definition: 'Present participle of "be"; existence or a living creature.', synonyms: ['existence', 'creature'] },
  has: { pos: 'verb', meaning: 'আছে, ধারণ করে', definition: 'Third person singular present of "have".' },
  have: { pos: 'verb', meaning: 'আছে, থাকা, পাওয়া', definition: 'Possess, own, or hold.', synonyms: ['possess', 'own', 'hold'] },
  had: { pos: 'verb', meaning: 'ছিল, পেয়েছিল', definition: 'Past tense and past participle of "have".' },
  do: { pos: 'verb', meaning: 'করা, সম্পাদন করা', definition: 'Perform an action, the precise nature of which is often unspecified.', synonyms: ['perform', 'execute'] },
  does: { pos: 'verb', meaning: 'করে', definition: 'Third person singular present of "do".' },
  did: { pos: 'verb', meaning: 'করেছিল, করল', definition: 'Past tense of "do".' },
  will: { pos: 'verb', meaning: 'করবে, ইচ্ছা, ইচ্ছাপত্র', definition: 'Expressing the future tense; deliberate intention.', synonyms: ['determination', 'desire'] },
  would: { pos: 'verb', meaning: 'করত, করতো, হবে', definition: 'Past of "will"; used to express conditional mood or habitual past action.' },
  can: { pos: 'verb', meaning: 'পারা, সক্ষম হওয়া', definition: 'Be able to; be permitted to.', antonyms: ['cannot'] },
  could: { pos: 'verb', meaning: 'পারত, পেরেছিল', definition: 'Past of "can"; used to indicate possibility or polite request.' },
  may: { pos: 'verb', meaning: 'হতে পারে, পারা', definition: 'Expressing possibility or asking/giving permission.' },
  might: { pos: 'verb', meaning: 'হতে পারত, শক্তি, ক্ষমতা', definition: 'Past of "may"; expressing possibility; great power or strength.', synonyms: ['power', 'strength'] },
  must: { pos: 'verb', meaning: 'অবশ্যই, বাধ্যতামূলকভাবে', definition: 'Be obliged to; should (expressing necessity or certainty).' },
  shall: { pos: 'verb', meaning: 'করব, হবে', definition: 'Used to express the future tense or strong assertion or obligation.' },
  should: { pos: 'verb', meaning: 'উচিত, কর্তব্য', definition: 'Used to indicate obligation, duty, or correctness.' },
  not: { pos: 'adverb', meaning: 'না, নয়', definition: 'Used with an auxiliary verb or "be" to form the negative.' },
  no: { pos: 'determiner', meaning: 'না, কোনো... না', definition: 'Not any; used to give a negative response.', antonyms: ['yes'] },
  all: { pos: 'determiner', meaning: 'সব, সমস্ত, সকল', definition: 'Used to refer to the whole quantity or extent of a particular group or thing.', synonyms: ['every', 'entire', 'complete'], antonyms: ['none'] },
  both: { pos: 'determiner', meaning: 'উভয়, দুটোই', definition: 'Used to refer to two things or people, regarded and identified together.' },
  each: { pos: 'determiner', meaning: 'প্রত্যেক, প্রতিটি', definition: 'Used to refer to every one of two or more people or things, regarded separately.', synonyms: ['every'] },
  every: { pos: 'determiner', meaning: 'প্রতিটি, প্রত্যেক', definition: 'Used before a singular noun to refer to all the individual members of a set.', synonyms: ['each', 'all'] },
  some: { pos: 'determiner', meaning: 'কিছু, কয়েকটি, কোনো', definition: 'An unspecified amount or number of.', synonyms: ['several', 'few'] },
  any: { pos: 'determiner', meaning: 'যেকোনো, কোনো, কিছু', definition: 'Used to refer to one or some of a thing or number of things, no matter how much or how many.' },
  many: { pos: 'determiner', meaning: 'অনেক, বহু', definition: 'A large number of.', synonyms: ['numerous', 'several'], antonyms: ['few'] },
  much: { pos: 'determiner', meaning: 'অনেক, প্রচুর', definition: 'A great amount or quantity of.', synonyms: ['abundant', 'plenty'], antonyms: ['little'] },
  more: { pos: 'determiner', meaning: 'আরো, অধিক, বেশি', definition: 'A greater or additional amount or degree.', synonyms: ['additional', 'further'], antonyms: ['less', 'fewer'] },
  most: { pos: 'determiner', meaning: 'সবচেয়ে বেশি, অধিকাংশ', definition: 'Greatest in amount, quantity, or degree.', synonyms: ['majority'], antonyms: ['least'] },
  other: { pos: 'adjective', meaning: 'অন্য, অপর, বাকি', definition: 'Used to refer to a person or thing that is different or distinct from one already mentioned.', synonyms: ['different', 'alternative'] },
  another: { pos: 'determiner', meaning: 'আরেকটি, অন্য একটি', definition: 'Used to refer to an additional person or thing of the same type.', synonyms: ['additional'] },
  such: { pos: 'determiner', meaning: 'এমন, এরূপ, এই ধরনের', definition: 'Of the type previously mentioned.', synonyms: ['similar'] },
  only: { pos: 'adverb', meaning: 'কেবল, শুধুমাত্র, একমাত্র', definition: 'And no one or nothing more besides; solely.', synonyms: ['solely', 'merely', 'exclusively'] },
  also: { pos: 'adverb', meaning: 'এছাড়াও, আরও, ও', definition: 'In addition; too.', synonyms: ['too', 'besides', 'furthermore'] },
  very: { pos: 'adverb', meaning: 'খুব, অত্যন্ত, একেবারে', definition: 'In a high degree; extremely.', synonyms: ['extremely', 'highly'] },
  even: { pos: 'adverb', meaning: 'এমনকি, সমান, মসৃণ', definition: 'Used to emphasize something surprising or extreme; flat and smooth.', synonyms: ['flat', 'level'], antonyms: ['uneven', 'odd'] },
  just: { pos: 'adverb', meaning: 'ঠিক, মাত্র, সবেমাত্র, ন্যায়সঙ্গত', definition: 'Exactly; very recently; based on what is morally right and fair.', synonyms: ['fair', 'righteous', 'merely'], antonyms: ['unjust', 'unfair'] },
  still: { pos: 'adverb', meaning: 'এখনো, তবুও, স্থির', definition: 'Up to and including the present; not moving or making a sound.', synonyms: ['motionless', 'calm', 'quiet'], antonyms: ['moving', 'active'] },
  never: { pos: 'adverb', meaning: 'কখনো না, কদাচ না', definition: 'At no time in the past or future; not ever.', antonyms: ['always', 'ever'] },
  often: { pos: 'adverb', meaning: 'প্রায়ই, ঘন ঘন', definition: 'Frequently; many times.', synonyms: ['frequently', 'repeatedly'], antonyms: ['rarely', 'seldom'] },
  always: { pos: 'adverb', meaning: 'সবসময়, সর্বদা', definition: 'At all times; on all occasions.', synonyms: ['forever', 'continually'], antonyms: ['never'] },
  there: { pos: 'adverb', meaning: 'সেখানে, ওখানে', definition: 'In, at, or to that place or position.', antonyms: ['here'] },
  here: { pos: 'adverb', meaning: 'এখানে', definition: 'In, at, or to this place or position.', antonyms: ['there'] },
  then: { pos: 'adverb', meaning: 'তখন, তারপর, তবে', definition: 'At that time; after that; next.', synonyms: ['subsequently', 'afterward'] },
  now: { pos: 'adverb', meaning: 'এখন, বর্তমানে', definition: 'At the present time or moment.', synonyms: ['currently', 'presently'], antonyms: ['then', 'later'] },
  dr: { pos: 'noun', meaning: 'ডক্টর, ডাক্তার (সংক্ষিপ্ত রূপ)', definition: 'Written abbreviation for Doctor.' },
  mr: { pos: 'noun', meaning: 'জনাব, মিস্টার (সংক্ষিপ্ত রূপ)', definition: 'Title used before a surname or full name to address or refer to a man.' },
  mrs: { pos: 'noun', meaning: 'শ্রীমতী, মিসেস (সংক্ষিপ্ত রূপ)', definition: 'Title used before a surname or full name to address or refer to a married woman.' },
};

// Lazy curriculum map built once from all 50 units
let curriculumWordMap: Map<string, VocabWord> | null = null;

function getCurriculumMap(): Map<string, VocabWord> {
  if (!curriculumWordMap) {
    curriculumWordMap = new Map();
    for (const w of getAllWords()) {
      curriculumWordMap.set(w.word.toLowerCase(), w);
    }
  }
  return curriculumWordMap;
}

// LRU-like bounded cache for fast repeat lookups
const lookupCache = new Map<string, WordLookupResult>();
const inFlightRequests = new Map<string, Promise<WordLookupResult>>();
const MAX_CACHE_SIZE = 4000;

function saveToCache(key: string, value: WordLookupResult) {
  if (lookupCache.size >= MAX_CACHE_SIZE) {
    const firstKey = lookupCache.keys().next().value;
    if (firstKey) lookupCache.delete(firstKey);
  }
  lookupCache.set(key, value);
}

export function normalizeEnglishToken(rawWord: string): string {
  return rawWord
    .trim()
    .replace(/[’']/g, "'")
    .replace(/'s$/i, '')
    .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

const IRREGULAR_LEMMAS: Record<string, string> = {
  codices: 'codex',
  indices: 'index',
  matrices: 'matrix',
  vertices: 'vertex',
  phenomena: 'phenomenon',
  criteria: 'criterion',
  children: 'child',
  men: 'man',
  women: 'woman',
  teeth: 'tooth',
  feet: 'foot',
  mice: 'mouse',
  geese: 'goose',
  went: 'go',
  gone: 'go',
  saw: 'see',
  seen: 'see',
  took: 'take',
  taken: 'take',
  gave: 'give',
  given: 'give',
  came: 'come',
  made: 'make',
  said: 'say',
  told: 'tell',
  knew: 'know',
  known: 'know',
  thought: 'think',
  brought: 'bring',
  caught: 'catch',
  taught: 'teach',
  bought: 'buy',
  fought: 'fight',
  sought: 'seek',
  found: 'find',
  felt: 'feel',
  kept: 'keep',
  left: 'leave',
  lost: 'lose',
  held: 'hold',
  stood: 'stand',
  understood: 'understand',
  wrote: 'write',
  written: 'write',
  spoke: 'speak',
  spoken: 'speak',
  broke: 'break',
  broken: 'break',
  chose: 'choose',
  chosen: 'choose',
  drove: 'drive',
  driven: 'drive',
  rose: 'rise',
  risen: 'rise',
  fell: 'fall',
  fallen: 'fall',
  grew: 'grow',
  grown: 'grow',
  drew: 'draw',
  drawn: 'draw',
  flew: 'fly',
  flown: 'fly',
  ran: 'run',
  began: 'begin',
  begun: 'begin',
  drank: 'drink',
  drunk: 'drink',
  sang: 'sing',
  sung: 'sing',
  swam: 'swim',
  swum: 'swim',
  better: 'good',
  best: 'good',
  worse: 'bad',
  worst: 'bad',
};

function getLemmaCandidates(lower: string): string[] {
  const candidates: string[] = [];
  const push = (w: string) => {
    if (w.length >= 2 && w !== lower && !candidates.includes(w)) {
      candidates.push(w);
    }
  };

  if (IRREGULAR_LEMMAS[lower]) {
    push(IRREGULAR_LEMMAS[lower]);
  }
  if (lower.endsWith('ies') && lower.length > 4) {
    push(lower.slice(0, -3) + 'y');
  }
  if (lower.endsWith('ves') && lower.length > 4) {
    push(lower.slice(0, -3) + 'f');
    push(lower.slice(0, -3) + 'fe');
  }
  if (lower.endsWith('es') && lower.length > 3) {
    push(lower.slice(0, -2));
    push(lower.slice(0, -1));
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) {
    push(lower.slice(0, -1));
  }
  if (lower.endsWith('ied') && lower.length > 4) {
    push(lower.slice(0, -3) + 'y');
  }
  if (lower.endsWith('ed') && lower.length > 4) {
    const stem = lower.slice(0, -2);
    push(stem);
    push(stem + 'e');
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1));
    }
  }
  if (lower.endsWith('ing') && lower.length > 5) {
    const stem = lower.slice(0, -3);
    push(stem);
    push(stem + 'e');
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      push(stem.slice(0, -1));
    }
  }
  if (lower.endsWith('ily') && lower.length > 5) {
    push(lower.slice(0, -3) + 'y');
  }
  if (lower.endsWith('ly') && lower.length > 4) {
    push(lower.slice(0, -2));
    push(lower.slice(0, -2) + 'le');
  }
  if (lower.endsWith('er') && lower.length > 4) {
    push(lower.slice(0, -2));
    push(lower.slice(0, -1));
  }
  if (lower.endsWith('est') && lower.length > 5) {
    push(lower.slice(0, -3));
    push(lower.slice(0, -2));
  }

  return candidates;
}

function fromCurriculumVocab(wordObj: VocabWord, displayWord: string): WordLookupResult {
  const firstExample = wordObj.examples?.[0];
  const definition = firstExample
    ? `Example: "${firstExample.english}"`
    : `${wordObj.word} (${wordObj.partOfSpeech}) — curriculum vocabulary word.`;

  return {
    word: displayWord,
    baseWord: wordObj.word,
    pos: wordObj.partOfSpeech || 'word',
    phonetic: wordObj.pronunciation || undefined,
    meaning: wordObj.banglaMeaning,
    definition,
    synonyms: (wordObj.synonyms || []).slice(0, 5),
    antonyms: (wordObj.antonyms || []).slice(0, 5),
    source: 'curriculum',
  };
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function lookupWithGemini(word: string, context?: string): Promise<WordLookupResult | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const prompt = context
      ? `Give the English dictionary details and accurate Bengali meaning for the word "${word}" as used in this context: "${context.slice(0, 260)}".`
      : `Give the English dictionary details and accurate Bengali meaning for the English word "${word}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert English-to-Bengali lexicographer. Return concise, accurate Bengali meanings, clear English definitions, part of speech, IPA phonetic if known, and up to 4 synonyms and 4 antonyms if available (empty arrays if none exist).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pos: { type: Type.STRING, description: 'Part of speech, e.g. noun, verb, adjective, adverb.' },
            phonetic: { type: Type.STRING, description: 'IPA pronunciation if applicable.' },
            meaning: { type: Type.STRING, description: 'Accurate, natural Bengali meaning(s), separated by commas if multiple.' },
            definition: { type: Type.STRING, description: 'Clear, concise English dictionary definition.' },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Up to 4 English synonyms, or empty array.' },
            antonyms: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Up to 4 English antonyms, or empty array.' },
          },
          required: ['pos', 'meaning', 'definition', 'synonyms', 'antonyms'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.meaning || !parsed?.definition) return null;

    return {
      word,
      pos: String(parsed.pos || 'word').toLowerCase(),
      phonetic: parsed.phonetic ? String(parsed.phonetic) : undefined,
      meaning: String(parsed.meaning).trim(),
      definition: String(parsed.definition).trim(),
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms.map(String).filter(Boolean).slice(0, 5) : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms.map(String).filter(Boolean).slice(0, 5) : [],
      source: 'gemini',
    };
  } catch {
    return null;
  }
}

interface DictionaryApiData {
  entryWord: string;
  pos: string;
  phonetic?: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
}

async function fetchFreeDictionary(candidates: string[]): Promise<DictionaryApiData | null> {
  for (const candidate of candidates) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(candidate)}`, {
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      const entry = data[0];
      const phonetic: string | undefined =
        entry.phonetic ||
        (Array.isArray(entry.phonetics) ? entry.phonetics.find((p: any) => p?.text)?.text : undefined);

      const meanings: any[] = Array.isArray(entry.meanings) ? entry.meanings : [];
      let pos = 'word';
      let definition = '';
      const synSet = new Set<string>();
      const antSet = new Set<string>();

      for (const m of meanings) {
        if (pos === 'word' && m?.partOfSpeech) {
          pos = String(m.partOfSpeech).toLowerCase();
        }
        if (Array.isArray(m?.synonyms)) {
          m.synonyms.forEach((s: string) => {
            if (s && s.toLowerCase() !== candidate.toLowerCase()) synSet.add(s);
          });
        }
        if (Array.isArray(m?.antonyms)) {
          m.antonyms.forEach((a: string) => {
            if (a && a.toLowerCase() !== candidate.toLowerCase()) antSet.add(a);
          });
        }
        if (Array.isArray(m?.definitions)) {
          for (const d of m.definitions) {
            if (!definition && d?.definition) {
              definition = String(d.definition).trim();
            }
            if (Array.isArray(d?.synonyms)) {
              d.synonyms.forEach((s: string) => {
                if (s && s.toLowerCase() !== candidate.toLowerCase()) synSet.add(s);
              });
            }
            if (Array.isArray(d?.antonyms)) {
              d.antonyms.forEach((a: string) => {
                if (a && a.toLowerCase() !== candidate.toLowerCase()) antSet.add(a);
              });
            }
          }
        }
      }

      if (definition) {
        return {
          entryWord: entry.word || candidate,
          pos,
          phonetic,
          definition,
          synonyms: Array.from(synSet).slice(0, 5),
          antonyms: Array.from(antSet).slice(0, 5),
        };
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

async function fetchDatamuseRelated(word: string, relation: 'rel_syn' | 'rel_ant'): Promise<string[]> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?${relation}=${encodeURIComponent(word)}&max=6`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item: any) => String(item?.word || '').trim())
      .filter((w: string) => Boolean(w) && w.toLowerCase() !== word.toLowerCase())
      .slice(0, 5);
  } catch {
    return [];
  }
}

function cleanBanglaTranslation(text: string | undefined | null): string | null {
  if (!text) return null;
  const cleaned = text.replace(/@.*$/g, '').trim();
  if (!cleaned) return null;
  if (/MYMEMORY|QUERY LENGTH|PLEASE SELECT|INVALID/i.test(cleaned)) return null;
  // Require at least one Bengali character so English echo or garbage isn't accepted
  if (!/[\u0980-\u09FF]/.test(cleaned)) return null;
  return cleaned;
}

async function fetchBanglaMeaning(wordsToTry: string[]): Promise<string | null> {
  for (const w of wordsToTry) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(w)}&langpair=en|bn`, {
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const primary = cleanBanglaTranslation(data?.responseData?.translatedText);
      if (primary) return primary;

      if (Array.isArray(data?.matches)) {
        for (const match of data.matches) {
          const mText = cleanBanglaTranslation(match?.translation);
          if (mText) return mText;
        }
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

async function resolveWordUncached(rawWord: string, context?: string): Promise<WordLookupResult> {
  const clean = normalizeEnglishToken(rawWord);
  if (!clean) {
    return {
      word: rawWord,
      pos: 'word',
      meaning: 'শব্দটি শনাক্ত করা যায়নি',
      definition: 'No dictionary definition available for this token.',
      synonyms: [],
      antonyms: [],
      source: 'dictionary',
    };
  }

  const lower = clean.toLowerCase();
  const lemmas = getLemmaCandidates(lower);
  const candidates = [lower, ...lemmas];

  // 1. Built-in core English-to-Bangla lexicon (function words, irregulars, abbreviations)
  for (const cand of candidates) {
    const core = CORE_LEXICON[cand];
    if (core) {
      return {
        word: clean,
        baseWord: cand !== lower ? cand : undefined,
        pos: core.pos,
        meaning: core.meaning,
        definition: core.definition,
        synonyms: core.synonyms || [],
        antonyms: core.antonyms || [],
        source: 'lexicon',
      };
    }
  }

  // 2. Built-in curriculum dictionary across all 50 units
  const currMap = getCurriculumMap();
  for (const cand of candidates) {
    const currWord = currMap.get(cand);
    if (currWord) {
      return fromCurriculumVocab(currWord, clean);
    }
  }

  // 3. Optional Gemini AI dictionary lookup (if GEMINI_API_KEY is configured)
  const geminiResult = await lookupWithGemini(clean, context);
  if (geminiResult) {
    return geminiResult;
  }

  // 4. Multi-source public Dictionary + Datamuse + MyMemory Bengali translation
  const [dictData, bnPrimary] = await Promise.all([
    fetchFreeDictionary(candidates),
    fetchBanglaMeaning([lower, ...lemmas.slice(0, 1)]),
  ]);

  const baseForRelated = dictData?.entryWord?.toLowerCase() || lemmas[0] || lower;

  // Fetch synonyms/antonyms from Datamuse if Free Dictionary didn't provide them
  const [dmSyns, dmAnts] = await Promise.all([
    !dictData || dictData.synonyms.length === 0 ? fetchDatamuseRelated(baseForRelated, 'rel_syn') : Promise.resolve([]),
    !dictData || dictData.antonyms.length === 0 ? fetchDatamuseRelated(baseForRelated, 'rel_ant') : Promise.resolve([]),
  ]);

  const synonyms = Array.from(new Set([...(dictData?.synonyms || []), ...dmSyns])).slice(0, 5);
  const antonyms = Array.from(new Set([...(dictData?.antonyms || []), ...dmAnts])).slice(0, 5);

  // If no dictionary entry was found and the token is capitalized (likely a proper name like "Julian")
  const looksLikeProperName = /^[A-Z][a-z]{1,}$/.test(clean) && !dictData;

  let meaning = bnPrimary;
  if (!meaning && dictData?.entryWord && dictData.entryWord.toLowerCase() !== lower) {
    meaning = await fetchBanglaMeaning([dictData.entryWord.toLowerCase()]);
  }

  if (!meaning) {
    meaning = looksLikeProperName
      ? `${clean} (নাম / Proper Noun)`
      : 'বাংলা অর্থ পাওয়া যায়নি';
  }

  const definition = dictData?.definition
    ? dictData.definition
    : looksLikeProperName
    ? `"${clean}" is used here as a proper name (ব্যক্তি, স্থান বা বিশেষ নাম).`
    : 'English dictionary definition is currently unavailable for this word.';

  return {
    word: clean,
    baseWord: dictData?.entryWord && dictData.entryWord.toLowerCase() !== lower ? dictData.entryWord : undefined,
    pos: dictData?.pos || (looksLikeProperName ? 'proper noun' : 'word'),
    phonetic: dictData?.phonetic,
    meaning,
    definition,
    synonyms,
    antonyms,
    source: 'dictionary',
  };
}

export async function lookupEnglishWord(rawWord: string, context?: string): Promise<WordLookupResult> {
  const clean = normalizeEnglishToken(rawWord);
  const cacheKey = clean.toLowerCase() || rawWord.toLowerCase();

  const cached = lookupCache.get(cacheKey);
  if (cached) {
    return { ...cached, word: clean || rawWord };
  }

  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = resolveWordUncached(rawWord, context)
    .then((result) => {
      saveToCache(cacheKey, result);
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}
