import { UnitInfo } from '../types';

export const unit15: UnitInfo = {
  id: 15,
  number: 15,
  title: 'Unit 15: Health, Medicine & Human Biology',
  subtitle: 'Day 15 — Pathology, Immunology & Healing Science',
  description: 'Examine clinical medical terms, physiological systems, infectious diseases, and therapeutics.',
  themeColor: 'emerald',
  words: [
    {
      id: 'u15_acute_1',
      unitId: 15,
      word: 'Acute',
      banglaMeaning: 'তীব্র , আকস্মিক ও মারাত্মক রোগাবস্থা',
      pronunciation: '/əˈkjuːt/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'He suffered an acute appendicitis attack requiring surgery.',
          bangla: 'সে অ্যাপেন্ডিসাইটিসের তীব্র ব্যথায় আক্রান্ত হয়ে জরুরি অস্ত্রোপচারের মুখোমুখি হলো।'
        }
      ],
      synonyms: ["severe", "sharp", "critical"],
      antonyms: ["chronic", "mild"],
      memoryTip: 'Sharp like an acute angle.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_benign_2',
      unitId: 15,
      word: 'Benign',
      banglaMeaning: 'নিরীহ , ক্যান্সার নয় এমন নির্দোষ টিউমার',
      pronunciation: '/bɪˈnaɪn/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Biopsy results confirmed the lump was completely benign.',
          bangla: 'বায়োপসি পরীক্ষায় নিশ্চিত হওয়া গেল যে মাংসপিণ্ডটি সম্পূর্ণ ক্যান্সারমুক্ত ও নির্দোষ।'
        }
      ],
      synonyms: ["harmless", "non-cancerous"],
      antonyms: ["malignant"],
      memoryTip: 'Bene = good/kind.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_chronic_3',
      unitId: 15,
      word: 'Chronic',
      banglaMeaning: 'দীর্ঘস্থায়ী , দীর্ঘমেয়াদী রোগ',
      pronunciation: '/ˈkrɒn.ɪk/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Physical therapy helps patients manage chronic joint pain.',
          bangla: 'ফিজিওথেরাপি রোগীদের দীর্ঘস্থায়ী অস্থিসন্ধির ব্যথা নিয়ন্ত্রণে রাখতে সহায়তা করে।'
        }
      ],
      synonyms: ["persistent", "long-standing"],
      antonyms: ["acute", "temporary"],
      memoryTip: 'Chronos = time.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_diagnosis_4',
      unitId: 15,
      word: 'Diagnosis',
      banglaMeaning: 'রোগ নির্ণয়',
      pronunciation: '/ˌdaɪ.əɡˈnəʊ.sɪs/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Early diagnosis significantly increases survival rates for patients.',
          bangla: 'প্রাথমিক অবস্থায় রোগ নির্ণয় রোগীর সুস্থ হওয়ার সম্ভাবনা বহুগুণ বাড়িয়ে দেয়।'
        }
      ],
      synonyms: ["identification", "detection"],
      antonyms: [],
      memoryTip: 'Dia (through) + gnosis (know).',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_epidemic_5',
      unitId: 15,
      word: 'Epidemic',
      banglaMeaning: 'মহামারী',
      pronunciation: '/ˌep.ɪˈdem.ɪk/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Health agencies contained the regional influenza epidemic.',
          bangla: 'স্বাস্থ্য সংস্থাগুলো সফলভাবে আঞ্চলিক ফ্লু মহামারী নিয়ন্ত্রণে আনতে পেরেছিল।'
        }
      ],
      synonyms: ["outbreak", "plague"],
      antonyms: [],
      memoryTip: 'Epi (upon) + demos (people).',
      difficulty: 'beginner'
    },
    {
      id: 'u15_immune_6',
      unitId: 15,
      word: 'Immune',
      banglaMeaning: 'রোগপ্রতিরোধী , সুরক্ষিত',
      pronunciation: '/ɪˈmjuːn/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Vaccination renders children immune to debilitating polio.',
          bangla: 'টিকা দেওয়ার ফলে শিশুরা পোলিও রোগের বিরুদ্ধে দীর্ঘস্থায়ী প্রতিরোধ ক্ষমতা পায়।'
        }
      ],
      synonyms: ["resistant", "protected"],
      antonyms: ["vulnerable", "susceptible"],
      memoryTip: 'Exempt from disease.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_malignant_7',
      unitId: 15,
      word: 'Malignant',
      banglaMeaning: 'মারাত্মক বা ক্ষতিকর ক্যান্সারযুক্ত',
      pronunciation: '/məˈlɪɡ.nənt/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Surgeons successfully excised the malignant tumor.',
          bangla: 'শল্যচিকিৎসকেরা সফলভাবে মারাত্মক ক্যান্সারযুক্ত টিউমারটি শরীর থেকে কেটে ফেলেছিলেন।'
        }
      ],
      synonyms: ["cancerous", "harmful"],
      antonyms: ["benign"],
      memoryTip: 'Mal = evil/bad.',
      difficulty: 'advanced'
    },
    {
      id: 'u15_oncology_8',
      unitId: 15,
      word: 'Oncology',
      banglaMeaning: 'ক্যান্সার বা টিউমার বিষয়ক চিকিৎসাবিদ্যা',
      pronunciation: '/ɒnˈkɒl.ə.dʒi/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'She specialized in clinical oncology and radiotherapy.',
          bangla: 'তিনি ক্যান্সার চিকিৎসাবিদ্যা এবং রেডিওথেরাপিতে উচ্চতর দক্ষতা অর্জন করেছিলেন।'
        }
      ],
      synonyms: ["cancer medicine"],
      antonyms: [],
      memoryTip: 'Onkos (mass) + logy.',
      difficulty: 'advanced'
    },
    {
      id: 'u15_pathogen_9',
      unitId: 15,
      word: 'Pathogen',
      banglaMeaning: 'রোগসৃষ্টিকারী জীবাণু',
      pronunciation: '/ˈpæθ.ə.dʒən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Hospital sterilization destroys deadly fungal and bacterial pathogens.',
          bangla: 'হাসপাতালের জীবাণুনাশক ব্যবস্থা প্রাণঘাতী ব্যাকটেরিয়া ও ছত্রাক জীবাণু ধ্বংস করে।'
        }
      ],
      synonyms: ["germ", "microbe", "virus"],
      antonyms: [],
      memoryTip: 'Pathos (disease) + gen (maker).',
      difficulty: 'advanced'
    },
    {
      id: 'u15_remission_10',
      unitId: 15,
      word: 'Remission',
      banglaMeaning: 'রোগের উপশম বা সাময়িক লক্ষণমুক্তি',
      pronunciation: '/rɪˈmɪʃ.ən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'After intensive chemotherapy, her leukemia entered complete remission.',
          bangla: 'নিবিড় কেমোথেরাপির পর তার রক্তক্যান্সার পুরোপুরি উপশমে ও নিয়ন্ত্রণে চলে এল।'
        }
      ],
      synonyms: ["abatement", "recovery"],
      antonyms: ["relapse"],
      memoryTip: 'Sending away disease.',
      difficulty: 'advanced'
    },
    {
      id: 'u15_symptom_11',
      unitId: 15,
      word: 'Symptom',
      banglaMeaning: 'রোগের বাহ্যিক লক্ষণ',
      pronunciation: '/ˈsɪmp.təm/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Fever and persistent cough are common symptoms of pneumonia.',
          bangla: 'জ্বর এবং ক্রমাগত কাশি হলো নিউমোনিয়ার অত্যন্ত পরিচিত লক্ষণ।'
        }
      ],
      synonyms: ["indication", "manifestation", "sign"],
      antonyms: [],
      memoryTip: 'Sign of illness.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_therapeutic_12',
      unitId: 15,
      word: 'Therapeutic',
      banglaMeaning: 'উপশমকারী বা আরোগ্যমূলক',
      pronunciation: '/ˌθer.əˈpjuː.tɪk/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Warm herbal baths provide proven therapeutic benefits.',
          bangla: 'উষ্ণ ওষধি গোসল প্রমাণিত আরোগ্যমূলক উপকারিতা এনে দেয়।'
        }
      ],
      synonyms: ["healing", "curative", "medicinal"],
      antonyms: ["harmful"],
      memoryTip: 'Therapeia = healing.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_vaccine_13',
      unitId: 15,
      word: 'Vaccine',
      banglaMeaning: 'টিকা বা প্রতিষেধক',
      pronunciation: '/ˈvæk.siːn/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The polio vaccine saved generations of children from paralysis.',
          bangla: 'পোলিও টিকা প্রজন্মের পর প্রজন্ম ধরে শিশুদের পক্ষাঘাত থেকে রক্ষা করেছে।'
        }
      ],
      synonyms: ["inoculation", "immunization"],
      antonyms: [],
      memoryTip: 'Vacca = cow (cowpox).',
      difficulty: 'beginner'
    },
    {
      id: 'u15_antibody_14',
      unitId: 15,
      word: 'Antibody',
      banglaMeaning: 'অ্যান্টিবডি , দেহের রোগপ্রতিরোধী প্রোটিন',
      pronunciation: '/ˈæn.tiˌbɒd.i/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'White blood cells synthesize antibodies to fight viral infections.',
          bangla: 'রক্তের শ্বেত রক্তকণিকা ভাইরাস সংক্রমণের বিরুদ্ধে লড়াই করতে অ্যান্টিবডি তৈরি করে।'
        }
      ],
      synonyms: ["protective protein"],
      antonyms: [],
      memoryTip: 'Body against antigen.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_biopsy_15',
      unitId: 15,
      word: 'Biopsy',
      banglaMeaning: 'বায়োপসি , রোগ নির্ণয়ে জীবন্ত টিস্যু পরীক্ষা',
      pronunciation: '/ˈbaɪ.ɒp.si/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The dermatologist performed a skin biopsy to check for melanoma.',
          bangla: 'ত্বকের ক্যান্সার আছে কি না যাচাই করতে চর্মরোগ বিশেষজ্ঞ একটি বায়োপসি করলেন।'
        }
      ],
      synonyms: ["tissue sample test"],
      antonyms: [],
      memoryTip: 'Bios (life) + opsis (sight).',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_cardiovascular_16',
      unitId: 15,
      word: 'Cardiovascular',
      banglaMeaning: 'হৃৎপিণ্ড ও রক্তনালী সংক্রান্ত',
      pronunciation: '/ˌkɑː.di.əʊˈvæs.kjə.lər/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Aerobic exercise promotes long-term cardiovascular fitness.',
          bangla: 'নিয়মিত ব্যায়াম দীর্ঘমেয়াদে হৃৎপিণ্ড ও রক্তনালীর স্বাস্থ্য ভালো রাখে।'
        }
      ],
      synonyms: ["circulatory"],
      antonyms: [],
      memoryTip: 'Cardio (heart) + vascular.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_dermatology_17',
      unitId: 15,
      word: 'Dermatology',
      banglaMeaning: 'চর্মরোগবিদ্যা',
      pronunciation: '/ˌdɜː.məˈtɒl.ə.dʒi/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'She consulted a clinic specializing in adolescent dermatology.',
          bangla: 'তিনি কিশোর বয়সীদের ত্বকের চিকিৎসার জন্য একটি চর্মরোগ বিশেষজ্ঞ ক্লিনিকে গেলেন।'
        }
      ],
      synonyms: ["skin medicine"],
      antonyms: [],
      memoryTip: 'Derma = skin.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_endocrine_18',
      unitId: 15,
      word: 'Endocrine',
      banglaMeaning: 'অন্তঃক্ষরা গ্রন্থি বা হরমোন সংক্রান্ত',
      pronunciation: '/ˈen.də.krɪn/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'The thyroid is an essential gland of the human endocrine system.',
          bangla: 'থাইরয়েড হলো মানবদেহের হরমোন পরিচালনাকারী অন্তঃক্ষরা ব্যবস্থার এক গুরুত্বপূর্ণ গ্রন্থি।'
        }
      ],
      synonyms: ["hormonal"],
      antonyms: [],
      memoryTip: 'Endo (inside) + krinein (secrete).',
      difficulty: 'advanced'
    },
    {
      id: 'u15_fracture_19',
      unitId: 15,
      word: 'Fracture',
      banglaMeaning: 'হাড়ের চিড় বা ভাঙন',
      pronunciation: '/ˈfræk.tʃər/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The skier suffered a compound fracture of the tibia.',
          bangla: 'স্কি খেলোয়াড়টির পায়ের হাড় বেশ মারাত্মকভাবে ভেঙে গিয়েছিল।'
        }
      ],
      synonyms: ["break", "crack"],
      antonyms: [],
      memoryTip: 'Fractura = break.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_genetic_20',
      unitId: 15,
      word: 'Genetic',
      banglaMeaning: 'বংশগত বা জিনঘটিত',
      pronunciation: '/dʒəˈnet.ɪk/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Certain heart conditions have an established genetic basis.',
          bangla: 'কিছু বিশেষ ধরণের হৃদরোগের পেছনে প্রমাণিত বংশগত জিনের ভূমিকা থাকে।'
        }
      ],
      synonyms: ["hereditary", "inherited"],
      antonyms: [],
      memoryTip: 'Genos = birth/origin.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_hemorrhage_21',
      unitId: 15,
      word: 'Hemorrhage',
      banglaMeaning: 'প্রচণ্ড রক্তক্ষরণ',
      pronunciation: '/ˈhem.ər.ɪdʒ/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Surgeons operated urgently to arrest internal cranial hemorrhage.',
          bangla: 'মাথার ভেতরের প্রচণ্ড রক্তক্ষরণ বন্ধ করতে শল্যচিকিৎসকেরা দ্রুত অস্ত্রোপচার করলেন।'
        }
      ],
      synonyms: ["heavy bleeding"],
      antonyms: [],
      memoryTip: 'Haima (blood) + rhegnunai (burst).',
      difficulty: 'advanced'
    },
    {
      id: 'u15_inoculate_22',
      unitId: 15,
      word: 'Inoculate',
      banglaMeaning: 'টিকা দিয়ে রোগপ্রতিরোধ ক্ষমতা তৈরি করা',
      pronunciation: '/ɪˈnɒk.jə.leɪt/',
      partOfSpeech: 'verb',
      examples: [
        {
          english: 'Nurses inoculated schoolchildren against seasonal measles.',
          bangla: 'নার্সেরা স্কুলের ছাত্রছাত্রীদের মৌসুমী হামের বিরুদ্ধে টিকা দিলেন।'
        }
      ],
      synonyms: ["vaccinate", "immunize"],
      antonyms: [],
      memoryTip: 'Planting protective seed.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_juxtacrine_23',
      unitId: 15,
      word: 'Juxtacrine',
      banglaMeaning: 'সংলগ্ন কোষের সরাসরি যোগাযোগের সংকেত ব্যবস্থা',
      pronunciation: '/ˈdʒʌk.stə.krɪn/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Juxtacrine cellular signaling requires direct physical contact.',
          bangla: 'সংলগ্ন কোষীয় সংকেত প্রেরণের জন্য কোষগুলোর একে অপরের সাথে সরাসরি শারীরিক সংস্পর্শের প্রয়োজন হয়।'
        }
      ],
      synonyms: ["adjacent contact signaling"],
      antonyms: [],
      memoryTip: 'Juxta (beside) + crine.',
      difficulty: 'advanced'
    },
    {
      id: 'u15_lesion_24',
      unitId: 15,
      word: 'Lesion',
      banglaMeaning: 'টিস্যুর ক্ষত বা অস্বাভাবিক পরিবর্তন',
      pronunciation: '/ˈliː.ʒən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Magnetic resonance scans revealed a minor brain tissue lesion.',
          bangla: 'এমআরআই পরীক্ষায় মস্তিষ্কের টিস্যুতে একটি ক্ষুদ্র ক্ষত বা অস্বাভাবিকতা ধরা পড়ল।'
        }
      ],
      synonyms: ["wound", "injury", "ulcer"],
      antonyms: [],
      memoryTip: 'Laedere = to hurt.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_metabolism_25',
      unitId: 15,
      word: 'Metabolism',
      banglaMeaning: 'বিপাক প্রক্রিয়া , শরীরে খাদ্য থেকে শক্তি রূপান্তরের গতি',
      pronunciation: '/məˈtæb.əl.ɪ.zəm/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Thyroid hormones regulate the baseline human metabolism.',
          bangla: 'থাইরয়েড হরমোন মানুষের শরীরের মৌলিক শক্তি উৎপাদন ও বিপাক প্রক্রিয়া নিয়ন্ত্রণ করে।'
        }
      ],
      synonyms: ["biochemical processing"],
      antonyms: [],
      memoryTip: 'Change / exchange.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_neurology_26',
      unitId: 15,
      word: 'Neurology',
      banglaMeaning: 'স্নায়ুবিজ্ঞান বা স্নায়ুরোগবিদ্যা',
      pronunciation: '/njʊəˈrɒl.ə.dʒi/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'He was referred to neurology after experiencing recurring migraines.',
          bangla: 'বারবার মাইগ্রেনের মাথাব্যথা হওয়ায় তাকে স্নায়ুরোগ বিশেষজ্ঞের কাছে পাঠানো হলো।'
        }
      ],
      synonyms: ["nerve medicine"],
      antonyms: [],
      memoryTip: 'Neuron = nerve.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_orthopedic_27',
      unitId: 15,
      word: 'Orthopedic',
      banglaMeaning: 'হাড় ও অস্থিসন্ধির চিকিৎসাবিদ্যা সংক্রান্ত',
      pronunciation: '/ˌɔː.θəˈpiː.dɪk/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'The patient wore an orthopedic brace following knee surgery.',
          bangla: 'হাঁটুর অস্ত্রোপচারের পর রোগী একটি বিশেষ অর্থোপেডিক ব্রেস পরিধান করলেন।'
        }
      ],
      synonyms: ["bone surgery"],
      antonyms: [],
      memoryTip: 'Ortho (straight) + pais (child).',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_pediatric_28',
      unitId: 15,
      word: 'Pediatric',
      banglaMeaning: 'শিশুরোগবিদ্যা সংক্রান্ত',
      pronunciation: '/ˌpiː.diˈæt.rɪk/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'The pediatric hospital ward was decorated with cheerful murals.',
          bangla: 'শিশুদের হাসপাতালের ওয়ার্ডটি রঙিন ও আনন্দদায়ক দেয়ালচিত্রে সাজানো ছিল।'
        }
      ],
      synonyms: ["child medicine"],
      antonyms: [],
      memoryTip: 'Pais = child.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_quarantine_29',
      unitId: 15,
      word: 'Quarantine',
      banglaMeaning: 'সংক্রামক রোগ প্রতিরোধে সংগনিরোধ বা কোয়ারেন্টাইন',
      pronunciation: '/ˈkwɒr.ən.tiːn/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Crew members were placed under strict fourteen-day viral quarantine.',
          bangla: 'জাহাজের নাবিকদের চৌদ্দ দিনের জন্য কঠোর সংগনিরোধ বা কোয়ারেন্টাইনে রাখা হলো।'
        }
      ],
      synonyms: ["isolation", "cordon"],
      antonyms: [],
      memoryTip: 'Italian quaranta = 40 days.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_respiration_30',
      unitId: 15,
      word: 'Respiration',
      banglaMeaning: 'শ্বসন প্রক্রিয়া বা শ্বাসপ্রশ্বাস',
      pronunciation: '/ˌres.pɪˈreɪ.ʃən/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Artificial respiration sustained the unconscious diver.',
          bangla: 'কৃত্রিম শ্বাসপ্রশ্বাসের ব্যবস্থা অচেতন ডুবুরিটিকে বাঁচিয়ে রাখল।'
        }
      ],
      synonyms: ["breathing"],
      antonyms: [],
      memoryTip: 'Re + spirare (breathe).',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_sedative_31',
      unitId: 15,
      word: 'Sedative',
      banglaMeaning: 'ঘুমের বা উপশমকারী ওষুধ',
      pronunciation: '/ˈsed.ə.tɪv/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'The anesthesiologist administered a mild calming sedative.',
          bangla: 'অ্যানেস্থেসিয়া বিশেষজ্ঞ রোগীকে শান্ত করতে হালকা ঘুমের ওষুধ দিলেন।'
        }
      ],
      synonyms: ["tranquilizer", "calmative"],
      antonyms: [],
      memoryTip: 'Sedare = to settle.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_toxicity_32',
      unitId: 15,
      word: 'Toxicity',
      banglaMeaning: 'বিষাক্ততা বা বিষক্রিয়ার মাত্রা',
      pronunciation: '/tɒkˈsɪs.ə.ti/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'Pharmacologists evaluated the toxicity of the experimental drug.',
          bangla: 'ঔষধবিজ্ঞানীরা পরীক্ষামূলক নতুন ওষুধটির বিষাক্ততার মাত্রা নিরূপণ করলেন।'
        }
      ],
      synonyms: ["poisonousness", "virulence"],
      antonyms: [],
      memoryTip: 'Toxikon = poison.',
      difficulty: 'intermediate'
    },
    {
      id: 'u15_ultrasound_33',
      unitId: 15,
      word: 'Ultrasound',
      banglaMeaning: 'আল্ট্রাসাউন্ড বা অতিশব্দীয় স্ক্যান',
      pronunciation: '/ˈʌl.trəˌsaʊnd/',
      partOfSpeech: 'noun',
      examples: [
        {
          english: 'An ultrasound scan monitored the development of the fetus.',
          bangla: 'একটি আল্ট্রাসাউন্ড স্ক্যানের মাধ্যমে গর্ভের ভ্রূণের বিকাশ পর্যবেক্ষণ করা হলো।'
        }
      ],
      synonyms: ["sonogram"],
      antonyms: [],
      memoryTip: 'Ultra sound frequency.',
      difficulty: 'beginner'
    },
    {
      id: 'u15_virulent_34',
      unitId: 15,
      word: 'Virulent',
      banglaMeaning: 'অত্যন্ত সংক্রামক ও তীব্র প্রাণঘাতী',
      pronunciation: '/ˈvɪr.jə.lənt/',
      partOfSpeech: 'adjective',
      examples: [
        {
          english: 'Scientists isolated a virulent new strain of the avian virus.',
          bangla: 'বিজ্ঞানীরা বার্ড ফ্লুর অত্যন্ত সংক্রামক ও তীব্র নতুন একটি রূপ শনাক্ত করলেন।'
        }
      ],
      synonyms: ["lethal", "infectious", "toxic"],
      antonyms: ["harmless"],
      memoryTip: 'Virus = poison.',
      difficulty: 'advanced'
    }
  ]
};
