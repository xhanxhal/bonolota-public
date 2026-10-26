#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates Units 2 to 30 with rich academic English vocabulary, 
authentic Bengali translations, pronunciations, examples, synonyms, antonyms, and mnemonics.
"""

import os
import re
import json

units = [
    # Unit 2: Behavioral Traits & Personalities
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
            ("Candid", "অকপট , স্পষ্টবাদী", "/ˈkæn.dɪd/", "adjective", "She gave a candid assessment of the project.", "সে প্রকল্পের একটি অকপট ও বাস্তব মূল্যায়ন দিয়েছিল।", ["frank", "honest", "forthright"], ["deceitful", "evasive"], "Candor = pure, unbiased truth.", "intermediate")
        ]
    },
    # Unit 3: Emotions, Intellect & Cognition
    {
        "id": 3, "number": 3, "title": "Unit 3: Emotions, Intellect & Cognition",
        "subtitle": "Day 3 — Inner States, Sentiments & Cognitive Depth",
        "description": "Vocabulary exploring human passions, intellectual discernment, and emotional spectrums.",
        "themeColor": "purple",
        "words": [
            ("Apathy", "উদাসীনতা , অনীহা", "/ˈæp.ə.θi/", "noun", "Voter apathy is a concern in modern elections.", "ভোটারদের উদাসীনতা আধুনিক নির্বাচনে একটি উদ্বেগের বিষয়।", ["indifference", "unconcern", "lethargy"], ["passion", "enthusiasm"], "A (without) + pathos (feeling).", "intermediate"),
            ("Benevolence", "পরোপকারিতা , দয়াশীলতা", "/bəˈnev.əl.əns/", "noun", "The clinic was built through her benevolence.", "তার দয়াশীলতা ও সহায়তায় চিকিৎসালয়টি নির্মিত হয়েছিল।", ["generosity", "kindness", "compassion"], ["malevolence", "cruelty"], "Bene (well) + vol (wishing).", "intermediate"),
            ("Candor", "অকপটতা , অকপট সত্যবাদিতা", "/ˈkæn.dər/", "noun", "She spoke with refreshing candor about the crisis.", "সংকটটি নিয়ে সে প্রশান্তিকর অকপটতার সাথে কথা বলল।", ["frankness", "honesty", "openness"], ["deceit", "guile"], "White purity of honest speech.", "intermediate"),
            ("Disdain", "তাচ্ছিল্য , অবজ্ঞা", "/dɪsˈdeɪn/", "noun", "He treated the bribe with profound disdain.", "ঘুষের প্রস্তাবটিকে সে গভীর তাচ্ছিল্যের সাথে প্রত্যাখ্যান করল।", ["contempt", "scorn", "derision"], ["admiration", "respect"], "Unworthy of respect.", "intermediate"),
            ("Empathy", "সহমর্মিতা , অপরের অনুভূতি উপলব্ধি", "/ˈem.pə.θi/", "noun", "Empathy builds deep relationships.", "সহমর্মিতা মানুষের মাঝে গভীর সম্পর্ক গড়ে তোলে।", ["compassion", "understanding", "affinity"], ["apathy", "callousness"], "Feeling within another person.", "beginner"),
            ("Fervor", "উদ্দাম উদ্দীপনা , ব্যাকুলতা", "/ˈfɜː.vər/", "noun", "The crowd chanted with patriotic fervor.", "জনতা দেশপ্রেমের উদ্দাম উদ্দীপনায় স্লোগান দিল।", ["passion", "zeal", "intensity"], ["apathy", "coldness"], "Fervent heat and passion.", "advanced"),
            ("Guile", "ধূর্ততা , প্রতারণাপূর্ণ চাতুরী", "/ɡaɪl/", "noun", "The fraudster used cunning guile to deceive victims.", "প্রতারকটি শিকারদের ধোঁকা দিতে ধূর্ত চাতুরী প্রয়োগ করেছিল।", ["cunning", "deceit", "craftiness"], ["honesty", "candor"], "Guileful trickery.", "advanced"),
            ("Hubris", "অহমিকা , মাত্রাতিরিক্ত দম্ভ", "/ˈhjuː.brɪs/", "noun", "The tycoon's hubris led to bankruptcy.", "শিল্পপতির মাত্রাতিরিক্ত অহমিকাই তাকে দেউলিয়া করেছিল।", ["arrogance", "pride", "conceit"], ["humility", "modesty"], "Greek concept of fatal pride.", "advanced"),
            ("Intuition", "অন্তর্দৃষ্টি , সহজাত জ্ঞান", "/ˌɪn.tʃuːˈɪʃ.ən/", "noun", "Her intuition told her to trust her gut.", "তার অন্তর্দৃষ্টি তাকে নিজের উপলব্ধির ওপর ভরসা করতে বলল।", ["sixth sense", "insight", "instinct"], ["reasoning", "logic"], "Direct perception without reasoning.", "intermediate"),
            ("Jubilation", "উল্লাস , মহা আনন্দ", "/ˌdʒuː.bəlˈeɪ.ʃən/", "noun", "Jubilation filled the streets after the championship.", "চ্যাম্পিয়ন হওয়ার পর রাস্তায় আনন্দ-উল্লাস ছড়িয়ে পড়ল।", ["exultation", "rejoicing", "triumph"], ["sorrow", "gloom"], "Joyous jubilation.", "intermediate"),
            ("Kinship", "আত্মীয়তা , হৃদয়ের টান", "/ˈkɪn.ʃɪp/", "noun", "He felt a deep kinship with fellow artists.", "সহকর্মী শিল্পীদের সাথে সে গভীর হৃদয়ের টান অনুভব করত।", ["affinity", "bond", "connection"], ["estrangement", "distance"], "Kin = family/relations.", "intermediate"),
            ("Lethargy", "নিস্তেজতা , চরম অলসতা ও জড়তা", "/ˈleθ.ə.dʒi/", "noun", "High fever left him in a state of lethargy.", "তীব্র জ্বর তাকে চরম নিস্তেজ ও অবসাদগ্রস্ত করে রেখেছিল।", ["sluggishness", "torpor", "inertia"], ["vigor", "vitality"], "Sluggish lack of energy.", "advanced"),
            ("Melancholy", "বিষণ্ণতা , অন্তহীন মনখারাপ", "/ˈmel.ən.kɒl.i/", "noun", "The melody evoked a sweet melancholy.", "সুরটি একটি মিষ্টি বিষণ্ণতা জাগিয়ে তুলেছিল।", ["sadness", "sorrow", "gloom"], ["joy", "cheerfulness"], "Pensive sadness.", "intermediate"),
            ("Nostalgia", "অতীতের মধুর স্মৃতিবেদনা", "/nɒsˈtæl.dʒə/", "noun", "Old school albums evoked intense nostalgia.", "পুরানো স্কুলের অ্যালবামটি তীব্র স্মৃতিকাতরতা ফিরিয়ে আনল।", ["reminiscence", "homesickness", "wistfulness"], ["future-focus", "indifference"], "Painful longing for home/past.", "intermediate"),
            ("Optimism", "আশাবাদ , ইতিবাচক দৃষ্টিভঙ্গি", "/ˈɒp.tɪ.mɪ.zəm/", "noun", "Optimism carries us through adversity.", "আশাবাদ প্রতিকূলতার মধ্য দিয়ে আমাদের পথ দেখায়।", ["hopefulness", "confidence", "positivity"], ["pessimism", "despair"], "Expecting the best.", "beginner"),
            ("Pessimism", "হতাশাবাদ , নেতিবাচক মানসিকতা", "/ˈpes.ɪ.mɪ.zəm/", "noun", "Do not let pessimism paralyze your efforts.", "হতাশাবাদকে তোমার চেষ্টাকে স্থবির করতে দিও না।", ["negativity", "cynicism", "despondency"], ["optimism", "hope"], "Expecting the worst.", "beginner"),
            ("Qualm", "বিবেকের দ্বিধাদ্বন্দ্ব বা অস্বস্তি", "/kwɑːm/", "noun", "He felt no qualm about exposing the corruption.", "দুর্নীতি ফাঁস করতে তার বিবেকে কোনো দ্বিধা ছিল না।", ["misgiving", "doubt", "scruple"], ["confidence", "certainty"], "Moral discomfort.", "advanced"),
            ("Rancor", "তীব্র বিদ্বেষ , তিক্ত আক্রোশ", "/ˈræŋ.kər/", "noun", "They parted ways without rancor or hatred.", "কোনো বিদ্বেষ বা ঘৃণা ছাড়াই তারা পৃথক হয়েছিল।", ["bitterness", "animosity", "malice"], ["goodwill", "friendliness"], "Lingering deep resentment.", "advanced"),
            ("Serenity", "প্রশান্তি , মনের গভীর স্থিরতা", "/səˈren.ə.ti/", "noun", "The quiet lake radiated serene beauty.", "শান্ত হ্রদটি এক অদ্ভুত প্রশান্তি ছড়িয়ে দিচ্ছিল।", ["tranquility", "peacefulness", "calm"], ["turmoil", "chaos"], "Serene peace of mind.", "intermediate"),
            ("Trepidation", "ভয়ভীতি , উদ্বেগময় কাঁপুনি", "/ˌtrep.ɪˈdeɪ.ʃən/", "noun", "He waited for the test results with trepidation.", "উদ্বেগ ও ভয়ের সাথে সে পরীক্ষার ফলের অপেক্ষা করছিল।", ["apprehension", "dread", "anxiety"], ["calm", "serenity"], "Trembling with anxiety.", "advanced")
        ]
    }
]

# Generate remaining units up to 30 systematically
theme_configs = [
    (4, "Unit 4: Arguments, Logic & Rhetoric", "Day 4 — Reasoning, Fallacies & Discourse", "cyan", [
        ("Assert", "দৃঢ়ভাবে দাবি করা", "/əˈsɜːt/", "verb", "She asserted her rights confidently.", "তিনি দৃঢ়তার সাথে তার অধিকার দাবি করলেন।", ["declare", "maintain", "affirm"], ["deny", "retract"], "State with firm conviction.", "intermediate"),
        ("Bolster", "সমর্থন জোগানো , শক্তিশালী করা", "/ˈbəʊl.stər/", "verb", "New evidence bolstered their legal case.", "নতুন প্রমাণ তাদের মামলাকে আরও শক্তিশালী করেছিল।", ["strengthen", "reinforce", "support"], ["undermine", "weaken"], "A bolster pillow provides support.", "intermediate"),
        ("Circumlocution", "ঘুরিয়ে পেঁচিয়ে কথা বলা", "/ˌsɜː.kəm.ləˈkjuː.ʃən/", "noun", "His answer was filled with political circumlocution.", "তার উত্তরটি রাজনৈতিক কথার মারপ্যাঁচে ভরপুর ছিল।", ["periphrasis", "evasiveness", "verbosity"], ["conciseness", "directness"], "Circum (around) + loqui (speak).", "advanced"),
        ("Deduce", "অনুমান বা সিদ্ধান্ত টানা", "/dɪˈdjuːs/", "verb", "From the footprints, the detective deduced the suspect's height.", "পায়ের ছাপ থেকে গোয়েন্দা সন্দেহভাজনের উচ্চতা অনুমান করলেন।", ["infer", "conclude", "derive"], ["guess", "miscalculate"], "De (down) + ducere (lead) = lead to conclusion.", "intermediate"),
        ("Eloquent", "বাকপটু , প্রাঞ্জলভাষী", "/ˈel.ə.kwənt/", "adjective", "He gave an eloquent speech that moved the audience.", "তিনি এক প্রাঞ্জল বক্তব্য দিয়েছিলেন যা শ্রোতাদের আলোড়িত করেছিল।", ["articulate", "persuasive", "fluent"], ["inarticulate", "hesitant"], "E (out) + loqui (speak).", "intermediate"),
        ("Fallacy", "ভ্রান্ত যুক্তি , কুযুক্তি", "/ˈfæl.ə.si/", "noun", "That claim is based on a common logical fallacy.", "সেই দাবিটি একটি প্রচলিত ভ্রান্ত যুক্তির ওপর প্রতিষ্ঠিত।", ["misconception", "delusion", "error"], ["truth", "validity"], "Fallere = deceive.", "advanced"),
        ("Garrulous", "বাচাল , অপ্রয়োজনীয় বকবককারী", "/ˈɡær.əl.əs/", "adjective", "A garrulous stranger spoke to me on the train.", "ট্রেনে এক বাচাল অপরিচিত লোক আমার সাথে অবিরাম কথা বলল।", ["talkative", "voluble", "chatty"], ["taciturn", "concise"], "Endless trivial chatting.", "advanced"),
        ("Hypothesis", "অনুসিদ্ধান্ত , বৈজ্ঞানিক অনুমান", "/haɪˈpɒθ.ə.sɪs/", "noun", "Scientists tested the hypothesis with experiments.", "বিজ্ঞানীরা পরীক্ষার মাধ্যমে অনুসিদ্ধান্তটি যাচাই করলেন।", ["theory", "supposition", "premise"], ["fact", "proof"], "Underlying tentative proposal.", "intermediate"),
        ("Insinuate", "ইঙ্গিতে কটু কথা বলা", "/ɪnˈsɪn.ju.eɪt/", "verb", "Are you insinuating that I took the money?", "আপনি কি ইঙ্গিত করছেন যে টাকাটা আমি নিয়েছি?", ["imply", "hint", "suggest"], ["declare", "state openly"], "Sinus = curve, winding slyly into minds.", "advanced"),
        ("Lucid", "স্পষ্ট ও বোধগম্য", "/ˈluː.sɪd/", "adjective", "She provided a remarkably lucid explanation of quantum physics.", "তিনি কোয়ান্টাম পদার্থবিদ্যার একটি অসাধারণ স্পষ্ট ব্যাখ্যা দিয়েছিলেন।", ["clear", "coherent", "transparent"], ["confusing", "obscure"], "Lux = light; shining clearly.", "intermediate"),
        ("Nuance", "সূক্ষ্ম পার্থক্য বা তারতম্য", "/ˈnjuː.ɑːns/", "noun", "He captured every subtle nuance of the musical piece.", "তিনি সঙ্গীতটির প্রতিটি সূক্ষ্ম ভাব ও তারতম্য নিখুঁতভাবে ফুটিয়ে তুলেছিলেন।", ["subtlety", "refinement", "shade"], ["crudeness", "obviousness"], "Shade of meaning or color.", "intermediate"),
        ("Polemic", "তীব্র আক্রমণাত্মক তর্ক বা রচনা", "/pəˈlem.ɪk/", "noun", "He penned a fierce polemic against corruption.", "তিনি দুর্নীতির বিরুদ্ধে এক তীব্র আক্রমণাত্মক প্রবন্ধ লিখেছিলেন।", ["tirade", "diatribe", "critique"], ["panegyric", "praise"], "Polemos = war in Greek.", "advanced"),
        ("Refute", "যুক্তি খণ্ডন করা", "/rɪˈfjuːt/", "verb", "The lawyer refuted all the false allegations.", "আইনজীবী সমস্ত মিথ্যা অভিযোগ খণ্ডন করলেন।", ["disprove", "debunk", "counter"], ["confirm", "verify"], "Smash an opposing argument.", "intermediate"),
        ("Tenable", "যুক্তিগ্রাহ্য , সমর্থনযোগ্য", "/ˈten.ə.bəl/", "adjective", "That scientific position is no longer tenable.", "সেই বৈজ্ঞানিক মতবাদটি এখন আর গ্রহণযোগ্য বা সমর্থনযোগ্য নয়।", ["defensible", "justifiable", "sound"], ["untenable", "flawed"], "Tenere = to hold, can be held.", "advanced"),
        ("Underscore", "গুরুত্ব আরোপ করা", "/ˌʌn.dəˈskɔːr/", "verb", "The report underscored the urgency of climate action.", "প্রতিবেদনটি জলবায়ু পদক্ষেপের জরুরি প্রয়োজনীয়তার ওপর গুরুত্ব দিয়েছিল।", ["emphasize", "highlight", "accentuate"], ["downplay", "ignore"], "Draw a line beneath to stress.", "intermediate"),
        ("Validate", "বৈধতা দেওয়া , সত্যতা প্রমাণ করা", "/ˈvæl.ɪ.deɪt/", "verb", "Lab findings validated the initial hypothesis.", "গবেষণাগারের ফলাফল প্রাথমিক অনুমানটির সত্যতা প্রমাণ করল।", ["confirm", "corroborate", "verify"], ["invalidate", "disprove"], "Make valid with solid proof.", "intermediate"),
        ("Plausible", "বিশ্বাসযোগ্য , যুক্তিসঙ্গত মনে হয় এমন", "/ˈplɔː.zə.bəl/", "adjective", "He gave a plausible explanation for his absence.", "সে তার অনুপস্থিতির একটি বিশ্বাসযোগ্য ব্যাখ্যা দিয়েছিল।", ["credible", "believable", "reasonable"], ["implausible", "unbelievable"], "Deserving applause and belief.", "intermediate"),
        ("Specious", "বাহ্যত সত্য কিন্তু ভেতরে ভ্রান্ত", "/ˈspiː.ʃəs/", "adjective", "A specious argument that sounds good but fails scrutiny.", "একটি আপাতদৃষ্টিতে সঠিক কিন্তু সূক্ষ্ম বিচারে ত্রুটিপূর্ণ যুক্তি।", ["misleading", "deceptive", "fallacious"], ["genuine", "sound"], "Good looking on surface only.", "advanced"),
        ("Concise", "সংক্ষিপ্ত কিন্তু অর্থপূর্ণ", "/kənˈsaɪs/", "adjective", "Write a concise summary of the chapter.", "অধ্যায়টির একটি সংক্ষিপ্ত ও সুস্পষ্ট সারাংশ লিখুন।", ["brief", "succinct", "pithy"], ["wordy", "rambling"], "Con + caedere (cut off extra words).", "beginner"),
        ("Equivocate", "দ্ব্যর্থবোধক কথা বলে ধোঁয়াশা রাখা", "/ɪˈkwɪv.ə.keɪt/", "verb", "The spokesperson equivocated when pressed on the timeline.", "সময়সীমার ব্যাপারে চাপ দিলে মুখপাত্রটি দ্ব্যর্থবোধক কৌশলে এড়িয়ে গেলেন।", ["prevaricate", "hedge", "evade"], ["confront", "clarify"], "Equal voices to evade truth.", "advanced")
    ]),
    (5, "Unit 5: Power, Conflict & Dominance", "Day 5 — Authority, Struggle & Geopolitics", "red", [
        ("Acquiesce", "বিনা প্রতিবাদে মেনে নেওয়া", "/ˌæk.wiˈes/", "verb", "He reluctantly acquiesced to his boss's demands.", "তিনি অনিচ্ছাসত্ত্বেও বসের নির্দেশ মেনে নিয়েছিলেন।", ["consent", "comply", "yield"], ["resist", "rebel"], "To become quiet and yield.", "advanced"),
        ("Bellicose", "যুদ্ধলিপ্সু , সংঘাতপ্রিয়", "/ˈbel.ɪ.kəʊs/", "adjective", "The dictator's bellicose rhetoric worried international observers.", "একনায়কের যুদ্ধলিপ্সু ভাষণ আন্তর্জাতিক পর্যবেক্ষকদের শঙ্কিত করেছিল।", ["warlike", "aggressive", "hostile"], ["peaceable", "pacific"], "Bellum = war.", "advanced"),
        ("Coerce", "জোরজবরদস্তি করা , বাধ্য করা", "/kəʊˈɜːs/", "verb", "They coerced the witness into silence.", "তারা জোরজবরদস্তি করে সাক্ষীকে চুপ করিয়ে রেখেছিল।", ["force", "compel", "intimidate"], ["persuade", "coax"], "Forcing compliance under threat.", "advanced"),
        ("Domineer", "মাতব্বরি করা , প্রভুত্ব খাটানো", "/ˌdɒm.ɪˈnɪər/", "verb", "He tried to domineer over all group discussions.", "সে দলের সব আলোচনায় প্রভুত্ব খাটানোর চেষ্টা করত।", ["tyrannize", "dictate", "browbeat"], ["cooperate", "yield"], "Dominus = master.", "intermediate"),
        ("Faction", "উপদল , দলছুট চক্র", "/ˈfæk.ʃən/", "noun", "Rival factions fought for control of the committee.", "কমিটির নিয়ন্ত্রণ নিতে প্রতিদ্বন্দ্বী উপদলগুলো সংঘাতে জড়াল।", ["clique", "bloc", "sect"], ["unity", "whole"], "Splinter group with divisive aim.", "intermediate"),
        ("Hegemony", "একচ্ছত্র আধিপত্য , নেতৃত্ব", "/hɪˈɡem.ə.ni/", "noun", "The empire maintained economic hegemony for a century.", "সাম্রাজ্যটি এক শতাব্দী ধরে অর্থনৈতিক একচ্ছত্র আধিপত্য বজায় রেখেছিল।", ["dominance", "supremacy", "leadership"], ["subordination", "weakness"], "Greek hegemon = leader/ruler.", "advanced"),
        ("Insurgent", "বিদ্রোহী , অবাধ্য যোদ্ধা", "/ɪnˈsɜː.dʒənt/", "noun", "Government troops engaged armed insurgents.", "সরকারি বাহিনী সশস্ত্র বিদ্রোহীদের সাথে সংঘর্ষে লিপ্ত হলো।", ["rebel", "revolutionary", "mutineer"], ["loyalist", "conformist"], "Rising up against rule.", "advanced"),
        ("Juggernaut", "অপ্রতিরোধ্য ধ্বংসাত্মক শক্তি", "/ˈdʒʌɡ.ə.nɔːt/", "noun", "The tech giant became an unstoppable economic juggernaut.", "প্রযুক্তি প্রতিষ্ঠানটি এক অপ্রতিরোধ্য অর্থনৈতিক শক্তিতে পরিণত হলো।", ["force", "steamroller", "colossus"], ["pushover", "frailty"], "From Jagannath chariot.", "advanced"),
        ("Leverage", "সুবিধা বা প্রভাব খাটানো", "/ˈliː.vər.ɪdʒ/", "noun", "They used market dominance as leverage during negotiations.", "আলোচনার সময় তারা তাদের বাজার নিয়ন্ত্রণকে প্রভাব হিসেবে খাটাল।", ["influence", "advantage", "power"], ["weakness", "impotence"], "Using a lever to gain power.", "intermediate"),
        ("Militant", "চরমপন্থী বা সশস্ত্র যোদ্ধা", "/ˈmɪl.ɪ.tənt/", "adjective", "Militant activists staged sit-ins across town.", "চরমপন্থী আন্দোলনকারীরা শহরের বিভিন্ন স্থানে অবস্থান ধর্মঘট করল।", ["aggressive", "combative", "radical"], ["pacifist", "peaceful"], "Miles = soldier.", "intermediate"),
        ("Nullify", "বাতিল করা , অকার্যকর ঘোষণা করা", "/ˈnʌl.ɪ.faɪ/", "verb", "The high court nullified the unconstitutional statute.", "উচ্চ আদালত অসাংবিধানিক আইনটিকে অকার্যকর ও বাতিল ঘোষণা করলেন।", ["annul", "invalidate", "void"], ["enforce", "validate"], "Nullus = none.", "advanced"),
        ("Oppress", "নিপীড়ন বা অত্যাচার করা", "/əˈpres/", "verb", "Corrupt rulers oppress vulnerable minorities.", "দুর্নীতিবাজ শাসকেরা দুর্বল সংখ্যালঘুদের নিপীড়ন করে।", ["persecute", "subjugate", "tyrannize"], ["liberate", "uplift"], "Press down heavily.", "intermediate"),
        ("Polarize", "বিপরীত মেরুতে বিভক্ত করা", "/ˈpəʊ.lə.raɪz/", "verb", "The debate polarized the entire nation.", "বিতর্কটি পুরো জাতিকে দুই বিপরীত মেরুতে বিভক্ত করে দিল।", ["divide", "split", "cleave"], ["unite", "harmonize"], "Push toward extreme north and south poles.", "intermediate"),
        ("Quell", "দমন করা , শান্ত করা", "/kwel/", "verb", "Security forces quelled the violent uprising.", "নিরাপত্তা বাহিনী সহিংস অভ্যুত্থানটি শক্ত হাতে দমন করল।", ["suppress", "extinguish", "calm"], ["incite", "inflame"], "Kill the fire of revolt.", "advanced"),
        ("Subjugate", "পদানত করা , পদদলিত করে রাখা", "/ˈsʌb.dʒʊ.ɡeɪt/", "verb", "The conqueror subjugated neighboring territories.", "বিজেতা পার্শ্ববর্তী অঞ্চলগুলোকে পদানত করেছিল।", ["conquer", "enslave", "vanquish"], ["liberate", "emancipate"], "Sub (under) + jugum (yoke).", "advanced"),
        ("Tyranny", "স্বৈরাচার , নির্মম নিষ্ঠুর শাসন", "/ˈtɪr.ən.i/", "noun", "Citizens rose up against the tyrant's cruel tyranny.", "স্বৈরাচারী শাসকের নির্মম নিপীড়নের বিরুদ্ধে নাগরিকরা জেগে উঠল।", ["despotism", "autocracy", "oppression"], ["democracy", "liberty"], "Rule of an absolute despot.", "intermediate"),
        ("Usurp", "বেআইনিভাবে ক্ষমতা দখল করা", "/juːˈzɜːp/", "verb", "The general attempted to usurp presidential power.", "জেনারেল রাষ্ট্রপতির ক্ষমতা বেআইনিভাবে কুক্ষিগত করার চেষ্টা করলেন।", ["seize", "arrogate", "commandeer"], ["relinquish", "yield"], "Usurpare = seize for one's own use.", "advanced"),
        ("Vanquish", "সম্পূর্ণরূপে পরাজিত করা", "/ˈvæŋ.kwɪʃ/", "verb", "They vowed to vanquish poverty across the region.", "তারা অঞ্চলজুড়ে দারিদ্র্যকে চিরতরে নির্মূল করার প্রতিজ্ঞা নিয়েছিল।", ["defeat", "conquer", "overcome"], ["surrender", "lose"], "Vincere = to conquer.", "advanced"),
        ("Withstand", "প্রতিরোধ করা বা সহ্য করা", "/wɪðˈstænd/", "verb", "The bridge was designed to withstand intense earthquakes.", "সেতুটি তীব্র ভূমিকম্প সহ্য করার উপযোগী করে নির্মিত হয়েছিল।", ["endure", "resist", "tolerate"], ["succumb", "yield"], "Stand firm against force.", "intermediate"),
        ("Sovereignty", "সার্বভৌমত্ব , পরম কর্তৃত্ব", "/ˈsɒv.rɪn.ti/", "noun", "Every country has the right to defend its territorial sovereignty.", "প্রত্যেক দেশের নিজস্ব ভৌগোলিক সার্বভৌমত্ব রক্ষার অধিকার রয়েছে।", ["autonomy", "independence", "rule"], ["subjugation", "dependence"], "Super = above all others.", "intermediate")
    ]),
    (6, "Unit 6: Change, Growth & Transformation", "Day 6 — Metamorphosis, Peaks & Decline", "amber", [
        ("Adapt", "অভিযোজিত হওয়া , মানিয়ে নেওয়া", "/əˈdæpt/", "verb", "Animals adapt to changing climatic patterns.", "প্রাণীরা পরিবর্তিত জলবায়ুর সাথে নিজেদের খাপ খাইয়ে নেয়।", ["adjust", "acclimate", "modify"], ["resist", "stagnate"], "Fit towards new circumstances.", "beginner"),
        ("Blossom", "বিকশিত হওয়া , প্রস্ফুটিত হওয়া", "/ˈblɒs.əm/", "verb", "Her artistic talent blossomed under great mentorship.", "যোগ্য গুরুর সান্নিধ্যে তার শিল্পপ্রতিভা সুন্দরভাবে বিকশিত হয়েছিল।", ["flourish", "bloom", "thrive"], ["wither", "fade"], "Like a flower opening.", "beginner"),
        ("Catalyze", "ত্বরান্বিত করা , প্রভাবক হিসেবে কাজ করা", "/ˈkæt.əl.aɪz/", "verb", "The new policy catalyzed rapid tech investments.", "নতুন নীতিমালা দ্রুত প্রযুক্তি বিনিয়োগকে ত্বরান্বিত করেছিল।", ["accelerate", "stimulate", "spark"], ["hinder", "retard"], "Catalyst in chemistry speeds reaction.", "advanced"),
        ("Diminish", "হ্রাস পাওয়া বা কমানো", "/dɪˈmɪn.ɪʃ/", "verb", "His influence diminished over the years.", "বছরের ব্যবধানে তার প্রভাব কমে গিয়েছিল।", ["decrease", "lessen", "shrink"], ["increase", "expand"], "Minus = less.", "intermediate"),
        ("Evolve", "বিবর্তিত হওয়া , ক্রমান্বয়ে রূপ নেওয়া", "/ɪˈvɒlv/", "verb", "The startup evolved into a multinational enterprise.", "ক্ষুদ্র স্টার্টআপটি ক্রমে একটি বহুজাতিক প্রতিষ্ঠানে রূপ নিল।", ["develop", "progress", "transform"], ["stagnate", "revert"], "Roll out progressively.", "intermediate"),
        ("Fluctuate", "ওঠানামা করা , অস্থির থাকা", "/ˈflʌk.tʃu.eɪt/", "verb", "Fuel prices fluctuate constantly based on global crude rates.", "বিশ্ববাজারের অপরিশোধিত তেলের দরের ওপর নির্ভর করে জ্বালানির দাম ক্রমাগত ওঠানামা করে।", ["oscillate", "waver", "shift"], ["stabilize", "remain constant"], "Fluctus = wave.", "intermediate"),
        ("Metamorphosis", "আমূল রূপান্তর , কায়াপল্টানো", "/ˌmet.əˈmɔː.fə.sɪs/", "noun", "Caterpillar undergo complete metamorphosis to become butterflies.", "শুঁয়োপোকা প্রজাপতিতে রূপ নিতে পূর্ণাঙ্গ রূপান্তরের মধ্য দিয়ে যায়।", ["transformation", "mutation", "transfiguration"], ["stagnation", "permanence"], "Meta (change) + morphe (form).", "advanced"),
        ("Nascent", "সদ্যজাত , উন্মেষমান", "/ˈnæs.ənt/", "adjective", "The nascent electric vehicle industry holds immense promise.", "সদ্য উন্মেষমান বৈদ্যুতিক গাড়ি শিল্পে অপার সম্ভাবনা রয়েছে।", ["emerging", "budding", "incipient"], ["dying", "moribund"], "Nasci = to be born.", "advanced"),
        ("Oscillate", "দোলায়মান হওয়া , দোদুল্যমান থাকা", "/ˈɒs.ɪ.leɪt/", "verb", "His opinion oscillated between two options.", "তার সিদ্ধান্ত দুটি পছন্দের মধ্যে দোদুল্যমান ছিল।", ["swing", "sway", "vacillate"], ["stabilize", "remain still"], "Like a pendulum swinging.", "advanced"),
        ("Proliferate", "দ্রুত বংশবৃদ্ধি বা সংখ্যায় বৃদ্ধি পাওয়া", "/prəˈlɪf.ər.eɪt/", "verb", "Cellphones proliferated across rural communities.", "গ্রামীণ জনপদে মুঠোফোনের দ্রুত বিস্তার ঘটল।", ["multiply", "mushroom", "expand"], ["decrease", "dwindle"], "Prolific growth.", "advanced"),
        ("Revamp", "সংস্কার বা নতুন রূপ দেওয়া", "/ˌriːˈvæmp/", "verb", "The university revamped its computer curriculum.", "বিশ্ববিদ্যালয় তার কম্পিউটার পাঠ্যক্রম সংস্কার করে আধুনিক রূপ দিল।", ["overhaul", "renovate", "restructure"], ["neglect", "ruin"], "Put a new vamp on old shoes.", "intermediate"),
        ("Stagnate", "স্থবির হয়ে পড়া , থমকে যাওয়া", "/stæɡˈneɪt/", "verb", "Without innovation, the business began to stagnate.", "উদ্ভাবন ছাড়া ব্যবসাটি স্থবির হয়ে পড়তে শুরু করল।", ["idle", "languish", "deteriorate"], ["thrive", "flourish"], "Stagnant, unmoving pool.", "intermediate"),
        ("Transmute", "এক রূপ থেকে অন্য রূপে রূপান্তর করা", "/trænzˈmjuːt/", "verb", "Alchemists sought to transmute base metals into gold.", "অপরসায়নিকেরা নিকৃষ্ট ধাতুকে সোনায় রূপান্তর করতে চেয়েছিলেন।", ["convert", "transform", "alter"], ["preserve", "maintain"], "Trans (across) + mutare (change).", "advanced"),
        ("Vacillate", "দ্বিধায় দোদুল্যমান থাকা", "/ˈvæs.ɪ.leɪt/", "verb", "She vacillated between accepting the job or going abroad.", "চাকরিটি গ্রহণ করা নাকি বিদেশে যাওয়া—এই নিয়ে সে দোলাচলে ভুগছিল।", ["waver", "hesitate", "fluctuate"], ["decide", "resolve"], "Waver back and forth.", "advanced"),
        ("Wane", "ক্ষীণ হওয়া , ক্রমশ হ্রাস পাওয়া", "/weɪn/", "verb", "The popularity of the singer began to wane.", "গায়কের জনপ্রিয়তা ধীরে ধীরে কমতে শুরু করল।", ["decline", "diminish", "ebb"], ["wax", "grow"], "Moon wanes after full moon.", "intermediate"),
        ("Wax", "ক্রমশ বৃদ্ধি পাওয়া বা পূর্ণ হওয়া", "/wæks/", "verb", "Her enthusiasm waxed as the deadline approached.", "সময় যত ঘনিয়ে এলো তার উদ্দীপনা ততই বাড়তে লাগল।", ["increase", "expand", "swell"], ["wane", "diminish"], "Moon waxes toward full moon.", "intermediate"),
        ("Zenith", "শীর্ষবিন্দু , চরম উন্নতি", "/ˈzen.ɪθ/", "noun", "At the zenith of his career, he won global accolades.", "কর্মজীবনের সর্বোচ্চ চূড়ায় তিনি বিশ্বজোড়া সম্মান অর্জন করেছিলেন।", ["peak", "pinnacle", "apex"], ["nadir", "bottom"], "Highest point overhead in sky.", "advanced"),
        ("Abate", "তীব্রতা হ্রাস পাওয়া , উপশম হওয়া", "/əˈbeɪt/", "verb", "The storm finally abated by midnight.", "মধ্যরাতের মধ্যে ঝড়টি অবশেষে শান্ত হয়ে এলো।", ["subside", "lessen", "slacken"], ["intensify", "worsen"], "Batter down to lessen.", "intermediate"),
        ("Augment", "বৃদ্ধি করা , বাড়িয়ে তোলা", "/ɔːɡˈment/", "verb", "He took a second job to augment his family income.", "পারিবারিক আয় বাড়াতে তিনি দ্বিতীয় একটি চাকরি নিলেন।", ["increase", "supplement", "boost"], ["reduce", "deplete"], "Augere = to increase.", "intermediate"),
        ("Culminate", "চরম পরিণতিতে পৌঁছানো", "/ˈkʌl.mɪ.neɪt/", "verb", "Years of rigorous practice culminated in an Olympic medal.", "কঠোর সাধনার পর অবশেষে একটি অলিম্পিক পদক দিয়ে সাফল্যের সমাপ্তি ঘটল।", ["peak", "climax", "conclude"], ["commence", "begin"], "Culmen = summit.", "intermediate")
    ])
]

# Create remaining units with automatic topics if needed to reach 30
additional_unit_topics = [
    (7, "Unit 7: Society, Culture & Communities", "Day 7 — Norms, Heritage & Demographic Shifts", "indigo", [
        ("Anachronism", "কালভ্রম , যুগের সাথে বেমানান বিষয়", "/əˈnæk.rə.nɪ.zəm/", "noun", "Using a typewriter in a modern office seems like an anachronism.", "আধুনিক অফিসে টাইপরাইটার ব্যবহার করাটা যুগের সাথে চরম বেমানান কালভ্রম।", ["archaism", "mismatch"], ["modernity"], "Ana (against) + chronos (time).", "advanced"),
        ("Bourgeois", "মধ্যবিত্ত মানসিকতার", "/ˈbʊəʒ.wɑː/", "adjective", "They rejected conventional bourgeois values.", "তারা প্রচলিত মধ্যবিত্ত ধ্যানধারণাকে বর্জন করেছিল।", ["middle-class", "conventional"], ["proletarian", "radical"], "Bourgeoisie.", "intermediate"),
        ("Cosmopolitan", "বিশ্বজনীন , বহু সংস্কৃতির অনুরাগী", "/ˌkɒz.məˈpɒl.ɪ.tən/", "adjective", "London is a truly cosmopolitan metropolis.", "লন্ডন একটি সত্যিকার অর্থেই বিশ্বজনীন বৈচিত্র্যময় মহানগরী।", ["global", "multicultural"], ["parochial", "provincial"], "Cosmos (world) + polites (citizen).", "intermediate"),
        ("Demography", "জনমিতি , জনসংখ্যা বিষয়ক বিদ্যা", "/dɪˈmɒɡ.rə.fi/", "noun", "Changing urban demography influences housing policies.", "পরিবর্তিত নগর জনমিতি আবাসন নীতিমালার ওপর প্রভাব ফেলে।", ["population statistics", "census"], [], "Demos (people) + graphy.", "intermediate"),
        ("Egalitarian", "সাম্যবাদী , সর্বজনীন সমতায় বিশ্বাসী", "/ɪˌɡæl.ɪˈteə.ri.ən/", "adjective", "An egalitarian society values equal opportunity for all.", "একটি সাম্যবাদী সমাজ সবার জন্য সমান সুযোগকে গুরুত্ব দেয়।", ["democratic", "equal"], ["elitist", "hierarchical"], "Equal rights for all.", "advanced"),
        ("Gentrification", "শহুরে নিম্নবিত্ত অঞ্চলের আধুনিকীকরণ", "/ˌdʒen.trɪ.fɪˈkeɪ.ʃən/", "noun", "Gentrification pushed long-time local residents out.", "এলাকার আধুনিকীকরণের ফলে পুরনো বাসিন্দারা অন্যত্র সরে যেতে বাধ্য হলো।", ["urban renewal", "development"], [], "Gentry = aristocracy moving in.", "advanced"),
        ("Heterogeneous", "বহুবিধ , বিষমজাতীয় বা মিশ্র", "/ˌhet.ər.əˈdʒiː.ni.əs/", "adjective", "A heterogeneous mix of diverse languages and customs.", "নানা ভাষা ও রীতিনীতির এক বৈচিত্র্যময় মিশ্রণ।", ["diverse", "varied"], ["homogeneous", "uniform"], "Hetero (different) + genos (kind).", "advanced"),
        ("Indigenous", "স্থানীয় , আদিবাসী বা স্বদেশী", "/ɪnˈdɪdʒ.ɪ.nəs/", "adjective", "Preserving the rights and knowledge of indigenous peoples.", "আদিবাসী সম্প্রদায়ের জ্ঞান ও অধিকার সংরক্ষণ করা।", ["native", "aboriginal"], ["foreign", "alien"], "Born of the land.", "intermediate"),
        ("Juxtaposition", "পাশাপাশি স্থাপন করে বৈসাদৃশ্য প্রদর্শন", "/ˌdʒʌk.stə.pəˈzɪʃ.ən/", "noun", "The juxtaposition of ancient ruins and skyscrapers was striking.", "প্রাচীন ধ্বংসাবশেষ ও আধুনিক গগনচুম্বী ভবনের যুগলবন্দি ছিল অসাধারণ।", ["contrast", "comparison"], [], "Juxta (beside) + position.", "advanced"),
        ("Multicultural", "বহুসংস্কৃতিসম্পন্ন", "/ˌmʌl.tiˈkʌl.tʃər.əl/", "adjective", "Canada prides itself on being a multicultural mosaic.", "কানাডা নিজেকে বহুসংস্কৃতির এক বৈচিত্র্যময় দেশ হিসেবে গর্ব করে।", ["diverse", "pluralistic"], ["monocultural"], "Many cultures.", "beginner"),
        ("Norm", "সামাজিক প্রথা বা মানদণ্ড", "/nɔːm/", "noun", "Respect for elders is a fundamental cultural norm.", "গুরুজনদের শ্রদ্ধা করা একটি মৌলিক সামাজিক রীতি।", ["standard", "convention"], ["anomaly", "aberration"], "Standard societal rule.", "beginner"),
        ("Oligarchy", "কতিপয়তন্ত্র , মুষ্টিমেয়র শাসন", "/ˈɒl.ɪ.ɡɑː.ki/", "noun", "The nation was ruled by a corrupt financial oligarchy.", "দেশটি একটি দুর্নীতিগ্রস্ত আর্থিক কতিপয়তন্ত্র দ্বারা শাসিত হচ্ছিল।", ["plutocracy", "clique"], ["democracy"], "Oligos (few) + arche (rule).", "advanced"),
        ("Pluralism", "বহুত্ববাদ , বৈচিত্র্যের সহাবস্থান", "/ˈplʊə.rəl.ɪ.zəm/", "noun", "Religious pluralism enriches the tapestry of national life.", "ধর্মীয় বহুত্ববাদ জাতীয় জীবনের মেলবন্ধনকে সমৃদ্ধ করে।", ["diversity", "coexistence"], ["uniformity"], "Plural = multiple groups.", "intermediate"),
        ("Quorum", "কোরাম , সভায় উপস্থিতির ন্যূনতম সংখ্যা", "/ˈkwɔː.rəm/", "noun", "The committee could not vote because it lacked a quorum.", "উপস্থিতির ন্যূনতম সংখ্যা না থাকায় কমিটি কোনো ভোট দিতে পারেনি।", ["minimum attendance"], [], "Sufficient members present.", "intermediate"),
        ("Ritual", "ধর্মীয় বা সামাজিক আচার-অনুষ্ঠান", "/ˈrɪtʃ.u.əl/", "noun", "Morning tea has become an indispensable daily ritual.", "সকালের চা তার দৈনন্দিন জীবনে এক অবিচ্ছেদ্য অভ্যাসে পরিণত হয়েছে।", ["ceremony", "rite"], [], "Sacred or habitual customs.", "beginner"),
        ("Stratification", "সামাজিক স্তরবিন্যাস", "/ˌstræt.ɪ.fɪˈkeɪ.ʃən/", "noun", "Social stratification based on wealth creates inequality.", "সম্পদের ওপর ভিত্তি করে সামাজিক স্তরবিন্যাস বৈষম্য তৈরি করে।", ["layering", "hierarchy"], ["equality"], "Strata = layers.", "advanced"),
        ("Taboo", "সামাজিকভাবে নিষিদ্ধ বিষয়", "/təˈbuː/", "noun", "Mental illness was once a major cultural taboo.", "মানসিক অসুস্থতা একসময় সমাজে চরম নিষিদ্ধ এক বিষয় ছিল।", ["prohibition", "restriction"], ["acceptable"], "Forbidden custom.", "intermediate"),
        ("Vernacular", "আঞ্চলিক মুখের ভাষা", "/vəˈnæk.jə.lər/", "noun", "He translated ancient epics into the local vernacular.", "তিনি প্রাচীন মহাকাব্যগুলোকে স্থানীয় মুখের ভাষায় রূপান্তর করেছিলেন।", ["native tongue", "dialect"], ["formal standard"], "Native everyday speech.", "advanced"),
        ("Assimilate", "আত্মীকরণ করা বা মিশে যাওয়া", "/əˈsɪm.ɪ.leɪt/", "verb", "Immigrants worked hard to assimilate into the new society.", "অভিবাসীরা নতুন সমাজের সাথে মানিয়ে নিতে অক্লান্ত পরিশ্রম করেছিল।", ["integrate", "absorb"], ["alienate", "isolate"], "Similis = similar.", "intermediate"),
        ("Diaspora", "প্রবাসী সম্প্রদায় , জাতিগত দেশান্তর", "/daɪˈæs.pər.ə/", "noun", "The Bengali diaspora celebrates language day across the world.", "বিশ্বজুড়ে প্রবাসী বাঙালিরা মহান ভাষা দিবস উদযাপন করে।", ["dispersion", "exile"], ["homeland"], "Scattering across nations.", "advanced")
    ]),
    (8, "Unit 8: Science, Nature & Ecology", "Day 8 — Biospheres, Physics & Planetary Rhythms", "teal", [
        ("Biodiversity", "জীববৈচিত্র্য", "/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/", "noun", "Rainforests boast immense biodiversity.", "বর্ষাবনগুলো সমৃদ্ধ জীববৈচিত্র্যে পরিপূর্ণ।", ["biological variety", "wildlife"], [], "Bio (life) + diversity.", "intermediate"),
        ("Desiccation", "চরম শুষ্কতা , পানিশূন্যতা", "/ˌdes.ɪˈkeɪ.ʃən/", "noun", "Severe desiccation caused crops to fail completely.", "চরম খরার কারণে ফসল সম্পূর্ণ নষ্ট হয়ে গিয়েছিল।", ["dehydration", "aridity"], ["hydration", "moisture"], "Drying out completely.", "advanced"),
        ("Ecosystem", "বাস্তুতন্ত্র", "/ˈiː.kəʊˌsɪs.təm/", "noun", "Pollution harms delicate marine ecosystems.", "দূষণ সংবেদনশীল সামুদ্রিক বাস্তুতন্ত্রের ক্ষতি করে।", ["biome", "ecological system"], [], "Oikos (house) of life.", "beginner"),
        ("Flora", "কোনো অঞ্চলের উদ্ভিদকুল", "/ˈflɔː.rə/", "noun", "Researchers documented the alpine flora.", "গবেষকেরা পার্বত্য অঞ্চলের উদ্ভিদকুলের তালিকা তৈরি করেছিলেন।", ["plant life", "vegetation"], ["fauna"], "Goddess of flowers.", "intermediate"),
        ("Fauna", "কোনো অঞ্চলের প্রাণিকুল", "/ˈfɔː.nə/", "noun", "The island is home to rare native fauna.", "দ্বীপটি বিরল প্রজাতির দেশীয় প্রাণিকুলের আবাসস্থল।", ["animal life", "wildlife"], ["flora"], "Faunus = woodland spirit.", "intermediate"),
        ("Geothermal", "ভূ-তাপীয় শক্তি", "/ˌdʒiː.əʊˈθɜː.məl/", "adjective", "Geothermal power plants tap earth's internal heat.", "ভূ-তাপীয় বিদ্যুৎকেন্দ্রগুলো পৃথিবীর ভূগর্ভস্থ উত্তাপ কাজে লাগায়।", ["earth-heat"], [], "Geo (earth) + therme (heat).", "intermediate"),
        ("Habitat", "প্রাকৃতিক আবাসস্থল", "/ˈhæb.ɪ.tæt/", "noun", "Deforestation destroys the natural habitat of tigers.", "বন উজাড় বাঘের প্রাকৃতিক আবাসস্থল ধ্বংস করে।", ["environment", "home"], [], "Habitare = to dwell.", "beginner"),
        ("Kinetic", "গতিশক্তি সংক্রান্ত , চলনশীল", "/kɪˈnet.ɪk/", "adjective", "Windmills convert wind's kinetic energy into electricity.", "বায়ুকল বাতাসের গতিশক্তিকে বিদ্যুতে রূপান্তর করে।", ["moving", "active"], ["potential", "static"], "Kinesis = movement.", "intermediate"),
        ("Luminescence", "আলোর নির্গমন , দীপ্তি", "/ˌluː.mɪˈnes.əns/", "noun", "Fireflies glow with cool biochemical luminescence.", "জোনাকিরা শীতল প্রাণরাসায়নিক দীপ্তিতে জ্বলে থাকে।", ["glow", "radiance"], ["darkness"], "Lumen = light.", "advanced"),
        ("Mutation", "জেনেটিক পরিবর্তন বা রূপান্তর", "/mjuːˈteɪ.ʃən/", "noun", "A random genetic mutation gave rise to antibiotic resistance.", "একটি অনির্দিষ্ট বংশগত মিউটেশনের ফলে অ্যান্টিবায়োটিক প্রতিরোধী ক্ষমতা তৈরি হয়েছিল।", ["genetic alteration", "change"], [], "Mutare = to change.", "intermediate"),
        ("Nocturnal", "নিশাচর , রাতের বেলা সক্রিয়", "/nɒkˈtɜː.nəl/", "adjective", "Owls are nocturnal predators with sharp vision.", "পেঁচা হলো নিশাচর শিকারি যাদের দৃষ্টিশক্তি অত্যন্ত প্রখর।", ["nighttime", "night-active"], ["diurnal"], "Nox / noct = night.", "intermediate"),
        ("Photosynthesis", "সালোকসংশ্লেষণ", "/ˌfəʊ.təʊˈsɪn.θə.sɪs/", "noun", "Plants absorb solar energy during photosynthesis.", "গাছপালা সালোকসংশ্লেষণের সময় সৌরশক্তি শোষণ করে।", ["solar food creation"], [], "Photo (light) + synthesis.", "intermediate"),
        ("Radiation", "তেজস্ক্রিয়তা বা বিকিরণ", "/ˌreɪ.diˈeɪ.ʃən/", "noun", "The ozone layer shields us from harmful solar radiation.", "ওজোন স্তর সূর্যের ক্ষতিকর বিকিরণ থেকে আমাদের রক্ষা করে।", ["emission", "rays"], [], "Radiating energy outwards.", "intermediate"),
        ("Symbiosis", "মিথোজীবিতা , পরস্পরের ওপর নির্ভরশীলতা", "/ˌsɪm.baɪˈəʊ.sɪs/", "noun", "Bees and flowering plants live in perfect symbiosis.", "মৌমাছি ও সপুষ্পক উদ্ভিদ চমৎকার মিথোজীবিতার মাধ্যমে বাঁচে।", ["mutualism", "interdependence"], ["parasitism"], "Syn (together) + bios (life).", "advanced"),
        ("Topography", "ভূসংস্থান , মাটির ভূমিরূপ", "/təˈpɒɡ.rə.fi/", "noun", "The steep topography made road construction difficult.", "খাড়া ভূমিরূপের কারণে সেখানে রাস্তা নির্মাণ করা কঠিন ছিল।", ["terrain", "landscape"], [], "Topos (place) + graphy.", "advanced"),
        ("Viscosity", "সান্দ্রতা , তরলের ঘনত্বের প্রবাহ-প্রতিরোধ", "/vɪsˈkɒs.ə.ti/", "noun", "Honey has a much higher viscosity than water.", "মধু পানির চেয়ে অনেক বেশি সান্দ্র বা আঠালো প্রকৃতির।", ["thickness", "stickiness"], ["fluidity"], "Resistance to flow.", "advanced"),
        ("Watershed", "জলবিভাজিকা বা যুগান্তকারী সন্ধিক্ষণ", "/ˈwɔː.tə.ʃed/", "noun", "The discovery marked a historic watershed in physics.", "আবিষ্কারটি পদার্থবিজ্ঞানের ইতিহাসে এক যুগান্তকারী সন্ধিক্ষণ সৃষ্টি করেছিল।", ["turning point", "milestone"], [], "Water boundary dividing basins.", "intermediate"),
        ("Zoonotic", "প্রাণীবাহিত রোগ সংক্রান্ত", "/ˌzəʊ.əˈnɒt.ɪk/", "adjective", "Rabies is a well-known zoonotic disease.", "জলাতঙ্ক একটি সুপরিচিত প্রাণীবাহিত রোগ।", ["animal-borne"], [], "Zoon (animal) + nosos (disease).", "advanced"),
        ("Endemic", "কোনো অঞ্চলে সীমাবদ্ধ প্রজাতি বা রোগ", "/enˈdem.ɪk/", "adjective", "That rare bird is strictly endemic to Madagascar.", "সেই বিরল পাখিটি সম্পূর্ণভাবে মাদাগাস্কারের স্থানীয় প্রাণী।", ["native", "restricted"], ["widespread", "pandemic"], "En (in) + demos (people/place).", "intermediate"),
        ("Canopy", "বনের বৃক্ষরাজির উপরিভাগের ছাউনি", "/ˈkæn.ə.pi/", "noun", "Monkeys leaped gracefully through the forest canopy.", "বানরগুলো বনের উপরের ঘন পাতার ছাউনির মধ্য দিয়ে লাফাচ্ছিল।", ["treetop roof", "cover"], [], "Overhead leafy shelter.", "intermediate")
    ]),
    (9, "Unit 9: Art, Aesthetics & Creativity", "Day 9 — Forms, Styles & Creative Mastery", "pink", [
        ("Abstract", "বিমূর্ত , অবয়বহীন ভাবনার", "/ˈæb.strækt/", "adjective", "Abstract paintings rely on raw emotion rather than literal forms.", "বিমূর্ত চিত্রকর্ম বাস্তব বস্তুর বদলে অনুভূতির ওপর নির্ভর করে।", ["non-representational", "conceptual"], ["concrete", "realistic"], "Drawn away from literal form.", "intermediate"),
        ("Baroque", "অত্যধিক অলঙ্কৃত ও জমকালো শিল্পরীতি", "/bəˈrɒk/", "adjective", "The cathedral boasts elaborate baroque arches.", "গির্জাটিতে অত্যন্ত জমকালো ও অলঙ্কৃত খিলান রয়েছে।", ["ornate", "flamboyant"], ["minimalist", "plain"], "Ornate irregular pearl style.", "advanced"),
        ("Cacophony", "বেসুরো কর্কশ আওয়াজ", "/kəˈkɒf.ən.i/", "noun", "A cacophony of blaring horns broke the morning peace.", "হর্নের কর্কশ আওয়াজে ভোরের প্রশান্তি ভেঙে গেল।", ["dissonance", "discord"], ["harmony", "euphony"], "Kakus (bad) + phone (sound).", "advanced"),
        ("Dissonance", "সুরবিরোধ , অমিল বা অসঙ্গতি", "/ˈdɪs.ən.əns/", "noun", "Cognitive dissonance occurs when beliefs contradict actions.", "বিশ্বাস ও কাজের অমিল ঘটলে মানসিক অসঙ্গতির সৃষ্টি হয়।", ["discord", "friction"], ["harmony", "accord"], "Dis + sonare (sound).", "advanced"),
        ("Eclectic", "নানা উৎস থেকে সংগৃহীত চমৎকার মিশ্রণ", "/ɪˈklek.tɪk/", "adjective", "Her home has an eclectic collection of antique art.", "তার বাড়িতে প্রাচীন শিল্পের এক চমৎকার সংকলিত মিশ্রণ আছে।", ["diverse", "catholic"], ["monotonous"], "Eklektikos = choosing the best.", "intermediate"),
        ("Grandiose", "আড়ম্বরপূর্ণ কিন্তু ভড়ংযুক্ত", "/ˈɡræn.di.əʊs/", "adjective", "He had grandiose schemes that ended in failure.", "তার কিছু চটকদার বড় বড় পরিকল্পনা ছিল যা ব্যর্থ হয়েছিল।", ["pretentious", "pompous"], ["humble", "modest"], "Grand beyond reality.", "advanced"),
        ("Harmony", "সুরেলা ঐক্য ও সঙ্গতি", "/ˈhɑː.mə.ni/", "noun", "Vocal harmony created a mesmerizing atmosphere.", "কণ্ঠের সুরেলা ঐক্য এক মোহময় পরিবেশ সৃষ্টি করেছিল।", ["concord", "agreement"], ["discord", "clash"], "Fitting together gracefully.", "beginner"),
        ("Iconoclast", "প্রচলিত প্রথা বা বিশ্বাস ভাঙার সাহসী ব্যক্তি", "/aɪˈkɒn.ə.klæst/", "noun", "The poet was an iconoclast who mocked social hypocrisy.", "কবি ছিলেন এক সংস্কারভাঙা পুরুষ যিনি সামাজিক ভণ্ডামিকে উপহাস করতেন।", ["rebel", "nonconformist"], ["conformist", "traditionalist"], "Eikon (image) + klan (break).", "advanced"),
        ("Juxtapose", "বৈসাদৃশ্য দেখানোর জন্য পাশাপাশি রাখা", "/ˌdʒʌk.stəˈpəʊz/", "verb", "The exhibition juxtaposes classical and digital art.", "প্রদর্শনীটিতে ধ্রুপদী ও ডিজিটাল শিল্পকে পাশাপাশি উপস্থাপন করা হয়েছে।", ["contrast", "collocate"], [], "Place side by side.", "advanced"),
        ("Kitsch", "রুচিহীন বা সস্তা জনপ্রিয় শিল্প", "/kɪtʃ/", "noun", "The souvenir shop was packed with colorful kitsch.", "স্মারক দোকানটি সস্তা ও চটকদার পণ্যে ঠাসা ছিল।", ["tackiness", "cheap art"], ["masterpiece"], "Tacky, pretentious souvenirs.", "advanced"),
        ("Lyrical", "কাব্যময় ও সুরময়", "/ˈlɪr.ɪ.kəl/", "adjective", "He wrote with lyrical prose that captivated readers.", "তিনি এমন কাব্যময় গদ্যে লিখেছিলেন যা পাঠকদের মুগ্ধ করেছিল।", ["poetic", "melodic"], ["harsh", "pedestrian"], "Like playing the lyre.", "intermediate"),
        ("Motif", "শিল্পকর্মের কেন্দ্রীয় মূলভাব বা নকশা", "/məʊˈtiːf/", "noun", "A recurring bird motif symbolizes freedom in the novel.", "উপন্যাসে বারবার ফিরে আসা পাখির প্রতীকটি মুক্তির প্রতীক।", ["theme", "pattern"], [], "Dominant recurring idea.", "intermediate"),
        ("Opulent", "ঐশ্বর্যমণ্ডিত , বিলাসবহুল", "/ˈɒp.jə.lənt/", "adjective", "The palace halls were decorated in opulent gold leaf.", "প্রাসাদের কক্ষগুলো চোখ ধাঁধানো সোনালি সাজে সুসজ্জিত ছিল।", ["luxurious", "lavish"], ["sparse", "austere"], "Opus = wealth and works.", "advanced"),
        ("Quintessential", "সর্বোৎকৃষ্ট বা খাঁটি নিদর্শন", "/ˌkwɪn.tɪˈsen.ʃəl/", "adjective", "Cricket on a green lawn is quintessential English culture.", "সবুজ মাঠে ক্রিকেট খেলা খাঁটি ইংরেজ সংস্কৃতির প্রতিচ্ছবি।", ["archetypal", "ideal"], [], "Fifth essence; pure perfection.", "advanced"),
        ("Resonant", "গভীর অনুরণন সৃষ্টিকারী", "/ˈrez.ən.ənt/", "adjective", "The speaker's resonant voice commanded the entire hall.", "বক্তার গম্ভীর অনুরণনযুক্ত কণ্ঠ পুরো হলে প্রতিধ্বনিত হয়েছিল।", ["booming", "evocative"], ["faint", "muffled"], "Re-sounding richly.", "intermediate"),
        ("Sublime", "মহিমান্বিত , পরম সুন্দর ও উদ্দীপক", "/səˈblaɪm/", "adjective", "The sunrise over the Himalayas was sheer sublime beauty.", "হিমালয়ের বুকে সূর্যোদয় ছিল এক পরম মহিমান্বিত স্বর্গীয় দৃশ্য।", ["exalted", "transcendent"], ["ordinary", "pedestrian"], "Up to the high threshold.", "advanced"),
        ("Virtuoso", "কোনো শিল্পে অসাধারণ দক্ষ ব্যক্তি", "/ˌvɜː.tʃuˈəʊ.səʊ/", "noun", "The teenage piano virtuoso received a standing ovation.", "কিশোর পিয়ানো বিশারদকে দাঁড়িয়ে অভিবাদন জানানো হয়েছিল।", ["prodigy", "master"], ["novice", "amateur"], "Virtue in artistic skill.", "advanced"),
        ("Whimsical", "খামখেয়ালি কিন্তু আমুদে ও মিষ্টি", "/ˈwɪm.zɪ.kəl/", "adjective", "The children's book featured whimsical illustrations.", "শিশুদের বইটিতে ছিল মিষ্টি ও অদ্ভুত মজার সব রঙিন ছবি।", ["playful", "fanciful"], ["serious", "somber"], "Whim of imagination.", "intermediate"),
        ("Avant-garde", "অগ্রবর্তী ও পরীক্ষামূলক শিল্পরীতি", "/ˌæv.ɑ̃ːˈɡɑːd/", "adjective", "His avant-garde designs shocked conservative critics.", "তার অগ্রবর্তী পরীক্ষামূলক নকশা রক্ষণশীল সমালোচকদের চমকে দিয়েছিল।", ["innovative", "experimental"], ["traditional", "dated"], "Vanguard of new ideas.", "advanced"),
        ("Chiaroscuro", "আলো-আঁধারির তীব্র বৈসাদৃশ্যময় চিত্ররীতি", "/kiˌɑː.rəˈskjʊə.rəʊ/", "noun", "Rembrandt was a supreme master of chiaroscuro.", "রেমব্রান্ট ছিলেন আলো-ছায়ার বৈসাদৃশ্যময় চিত্ররীতির এক অনন্য ওস্তাদ।", ["light and shade"], [], "Chiaro (light) + scuro (dark).", "advanced")
    ])
]

# We will generate remaining units programmatically with standard templates
for u_id in range(10, 31):
    unit_titles = {
        10: ("Unit 10: Law, Justice & Ethics", "Day 10 — Jurisprudence, Guilt & Constitutional Principles", "blue"),
        11: ("Unit 11: Business, Finance & Economics", "Day 11 — Markets, Fiscal Health & Enterprise", "emerald"),
        12: ("Unit 12: Technology, Digital & Innovation", "Day 12 — Computation, Algorithms & Future Networks", "cyan"),
        13: ("Unit 13: Time, History & Epochs", "Day 13 — Eras, Legacies & Fleeting Moments", "amber"),
        14: ("Unit 14: Space, Astronomy & Cosmos", "Day 14 — Galaxies, Celestial Phenomena & Stellar Depths", "indigo"),
        15: ("Unit 15: Health, Medicine & Vitality", "Day 15 — Diagnostics, Immunity & Clinical Healing", "red"),
        16: ("Unit 16: Mind, Memory & Psychology", "Day 16 — Subconscious Drives, Habits & Perceptions", "purple"),
        17: ("Unit 17: Communication, Media & Language", "Day 17 — Dialects, Rhetoric & Mass Transmission", "teal"),
        18: ("Unit 18: Nature, Weather & Geography", "Day 18 — Landforms, Extreme Climates & Biomes", "emerald"),
        19: ("Unit 19: Work, Profession & Ambition", "Day 19 — Career Trajectories, Craftsmanship & Tenacity", "blue"),
        20: ("Unit 20: Food, Taste & Sustenance", "Day 20 — Flavors, Nutrition & Gastronomy", "amber"),
        21: ("Unit 21: Travel, Exploration & Journey", "Day 21 — Wayfarers, Odysseys & Far Horizons", "indigo"),
        22: ("Unit 22: Education, Learning & Academics", "Day 22 — Scholarship, Erudition & Pedagogy", "cyan"),
        23: ("Unit 23: Philosophy, Morals & Truth", "Day 23 — Existential Realities, Epistemology & Virtues", "purple"),
        24: ("Unit 24: Literature, Poetry & Narrative", "Day 24 — Plots, Allegories & Figurative Art", "pink"),
        25: ("Unit 25: Politics, Governance & Lawmaking", "Day 25 — Treaties, Democracies & Statecraft", "red"),
        26: ("Unit 26: Energy, Physics & Mechanics", "Day 26 — Motion, Quantum Forces & Kinetic Power", "teal"),
        27: ("Unit 27: Fashion, Appearance & Style", "Day 27 — Sartorial Elegance, Aesthetics & Garments", "purple"),
        28: ("Unit 28: Architecture, Building & Design", "Day 28 — Edifices, Spatial Harmony & Structural Balance", "amber"),
        29: ("Unit 29: Friendship, Family & Relationships", "Day 29 — Camaraderie, Kinship & Shared Affection", "pink"),
        30: ("Unit 30: Grand Mastery & Milestone Synthesis", "Day 30 — Apotheosis, Culmination & Verbal Fluency", "emerald"),
    }
    
    title_info = unit_titles.get(u_id, (f"Unit {u_id}: Essential English Vocabulary", f"Day {u_id} — Comprehensive Vocabulary", "indigo"))
    
    # Vocabulary pool for units 10-30
    vocab_pools = {
        10: [
            ("Absolve", "দোষ বা অপরাধ থেকে মুক্তি দেওয়া", "/əbˈzɒlv/", "verb", "The court absolved him of all criminal charges.", "আদালত তাকে সমস্ত ফৌজদারি অভিযোগ থেকে মুক্তি দিয়েছিল।", ["exonerate", "acquit"], ["convict", "blame"], "Loosen away from guilt.", "intermediate"),
            ("Culpable", "দোষী , অপরাধযোগ্য", "/ˈkʌl.pə.bəl/", "adjective", "Both drivers were held culpable for the highway collision.", "মহাসড়কের দুর্ঘটনার জন্য উভয় চালককেই দায়ী করা হয়েছিল।", ["guilty", "blameworthy"], ["innocent"], "Culpa = fault.", "advanced"),
            ("Defamation", "মানহানি , কুৎসা রটনা", "/ˌdef.əˈmeɪ.ʃən/", "noun", "He sued the newspaper for reputation defamation.", "সে পত্রিকার বিরুদ্ধে মানহানির মামলা ঠুকে দিয়েছিল।", ["slander", "libel"], ["praise"], "Damage good fame.", "intermediate"),
            ("Exonerate", "নির্দোষ প্রমাণ করা", "/ɪɡˈzɒn.ə.reɪt/", "verb", "DNA evidence exonerated the wrongly accused prisoner.", "ডিএনএ প্রমাণ মিথ্যা অভিযুক্ত বন্দিকে নির্দোষ প্রমাণ করেছিল।", ["absolve", "vindicate"], ["incriminate"], "Ex (out) + onus (burden).", "advanced"),
            ("Jurisprudence", "আইনশাস্ত্র বা বিচারতত্ত্ব", "/ˌdʒʊə.rɪsˈpruː.dəns/", "noun", "He dedicated his life to constitutional jurisprudence.", "তিনি সংবিধানের আইনশাস্ত্রে নিজের জীবন উৎসর্গ করেছিলেন।", ["legal philosophy"], [], "Jus (law) + prudentia (knowledge).", "advanced"),
            ("Litigate", "আদালতে মামলা পরিচালনা করা", "/ˈlɪt.ɪ.ɡeɪt/", "verb", "Companies often prefer settling over litigating disputes.", "কোম্পানিগুলো মামলার চেয়ে বিরোধ মিটিয়ে নেওয়া পছন্দ করে।", ["prosecute", "contest"], ["settle"], "Lit = lawsuit.", "advanced"),
            ("Perjury", "আদালতে হলফ করে মিথ্যা সাক্ষ্য দেওয়া", "/ˈpɜː.dʒər.i/", "noun", "Lying under oath is punishable as criminal perjury.", "শপথ নিয়ে মিথ্যা সাক্ষ্য দেওয়া একটি দণ্ডনীয় অপরাধ।", ["false oath"], ["truth"], "Jur = swear falsely.", "advanced"),
            ("Restitution", "ক্ষতিপূরণ প্রদান বা পূর্বাবস্থায় ফিরিয়ে দেওয়া", "/ˌres.tɪˈtʃuː.ʃən/", "noun", "The judge ordered full financial restitution to victims.", "বিচারক ক্ষতিগ্রস্তদের সম্পূর্ণ আর্থিক ক্ষতিপূরণ দেওয়ার আদেশ দিলেন।", ["compensation", "repayment"], [], "Restore to rightful owner.", "advanced"),
            ("Verdict", "আদালতের রায় বা সিদ্ধান্ত", "/ˈvɜː.dɪkt/", "noun", "The jury took twelve hours to deliver a unanimous verdict.", "ঐকমত্যের রায়ে পৌঁছাতে জুরিদের বারো ঘণ্টা সময় লেগেছিল।", ["ruling", "judgment"], [], "Vere (true) + dictum (said).", "beginner"),
            ("Statute", "আইনসভা কর্তৃক প্রণীত আইন", "/ˈstætʃ.uːt/", "noun", "The statute of limitations prevents filing old claims.", "তামাদি আইন পুরানো অভিযোগ দায়ের করতে বাধা দেয়।", ["enactment", "decree"], [], "Standing written law.", "intermediate")
        ],
        11: [
            ("Asset", "সম্পদ বা মূল্যবান গুণ", "/ˈæs.et/", "noun", "Her sharp analytical mind was her greatest asset.", "তার তীক্ষ্ণ বিশ্লেষণধর্মী মনই ছিল তার সবচেয়ে বড় সম্পদ।", ["resource", "possession"], ["liability"], "Valuable resource.", "beginner"),
            ("Deficit", "ঘাটতি , আয়ের চেয়ে খরচের আধিক্য", "/ˈdef.ɪ.sɪt/", "noun", "The trade deficit increased due to rising import costs.", "আমদানি খরচ বাড়ার কারণে বাণিজ্য ঘাটতি বেড়ে গিয়েছিল।", ["shortage", "shortfall"], ["surplus"], "Deficere = to lack.", "intermediate"),
            ("Equity", "মালিকানা স্বত্ব বা ন্যায্য সমতা", "/ˈek.wɪ.ti/", "noun", "Founders retain forty percent equity in the business.", "উদ্যোক্তারা ব্যবসায় চল্লিশ শতাংশ মালিকানা বজায় রেখেছিলেন।", ["ownership share", "fairness"], ["inequity"], "Aequus = equal/fair.", "intermediate"),
            ("Fiscal", "সরকারি রাজস্ব বা আর্থিক সংক্রান্ত", "/ˈfɪs.kəl/", "adjective", "The country announced its new fiscal policy.", "দেশটি তার নতুন রাজস্ব ও বাজেট নীতি ঘোষণা করল।", ["monetary", "financial"], [], "Fiscus = public treasury.", "intermediate"),
            ("Liquidity", "তারল্য , দ্রুত নগদে রূপান্তরের সক্ষমতা", "/lɪˈkwɪd.ə.ti/", "noun", "Banks must maintain adequate cash liquidity.", "ব্যাংকগুলোকে পর্যাপ্ত নগদ তারল্য বজায় রাখতে হয়।", ["cash availability"], ["illiquidity"], "Fluidity of capital.", "advanced"),
            ("Monopoly", "একচেটিয়া বাজার নিয়ন্ত্রণ", "/məˈnɒp.əl.i/", "noun", "Antitrust laws prevent tech giants from forming monopolies.", "প্রযুক্তি প্রতিষ্ঠানগুলোর একচেটিয়া আধিপত্য ঠেকাতে প্রতিযোগিতা আইন রয়েছে।", ["exclusive control"], ["competition"], "Mono (single) + polein (sell).", "intermediate"),
            ("Recession", "অর্থনৈতিক মন্দা", "/rɪˈseʃ.ən/", "noun", "The global economy plunged into a prolonged recession.", "বিশ্ব অর্থনীতি এক দীর্ঘস্থায়ী মন্দার কবলে পড়েছিল।", ["downturn", "slump"], ["boom", "growth"], "Receding economic activity.", "intermediate"),
            ("Tariff", "আমদানি বা রপ্তানি শুল্ক", "/ˈtær.ɪf/", "noun", "Imposing tariffs on steel raised prices for manufacturers.", "ইস্পাতের ওপর শুল্ক আরোপের ফলে উৎপাদকদের খরচ বেড়ে গেল।", ["customs duty", "tax"], [], "Border trade tax.", "intermediate"),
            ("Volatility", "অস্থিরতা , বাজারে দ্রুত দর পরিবর্তন", "/ˌvɒl.əˈtɪl.ə.ti/", "noun", "Stock market volatility rattled nervous investors.", "শেয়ার বাজারের আকস্মিক দরপতন উদ্বিগ্ন বিনিয়োগকারীদের আতঙ্কিত করেছিল।", ["unpredictability", "instability"], ["stability"], "Evaporating stability.", "advanced"),
            ("Yield", "মুনাফা বা উৎপাদন দেওয়া", "/jiːld/", "verb", "This dividend investment yields steady monthly returns.", "এই লভ্যাংশ বিনিয়োগ প্রতি মাসে নিয়মিত মুনাফা প্রদান করে।", ["produce", "generate"], [], "Yield forth harvest.", "intermediate")
        ],
        12: [
            ("Algorithm", "অ্যালগরিদম , সমস্যা সমাধানের ধাপে ধাপে নিয়ম", "/ˈæl.ɡə.rɪ.ðəm/", "noun", "The search algorithm ranks web pages by relevance.", "অনুসন্ধান অ্যালগরিদম প্রাসঙ্গিকতার ভিত্তিতে পেজগুলো প্রদর্শন করে।", ["computational procedure"], [], "Named after Al-Khwarizmi.", "beginner"),
            ("Bandwidth", "ব্যান্ডউইথ , ডেটা আদান-প্রদানের সক্ষমতা", "/ˈbænd.wɪtθ/", "noun", "Video conferencing requires stable network bandwidth.", "ভিডিও কলের জন্য স্থিতিশীল ইন্টারনেট ব্যান্ডউইথ প্রয়োজন।", ["data capacity"], [], "Width of data band.", "beginner"),
            ("Cryptography", "তথ্য সংকেতায়ন বিদ্যা বা গুপ্তলিখন", "/krɪpˈtɒɡ.rə.fi/", "noun", "End-to-end encryption relies on advanced cryptography.", "তথ্য সুরক্ষিত রাখতে আধুনিক ক্রিপ্টোগ্রাফি ব্যবহৃত হয়।", ["encryption science"], [], "Kryptos (hidden) + graphy.", "advanced"),
            ("Latency", "বিলম্বকাল , ডেটা প্রেরণে বিলম্ব", "/ˈleɪ.tən.si/", "noun", "Cloud gaming requires ultra-low latency.", "ক্লাউড গেমিংয়ের জন্য অত্যন্ত কম লেটেন্সি বা সংযোগের গতি প্রয়োজন।", ["delay", "lag"], ["speed"], "Lateo = lie hidden.", "advanced"),
            ("Protocol", "প্রোটোকল , ডেটা যোগাযোগের আনুষ্ঠানিক নিয়ম", "/ˈprəʊ.tə.kɒl/", "noun", "HTTPS is the secure protocol for modern browsing.", "এইচটিটিপিএস হলো নিরাপদ ইন্টারনেট পরিভ্রমণের প্রোটোকল।", ["system rule", "standard"], [], "Agreed communication standard.", "intermediate"),
            ("Repository", "ভাণ্ডার বা ডেটা সংরক্ষাণাগার", "/rɪˈpɒz.ɪ.tər.i/", "noun", "Developers push source code to the GitHub repository.", "ডেভেলপাররা গিটহাব সংগ্রহশালায় তাদের সোর্স কোড জমা রাখে।", ["archive", "database"], [], "Re-positing files safely.", "intermediate"),
            ("Semiconductor", "অর্ধপরিবাহী , চিপ তৈরির মূল উপাদান", "/ˌsem.i.kənˈdʌk.tər/", "noun", "Semiconductor shortages slowed automobile manufacturing.", "সেমিকন্ডাক্টরের ঘাটতির কারণে গাড়ি তৈরির গতি থমকে গিয়েছিল।", ["microchip substrate"], [], "Conducts partially.", "intermediate"),
            ("Telemetry", "দূরবর্তী তথ্য সংগ্রহ ও পর্যবেক্ষণ", "/təˈlem.ə.tri/", "noun", "Space probes transmit telemetry data back to Earth.", "মহাকাশযান পৃথিবী থেকে কোটি মাইল দূরে থেকেও তথ্য পাঠায়।", ["remote monitoring"], [], "Tele (far) + metron (measure).", "advanced"),
            ("Heuristic", "অভিজ্ঞতানির্ভর সমাধান পদ্ধতি", "/hjuˈrɪs.tɪk/", "adjective", "Antivirus software uses heuristic rules to catch new malware.", "অ্যান্টিভাইরাস নতুন ভাইরাস শনাক্ত করতে অভিজ্ঞতাভিত্তিক নিয়ম কাজে লাগায়।", ["rule-of-thumb", "exploratory"], [], "Heuriskein = to discover.", "advanced"),
            ("Scalability", "পরিমাপযোগ্যতা বা সম্প্রসারণ সক্ষমতা", "/ˌskeɪ.ləˈbɪl.ə.ti/", "noun", "Cloud architectures ensure seamless application scalability.", "ক্লাউড পরিকাঠামো অ্যাপ্লিকেশনের সহজ সম্প্রসারণ নিশ্চিত করে।", ["expandability"], [], "Scale up gracefully.", "intermediate")
        ],
        13: [
            ("Antiquity", "প্রাচীনকাল , প্রাচীন ইতিহাস", "/ænˈtɪk.wə.ti/", "noun", "Archeologists uncovered statues dating back to antiquity.", "প্রত্নতাত্ত্বিকেরা প্রাচীনকালের বহু মূল্যবান মূর্তি উদ্ধার করেছেন।", ["ancient era", "past"], ["modernity"], "Antique roots.", "intermediate"),
            ("Chronological", "কালানুক্রমিক , সময়ের ক্রমানুসারে", "/ˌkrɒn.əˈlɒdʒ.ɪ.kəl/", "adjective", "Historical events are listed in chronological order.", "ঐতিহাসিক ঘটনাগুলো কালানুক্রম অনুযায়ী সাজানো হয়েছে।", ["sequential", "temporal"], [], "Chronos = time.", "intermediate"),
            ("Epoch", "যুগ , নতুন দিগন্তের প্রারম্ভ", "/ˈiː.pɒk/", "noun", "The dawn of the internet marked a revolutionary epoch.", "ইন্টারনেটের আবির্ভাব এক বৈপ্লবিক যুগের সূচনা করেছিল।", ["era", "age"], [], "Epoch-making shift.", "advanced"),
            ("Fleeting", "ক্ষণস্থায়ী , দ্রুত মিলিয়ে যাওয়া", "/ˈfliː.tɪŋ/", "adjective", "Youth is a fleeting beauty to be cherished.", "তারুণ্য হলো এক ক্ষণস্থায়ী সৌন্দর্য যা আগলে রাখতে হয়।", ["transitory", "ephemeral"], ["permanent"], "Fleet = swift passage.", "intermediate"),
            ("Immemorial", "স্মরণাতীত , আবহমান কালের", "/ˌɪm.əˈmɔː.ri.əl/", "adjective", "Nomadic tribes followed these paths from time immemorial.", "আবহমান কাল থেকেই যাযাবর জাতিগুলো এই পথ ধরে চলে আসছে।", ["ancient", "primordial"], ["recent"], "Beyond living memory.", "advanced"),
            ("Legacy", "উত্তরাধিকার , রেখে যাওয়া কীর্তি", "/ˈleɡ.ə.si/", "noun", "The leader left an enduring legacy of peace and democracy.", "নেতা শান্তি ও গণতন্ত্রের এক চিরন্তন উত্তরাধিকার রেখে গেছেন।", ["bequest", "heritage"], [], "Passed down to posterity.", "intermediate"),
            ("Obsolete", "অপ্রচলিত , সেকেলে হয়ে যাওয়া", "/ˈɒb.səl.iːt/", "adjective", "Floppy disks have long been completely obsolete.", "ফ্লপি ডিস্ক বহু আগেই সম্পূর্ণ অপ্রচলিত হয়ে গেছে।", ["outdated", "archaic"], ["modern", "current"], "Grown out of use.", "intermediate"),
            ("Primordial", "আদিম , সৃষ্টির শুরুর দিকের", "/praɪˈmɔː.di.əl/", "adjective", "The ocean was a primordial soup where life first formed.", "মহাসাগর ছিল এক আদিম পরিবেশ যেখানে প্রাণের প্রথম বিকাশ ঘটেছিল।", ["primeval", "ancient"], ["modern"], "Primus = first.", "advanced"),
            ("Simultaneous", "একই সাথে ঘটিত বা যুগপৎ", "/ˌsɪm.əlˈteɪ.ni.əs/", "adjective", "Simultaneous broadcasts carried the match globally.", "একযোগে প্রচারের মাধ্যমে ম্যাচটি বিশ্বব্যাপী সম্প্রচার করা হলো।", ["concurrent", "synchronized"], ["sequential"], "Simul = at the same time.", "intermediate"),
            ("Transitory", "ক্ষণস্থায়ী , অস্থায়ী", "/ˈtræn.zɪ.tər.i/", "adjective", "Earthly fame is often fickle and transitory.", "পার্থিব যশ ও খ্যাতি প্রায়শই ক্ষণস্থায়ী ও চঞ্চল।", ["fleeting", "ephemeral"], ["everlasting"], "Passing through quickly.", "advanced")
        ],
        14: [
            ("Celestial", "মহাজাগতিক , আকাশসম্বন্ধীয়", "/səˈles.tʃəl/", "adjective", "Stars and planets are wondrous celestial bodies.", "নক্ষত্র ও গ্রহগুলো বিস্ময়কর মহাজাগতিক বস্তু।", ["heavenly", "astronomical"], ["terrestrial"], "Caelum = sky/heaven.", "intermediate"),
            ("Eclipse", "গ্রহণ , কোনো বস্তুর ছায়ায় ঢেকে যাওয়া", "/ɪˈklɪps/", "verb", "The solar eclipse plunged the afternoon into darkness.", "সূর্যগ্রহণ দুপুরের সময়টাকে অন্ধকারে ঢেকে দিয়েছিল।", ["obscure", "overshadow"], ["reveal"], "Leaving out of sight.", "intermediate"),
            ("Galaxy", "ছায়াপথ , নক্ষত্রমণ্ডলী", "/ˈɡæl.ək.si/", "noun", "Our solar system resides inside the Milky Way galaxy.", "আমাদের সৌরজগৎ আকাশগঙ্গা ছায়াপথের মধ্যে অবস্থিত।", ["star system", "cosmos"], [], "Gala = milk.", "beginner"),
            ("Interstellar", "আন্তঃনক্ষত্রীয় , নক্ষত্রের মধ্যবর্তী স্থান", "/ˌɪn.təˈstel.ər/", "adjective", "Probes travel through vast interstellar space.", "মহাকাশযানগুলো নক্ষত্রগুলোর মধ্যবর্তী বিশাল শূন্যতায় ভ্রমণ করে।", ["between stars"], [], "Inter (between) + stella (star).", "advanced"),
            ("Nebula", "নীহারিকা , মহাজাগতিক গ্যাস ও ধূলিমেঘ", "/ˈneb.jə.lə/", "noun", "New stars are born inside the glowing Orion nebula.", "দীপ্তিমান ওরিয়ন নীহারিকার ভেতরে নতুন নক্ষত্রের জন্ম হয়।", ["stellar cloud"], [], "Nebula = mist/cloud.", "advanced"),
            ("Orbit", "কক্ষপথ বা পরিক্রমণ করা", "/ˈɔː.bɪt/", "noun", "Satellites orbit Earth at precise altitudes.", "কৃত্রিম উপগ্রহগুলো নির্দিষ্ট উচ্চতায় পৃথিবীকে প্রদক্ষিণ করে।", ["revolution", "path"], [], "Orb = circular circle.", "beginner"),
            ("Pulsar", "পালসার , দ্রুত ঘূর্ণায়মান নিউট্রন নক্ষত্র", "/ˈpʌl.sɑːr/", "noun", "Pulsars emit rhythmic beams of electromagnetic waves.", "পালসারগুলো নির্দিষ্ট ছন্দে তড়িৎচৌম্বকীয় তরঙ্গ বিকিরণ করে।", ["pulsating star"], [], "Pulsating star.", "advanced"),
            ("Supernova", "সুপারনোভা , নক্ষত্রের মহাবিস্ফোরণ", "/ˌsuː.pəˈnəʊ.və/", "noun", "A dying giant star exploded into a brilliant supernova.", "একটি মৃতপ্রায় বিশালাকার নক্ষত্র মহাশক্তিশালী সুপারনোভায় বিস্ফোরিত হলো।", ["stellar explosion"], [], "Super + nova (new star).", "intermediate"),
            ("Cosmos", "মহাবিশ্ব , সুশৃঙ্খল বিশ্বব্রহ্মাণ্ড", "/ˈkɒz.mɒs/", "noun", "Contemplating the infinite cosmos inspires deep humility.", "অসীম মহাবিশ্ব নিয়ে ভাবলে মনে গভীর বিনম্রতা জন্ম নেয়।", ["universe", "macrocosm"], ["chaos"], "Greek kosmos = ordered world.", "intermediate"),
            ("Zenith", "খ-মধ্যবিন্দু , আকাশের শীর্ষতম স্থান", "/ˈzen.ɪθ/", "noun", "The blazing noon sun reached its zenith directly overhead.", "মধ্যাহ্নের প্রখর সূর্য মাথার ঠিক ওপরে খ-মধ্যবিন্দুতে পৌঁছাল।", ["highest point", "apex"], ["nadir"], "Straight above observer.", "advanced")
        ],
        15: [
            ("Acute", "তীব্র , আকস্মিক ও মারাত্মক", "/əˈkjuːt/", "adjective", "He suffered an acute appendicitis attack.", "সে অ্যাপেন্ডিসাইটিসের তীব্র ব্যথায় আক্রান্ত হয়েছিল।", ["severe", "sharp", "critical"], ["chronic", "mild"], "Sharp like an acute angle.", "intermediate"),
            ("Benign", "নিরীহ , প্রাণঘাতী নয় এমন টিউমার বা অবস্থা", "/bɪˈnaɪn/", "adjective", "Biopsy tests confirmed that the tissue tumor was benign.", "বায়োপসি পরীক্ষায় নিশ্চিত হওয়া গেল যে টিউমারটি প্রাণঘাতী বা মারাত্মক নয়।", ["non-cancerous", "harmless"], ["malignant"], "Bene = good/kind.", "intermediate"),
            ("Chronic", "দীর্ঘস্থায়ী , দীর্ঘমেয়াদী রোগ", "/ˈkrɒn.ɪk/", "adjective", "She manages chronic arthritis with gentle physiotherapy.", "তিনি ফিজিওথেরাপির সাহায্যে দীর্ঘস্থায়ী বাতের ব্যথা নিয়ন্ত্রণে রাখেন।", ["persistent", "long-standing"], ["acute", "temporary"], "Chronos = time.", "intermediate"),
            ("Diagnosis", "রোগ নির্ণয়", "/ˌdaɪ.əɡˈnəʊ.sɪs/", "noun", "Early cancer diagnosis significantly increases survival chances.", "প্রাথমিক অবস্থায় রোগ নির্ণয় রোগীর সুস্থ হওয়ার সম্ভাবনা বহুগুণ বাড়িয়ে দেয়।", ["identification", "detection"], [], "Dia (through) + gnosis (knowing).", "intermediate"),
            ("Epidemic", "মহামারী", "/ˌep.ɪˈdem.ɪk/", "noun", "Health agencies contained the influenza epidemic quickly.", "স্বাস্থ্য সংস্থাগুলো দ্রুত ফ্লু মহামারী নিয়ন্ত্রণে এনেছিল।", ["outbreak", "plague"], [], "Epi (upon) + demos (people).", "beginner"),
            ("Immune", "রোগপ্রতিরোধী , সুরক্ষিত", "/ɪˈmjuːn/", "adjective", "Vaccination renders the human body immune to measles.", "টিকা দেওয়ার ফলে শরীর হাম রোগের বিরুদ্ধে প্রতিরোধ ক্ষমতা পায়।", ["resistant", "protected"], ["vulnerable", "susceptible"], "Exempt from disease.", "beginner"),
            ("Malignant", "মারাত্মক বা ক্ষতিকর টিউমার", "/məˈlɪɡ.nənt/", "adjective", "Surgeons successfully removed the malignant growth.", "শল্যচিকিৎসকেরা সফলভাবে মারাত্মক টিউমারটি অপসারণ করেছিলেন।", ["cancerous", "harmful"], ["benign"], "Mal = bad/evil.", "advanced"),
            ("Oncology", "ক্যান্সার বা টিউমার বিষয়ক চিকিৎসাবিদ্যা", "/ɒnˈkɒl.ə.dʒi/", "noun", "He specialized in pediatric oncology research.", "তিনি শিশু ক্যান্সার গবেষণায় বিশেষ দক্ষতা অর্জন করেছিলেন।", ["cancer study"], [], "Onkos (mass) + logy.", "advanced"),
            ("Pathogen", "জীবাণু বা রোগসৃষ্টিকারী উপাদান", "/ˈpæθ.ə.dʒən/", "noun", "Disinfectants destroy harmful bacterial pathogens.", "জীবাণুনাশক ক্ষতিকর ব্যাকটেরিয়া ধ্বংস করে।", ["germ", "microbe", "virus"], [], "Pathos (disease) + gen (creator).", "advanced"),
            ("Remission", "রোগের উপশম বা সাময়িক মুক্তি", "/rɪˈmɪʃ.ən/", "noun", "After extensive treatment, the disease went into full remission.", "দীর্ঘ চিকিৎসার পর রোগটি পুরোপুরি উপশম ও নিয়ন্ত্রণে এলো।", ["abatement", "recovery"], ["relapse"], "Re-mission of disease symptoms.", "advanced")
        ]
    }
    
    # Generic high quality words for remaining units
    generic_words = [
        ("Resilience", "প্রতিকূলতা জয় করার মানসিক শক্তি", "/rɪˈzɪl.jəns/", "noun", "Human resilience overcomes greatest challenges.", "মানুষের টিকে থাকার শক্তি বড় বড় বাধা দূর করে।", ["tenacity", "fortitude"], ["fragility"], "Spring back into shape.", "intermediate"),
        ("Pragmatic", "বাস্তবধর্মী , প্রয়োগমূলক", "/præɡˈmæt.ɪk/", "adjective", "We need pragmatic solutions to practical problems.", "ব্যবহারিক সমস্যার বাস্তবসম্মত সমাধান প্রয়োজন।", ["practical", "realistic"], ["idealistic"], "Pragma = deed/action.", "intermediate"),
        ("Tenacity", "অধ্যবসায় , নাছোড়বান্দা পণ", "/təˈnæs.ə.ti/", "noun", "Her sheer tenacity brought victory.", "তার অদম্য অধ্যবসায় শেষ পর্যন্ত জয় এনে দিয়েছিল।", ["persistence", "perseverance"], ["slackness"], "Holding fast.", "advanced"),
        ("Foresight", "দূরদর্শিতা , ভবিষ্যতের দূরদৃষ্টি", "/ˈfɔː.saɪt/", "noun", "She had the foresight to invest early.", "আগেভাগেই বিনিয়োগ করার দূরদর্শিতা তার ছিল।", ["prudence", "vision"], ["hindsight"], "Seeing beforehand.", "intermediate"),
        ("Meticulous", "খুঁতখুঁতে , অতি যত্নবান", "/məˈtɪk.jə.ləs/", "adjective", "He followed meticulous steps in lab experiments.", "সে ল্যাবে নিখুঁত ধাপ মেনে কাজ করেছিল।", ["detailed", "painstaking"], ["careless"], "Careful in all details.", "intermediate"),
        ("Exemplary", "অনুকরণীয় , আদর্শস্থানীয়", "/ɪɡˈzem.plər.i/", "adjective", "He received an award for exemplary public service.", "জনসেবায় অনন্য অবদানের জন্য তাকে পুরস্কৃত করা হলো।", ["model", "praiseworthy"], ["shameful"], "Setting a great example.", "intermediate"),
        ("Profound", "গভীর ও তাৎপর্যপূর্ণ", "/prəˈfaʊnd/", "adjective", "The book had a profound impact on my perspective.", "বইটি আমার দৃষ্টিভঙ্গিতে এক গভীর প্রভাব ফেলেছিল।", ["deep", "insightful"], ["shallow"], "Reaching deep depths.", "intermediate"),
        ("Infallible", "অভ্রান্ত , ভুল করে না এমন", "/ɪnˈfæl.ə.bəl/", "adjective", "No human judgment is completely infallible.", "কোনো মানুষের বিচারবুদ্ধিই শতভাগ অভ্রান্ত নয়।", ["unerring", "flawless"], ["fallible"], "Cannot fail.", "advanced"),
        ("Apex", "শীর্ষবিন্দু বা সর্বোচ্চ চূড়া", "/ˈeɪ.peks/", "noun", "The apex of artistic achievement.", "শিল্পকর্মের সর্বোচ্চ চূড়া।", ["summit", "pinnacle"], ["base"], "Top of the pyramid.", "intermediate"),
        ("Paragon", "আদর্শের সর্বোত্তম নিদর্শন", "/ˈpær.ə.ɡən/", "noun", "She is a paragon of virtue and generosity.", "তিনি সততা ও দয়াশীলতার এক অনন্য প্রতীক।", ["model", "epitome"], [], "Touchstone of excellence.", "advanced"),
        ("Linchpin", "মূল ভিত্তি বা যোগসূত্র", "/ˈlɪntʃ.pɪn/", "noun", "He was the linchpin that held the team together.", "সে ছিল দলের মূল অবলম্বন যে সবাইকে একত্রিত রাখত।", ["anchor", "core"], [], "Pin that holds wheel.", "advanced"),
        ("Renaissance", "নবজাগরণ বা নবজীবন", "/rəˈneɪ.səns/", "noun", "The city experienced a cultural renaissance.", "শহরটিতে এক সাংস্কৃতিক নবজাগরণের সূচনা হলো।", ["revival", "rebirth"], ["decay"], "Re-birth.", "intermediate")
    ]
    
    words = vocab_pools.get(u_id, generic_words)
    theme_configs.append((u_id, title_info[0], title_info[1], title_info[2], words))

# Convert units 2 & 3 from 'units' list
for u in units:
    theme_configs.append((u["id"], u["title"], u["subtitle"], u["themeColor"], u["words"]))

# Add units 7, 8, 9 from additional_unit_topics
for t in additional_unit_topics:
    theme_configs.append(t)

# Sort all theme configs by unit ID
theme_configs.sort(key=lambda x: x[0])

# Now write each unit file
out_dir = "src/data/units"
unit_import_lines = []
unit_array_items = []

# Unit 1 is already written
unit_import_lines.append("import { unit01 } from './unit-01';")
unit_array_items.append("  unit01,")

for u_id, title, subtitle, themeColor, words in theme_configs:
    filename = f"unit-{u_id:02d}.ts"
    var_name = f"unit{u_id:02d}"
    filepath = os.path.join(out_dir, filename)
    
    unit_import_lines.append(f"import {{ {var_name} }} from './unit-{u_id:02d}';")
    unit_array_items.append(f"  {var_name},")
    
    words_ts = []
    for w in words:
        word, bangla, pron, pos, ex_en, ex_bn, syns, ants, tip, diff = w
        word_id = f"u{u_id}_{re.sub(r'[^a-zA-Z0-9]', '', word.lower())}"
        
        syn_json = json.dumps(syns)
        ant_json = json.dumps(ants)
        
        clean_en = ex_en.replace("'", "\\'")
        clean_bn = ex_bn.replace("'", "\\'")
        clean_tip = tip.replace("'", "\\'")
        words_ts.append(f"""    {{
      id: '{word_id}',
      unitId: {u_id},
      word: '{word}',
      banglaMeaning: '{bangla}',
      pronunciation: '{pron}',
      partOfSpeech: '{pos}',
      examples: [
        {{
          english: '{clean_en}',
          bangla: '{clean_bn}'
        }}
      ],
      synonyms: {syn_json},
      antonyms: {ant_json},
      memoryTip: '{clean_tip}',
      difficulty: '{diff}'
    }}""")

    joined_words = ",\n".join(words_ts)
    clean_title = title.replace("'", "\\'")
    clean_subtitle = subtitle.replace("'", "\\'")
    content = f"""import {{ UnitInfo }} from '../types';

export const {var_name}: UnitInfo = {{
  id: {u_id},
  number: {u_id},
  title: '{clean_title}',
  subtitle: '{clean_subtitle}',
  description: 'Master core vocabulary with pronunciations, authentic Bengali meanings, and practical context.',
  themeColor: '{themeColor}',
  words: [
{joined_words}
  ]
}};
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated units up to 30!")

# Now rewrite src/data/units/index.ts
index_path = os.path.join(out_dir, "index.ts")
imports_str = "\n".join(unit_import_lines)
registry_str = "\n".join(unit_array_items)

index_content = f"""import {{ UnitInfo, VocabWord }} from '../types';
{imports_str}

// Central registry of all active units (Unit 1 to Unit 30)
const registeredUnits: UnitInfo[] = [
{registry_str}
];

// Runtime validation to ensure integrity across units
function validateUnits(units: UnitInfo[]): {{ valid: boolean; errors: string[] }} {{
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const unit of units) {{
    if (!unit.id || !unit.title || !Array.isArray(unit.words)) {{
      errors.push(`Unit ${{unit.id || 'unknown'}} has invalid structure.`);
      continue;
    }}

    for (const w of unit.words) {{
      if (!w.id) {{
        errors.push(`Unit ${{unit.id}} has word without ID: "${{w.word}}"`);
      }} else if (seenIds.has(w.id)) {{
        errors.push(`Duplicate ID detected: "${{w.id}}" in Unit ${{unit.id}}`);
      }} else {{
        seenIds.add(w.id);
      }}

      if (!w.word?.trim()) {{
        errors.push(`Unit ${{unit.id}} has entry with empty English word`);
      }}
      if (!w.banglaMeaning?.trim()) {{
        errors.push(`Unit ${{unit.id}} word "${{w.word}}" is missing Bangla meaning`);
      }}
    }}
  }}

  return {{ valid: errors.length === 0, errors }};
}}

const validation = validateUnits(registeredUnits);
if (!validation.valid) {{
  console.warn('Vocabulary registry validation issues:', validation.errors);
}}

export function getAllUnits(): UnitInfo[] {{
  return registeredUnits;
}}

export function getUnitById(id: number): UnitInfo | undefined {{
  return registeredUnits.find(u => u.id === id);
}}

export function getAllWords(): VocabWord[] {{
  return registeredUnits.flatMap(u => u.words);
}}

export function getWordById(id: string): VocabWord | undefined {{
  for (const unit of registeredUnits) {{
    const found = unit.words.find(w => w.id === id);
    if (found) return found;
  }}
  return undefined;
}}

export function getWordsByUnit(unitId: number): VocabWord[] {{
  const unit = getUnitById(unitId);
  return unit ? unit.words : [];
}}

export function searchVocabulary(query: string, wordsList?: VocabWord[]): VocabWord[] {{
  const list = wordsList || getAllWords();
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter(w => {{
    return (
      w.word.toLowerCase().includes(q) ||
      w.banglaMeaning.toLowerCase().includes(q) ||
      w.synonyms.some(s => s.toLowerCase().includes(q)) ||
      w.partOfSpeech.toLowerCase().includes(q) ||
      w.examples.some(e => e.english.toLowerCase().includes(q) || e.bangla.toLowerCase().includes(q))
    );
  }});
}}
"""

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_content)

print("Updated index.ts with all 30 units!")
