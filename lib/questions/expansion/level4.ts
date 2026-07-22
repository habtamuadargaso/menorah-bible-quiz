import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 4 (Numbers, Deuteronomy, Joshua, Judges, Ruth). */
export const LEVEL_4_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l4-e01", level: 4, category: "Joshua", canonicalCategory: "Old Testament", book: "Joshua", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 1, reference: "Joshua 1:1-2", tags: ["Joshua"], verified: false,
    translations: {
      en: { question: "Who led the Israelites into the Promised Land after Moses died?", choices: ["Caleb", "Joshua", "Aaron", "Samuel"], explanation: "God appointed Joshua to succeed Moses and lead Israel into the Promised Land." },
      am: { question: "ሙሴ ከሞተ በኋላ እስራኤላውያንን ወደ ተስፋይቱ ምድር ማን መራ?", choices: ["ካሌብ", "ኢያሱ", "አሮን", "ሳሙኤል"], explanation: "እግዚአብሔር ኢያሱን የሙሴን ቦታ ተክቶ እስራኤልን ወደ ተስፋይቱ ምድር እንዲመራ ሾመው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l4-e02", level: 4, category: "Joshua", canonicalCategory: "Places", book: "Joshua", testament: "old", chapter: 6,
    difficulty: "easy", correctIndex: 0, reference: "Joshua 6:20", tags: ["Joshua", "Jericho"], verified: false,
    translations: { en: { question: "What city's walls collapsed after Israel marched around it seven times?", choices: ["Jericho", "Ai", "Hebron", "Bethel"], explanation: "Jericho's walls fell after Israel marched around it for seven days as God commanded." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e03", level: 4, category: "Moses", canonicalCategory: "Old Testament", book: "Numbers", testament: "old", chapter: 13,
    difficulty: "easy", correctIndex: 1, reference: "Numbers 13:1-16", tags: ["Moses"], verified: false,
    translations: { en: { question: "How many spies did Moses send to scout the Promised Land?", choices: ["10", "12", "7", "2"], explanation: "Moses sent twelve spies, one from each tribe, to explore the land of Canaan." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e04", level: 4, category: "Joshua", canonicalCategory: "Women", book: "Joshua", testament: "old", chapter: 2,
    difficulty: "easy", correctIndex: 1, reference: "Joshua 2:1-21", tags: ["Rahab", "Jericho"], verified: false,
    translations: { en: { question: "Who hid the Israelite spies in Jericho and was spared when the city fell?", choices: ["Deborah", "Rahab", "Ruth", "Miriam"], explanation: "Rahab hid the spies and helped them escape, so she and her family were spared." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e05", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 16,
    difficulty: "easy", correctIndex: 1, reference: "Judges 16:17", tags: ["Samson"], verified: false,
    translations: { en: { question: "Who was the judge of Israel whose great strength was tied to his uncut hair?", choices: ["Gideon", "Samson", "Ehud", "Barak"], explanation: "Samson's strength came from his Nazarite vow, symbolized by his uncut hair." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e06", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 7,
    difficulty: "easy", correctIndex: 1, reference: "Judges 7:7", tags: ["Gideon"], verified: false,
    translations: { en: { question: "Which judge defeated the Midianite army with only 300 men?", choices: ["Samson", "Gideon", "Deborah", "Jephthah"], explanation: "God reduced Gideon's army to 300 men so Israel would know the victory came from Him." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e07", level: 4, category: "Judges", canonicalCategory: "Women", book: "Judges", testament: "old", chapter: 4,
    difficulty: "easy", correctIndex: 1, reference: "Judges 4:4", tags: ["Deborah"], verified: false,
    translations: { en: { question: "Who was the only female judge of Israel named in the Bible?", choices: ["Ruth", "Deborah", "Miriam", "Naomi"], explanation: "Deborah was a prophetess who judged Israel and led them to victory over their enemies." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-e08", level: 4, category: "Ruth", canonicalCategory: "Women", book: "Ruth", testament: "old", chapter: 1,
    difficulty: "easy", correctIndex: 1, reference: "Ruth 1:16", tags: ["Ruth"], verified: false,
    translations: { en: { question: "What did Ruth famously say to Naomi, showing her loyalty?", choices: ["I will return to my people", "Where you go, I will go", "I cannot follow you", "Leave me be"], explanation: "Ruth pledged her loyalty to Naomi, saying 'Where you go I will go, and where you stay I will stay.'" } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m01", level: 4, category: "Moses", canonicalCategory: "Old Testament", book: "Numbers", testament: "old", chapter: 14,
    difficulty: "medium", correctIndex: 1, reference: "Numbers 14:33-34", tags: ["Moses"], verified: false,
    translations: {
      en: { question: "Why did the Israelites wander in the wilderness for 40 years?", choices: ["They were lost", "They rebelled and refused to enter the Promised Land in faith", "God was punishing Egypt", "They were waiting for Moses to die"], explanation: "Because Israel refused to trust God and enter Canaan, they wandered forty years until that generation passed." },
      am: { question: "እስራኤላውያን በምድረ በዳ ለ40 ዓመታት የተንከራተቱት ለምንድን ነው?", choices: ["ስለጠፉ", "በእምነት ወደ ተስፋይቱ ምድር ለመግባት ስላልታዘዙና ስላመፁ", "እግዚአብሔር ግብፅን ስለሚቀጣ", "ሙሴ እስኪሞት ስለሚጠብቁ"], explanation: "እስራኤል እግዚአብሔርን አምኖ ወደ ከነዓን ለመግባት ስላልፈለገ፣ ያ ትውልድ እስኪያልፍ ድረስ ለአርባ ዓመታት ተንከራተቱ።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l4-m02", level: 4, category: "Moses", canonicalCategory: "Old Testament", book: "Numbers", testament: "old", chapter: 14,
    difficulty: "medium", correctIndex: 1, reference: "Numbers 14:36-37", tags: ["Moses"], verified: false,
    translations: { en: { question: "What happened to the ten spies who gave a discouraging report about the Promised Land?", choices: ["They became leaders", "They died in a plague", "They were exiled", "They became priests"], explanation: "The ten spies who spread fear about the land died in a plague before the Lord." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m03", level: 4, category: "Moses", canonicalCategory: "Old Testament", book: "Numbers", testament: "old", chapter: 21,
    difficulty: "medium", correctIndex: 1, reference: "Numbers 21:6", tags: ["Moses"], verified: false,
    translations: { en: { question: "What did God send among the complaining Israelites in the wilderness?", choices: ["Locusts", "Venomous snakes", "Scorpions", "Hail"], explanation: "God sent venomous snakes among the people because of their complaining." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m04", level: 4, category: "Moses", canonicalCategory: "Miracles", book: "Numbers", testament: "old", chapter: 21,
    difficulty: "medium", correctIndex: 1, reference: "Numbers 21:9", tags: ["Moses"], verified: false,
    translations: { en: { question: "What did Moses lift up on a pole so that anyone bitten by a snake could look and live?", choices: ["A golden snake", "A bronze snake", "A wooden staff", "A silver serpent"], explanation: "Moses made a bronze snake and put it on a pole; anyone bitten who looked at it lived." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m05", level: 4, category: "Moses", canonicalCategory: "Miracles", book: "Numbers", testament: "old", chapter: 22,
    difficulty: "medium", correctIndex: 1, reference: "Numbers 22:28", tags: ["Balaam"], verified: false,
    translations: { en: { question: "God kept the prophet Balaam from cursing Israel, speaking to him through what animal?", choices: ["An eagle", "Balaam's donkey", "A lion", "A serpent"], explanation: "God opened the mouth of Balaam's donkey to speak to him and stop him from cursing Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m06", level: 4, category: "Joshua", canonicalCategory: "Miracles", book: "Joshua", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Joshua 3:16", tags: ["Joshua"], verified: false,
    translations: { en: { question: "What happened to the Jordan River so Israel could cross into Canaan?", choices: ["It parted like the Red Sea", "It stopped flowing and piled up upstream", "It turned to ice", "They built a bridge"], explanation: "The water of the Jordan stopped flowing and piled up, letting Israel cross on dry ground." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m07", level: 4, category: "Joshua", canonicalCategory: "Old Testament", book: "Joshua", testament: "old", chapter: 7,
    difficulty: "medium", correctIndex: 1, reference: "Joshua 7:1,21", tags: ["Joshua"], verified: false,
    translations: { en: { question: "What did Achan do that brought trouble on Israel after Jericho fell?", choices: ["He refused to fight", "He took forbidden plunder from Jericho", "He worshiped idols publicly", "He betrayed Joshua"], explanation: "Achan secretly kept plunder from Jericho that God had devoted to destruction, bringing judgment on Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m08", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 6,
    difficulty: "medium", correctIndex: 1, reference: "Judges 6:36-40", tags: ["Gideon"], verified: false,
    translations: { en: { question: "Which judge asked God to confirm his calling using a wool fleece and dew?", choices: ["Samson", "Gideon", "Ehud", "Othniel"], explanation: "Gideon asked God to confirm his calling by making a fleece wet with dew while the ground stayed dry, and then the reverse." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-m09", level: 4, category: "Ruth", canonicalCategory: "People", book: "Ruth", testament: "old", chapter: 4,
    difficulty: "medium", correctIndex: 1, reference: "Ruth 4:13", tags: ["Ruth", "Boaz"], verified: false,
    translations: { en: { question: "Who was Ruth's kinsman-redeemer who married her?", choices: ["Elimelech", "Boaz", "Mahlon", "Obed"], explanation: "Boaz acted as kinsman-redeemer for Ruth and Naomi's family and married Ruth." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h01", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 7,
    difficulty: "hard", correctIndex: 1, reference: "Judges 7:3", tags: ["Gideon"], verified: false,
    translations: {
      en: { question: "How many men did Gideon start with before God reduced his army to 300?", choices: ["10,000", "32,000", "50,000", "5,000"], explanation: "Gideon began with 32,000 men, which God reduced first to 10,000 and finally to 300." },
      am: { question: "እግዚአብሔር የጌዴዎንን ሠራዊት ወደ 300 ከመቀነሱ በፊት በስንት ሰዎች ጀመረ?", choices: ["10,000", "32,000", "50,000", "5,000"], explanation: "ጌዴዎን በ32,000 ሰዎች ጀመረ፣ እግዚአብሔርም መጀመሪያ ወደ 10,000 በመጨረሻም ወደ 300 ቀነሰው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l4-h02", level: 4, category: "Moses", canonicalCategory: "Old Testament", book: "Numbers", testament: "old", chapter: 20,
    difficulty: "hard", correctIndex: 1, reference: "Numbers 20:10-12", tags: ["Moses"], verified: false,
    translations: { en: { question: "What sin kept Moses himself from entering the Promised Land?", choices: ["He doubted God", "He struck the rock instead of speaking to it as commanded", "He worshiped an idol", "He disobeyed a command to fight"], explanation: "God told Moses to speak to the rock for water, but Moses struck it in anger, showing a lack of trust before Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h03", level: 4, category: "Joshua", canonicalCategory: "People", book: "Joshua", testament: "old", chapter: 14,
    difficulty: "hard", correctIndex: 1, reference: "Joshua 14:10", tags: ["Caleb"], verified: false,
    translations: { en: { question: "How old was Caleb when he asked Joshua for his portion of the land?", choices: ["65", "85", "100", "40"], explanation: "Caleb said he was eighty-five years old when he asked for the hill country God had promised him." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h04", level: 4, category: "Joshua", canonicalCategory: "Places", book: "Joshua", testament: "old", chapter: 6,
    difficulty: "hard", correctIndex: 1, reference: "Joshua 6:17-19", tags: ["Joshua", "Jericho"], verified: false,
    translations: { en: { question: "What did God command Israel to do with Jericho and its plunder?", choices: ["Keep it for themselves", "Devote the city to destruction and put its silver and gold in the treasury", "Divide it among the tribes", "Sell it to other nations"], explanation: "Jericho and its spoil were devoted to the Lord; only the silver, gold, bronze, and iron went into His treasury." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h05", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 3,
    difficulty: "hard", correctIndex: 1, reference: "Judges 3:31", tags: ["Shamgar"], verified: false,
    translations: { en: { question: "Which judge killed 600 Philistines with an ox goad?", choices: ["Samson", "Shamgar", "Ehud", "Tola"], explanation: "Shamgar struck down six hundred Philistines with an ox goad and also saved Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h06", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 3,
    difficulty: "hard", correctIndex: 1, reference: "Judges 3:16,21", tags: ["Ehud"], verified: false,
    translations: { en: { question: "What weapon did Ehud use to kill King Eglon of Moab?", choices: ["A sword", "A double-edged dagger", "A sling", "A spear"], explanation: "Ehud made a short double-edged dagger and used it to kill the Moabite king Eglon." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h07", level: 4, category: "Judges", canonicalCategory: "Judges", book: "Judges", testament: "old", chapter: 10,
    difficulty: "hard", correctIndex: 1, reference: "Judges (book overview)", tags: ["Judges"], verified: false,
    translations: { en: { question: "How many judges are named as leading Israel in the Book of Judges?", choices: ["7", "12", "15", "20"], explanation: "The Book of Judges names twelve judges, from Othniel to Samson, who led Israel in different periods." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h08", level: 4, category: "Ruth", canonicalCategory: "People", book: "Ruth", testament: "old", chapter: 2,
    difficulty: "hard", correctIndex: 1, reference: "Ruth 2:1", tags: ["Ruth", "Boaz"], verified: false,
    translations: { en: { question: "What relation was Boaz to Naomi's late husband, Elimelech?", choices: ["His brother", "A close relative (kinsman)", "His father", "No relation"], explanation: "Boaz was a relative of Naomi's husband Elimelech, which made him eligible to act as kinsman-redeemer." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h09", level: 4, category: "Ruth", canonicalCategory: "People", book: "Ruth", testament: "old", chapter: 1,
    difficulty: "hard", correctIndex: 1, reference: "Ruth 1:2-5", tags: ["Ruth"], verified: false,
    translations: { en: { question: "What was the name of Ruth's first husband, who died in Moab?", choices: ["Boaz", "Mahlon", "Chilion", "Obed"], explanation: "Ruth's first husband was Mahlon, son of Elimelech and Naomi, who died in Moab." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l4-h10", level: 4, category: "Ruth", canonicalCategory: "People", book: "Ruth", testament: "old", chapter: 4,
    difficulty: "hard", correctIndex: 0, reference: "Ruth 4:17", tags: ["Ruth", "Boaz"], verified: false,
    translations: { en: { question: "What was the name of the son born to Ruth and Boaz, an ancestor of King David?", choices: ["Obed", "Jesse", "Boaz Jr.", "Salmon"], explanation: "Ruth and Boaz's son Obed became the grandfather of Jesse, David's father." } },
    translationStatus: { en: "machine" },
  },
];
