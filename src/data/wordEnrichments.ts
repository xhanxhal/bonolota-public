import { VocabWord, WordEnrichment, WordTone, ExamTag } from './types';

// Curated high-yield dictionary for specific deep enrichments
const CURATED_ENRICHMENTS: Record<string, Partial<WordEnrichment>> = {
  aberrant: {
    tone: 'negative',
    examTags: ['BCS', 'GRE', 'IBA'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'বিপথে যাওয়া / কুপথগামী',
      explanation: 'স্বাভাবিক ভালো রাস্তা ছেড়ে বেখাপ্পা বা উল্টোপথে হাঁটা।'
    },
    wordFamily: {
      adjective: 'Aberrant',
      noun: 'Aberrance / Aberration',
      adverb: 'Aberrantly'
    },
    collocation: {
      phrase: 'Aberrant behaviour / aberrant cells',
      bangla: 'অস্বাভাবিক বা বিচ্যুত আচরণ'
    },
    pitfall: {
      wrong: 'His conduct was aberration.',
      correct: 'His conduct was aberrant (Adjective) / an aberration (Noun).',
      tip: 'Aberrant হলো Adjective, আর Aberration হলো Noun।'
    },
    intensity: {
      level: 3,
      spectrum: ['Unusual', 'Atypical', 'Aberrant', 'Perverted']
    },
    idiomConnection: {
      idiom: 'Go off the rails',
      meaning: 'স্বাভাবিক নিয়মের বাইরে বা বিশৃঙ্খল পথে চলে যাওয়া'
    }
  },
  aberration: {
    tone: 'negative',
    examTags: ['BCS', 'GRE', 'Bank'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'লাইনচ্যুত হওয়া / নীতিচ্যুতি',
      explanation: 'নিয়মমাফিক সঠিক নীতি থেকে হঠাৎ সাময়িক পদস্খলন।'
    },
    wordFamily: {
      noun: 'Aberration',
      adjective: 'Aberrant',
      verb: 'Aberrate'
    },
    collocation: {
      phrase: 'A momentary aberration of mind',
      bangla: 'সাময়িক মতিভ্রম বা চিত্তবিচ্যুতি'
    }
  },
  abhor: {
    tone: 'negative',
    examTags: ['BCS', 'IBA', 'GRE'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'চোখের বিষ / বিষবৎ পরিত্যাগ করা',
      explanation: 'কাউকে বা কোনো কাজকে চরমভাবে ঘৃণা করা।'
    },
    wordFamily: {
      verb: 'Abhor',
      noun: 'Abhorrence',
      adjective: 'Abhorrent',
      adverb: 'Abhorrently'
    },
    collocation: {
      phrase: 'Abhor cruelty / abhor violence',
      bangla: 'নিষ্ঠুরতাকে তীব্র ঘৃণা করা'
    },
    pitfall: {
      wrong: 'I abhor to his behavior.',
      correct: 'I abhor his behavior.',
      tip: 'Abhor একটি Transitive verb, এর পরে সরাসরি object বসে, কোনো "to" বা preposition বসে না।'
    },
    intensity: {
      level: 4,
      spectrum: ['Dislike', 'Detest', 'Loathe', 'Abhor']
    }
  },
  altruistic: {
    tone: 'positive',
    examTags: ['BCS', 'IBA', 'GRE', 'Bank'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'পরের মাথায় ছাতা ধরা / পরার্থে প্রাণ দেওয়া',
      explanation: 'নিঃস্বার্থভাবে মানুষের কল্যাণ সাধন করা।'
    },
    wordFamily: {
      noun: 'Altruism / Altruist',
      adjective: 'Altruistic',
      adverb: 'Altruistically'
    },
    collocation: {
      phrase: 'Altruistic motive / altruistic act',
      bangla: 'পরোপকারী বা নিঃস্বার্থ উদ্দেশ্য'
    },
    pitfall: {
      wrong: 'He is an altruistic.',
      correct: 'He is altruistic (Adj) / He is an altruist (Noun).',
      tip: 'ব্যক্তিকে Noun হিসেবে বোঝাতে Altruist ব্যবহার করুন।'
    },
    intensity: {
      level: 3,
      spectrum: ['Helpful', 'Generous', 'Altruistic', 'Self-sacrificing']
    }
  },
  ambiguous: {
    tone: 'neutral',
    examTags: ['BCS', 'Bank', 'IBA', 'DU'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'সাপও মরে লাঠিও না ভাঙে এমন দ্ব্যর্থবোধক কথা',
      explanation: 'স্পষ্ট না বলে গোলমেলে ধাঁচে কথা বলা।'
    },
    wordFamily: {
      adjective: 'Ambiguous',
      noun: 'Ambiguity',
      adverb: 'Ambiguously'
    },
    collocation: {
      phrase: 'Ambiguous statement / reply',
      bangla: 'দ্ব্যর্থবোধক বা অস্পষ্ট মন্তব্য'
    },
    pitfall: {
      wrong: 'Ambiguous vs Ambivalent',
      correct: 'Ambiguous = দুটি অর্থ হতে পারে (অস্পষ্ট); Ambivalent = মনে দ্বিমুখী অনুভূতির টানাপোড়েন।',
      tip: 'উভয়ের মধ্যে পার্থক্য খেয়াল রাখুন।'
    }
  },
  anarchy: {
    tone: 'negative',
    examTags: ['BCS', 'Bank', 'DU'],
    thematicCategory: 'Politics, Power & Governance',
    banglaIdiom: {
      idiom: 'মৎস্যন্যায় / অরাজকতা',
      explanation: 'আইন-আদালতহীন নৈরাজ্য যেখানে সবল দুর্বলকে গিলে খায়।'
    },
    wordFamily: {
      noun: 'Anarchy / Anarchist',
      adjective: 'Anarchic / Anarchical',
      adverb: 'Anarchically'
    },
    collocation: {
      phrase: 'Fall into utter anarchy',
      bangla: 'চরম নৈরাজ্যের মধ্যে নিমজ্জিত হওয়া'
    }
  },
  audacious: {
    tone: 'neutral',
    examTags: ['GRE', 'IBA', 'BCS'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'বুকের পাটা / দুঃসাহসী',
      explanation: 'ভয়ডরহীন দুর্দান্ত সাহস (কখনো বেপরোয়া অর্থে)।'
    },
    wordFamily: {
      adjective: 'Audacious',
      noun: 'Audacity',
      adverb: 'Audaciously'
    },
    collocation: {
      phrase: 'An audacious plan / audacious remark',
      bangla: 'দুঃসাহসিক পরিকল্পনা বা বক্তব্য'
    },
    intensity: {
      level: 3,
      spectrum: ['Brave', 'Bold', 'Audacious', 'Foolhardy']
    }
  },
  benevolent: {
    tone: 'positive',
    examTags: ['BCS', 'Bank', 'DU'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'দয়ার সাগর / মহানুভব',
      explanation: 'সকলের প্রতি আন্তরিক মঙ্গলকামনা করা।'
    },
    wordFamily: {
      adjective: 'Benevolent',
      noun: 'Benevolence',
      adverb: 'Benevolently'
    },
    collocation: {
      phrase: 'Benevolent smile / benevolent institution',
      bangla: 'দয়ালু হাসি বা জনকল্যাণমূলক প্রতিষ্ঠান'
    },
    intensity: {
      level: 3,
      spectrum: ['Kind', 'Charitable', 'Benevolent', 'Saintly']
    }
  },
  cacophony: {
    tone: 'negative',
    examTags: ['GRE', 'IBA', 'BCS'],
    thematicCategory: 'Arts, Sensory & Description',
    banglaIdiom: {
      idiom: 'কান ঝালাপালা করা আওয়াজ / হট্টগোল',
      explanation: 'কর্কশ ও বিশৃঙ্খল শব্দ বা চিৎকার।'
    },
    wordFamily: {
      noun: 'Cacophony',
      adjective: 'Cacophonous',
      adverb: 'Cacophonously'
    },
    collocation: {
      phrase: 'A cacophony of horns and shouts',
      bangla: 'গাড়ির হর্ন ও চিৎকারের তীব্র কর্কশ আওয়াজ'
    }
  },
  candid: {
    tone: 'positive',
    examTags: ['BCS', 'Bank', 'IBA'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'মুখের ওপর স্পষ্ট কথা বলা / অকপট',
      explanation: 'কোনো ভণিতা না করে সত্য ও খোলামেলা বলা।'
    },
    wordFamily: {
      adjective: 'Candid',
      noun: 'Candor / Candidness',
      adverb: 'Candidly'
    },
    collocation: {
      phrase: 'Candid opinion / candid photograph',
      bangla: 'অকপট মতামত বা স্বাভাবিক অপ্রস্তুত ছবি'
    }
  },
  ephemeral: {
    tone: 'neutral',
    examTags: ['BCS', 'GRE', 'IBA'],
    thematicCategory: 'Time, Change & Nature',
    banglaIdiom: {
      idiom: 'পদ্মাপাতার জল / ক্ষণস্থায়ী মায়া',
      explanation: 'যা চোখের পলকে মিলিয়ে যায়, বেশিদিন টেকে না।'
    },
    wordFamily: {
      adjective: 'Ephemeral',
      noun: 'Ephemerality / Ephemera',
      adverb: 'Ephemerally'
    },
    collocation: {
      phrase: 'Ephemeral pleasure / ephemeral fame',
      bangla: 'ক্ষণস্থায়ী সুখ বা সাময়িক খ্যাতি'
    },
    intensity: {
      level: 3,
      spectrum: ['Brief', 'Temporary', 'Ephemeral', 'Fleeting']
    }
  },
  garrulous: {
    tone: 'negative',
    examTags: ['GRE', 'IBA', 'BCS'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'বাচাল / কথার ফুলঝুরি ছোটানো',
      explanation: 'প্রয়োজন ছাড়া অপ্রাসঙ্গিক বিষয়ে অনবরত কথা বলা।'
    },
    wordFamily: {
      adjective: 'Garrulous',
      noun: 'Garrulity / Garrulousness',
      adverb: 'Garrulously'
    },
    collocation: {
      phrase: 'A garrulous old neighbor',
      bangla: 'অতিরিক্ত কথা বলা প্রতিবেশী'
    },
    intensity: {
      level: 3,
      spectrum: ['Talkative', 'Chatty', 'Garrulous', 'Loquacious']
    }
  },
  lucid: {
    tone: 'positive',
    examTags: ['BCS', 'Bank', 'IBA', 'GRE'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'দুধে-ভাতে পরিষ্কার / জলের মতো সহজ',
      explanation: 'বোঝার ক্ষেত্রে অত্যন্ত স্বচ্ছ ও প্রাঞ্জল।'
    },
    wordFamily: {
      adjective: 'Lucid',
      noun: 'Lucidity / Lucidness',
      adverb: 'Lucidly'
    },
    collocation: {
      phrase: 'A lucid explanation / lucid dreaming',
      bangla: 'অত্যন্ত প্রাঞ্জল ব্যাখ্যা'
    }
  },
  misanthrope: {
    tone: 'negative',
    examTags: ['BCS', 'GRE', 'IBA'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'মানুষখেকো মনোভাব / মনুষ্যবিদ্বেষী',
      explanation: 'সমগ্র মানবজাতির প্রতি ঘৃণা পোষণকারী।'
    },
    wordFamily: {
      noun: 'Misanthrope / Misanthropy',
      adjective: 'Misanthropic',
      adverb: 'Misanthropically'
    },
    collocation: {
      phrase: 'Become a bitter misanthrope',
      bangla: 'একাকী ও মনুষ্যবিদ্বেষী হয়ে ওঠা'
    }
  },
  pragmatic: {
    tone: 'positive',
    examTags: ['BCS', 'Bank', 'IBA'],
    thematicCategory: 'Mind, Intellect & Behavior',
    banglaIdiom: {
      idiom: 'গাছে কাঁঠাল গোঁফে তেল নয় / কাজের লোক',
      explanation: 'কাল্পনিক তত্ত্বের চেয়ে বাস্তব কার্যকারিতাকে প্রাধান্য দেওয়া।'
    },
    wordFamily: {
      adjective: 'Pragmatic',
      noun: 'Pragmatism / Pragmatist',
      adverb: 'Pragmatically'
    },
    collocation: {
      phrase: 'Pragmatic approach / pragmatic decision',
      bangla: 'বাস্তবধর্মী বা প্রয়োগিক দৃষ্টিভঙ্গি'
    }
  },
  prodigal: {
    tone: 'negative',
    examTags: ['BCS', 'GRE', 'IBA'],
    thematicCategory: 'Money, Trade & Wealth',
    banglaIdiom: {
      idiom: 'নবাবী চাল / দু’হাতে টাকা ওড়ানো / উড়নচণ্ডী',
      explanation: 'বেপরোয়া অপচয়কারী যে ভবিষ্যতের কথা ভাবে না।'
    },
    wordFamily: {
      adjective: 'Prodigal',
      noun: 'Prodigality',
      adverb: 'Prodigally'
    },
    collocation: {
      phrase: 'Prodigal expenditure / the prodigal son',
      bangla: 'উড়নচণ্ডী স্বভাব বা অপব্যয়ী সন্তান'
    },
    intensity: {
      level: 3,
      spectrum: ['Extravagant', 'Wasteful', 'Prodigal', 'Profligate']
    }
  },
  reticent: {
    tone: 'neutral',
    examTags: ['GRE', 'IBA', 'BCS'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'মুখে কুলুপ আঁটা / মিতভাষী',
      explanation: 'নিজের অনুভূতি বা কথা চেপে রাখা, সহজে কথা না বলা।'
    },
    wordFamily: {
      adjective: 'Reticent',
      noun: 'Reticence',
      adverb: 'Reticently'
    },
    collocation: {
      phrase: 'Reticent about personal life',
      bangla: 'ব্যক্তিগত জীবন নিয়ে কম কথা বলা'
    }
  },
  venerate: {
    tone: 'positive',
    examTags: ['BCS', 'GRE', 'IBA'],
    thematicCategory: 'Society, Morals & Relations',
    banglaIdiom: {
      idiom: 'মাথায় তুলে রাখা / গভীর শ্রদ্ধা জানানো',
      explanation: 'কাউকে পরম সম্মানের আসনে বসানো।'
    },
    wordFamily: {
      verb: 'Venerate',
      noun: 'Veneration',
      adjective: 'Venerable'
    },
    collocation: {
      phrase: 'Venerate traditions / venerate elders',
      bangla: 'প্রাচীন ঐতিহ্য বা প্রবীণদের গভীর শ্রদ্ধা করা'
    }
  },
  zealous: {
    tone: 'positive',
    examTags: ['BCS', 'Bank', 'IBA'],
    thematicCategory: 'Emotion, Character & Temper',
    banglaIdiom: {
      idiom: 'কোমর বেঁধে নামা / উদ্যমী',
      explanation: 'কোনো উদ্দেশ্য সফল করতে একনিষ্ঠ আগ্রহ দেখানো।'
    },
    wordFamily: {
      adjective: 'Zealous',
      noun: 'Zeal / Zealot',
      adverb: 'Zealously'
    },
    collocation: {
      phrase: 'Zealous supporter / zealous worker',
      bangla: 'অত্যুৎসাহী কর্মী বা একনিষ্ঠ সমর্থক'
    }
  }
};

// Automatic fallback heuristics for any of the 1,850 words
export function getWordEnrichment(word: VocabWord): WordEnrichment {
  const cleanKey = word.word.toLowerCase().trim();
  const curated = CURATED_ENRICHMENTS[cleanKey];

  // Determine tone if not curated
  let tone: WordTone = curated?.tone || 'neutral';
  if (!curated?.tone) {
    const meaning = (word.banglaMeaning + ' ' + (word.synonyms?.join(' ') || '')).toLowerCase();
    const posIndicators = ['উন্নত', 'ভালো', 'পবিত্র', 'উদার', 'সহায়', 'জ্ঞানী', 'সুন্দর', 'স্পষ্ট', 'আনন্দ', 'friend', 'praise', 'noble', 'kind', 'peace'];
    const negIndicators = ['খারাপ', 'ঘৃণা', 'ক্ষতি', 'শত্রু', 'রাগ', 'ভুল', 'কপট', 'অহংকার', 'ধ্বংস', 'অপচয়', 'hate', 'bad', 'evil', 'destroy', 'damage', 'fool'];

    if (posIndicators.some(w => meaning.includes(w))) {
      tone = 'positive';
    } else if (negIndicators.some(w => meaning.includes(w))) {
      tone = 'negative';
    }
  }

  // Determine exam tags
  const examTags: ExamTag[] = curated?.examTags || [];
  if (examTags.length === 0) {
    if (word.unitId <= 30) {
      examTags.push('BCS', 'Bank');
      if (word.difficulty === 'advanced') examTags.push('IBA');
    } else {
      examTags.push('GRE', 'IBA');
      if (word.unitId <= 40) examTags.push('BCS');
    }
    if (word.difficulty === 'intermediate' || word.difficulty === 'beginner') {
      examTags.push('DU');
    }
  }

  // Determine thematic category
  let thematicCategory = curated?.thematicCategory || '';
  if (!thematicCategory) {
    const text = (word.word + ' ' + word.banglaMeaning + ' ' + (word.synonyms?.join(' ') || '')).toLowerCase();
    if (text.includes('আইন') || text.includes('অপরাধ') || text.includes('শাস্তি') || text.includes('crime') || text.includes('law') || text.includes('court') || text.includes('judge')) {
      thematicCategory = 'Crime, Court & Law';
    } else if (text.includes('রাজনীতি') || text.includes('শাসন') || text.includes('সরকার') || text.includes('politics') || text.includes('power') || text.includes('rule') || text.includes('king')) {
      thematicCategory = 'Politics, Power & Governance';
    } else if (text.includes('টাকা') || text.includes('সম্পদ') || text.includes('টাকা') || text.includes('দরিদ্র') || text.includes('money') || text.includes('wealth') || text.includes('rich') || text.includes('poor')) {
      thematicCategory = 'Money, Trade & Wealth';
    } else if (text.includes('রাগ') || text.includes('ভয়') || text.includes('ভালোবাসা') || text.includes('ঘৃণা') || text.includes('anger') || text.includes('fear') || text.includes('joy') || text.includes('hate')) {
      thematicCategory = 'Emotion, Character & Temper';
    } else if (text.includes('জ্ঞান') || text.includes('চিন্তা') || text.includes('কথা') || text.includes('বক্তৃতা') || text.includes('speak') || text.includes('think') || text.includes('mind') || text.includes('wise')) {
      thematicCategory = 'Mind, Intellect & Behavior';
    } else {
      thematicCategory = 'Society, Morals & Relations';
    }
  }

  // Fallback word family if missing
  let wordFamily = curated?.wordFamily;
  if (!wordFamily) {
    const base = word.word;
    if (word.partOfSpeech === 'noun') {
      wordFamily = { noun: base, adjective: base.endsWith('tion') ? base.replace(/tion$/, 'tive') : `${base}al` };
    } else if (word.partOfSpeech === 'adjective') {
      wordFamily = { adjective: base, noun: `${base}ness`, adverb: `${base}ly` };
    } else if (word.partOfSpeech === 'verb') {
      wordFamily = { verb: base, noun: `${base}tion` };
    } else {
      wordFamily = { adjective: base };
    }
  }

  // Fallback collocation
  const collocation = curated?.collocation || {
    phrase: `${word.word} in context`,
    bangla: `${word.banglaMeaning}-এর বাস্তব প্রয়োগ`
  };

  // Fallback bangla idiom/colloquial
  const banglaIdiom = curated?.banglaIdiom || {
    idiom: word.banglaMeaning.split(/[,;]/)[0]?.trim() || word.banglaMeaning,
    explanation: `বাস্তব ভাষায় '${word.word}' বোঝাতে এই ভাবটি প্রয়োগ করা হয়।`
  };

  return {
    tone,
    examTags,
    thematicCategory,
    banglaIdiom,
    wordFamily,
    collocation,
    pitfall: curated?.pitfall,
    intensity: curated?.intensity,
    idiomConnection: curated?.idiomConnection
  };
}

export const THEMATIC_CATEGORIES = [
  { id: 'all', title: 'সব বিষয়', icon: 'Sparkles', count: 1850 },
  { id: 'Crime, Court & Law', title: '⚖️ Crime, Court & Law', icon: 'Scale', count: 180 },
  { id: 'Politics, Power & Governance', title: '🏛️ Politics & Power', icon: 'Landmark', count: 240 },
  { id: 'Money, Trade & Wealth', title: '💰 Money & Wealth', icon: 'Coins', count: 190 },
  { id: 'Emotion, Character & Temper', title: '❤️ Emotion & Temper', icon: 'Heart', count: 350 },
  { id: 'Mind, Intellect & Behavior', title: '🧠 Intellect & Speech', icon: 'Brain', count: 420 },
  { id: 'Society, Morals & Relations', title: '🤝 Society & Morals', icon: 'Users', count: 470 },
];
