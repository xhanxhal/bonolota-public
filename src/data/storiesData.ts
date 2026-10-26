export interface StoryVocab {
  word: string;
  meaningBn: string;
  explanation: string;
}

export interface StoryItem {
  id: string;
  titleEn: string;
  titleBn: string;
  genre: string;
  paragraphEn: string;
  paragraphBn: string;
  vocabulary: StoryVocab[];
}

export const STORIES_DATA: StoryItem[] = [
  {
    id: 'story-1',
    titleEn: 'The Scholar in the Cacophony',
    titleBn: 'কোলাহলের মাঝে ধ্যানমগ্ন পণ্ডিত',
    genre: 'Drama & Philosophy',
    paragraphEn: 'Amid the deafening cacophony of the bustling bazaar, the elderly scholar remained astonishingly placid. While others were easily provoked by aberrant outbursts of angry traders, his mind was firmly anchored. Rather than offering an ambiguous defense, he gave a lucid explanation to the crowd that calmed every agitated soul with benevolent grace.',
    paragraphBn: 'ব্যস্ত বাজারের কান ঝালাপালা করা কোলাহলের মাঝেও বৃদ্ধ পণ্ডিত অদ্ভুত রকমের শান্ত রইলেন। যখন অন্য অনেকেই ক্ষুব্ধ বিক্রেতাদের অস্বাভাবিক আচরণে সহজে উত্তেজিত হয়ে পড়ছিল, তখন তাঁর চিত্ত ছিল সুদৃঢ়। কোনো গোলমেলে বা দ্ব্যর্থবোধক কথা না বলে, তিনি জনতার সামনে এমন এক স্বচ্ছ ও প্রাঞ্জল ব্যাখ্যা তুলে ধরলেন যা প্রত্যেকটি অস্থির মনকে পরম স্নেহে শান্ত করে দিল।',
    vocabulary: [
      { word: 'Cacophony', meaningBn: 'কর্কশ আওয়াজ বা কোলাহল', explanation: 'A harsh, discordant mixture of sounds.' },
      { word: 'Placid', meaningBn: 'শান্ত ও নির্বিকার', explanation: 'Calm and peaceful, with little movement or activity.' },
      { word: 'Aberrant', meaningBn: 'অস্বাভাবিক বা বিচ্যুত', explanation: 'Departing from an accepted standard.' },
      { word: 'Ambiguous', meaningBn: 'দ্ব্যর্থবোধক বা অস্পষ্ট', explanation: 'Open to more than one interpretation; not having one obvious meaning.' },
      { word: 'Lucid', meaningBn: 'সহজবোধ্য ও প্রাঞ্জল', explanation: 'Expressed clearly; easy to understand.' },
      { word: 'Benevolent', meaningBn: 'মহানুভব ও মঙ্গলকামী', explanation: 'Well meaning and kindly.' }
    ]
  },
  {
    id: 'story-2',
    titleEn: 'The Fall of the Prodigal Heir',
    titleBn: 'উড়নচণ্ডী যুবরাজের পরিণতি',
    genre: 'Historical Fiction',
    paragraphEn: 'The young heir was infamous for his prodigal habits, squandering his dynasty’s immense treasury on ephemeral pleasures. His advisers urged a more pragmatic policy to prevent an impending state bankruptcy, but his audacious pride made him reject all council. Soon, the kingdom plunged into utter anarchy as creditors seized the grand palace gates.',
    paragraphBn: 'তরুণ যুবরাজ তাঁর উড়নচণ্ডী অপচয়ের অভ্যাসের জন্য কুখ্যাত ছিলেন; তিনি রাজবংশের বিপুল ধনভাণ্ডার ক্ষণস্থায়ী আমোদ-প্রমোদে উড়িয়ে দিচ্ছিলেন। সম্ভাব্য দেউলিয়া অবস্থা রুখতে উপদেষ্টারা বাস্তবসম্মত নীতি গ্রহণের তাগিদ দিলেও, তাঁর বেপরোয়া অহংকার সমস্ত সদুপদেশ প্রত্যাখ্যান করতে বাধ্য করল। অচিরেই পাওনাদাররা রাজপ্রাসাদের প্রধান ফটক ঘেরাও করায় গোটা রাজ্য চরম নৈরাজ্যের গভীরে তলিয়ে গেল।',
    vocabulary: [
      { word: 'Prodigal', meaningBn: 'অপব্যয়ী বা উড়নচণ্ডী', explanation: 'Spending money or resources freely and recklessly; wastefully extravagant.' },
      { word: 'Ephemeral', meaningBn: 'ক্ষণস্থায়ী বা সাময়িক', explanation: 'Lasting for a very short time.' },
      { word: 'Pragmatic', meaningBn: 'বাস্তবধর্মী বা প্রয়োগিক', explanation: 'Dealing with things sensibly and realistically based on practical rather than theoretical considerations.' },
      { word: 'Audacious', meaningBn: 'দুঃসাহসী বা বেপরোয়া', explanation: 'Showing a willingness to take surprisingly bold risks.' },
      { word: 'Anarchy', meaningBn: 'অরাজকতা বা নৈরাজ্য', explanation: 'A state of disorder due to absence or non-recognition of authority.' }
    ]
  },
  {
    id: 'story-3',
    titleEn: 'The Candid Diplomat',
    titleBn: 'অকপট কূটনীতিকের চুক্তি',
    genre: 'Political Intrigue',
    paragraphEn: 'Known throughout Europe as a reticent diplomat, Sophia rarely spoke at banquets. Yet when war seemed imminent, she abandoned formal pleasantries and delivered a candid critique of the corrupt treaty. She declared that she would forever abhor any agreement that oppressed innocent citizens, earning the veneration of the common people.',
    paragraphBn: 'সারা ইউরোপে কম কথার মিতভাষী কূটনীতিক হিসেবে পরিচিত হওয়ায় সোফিয়া দাওয়াতগুলোতে খুব কমই কথা বলতেন। কিন্তু যখন যুদ্ধ আসন্ন মনে হলো, তিনি সমস্ত আনুষ্ঠানিক তোষামোদ ঝেড়ে ফেলে অন্যায্য চুক্তির বিরুদ্ধে এক অকপট সত্য সমালোচনা তুলে ধরলেন। তিনি দ্ব্যর্থহীন কণ্ঠে ঘোষণা করলেন যে নিরীহ মানুষকে শোষণ করে এমন কোনো চুক্তি তিনি মনেপ্রাণে ঘৃণা করেন—যা তাঁকে সাধারণ মানুষের পরম শ্রদ্ধার আসনে বসিয়ে দিল।',
    vocabulary: [
      { word: 'Reticent', meaningBn: 'মিতভাষী বা স্বল্পভাষী', explanation: 'Not revealing one\'s thoughts or feelings readily.' },
      { word: 'Imminent', meaningBn: 'আসন্ন বা অবিলম্বে ঘটবে এমন', explanation: 'About to happen.' },
      { word: 'Candid', meaningBn: 'অকপট ও সত্যভাষী', explanation: 'Truthful and straightforward; frank.' },
      { word: 'Abhor', meaningBn: 'তীব্রভাবে ঘৃণা করা', explanation: 'Regard with disgust and hatred.' },
      { word: 'Veneration', meaningBn: 'গভীর শ্রদ্ধা ও সম্মান', explanation: 'Great respect; reverence.' }
    ]
  }
];
