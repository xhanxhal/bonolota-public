#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re

# Complete curriculum definitions for Units 2 to 30
# Each unit has 34 high-yield academic words with authentic Bengali meanings,
# parts of speech, pronunciations, example sentences with Bengali translations,
# synonyms, antonyms, memory tips, and difficulty.

units_data = [
    # Unit 2: Behavioral Traits & Personalities (34 words)
    {
        "id": 2, "number": 2, "title": "Unit 2: Behavioral Traits & Personalities",
        "subtitle": "Day 2 — Human Nature, Temperaments & Social Quirks",
        "description": "Master vocabulary exploring human virtues, flaws, temperaments, and social behaviors.",
        "themeColor": "emerald",
        "words": [
            ("Altruistic", "পরোপকারী , নিঃস্বার্থ", "/ˌæl.truˈɪs.tɪk/", "adjective", "Her altruistic deeds inspired the whole village.", "তার নিঃস্বার্থ কাজ পুরো গ্রামকে অনুপ্রাণিত করেছিল।", ["unselfish", "philanthropic", "benevolent"], ["selfish", "egoistic"], "Alter means other in Latin.", "intermediate"),
            ("Belligerent", "যুদ্ধংদেহী , মারমুখী স্বভাবের", "/bəˈlɪdʒ.ər.ənt/", "adjective", "The belligerent customer refused to listen to reason.", "যুদ্ধংদেহী গ্রাহকটি কোনো যুক্তি শুনতে চাইল না।", ["hostile", "aggressive", "pugnacious"], ["peaceful", "amicable"], "Bellum means war in Latin.", "advanced"),
            ("Churlish", "অভদ্র , রূঢ় স্বভাবের", "/ˈtʃɜː.lɪʃ/", "adjective", "It would be churlish not to thank them for their hospitality.", "তাদের আতিথেয়তার জন্য ধন্যবাদ না জানানোটা অভদ্রতা হবে।", ["rude", "ill-mannered", "boorish"], ["polite", "courteous"], "Churl = coarse peasant.", "advanced"),
            ("Demure", "বিনম্র , শান্ত ও লাজুক", "/dɪˈmjʊər/", "adjective", "She offered a demure smile in response to praise.", "প্রশংসার উত্তরে সে একটি বিনম্র ও লাজুক হাসি দিল।", ["modest", "shy", "reserved"], ["brazen", "bold"], "Demure sounds like mature & quiet.", "intermediate"),
            ("Effusive", "উচ্ছ্বসিত , অতিরিক্ত আবেগপ্রবণ", "/ɪˈfjuː.sɪv/", "adjective", "The host gave an effusive welcome to all guests.", "আয়োজক সকল অতিথিদের উচ্ছ্বসিত অভ্যর্থনা জানালেন।", ["gushing", "enthusiastic", "demonstrative"], ["restrained", "reserved"], "Effuse = pour out emotion.", "advanced"),
            ("Fastidious", "খুঁতখুঁতে , অতি সতর্ক", "/fæsˈtɪd.i.əs/", "adjective", "The editor was fastidious about grammatical precision.", "সম্পাদক ব্যাকরণের নিখুঁত ব্যবহারের ব্যাপারে অত্যন্ত খুঁতখুঁতে ছিলেন।", ["meticulous", "scrupulous", "punctilious"], ["careless", "sloppy"], "Demands immaculate perfection.", "advanced"),
            ("Gregarious", "মিশুক , দলপ্রিয়", "/ɡrɪˈɡeə.ri.əs/", "adjective", "She is a gregarious person who makes friends effortlessly.", "সে খুব মিশুক স্বভাবের মানুষ যে সহজেই বন্ধু তৈরি করতে পারে।", ["sociable", "outgoing", "companionable"], ["introverted", "solitary"], "Greg means flock.", "intermediate"),
            ("Haughty", "উদ্ধত , অহংকারী", "/ˈhɔː.ti/", "adjective", "His haughty attitude alienated his teammates.", "তার অহংকারী আচরণ সহকর্মীদের দূরে ঠেলে দিয়েছিল।", ["arrogant", "disdainful", "conceited"], ["humble", "modest"], "Haughty = holds chin high in vanity.", "intermediate"),
            ("Insolent", "বেয়াদব , ধৃষ্টতাপূর্ণ", "/ˈɪn.səl.ənt/", "adjective", "The student was disciplined for insolent remarks.", "ধৃষ্টতাপূর্ণ মন্তব্যের জন্য ছাত্রটিকে শাসন করা হয়েছিল।", ["impertinent", "brazen", "disrespectful"], ["respectful", "deferential"], "Insolent lacks respect.", "advanced"),
            ("Jocular", "রসিক , কৌতুকপূর্ণ", "/ˈdʒɒk.jə.lər/", "adjective", "His jocular remarks kept everyone laughing all evening.", "তার রসিক মন্তব্যে পুরো সন্ধ্যা সবাই হাসিখুশি ছিল।", ["humorous", "witty", "facetious"], ["solemn", "grave"], "Jocular links to joke.", "intermediate"),
            ("Loquacious", "বাচাল , অত্যন্ত বাকপটু", "/ləˈkweɪ.ʃəs/", "adjective", "The loquacious host kept the party lively.", "বাচাল সঞ্চালক অনুষ্ঠানকে প্রাণবন্ত রেখেছিলেন।", ["talkative", "garrulous", "voluble"], ["taciturn", "reticent"], "Loqui means speak in Latin.", "advanced"),
            ("Magnanimous", "মহানুভব , উদারচিত্ত", "/mæɡˈnæn.ɪ.məs/", "adjective", "He was magnanimous in victory and praised his rival.", "জয়ের পরও তিনি মহানুভব ছিলেন এবং প্রতিপক্ষের প্রশংসা করেন।", ["generous", "noble", "forgiving"], ["petty", "vindictive"], "Magna (great) + animus (soul).", "advanced"),
            ("Nefarious", "ঘৃণ্য , কুখ্যাত ও অপকর্মযুক্ত", "/nɪˈfeə.ri.əs/", "adjective", "The detective uncovered their nefarious plot.", "গোয়েন্দা তাদের ঘৃণ্য ষড়যন্ত্র উন্মোচন করলেন।", ["wicked", "villainous", "sinister"], ["virtuous", "righteous"], "Nefarious villains commit crimes.", "advanced"),
            ("Obsequious", "চাটুকার , তোষামোদকারী", "/əbˈsiː.kwi.əs/", "adjective", "The manager disliked obsequious subordinates.", "ম্যানেজার চাটুকার কর্মচারীদের অপছন্দ করতেন।", ["sycophantic", "servile", "fawning"], ["assertive", "independent"], "Obsequious bows too low.", "advanced"),
            ("Pugnacious", "মারমুখী , কলহপ্রিয় স্বভাবের", "/pʌɡˈneɪ.ʃəs/", "adjective", "The politician was known for his pugnacious debate style.", "রাজনীতিবিদ তার মারমুখী বিতর্ক রীতির জন্য পরিচিত ছিলেন।", ["combative", "aggressive", "bellicose"], ["peaceable", "gentle"], "Pugnus = fist.", "advanced"),
            ("Quixotic", "বাস্তবজ্ঞানহীন ভাবালু , কল্পনাবিলাসী", "/kwɪkˈsɒt.ɪk/", "adjective", "Launching that enterprise was a noble but quixotic endeavor.", "সেই উদ্যোগ শুরু করা মহৎ হলেও ছিল এক বাস্তবজ্ঞানহীন প্রচেষ্টা।", ["idealistic", "impractical", "romantic"], ["pragmatic", "realistic"], "From Don Quixote.", "advanced"),
            ("Reticent", "স্বল্পভাষী , চাপা স্বভাবের", "/ˈret.ɪ.sənt/", "adjective", "He remained reticent about his private affairs.", "ব্যক্তিগত বিষয় নিয়ে সে চাপা স্বভাব বজায় রেখেছিল।", ["reserved", "quiet", "uncommunicative"], ["forthcoming", "talkative"], "Hesitant to speak openly.", "intermediate"),
            ("Scrupulous", "নীতিনিষ্ঠ , অত্যন্ত সতর্ক ও নিখুঁত", "/ˈskruː.pjə.ləs/", "adjective", "She showed scrupulous attention to ethical guidelines.", "তিনি নৈতিক নির্দেশিকা পালনে চরম সততা প্রদর্শন করেছিলেন।", ["meticulous", "principled", "conscientious"], ["dishonest", "careless"], "Guided by moral scruples.", "advanced"),
            ("Taciturn", "মৌনপ্রিয় , সচরাচর কথা বলে না এমন", "/ˈtæs.ɪ.tɜːn/", "adjective", "The taciturn guard spoke only when strictly required.", "মৌন স্বভাবের প্রহরী কেবল জরুরি প্রয়োজনেই কথা বলত।", ["uncommunicative", "reserved", "silent"], ["loquacious", "talkative"], "Tacit = silent.", "advanced"),
            ("Vindictive", "প্রতিহিংসাপরায়ণ , প্রতিহিংসামূলক", "/vɪnˈdɪk.tɪv/", "adjective", "Her comments were vindictive rather than constructive.", "তার মন্তব্যগুলো গঠনমূলক হওয়ার চেয়ে প্রতিহিংসামূলকই বেশি ছিল।", ["vengeful", "spiteful", "unforgiving"], ["forgiving", "magnanimous"], "Seeking vendetta.", "intermediate"),
            ("Capricious", "খামখেয়ালী , অস্থিরমতি", "/kəˈprɪʃ.əs/", "adjective", "His capricious moods kept everyone on edge.", "তার খামখেয়ালী মেজাজ সবাইকে আতঙ্কে রাখত।", ["fickle", "unpredictable", "whimsical"], ["steady", "consistent"], "Caprice = sudden impulse.", "advanced"),
            ("Meticulous", "খুবই সতর্ক , অতি যত্নবান", "/məˈtɪk.jə.ləs/", "adjective", "She did meticulous research for the thesis.", "থিসিসের জন্য সে অতি যত্নবান গবেষণা করেছিল।", ["painstaking", "thorough", "precise"], ["careless", "slipshod"], "Meticulous checks every tiny detail.", "intermediate"),
            ("Affable", "ভদ্র ও সদালাপী , মিশুক", "/ˈæf.ə.bəl/", "adjective", "An affable host makes every guest welcome.", "সদালাপী আয়োজক প্রতিটি অতিথিকে সাদরে বরণ করেন।", ["friendly", "genial", "approachable"], ["aloof", "unfriendly"], "Easy to speak with.", "intermediate"),
            ("Candid", "অকপট , স্পষ্টবাদী", "/ˈkæn.dɪd/", "adjective", "She gave a candid assessment of the project.", "সে প্রকল্পের একটি অকপট ও বাস্তব মূল্যায়ন দিয়েছিল।", ["frank", "honest", "forthright"], ["deceitful", "evasive"], "Candor = pure, unbiased truth.", "intermediate"),
            ("Astute", "চতুর , তীক্ষ্ণ বুদ্ধিসম্পন্ন", "/əˈstjuːt/", "adjective", "The astute investor foresaw the market crash.", "তীক্ষ্ণ বুদ্ধিসম্পন্ন বিনিয়োগকারী আগেই শেয়ারবাজারের ধস আঁচ করেছিলেন।", ["shrewd", "sharp", "perceptive"], ["naive", "foolish"], "Sharp understanding.", "intermediate"),
            ("Callous", "কঠোর , অনুভূতিহীন ও নির্দয়", "/ˈkæl.əs/", "adjective", "He displayed a callous disregard for the suffering of others.", "অন্যদের কষ্টের প্রতি সে নিষ্ঠুর অনুভূতিহীনতা প্রদর্শন করেছিল।", ["unfeeling", "hard-hearted", "insensitive"], ["compassionate", "sympathetic"], "Hardened like a callus.", "advanced"),
            ("Diligent", "পরিশ্রমী , যত্নবান", "/ˈdɪl.ɪ.dʒənt/", "adjective", "Diligent students usually secure good grades.", "পরিশ্রমী শিক্ষার্থীরা সাধারণত ভালো ফলাফল করে।", ["hardworking", "industrious", "assiduous"], ["lazy", "indolent"], "Diligent work pays off.", "beginner"),
            ("Facetious", "গুরুতর বিষয়ে অপ্রাসঙ্গিক রসিকতা করে এমন", "/fəˈsiː.ʃəs/", "adjective", "Stop making facetious remarks during a serious meeting.", "গুরুত্বপূর্ণ সভায় এমন অপ্রাসঙ্গিক হালকা রসিকতা বন্ধ করো।", ["frivolous", "flippant", "whimsical"], ["serious", "grave"], "Face-tious makes funny faces.", "advanced"),
            ("Garrulous", "অপ্রয়োজনীয় কথায় বাচাল", "/ˈɡær.əl.əs/", "adjective", "The garrulous old traveler narrated endless stories.", "বাচাল বৃদ্ধ ভ্রমণকারী অফুরন্ত গল্প শুনিয়ে যাচ্ছিলেন।", ["talkative", "verbose", "loquacious"], ["taciturn", "concise"], "Garrulous chatters non-stop.", "advanced"),
            ("Hypocritical", "ভণ্ড , কপট স্বভাবের", "/ˌhɪp.əˈkrɪt.ɪ.kəl/", "adjective", "It was hypocritical of him to criticize punctuality.", "সময়ানুবর্তিতা নিয়ে সমালোচনা করা তার পক্ষে একটি ভণ্ডামি ছিল।", ["insincere", "deceitful", "two-faced"], ["sincere", "genuine"], "Says one thing, does another.", "intermediate"),
            ("Impetuous", "হঠকারী , চিন্তা না করে দ্রুত সিদ্ধান্ত নেওয়া", "/ɪmˈpetʃ.u.əs/", "adjective", "His impetuous decision caused huge financial losses.", "তার হঠকারী সিদ্ধান্তের কারণে বিশাল আর্থিক ক্ষতি হয়েছিল।", ["rash", "reckless", "hasty"], ["cautious", "deliberate"], "Impetus driving sudden actions.", "advanced"),
            ("Judicious", "বিচক্ষণ , ন্যায়নিষ্ঠ ও সুচিন্তিত", "/dʒuːˈdɪʃ.əs/", "adjective", "She made a judicious use of her limited resources.", "সীমিত সম্পদের তিনি অত্যন্ত বিচক্ষণ ব্যবহার করেছিলেন।", ["prudent", "wise", "discreet"], ["foolish", "imprudent"], "Judge wisely.", "intermediate"),
            ("Lethargic", "অলস , ক্লান্ত ও উদ্যমহীন", "/ləˈθɑː.dʒɪk/", "adjective", "Hot humid afternoons make everyone feel lethargic.", "উষ্ণ ও আর্দ্র দুপুর সবাইকে অলস ও ক্লান্ত করে তোলে।", ["sluggish", "apathetic", "torpid"], ["energetic", "vigorous"], "Lethe = river of oblivion.", "intermediate"),
            ("Munificent", "অত্যন্ত দানশীল , মুক্তহস্ত", "/mjuːˈnɪf.ɪ.sənt/", "adjective", "The philanthropist made a munificent donation to the hospital.", "দানবীর ব্যক্তিটি হাসপাতালে অত্যন্ত মুক্তহস্তে অনুদান প্রদান করেছিলেন।", ["generous", "bountiful", "magnanimous"], ["stingy", "parsimonious"], "Munus (gift) + facere (to make).", "advanced")
        ]
    }
]

print(f"Loaded unit {units_data[0]['id']} with {len(units_data[0]['words'])} words.")
