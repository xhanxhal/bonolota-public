export interface ConfusingWordItem {
  id: string;
  pair: [
    {
      word: string;
      pronunciation: string;
      partOfSpeech: string;
      banglaMeaning: string;
      difference: string;
      example: string;
    },
    {
      word: string;
      pronunciation: string;
      partOfSpeech: string;
      banglaMeaning: string;
      difference: string;
      example: string;
    }
  ];
  mnemonicTip: string;
  examAppearance?: string;
}

export const CONFUSING_WORDS: ConfusingWordItem[] = [
  {
    id: 'compliment-complement',
    pair: [
      {
        word: 'Compliment',
        pronunciation: '/ˈkɒm.plɪ.mənt/',
        partOfSpeech: 'noun / verb',
        banglaMeaning: 'প্রশংসা করা / সাধুবাদ',
        difference: "'I' অক্ষরটি মনে রাখুন — 'I like to receive a compliment' (প্রশংসা পাওয়া আমার পছন্দ)।",
        example: 'He gave her a lovely compliment on her presentation.'
      },
      {
        word: 'Complement',
        pronunciation: '/ˈkɒm.plɪ.ment/',
        partOfSpeech: 'noun / verb',
        banglaMeaning: 'পরিপূরক হওয়া / সম্পূর্ণ করা',
        difference: "'E' অক্ষরটি মনে রাখুন — 'Complete' (সম্পূর্ণ) করার সাথে সম্পৃক্ত।",
        example: 'The sauce is the perfect complement to the grilled fish.'
      }
    ],
    mnemonicTip: 'Compliment-এ "I" আছে (I like praise), আর Complement-এ "E" আছে যা "Complete" শব্দের মতো!',
    examAppearance: '৪৪তম BCS, ঢাবি IBA, বাংলাদেশ ব্যাংক AD'
  },
  {
    id: 'ingenious-ingenuous',
    pair: [
      {
        word: 'Ingenious',
        pronunciation: '/ɪnˈdʒiː.ni.əs/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'বুদ্ধিদীপ্ত / উদ্ভাবনশীল',
        difference: "'Genius' শব্দের মতো—অত্যন্ত চতুর ও দক্ষ সৃষ্টিশীল মানুষ বা বুদ্ধি।",
        example: 'She came up with an ingenious solution to the power shortage.'
      },
      {
        word: 'Ingenuous',
        pronunciation: '/ɪnˈdʒen.ju.əs/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'অকপট / সহজ-সরল / ভানহীন',
        difference: "'Genuine' বা সরল মনের মতো—যে কোনো ছলচাতুরী বোঝে না।",
        example: 'His ingenuous smile proved he was telling the plain truth.'
      }
    ],
    mnemonicTip: 'Ingenious = Genius (মাথাওয়ালা / বুদ্ধিমান); Ingenuous = Innocent (নিষ্পাপ / সহজ-সরল)।',
    examAppearance: '৪১তম BCS, IBA ভর্তি পরীক্ষা, GRE Core'
  },
  {
    id: 'affect-effect',
    pair: [
      {
        word: 'Affect',
        pronunciation: '/əˈfekt/',
        partOfSpeech: 'verb (সাধারণত)',
        banglaMeaning: 'প্রভাবিত করা / ক্ষতিসাধন করা',
        difference: "Action বা কাজ বোঝায় (A for Action = Affect)।",
        example: 'The cold weather will directly affect your health.'
      },
      {
        word: 'Effect',
        pronunciation: '/ɪˈfekt/',
        partOfSpeech: 'noun (সাধারণত)',
        banglaMeaning: 'ফলাফল / প্রভাব',
        difference: "End result বা পরিণতি বোঝায় (E for End result = Effect)।",
        example: 'The medicine had an immediate calming effect.'
      }
    ],
    mnemonicTip: 'RAVEN নিয়ম: R = Remember, A = Affect is a V = Verb, E = Effect is a N = Noun!',
    examAppearance: '৩৮তম ও ৪৩তম BCS, সকল সরকারি ব্যাংক'
  },
  {
    id: 'disinterested-uninterested',
    pair: [
      {
        word: 'Disinterested',
        pronunciation: '/dɪsˈɪn.trəs.tɪd/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'পক্ষপাতহীন / নির্লিপ্ত / নিরপেক্ষ',
        difference: "যার কোনো ব্যক্তিগত স্বার্থ নেই (Unbiased / Impartial বিচারক বা রেফারির মতো)।",
        example: 'A lawyer should give disinterested and objective advice.'
      },
      {
        word: 'Uninterested',
        pronunciation: '/ʌnˈɪn.trəs.tɪd/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'উদাসীন / অনাগ্রহী',
        difference: "যার বিষয়টিতে কোনো কৌতূহল বা আগ্রহ নেই (Bored / Not interested)।",
        example: 'He seemed totally uninterested in cricket matches.'
      }
    ],
    mnemonicTip: 'Disinterested = জাজ বা বিচারক (কোনো স্বার্থ নেই); Uninterested = ঘুমন্ত ছাত্র (পড়ায় মন নেই)।',
    examAppearance: '৪০তম BCS, ঢাবি সি ইউনিট, IBA'
  },
  {
    id: 'averse-adverse',
    pair: [
      {
        word: 'Averse',
        pronunciation: '/əˈvɜːs/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'বিমুখ / অপছন্দকারী (মানুষের মনোভাব)',
        difference: "ব্যক্তির অনিচ্ছা বোঝাতে সাধারণত 'averse to' ব্যবহৃত হয়।",
        example: 'He is utterly averse to taking unnecessary financial risks.'
      },
      {
        word: 'Adverse',
        pronunciation: '/ˈæd.vɜːs/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'প্রতিকূল / ক্ষতিকর (পরিস্থিতি বা আবহাওয়া)',
        difference: "পরিস্থিতি বা আবহাওয়া বোঝায় ('Adverse conditions / adverse reaction')।",
        example: 'The flight was cancelled due to adverse weather conditions.'
      }
    ],
    mnemonicTip: 'Averse = মানুষের অনিচ্ছা (Person); Adverse = খারাপ পরিস্থিতি (Adversity)।',
    examAppearance: '৩৫তম BCS, Sonali Bank Officer'
  },
  {
    id: 'stationery-stationary',
    pair: [
      {
        word: 'Stationery',
        pronunciation: '/ˈsteɪ.ʃən.ri/',
        partOfSpeech: 'noun',
        banglaMeaning: 'কাগজ-কলম ও পড়ার সরঞ্জাম',
        difference: "'E' মনে রাখুন — 'E for Envelope / Eraser / Pen'।",
        example: 'I bought some notebooks and pens from the stationery shop.'
      },
      {
        word: 'Stationary',
        pronunciation: '/ˈsteɪ.ʃən.ri/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'স্থির / অচল / গতিহীন',
        difference: "'A' মনে রাখুন — 'A for At rest (স্থির)'।",
        example: 'The car remained stationary at the red signal.'
      }
    ],
    mnemonicTip: 'StationEry = Envelopes & Pens; StationAry = At rest (এক জায়গায় দাঁড়িয়ে থাকা)।',
    examAppearance: 'প্রাথমিক সহকারী শিক্ষক ও বিসিএস প্রিলিমিনারি'
  },
  {
    id: 'discrete-discreet',
    pair: [
      {
        word: 'Discrete',
        pronunciation: '/dɪˈskriːt/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'স্বতন্ত্র / পৃথক / আলাদা অংশ',
        difference: "এখানে 't' অক্ষরটি দুটি 'e'-কে আলাদা করে রেখেছে (Discre-t-e = আলাদা)।",
        example: 'The project is broken down into four discrete phases.'
      },
      {
        word: 'Discreet',
        pronunciation: '/dɪˈskriːt/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'সতর্ক / সাবধানী / গোপনতা রক্ষাকারী',
        difference: "এখানে দুটি 'e' পাশাপাশি লুকিয়ে রয়েছে (গোপনে কথা বলার মতো)।",
        example: 'She made discreet inquiries about his background.'
      }
    ],
    mnemonicTip: 'DiscreTe = T দুটো E-কে পৃথক করেছে (Separate); DiscrEEt = দুটো E কানে কানে ফিসফিস করছে (Secret)!',
    examAppearance: '৩৬তম BCS, IBA MBA'
  },
  {
    id: 'elicit-illicit',
    pair: [
      {
        word: 'Elicit',
        pronunciation: '/ɪˈlɪs.ɪt/',
        partOfSpeech: 'verb',
        banglaMeaning: 'বের করে আনা / উদঘাটন করা',
        difference: "'E' দিয়ে শুরু — সত্য বা তথ্য নিষ্কাশন (Extract) করা।",
        example: 'The detective tried to elicit information from the suspect.'
      },
      {
        word: 'Illicit',
        pronunciation: '/ɪˈlɪs.ɪt/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'অবৈধ / আইনবহির্ভূত',
        difference: "'Ill' বা 'Illegal' শব্দ মনে রাখুন।",
        example: 'He was arrested for smuggling illicit substances.'
      }
    ],
    mnemonicTip: 'Elicit = Extract (বের করে আনা); Illicit = Illegal (অবৈধ)।',
    examAppearance: '৪২তম BCS, BIBM'
  },
  {
    id: 'eminent-imminent',
    pair: [
      {
        word: 'Eminent',
        pronunciation: '/ˈem.ɪ.nənt/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'বিশিষ্ট / প্রখ্যাত / খ্যাতনামা',
        difference: "সম্মানী ব্যক্তি বোঝাতে ব্যবহৃত হয়।",
        example: 'He is an eminent professor of linguistics.'
      },
      {
        word: 'Imminent',
        pronunciation: '/ˈɪm.ɪ.nənt/',
        partOfSpeech: 'adjective',
        banglaMeaning: 'আসন্ন / অবিলম্বে ঘটবে এমন',
        difference: "'In a minute' মনে রাখুন—খুব শীঘ্রই ঘটতে যাওয়া বিপদ বা ঘটনা।",
        example: 'The dark clouds indicated that heavy rain was imminent.'
      }
    ],
    mnemonicTip: 'Eminent = বিখ্যাত মানুষ; Imminent = Immediate / শীঘ্রই ঘটতে যাওয়া ঘটনা।',
    examAppearance: '৩৭তম BCS, Agrani Bank'
  },
  {
    id: 'principal-principle',
    pair: [
      {
        word: 'Principal',
        pronunciation: '/ˈprɪn.sə.pəl/',
        partOfSpeech: 'noun / adjective',
        banglaMeaning: 'অধ্যক্ষ / প্রধান / মূলধন',
        difference: "'PAL' মনে রাখুন — 'The principal is your pal' (অধ্যক্ষ আপনার বন্ধু)।",
        example: 'Our principal gave an inspiring speech on Independence Day.'
      },
      {
        word: 'Principle',
        pronunciation: '/ˈprɪn.sə.pəl/',
        partOfSpeech: 'noun',
        banglaMeaning: 'নীতি / আদর্শ / বৈজ্ঞানিক সূত্র',
        difference: "'PLE' মনে রাখুন — 'Rule' (নিয়ম ও নীতি)।",
        example: 'He is a man of high moral principles.'
      }
    ],
    mnemonicTip: 'PrinciPAL = মানুষ/প্রধান; PrinciPLE = Rule/নীতি।',
    examAppearance: '৪৪তম BCS, ঢাবি ভর্তি পরীক্ষা'
  }
];
