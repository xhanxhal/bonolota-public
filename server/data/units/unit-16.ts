import { UnitInfo } from '../types';

export const unit16: UnitInfo = {
  id: 16,
  number: 16,
  title: 'Unit 16: Law, Justice & Legal Principles',
  subtitle: 'Day 16 — Jurisprudence, Statutes & Judicial Due Process',
  description: 'Master legal vocabulary, courtroom terminology, civil rights, and statutory interpretation.',
  themeColor: 'amber',
  words: [
    {
      id: 'u16_acquittal_1',
      unitId: 16,
      word: 'Acquittal',
      banglaMeaning: 'আদালত কর্তৃক নির্দোষ সাব্যস্ত করে খালাস প্রদান',
      pronunciation: '/əˈkwɪt.əl/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The jury\'s unanimous acquittal cleared him of all criminal charges.',
          bangla: 'জুরিদের সর্বসম্মত খালাসের রায়ে তিনি সকল ফৌজদারি অপরাধের দায় থেকে মুক্তি পেলেন।'
        }
      ],
      synonyms: ["clearing", "exoneration", "absolution"],
      antonyms: ["conviction"],
      memoryTip: 'Ad + quit (free).',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_affidavit_2',
      unitId: 16,
      word: 'Affidavit',
      banglaMeaning: 'হলফনামা , শপথপূর্বক লিখিত জবানবন্দি',
      pronunciation: '/ˌæf.ɪˈdeɪ.vɪt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The witness signed a sworn affidavit detailing the accident.',
          bangla: 'প্রত্যক্ষদর্শী দুর্ঘটনার বিস্তারিত বর্ণনা দিয়ে একটি শপথনামা স্বাক্ষর করলেন।'
        }
      ],
      synonyms: ["sworn statement", "deposition"],
      antonyms: [],
      memoryTip: 'He has stated on oath.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_bail_3',
      unitId: 16,
      word: 'Bail',
      banglaMeaning: 'জামিন',
      pronunciation: '/beɪl/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The judge granted bail on the condition that he surrender his passport.',
          bangla: 'পাসপোর্ট জমা দেওয়ার শর্তে বিচারক তার জামিন মঞ্জুর করলেন।'
        }
      ],
      synonyms: ["bond", "surety"],
      antonyms: [],
      memoryTip: 'Securing release.',
      difficulty: 'beginner'
    },
    {
      id: 'u16_caveat_4',
      unitId: 16,
      word: 'Caveat',
      banglaMeaning: 'আইনি সতর্কতা বা বিশেষ শর্ত',
      pronunciation: '/ˈkæv.i.æt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The contract carried an explicit caveat regarding delayed payments.',
          bangla: 'চুক্তিতে বিলম্বে অর্থ পরিশোধের ব্যাপারে একটি সুস্পষ্ট শর্ত ও সতর্কতা ছিল।'
        }
      ],
      synonyms: ["warning", "stipulation", "proviso"],
      antonyms: [],
      memoryTip: 'Let him beware.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_deposition_5',
      unitId: 16,
      word: 'Deposition',
      banglaMeaning: 'আদালতের বাইরে শপথ নিয়ে দেওয়া সাক্ষ্য',
      pronunciation: '/ˌdep.əˈzɪʃ.ən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Attorneys questioned the executive during a four-hour video deposition.',
          bangla: 'চার ঘণ্টার ভিডিও সাক্ষ্যগ্রহণে আইনজীবীরা কর্মকর্তার জবানবন্দি গ্রহণ করলেন।'
        }
      ],
      synonyms: ["testimony", "sworn evidence"],
      antonyms: [],
      memoryTip: 'Putting down testimony.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_exonerate_6',
      unitId: 16,
      word: 'Exonerate',
      banglaMeaning: 'দোষমুক্ত ঘোষণা করা বা অভিযোগ থেকে অব্যাহতি দেওয়া',
      pronunciation: '/ɪɡˈzɒn.ə.reɪt/',
      partOfSpeech: 'verb',
      examples: [
        {
          english: 'New DNA evidence exonerated the wrongly imprisoned man.',
          bangla: 'নতুন ডিএনএ প্রমাণের ভিত্তিতে অন্যায়ভাবে সাজাপ্রাপ্ত ব্যক্তিটিকে নির্দোষ ঘোষণা করা হলো।'
        }
      ],
      synonyms: ["vindicate", "absolve", "acquit"],
      antonyms: ["convict", "incriminate"],
      memoryTip: 'Ex (out of) + onus (burden).',
      difficulty: 'advanced'
    },
    {
      id: 'u16_felony_7',
      unitId: 16,
      word: 'Felony',
      banglaMeaning: 'গুরুতর ফৌজদারি অপরাধ',
      pronunciation: '/ˈfel.ə.ni/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Armed robbery is classified as a severe felony in criminal law.',
          bangla: 'ফৌজদারি আইনে সশস্ত্র ডাকাতিকে একটি চরম গুরুতর অপরাধ হিসেবে গণ্য করা হয়।'
        }
      ],
      synonyms: ["major crime", "grave offense"],
      antonyms: ["misdemeanor"],
      memoryTip: 'Heavy evil deed.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_grievance_8',
      unitId: 16,
      word: 'Grievance',
      banglaMeaning: 'ন্যায়সঙ্গত ক্ষোভ বা আনুষ্ঠানিক অভিযোগ',
      pronunciation: '/ˈɡriː.vəns/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The labor union submitted an official grievance regarding workplace safety.',
          bangla: 'শ্রমিক ইউনিয়ন কাজের পরিবেশের নিরাপত্তা নিয়ে একটি আনুষ্ঠানিক অভিযোগ জমা দিল।'
        }
      ],
      synonyms: ["complaint", "injustice", "objection"],
      antonyms: [],
      memoryTip: 'Gravis = heavy grief.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_habeascorpus_9',
      unitId: 16,
      word: 'Habeas corpus',
      banglaMeaning: 'বন্দী হাজির করার অধিকার বা রিট',
      pronunciation: '/ˌheɪ.bi.əs ˈkɔː.pəs/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The lawyer filed a petition for habeas corpus challenging illegal detention.',
          bangla: 'বেআইনি আটকের বিরুদ্ধে আইনজীবী আদালতে বন্দী হাজির করার রিট আবেদন করলেন।'
        }
      ],
      synonyms: ["unlawful detention writ"],
      antonyms: [],
      memoryTip: 'That you have the body.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_injunction_10',
      unitId: 16,
      word: 'Injunction',
      banglaMeaning: 'আদালতের নিষেধাজ্ঞা বা স্থগিতাদেশ',
      pronunciation: '/ɪnˈdʒʌŋk.ʃən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The court issued a temporary injunction halting demolition of the monument.',
          bangla: 'ঐতিহাসিক সৌধটি ভাঙার ওপর আদালত একটি অন্তর্বর্তীকালীন স্থগিতাদেশ জারি করলেন।'
        }
      ],
      synonyms: ["restraining order", "ban", "decree"],
      antonyms: [],
      memoryTip: 'Joining by court order.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_jurisprudence_11',
      unitId: 16,
      word: 'Jurisprudence',
      banglaMeaning: 'আইনশাস্ত্র বা আইনের মৌলিক দর্শন',
      pronunciation: '/ˌdʒʊə.rɪsˈpruː.dəns/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'She authored several authoritative textbooks on constitutional jurisprudence.',
          bangla: 'তিনি সাংবিধানিক আইনশাস্ত্রের ওপর বেশ কয়েকটি প্রামাণ্য পাঠ্যবই রচনা করেছেন।'
        }
      ],
      synonyms: ["legal philosophy", "case law"],
      antonyms: [],
      memoryTip: 'Juris (law) + prudence (wisdom).',
      difficulty: 'advanced'
    },
    {
      id: 'u16_litigation_12',
      unitId: 16,
      word: 'Litigation',
      banglaMeaning: 'মামলা মোকদ্দমা',
      pronunciation: '/ˌlɪt.ɪˈɡeɪ.ʃən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The software patent was tied up in costly international litigation.',
          bangla: 'সফটওয়্যারটির পেটেন্ট নিয়ে দীর্ঘ ও ব্যয়বহুল আন্তর্জাতিক মামলা চলছিল।'
        }
      ],
      synonyms: ["lawsuit", "legal dispute"],
      antonyms: [],
      memoryTip: 'Litigare = dispute at law.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_misdemeanor_13',
      unitId: 16,
      word: 'Misdemeanor',
      banglaMeaning: 'লঘু বা তুলনামূলক ছোট অপরাধ',
      pronunciation: '/ˌmɪs.dɪˈmiː.nər/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Jaywalking is considered a minor misdemeanor punishable by fine.',
          bangla: 'অননুমোদিতভাবে রাস্তা পার হওয়া একটি ছোট অপরাধ যার জন্য জরিমানা হতে পারে।'
        }
      ],
      synonyms: ["minor infraction", "petty offense"],
      antonyms: ["felony"],
      memoryTip: 'Bad demeanor.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_negligence_14',
      unitId: 16,
      word: 'Negligence',
      banglaMeaning: 'চরম অবহেলা বা কর্তব্যে গাফিলতি',
      pronunciation: '/ˈneɡ.lɪ.dʒəns/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The hospital was sued for gross professional medical negligence.',
          bangla: 'চিকিৎসায় মারাত্মক গাফিলতির জন্য হাসপাতালটির বিরুদ্ধে মামলা দায়ের করা হয়েছিল।'
        }
      ],
      synonyms: ["carelessness", "dereliction", "slackness"],
      antonyms: ["diligence"],
      memoryTip: 'Neg-legere = not choosing care.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_overrule_15',
      unitId: 16,
      word: 'Overrule',
      banglaMeaning: 'আগের সিদ্ধান্ত বা আপত্তি নাকচ করে দেওয়া',
      pronunciation: '/ˌəʊ.vəˈruːl/',
      partOfSpeech: 'verb',
      examples: [
        {
          english: 'The appellate court overruled the lower court\'s contentious decision.',
          bangla: 'আপিল আদালত নিম্ন আদালতের বিতর্কিত রায়টি বাতিল করে নাকচ করে দিল।'
        }
      ],
      synonyms: ["nullify", "invalidate", "reverse"],
      antonyms: ["uphold"],
      memoryTip: 'Rule over.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_precedent_16',
      unitId: 16,
      word: 'Precedent',
      banglaMeaning: 'নজির বা পূর্ববর্তী দৃষ্টান্তমূলক বিচারিক সিদ্ধান্ত',
      pronunciation: '/ˈpres.ɪ.dənt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The ruling established an enduring judicial precedent for press freedom.',
          bangla: 'এই রায়টি গণমাধ্যমের স্বাধীনতার পক্ষে এক স্থায়ী বিচারিক নজির স্থাপন করল।'
        }
      ],
      synonyms: ["prior instance", "benchmark", "model"],
      antonyms: [],
      memoryTip: 'Pre-ceding standard.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_quash_17',
      unitId: 16,
      word: 'Quash',
      banglaMeaning: 'আদালতের আদেশ বা অভিযোগ বাতিল করা',
      pronunciation: '/kwɒʃ/',
      partOfSpeech: 'verb',
      examples: [
        {
          english: 'The high court quashed the flawed indictment against the journalist.',
          bangla: 'হাইকোর্ট সাংবাদিকের বিরুদ্ধে আনা ত্রুটিপূর্ণ অভিযোগটি খারিজ করে বাতিল করলেন।'
        }
      ],
      synonyms: ["annul", "void", "cancel"],
      antonyms: ["uphold"],
      memoryTip: 'Quash and crush.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_restitution_18',
      unitId: 16,
      word: 'Restitution',
      banglaMeaning: 'ক্ষতিপূরণ বা আগের অধিকার পুনর্বহাল',
      pronunciation: '/ˌres.tɪˈtʃuː.ʃən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The judge ordered the thief to pay full financial restitution to victims.',
          bangla: 'বিচারক চোরকে ক্ষতিগ্রস্তদের পূর্ণ আর্থিক ক্ষতিপূরণ দেওয়ার নির্দেশ দিলেন।'
        }
      ],
      synonyms: ["compensation", "reparation", "redress"],
      antonyms: [],
      memoryTip: 'Restituting loss.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_statute_19',
      unitId: 16,
      word: 'Statute',
      banglaMeaning: 'সংসদ বা আইনসভা প্রণীত লিখিত আইন',
      pronunciation: '/ˈstætʃ.uːt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The newly enacted environmental statute limits industrial emissions.',
          bangla: 'নতুন প্রণীত পরিবেশ সংরক্ষণ আইন শিল্পকারখানার ক্ষতিকর ধোঁয়া নির্গমনকে সীমিত করে।'
        }
      ],
      synonyms: ["act", "law", "decree"],
      antonyms: [],
      memoryTip: 'Statute standing law.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_tort_20',
      unitId: 16,
      word: 'Tort',
      banglaMeaning: 'দেওয়ানি অপরাধ বা ক্ষতি যা মামলাযোগ্য',
      pronunciation: '/tɔːt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Personal injury suits are common examples of civil tort claims.',
          bangla: 'ব্যক্তিগত আঘাতজনিত ক্ষতিপূরণের মামলাগুলো দেওয়ানি অপরাধের অতি পরিচিত উদাহরণ।'
        }
      ],
      synonyms: ["civil wrong"],
      antonyms: [],
      memoryTip: 'Tortus = twisted wrong.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_unconstitutional_21',
      unitId: 16,
      word: 'Unconstitutional',
      banglaMeaning: 'অসাংবিধানিক বা সংবিধান পরিপন্থী',
      pronunciation: '/ˌʌn.kɒn.stɪˈtʃuː.ʃən.əl/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'The supreme bench struck down the controversial censorship law as unconstitutional.',
          bangla: 'সুপ্রিম কোর্টের বেঞ্চ বিতর্কিত সেন্সরশিপ আইনটিকে অসাংবিধানিক বলে খারিজ করে দিল।'
        }
      ],
      synonyms: ["illegal", "invalid"],
      antonyms: ["constitutional"],
      memoryTip: 'Against constitution.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_verdict_22',
      unitId: 16,
      word: 'Verdict',
      banglaMeaning: 'আদালতের চূড়ান্ত রায় বা সিদ্ধান্ত',
      pronunciation: '/ˈvɜː.dɪkt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Tension filled the courtroom as the foreperson delivered the guilty verdict.',
          bangla: 'জুরিদের প্রধান যখন দোষী সাব্যস্ত করে রায় ঘোষণা করলেন, তখন আদালতে পিনপতন নীরবতা নেমে এল।'
        }
      ],
      synonyms: ["judgment", "ruling", "decision"],
      antonyms: [],
      memoryTip: 'Vere (truly) + dictum (said).',
      difficulty: 'beginner'
    },
    {
      id: 'u16_warrant_23',
      unitId: 16,
      word: 'Warrant',
      banglaMeaning: 'গ্রেপ্তারি পরোয়ানা বা তল্লাশির আইনি আদেশপত্র',
      pronunciation: '/ˈwɒr.ənt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Officers presented a search warrant issued by the magistrate.',
          bangla: 'পুলিশ কর্মকর্তারা ম্যাজিস্ট্রেটের জারি করা তল্লাশির পরোয়ানা প্রদর্শন করলেন।'
        }
      ],
      synonyms: ["authorization", "writ", "license"],
      antonyms: [],
      memoryTip: 'Legal warrant.',
      difficulty: 'beginner'
    },
    {
      id: 'u16_adjudicate_24',
      unitId: 16,
      word: 'Adjudicate',
      banglaMeaning: 'আইনত বিচার করে বিরোধ নিষ্পত্তি করা',
      pronunciation: '/əˈdʒuː.dɪ.keɪt/',
      partOfSpeech: 'verb',
      examples: [
        {
          english: 'The industrial tribunal was formed to adjudicate the labor dispute.',
          bangla: 'শ্রম বিরোধ নিষ্পত্তি ও বিচারের জন্য একটি বিশেষ শিল্প ট্রাইব্যুনাল গঠন করা হলো।'
        }
      ],
      synonyms: ["judge", "arbitrate", "settle"],
      antonyms: [],
      memoryTip: 'Act as judge.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_beneficiary_25',
      unitId: 16,
      word: 'Beneficiary',
      banglaMeaning: 'উত্তরাধিকারী বা স্বার্থভোগী ব্যক্তি',
      pronunciation: '/ˌben.ɪˈfɪʃ.ər.i/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'She was named as the primary beneficiary of her grandfather\'s estate.',
          bangla: 'তার দাদার সম্পত্তির প্রধান উত্তরাধিকারী হিসেবে তার নাম ঘোষণা করা হলো।'
        }
      ],
      synonyms: ["heir", "recipient", "legatee"],
      antonyms: [],
      memoryTip: 'Bene (good) + facere.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_culpability_26',
      unitId: 16,
      word: 'Culpability',
      banglaMeaning: 'অপরাধে দোষী হওয়ার দায় বা অপরাধযোগ্যতা',
      pronunciation: '/ˌkʌl.pəˈbɪl.ə.ti/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The investigation determined corporate culpability for the toxic spill.',
          bangla: 'তদন্তে বিষাক্ত রাসায়নিক ছড়িয়ে পড়ার ঘটনায় প্রতিষ্ঠানের অপরাধমূলক দায় প্রমাণিত হলো।'
        }
      ],
      synonyms: ["guilt", "blameworthiness", "liability"],
      antonyms: ["innocence"],
      memoryTip: 'Culpa = fault.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_defamation_27',
      unitId: 16,
      word: 'Defamation',
      banglaMeaning: 'মানহানি বা কুৎসা রটনা',
      pronunciation: '/ˌdef.əˈmeɪ.ʃən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The celebrity filed a defamation lawsuit against the gossip magazine.',
          bangla: 'তারকা ব্যক্তিটি কুৎসা রটনাকারী ম্যাগাজিনের বিরুদ্ধে মানহানির মামলা করলেন।'
        }
      ],
      synonyms: ["slander", "libel", "calumny"],
      antonyms: ["praise"],
      memoryTip: 'Destroying fame.',
      difficulty: 'intermediate'
    },
    {
      id: 'u16_embezzlement_28',
      unitId: 16,
      word: 'Embezzlement',
      banglaMeaning: 'সরকারি বা প্রাতিষ্ঠানিক তহবিল আত্মসাৎ',
      pronunciation: '/ɪmˈbez.əl.mənt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'He faced ten years in prison for multi-million dollar bank embezzlement.',
          bangla: 'ব্যাংকের কোটি টাকা আত্মসাতের দায়ে তার দশ বছরের কারাদণ্ড হতে পারে।'
        }
      ],
      synonyms: ["misappropriation", "fraud"],
      antonyms: [],
      memoryTip: 'Stealing entrusted money.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_fiduciary_29',
      unitId: 16,
      word: 'Fiduciary',
      banglaMeaning: 'আমানতদারিত্বমূলক দায়িত্বসম্পন্ন',
      pronunciation: '/fɪˈdjuː.ʃər.i/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Attorneys bear a fiduciary duty to act in the best interests of clients.',
          bangla: 'ক্লায়েন্টের সর্বোত্তম স্বার্থ রক্ষা করা আইনজীবীর নৈতিক ও আইনি আমানতদারিত্বের দায়িত্ব।'
        }
      ],
      synonyms: ["trustee-based"],
      antonyms: [],
      memoryTip: 'Fides = faith/trust.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_gavel_30',
      unitId: 16,
      word: 'Gavel',
      banglaMeaning: 'বিচারকের হাতুড়ি',
      pronunciation: '/ˈɡæv.əl/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The judge banged her wooden gavel to call the courtroom to order.',
          bangla: 'আদালতকে শান্ত করতে বিচারক তার কাঠের হাতুড়িটি টেবিলের ওপর ঠুকলেন।'
        }
      ],
      synonyms: ["mallet"],
      antonyms: [],
      memoryTip: 'Judge\'s hammer.',
      difficulty: 'beginner'
    },
    {
      id: 'u16_indictment_31',
      unitId: 16,
      word: 'Indictment',
      banglaMeaning: 'আনুষ্ঠানিক অভিযোগপত্র',
      pronunciation: '/ɪnˈdaɪt.mənt/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The grand jury returned a federal indictment charging tax evasion.',
          bangla: 'গ্র্যান্ড জুরি কর ফাঁকির অভিযোগে একটি কেন্দ্রীয় আনুষ্ঠানিক অভিযোগপত্র গ্রহণ করল।'
        }
      ],
      synonyms: ["formal charge", "accusation"],
      antonyms: [],
      memoryTip: 'Dictate indictment.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_larceny_32',
      unitId: 16,
      word: 'Larceny',
      banglaMeaning: 'চুরি বা পরস্বাপহরণ',
      pronunciation: '/ˈlɑː.sən.i/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Grand larceny involves the unlawful theft of high-value property.',
          bangla: 'অধিক মূল্যের সম্পদ চুরির ঘটনাকে গুরুতর চুরি হিসেবে সংজ্ঞায়িত করা হয়।'
        }
      ],
      synonyms: ["theft", "stealing", "robbery"],
      antonyms: [],
      memoryTip: 'Latro = robber.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_perjury_33',
      unitId: 16,
      word: 'Perjury',
      banglaMeaning: 'আদালতে হলফ করে মিথ্যা সাক্ষ্য প্রদান',
      pronunciation: '/ˈpɜː.dʒər.i/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The corrupt witness was arrested immediately for committing perjury.',
          bangla: 'আদালতে মিথ্যা সাক্ষ্য দেওয়ার অভিযোগে দুর্নীতিবাজ সাক্ষীকে তাৎক্ষণিকভাবে গ্রেপ্তার করা হলো।'
        }
      ],
      synonyms: ["false oath", "lying under oath"],
      antonyms: ["truthfulness"],
      memoryTip: 'Swearing falsely.',
      difficulty: 'advanced'
    },
    {
      id: 'u16_subpoena_34',
      unitId: 16,
      word: 'Subpoena',
      banglaMeaning: 'আদালতে হাজির হওয়ার বাধ্যতামূলক সমন',
      pronunciation: '/səˈpiː.nə/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The senate committee issued a subpoena demanding internal emails.',
          bangla: 'সিনেট কমিটি ভেতরের ইমেইল তলব করে একটি বাধ্যতামূলক আইনি সমন জারি করল।'
        }
      ],
      synonyms: ["summons", "court order"],
      antonyms: [],
      memoryTip: 'Sub (under) poena (penalty).',
      difficulty: 'advanced'
    }
  ]
};
