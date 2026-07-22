import type { BibleQuestion } from "../types";

/** Mission 5D expansion — Level 3 (Exodus, Leviticus: Moses, Passover, the Law). */
export const LEVEL_3_EXPANSION_EN: BibleQuestion[] = [
  {
    id: "exp-en-l3-e01", level: 3, category: "Moses", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 3,
    difficulty: "easy", correctIndex: 1, reference: "Exodus 3:10", tags: ["Moses"], verified: false,
    translations: {
      en: { question: "Who led the Israelites out of slavery in Egypt?", choices: ["Joshua", "Moses", "Aaron", "David"], explanation: "God called Moses to lead the Israelites out of Egyptian slavery." },
      am: { question: "እስራኤላውያንን ከግብፅ ባርነት ማን መራ?", choices: ["ኢያሱ", "ሙሴ", "አሮን", "ዳዊት"], explanation: "እግዚአብሔር ሙሴን እስራኤላውያንን ከግብፅ ባርነት እንዲመራ ጠራው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l3-e02", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 7,
    difficulty: "easy", correctIndex: 0, reference: "Exodus 7-12", tags: ["Moses", "Plagues"], verified: false,
    translations: { en: { question: "What did God send on Egypt to convince Pharaoh to free the Israelites?", choices: ["Ten plagues", "An army", "A famine", "A flood"], explanation: "God sent ten plagues on Egypt until Pharaoh finally let the Israelites go." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-e03", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 14,
    difficulty: "easy", correctIndex: 1, reference: "Exodus 14:21", tags: ["Moses"], verified: false,
    translations: { en: { question: "What sea did God part so the Israelites could cross on dry ground?", choices: ["Dead Sea", "Red Sea", "Sea of Galilee", "Mediterranean Sea"], explanation: "God parted the Red Sea, letting Israel cross on dry ground while the pursuing Egyptian army was drowned." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-e04", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 16,
    difficulty: "easy", correctIndex: 0, reference: "Exodus 16:15", tags: ["Moses"], verified: false,
    translations: { en: { question: "What miraculous bread-like food did God provide the Israelites in the wilderness?", choices: ["Manna", "Meat only", "Fruit", "Fish"], explanation: "God provided manna, a bread from heaven, for the Israelites to eat each day in the wilderness." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-e05", level: 3, category: "Law", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 19,
    difficulty: "easy", correctIndex: 1, reference: "Exodus 19:20; 20:1", tags: ["Moses", "Commandments"], verified: false,
    translations: { en: { question: "On what mountain did God give Moses the Ten Commandments?", choices: ["Mount Carmel", "Mount Sinai", "Mount Nebo", "Mount Ararat"], explanation: "God called Moses up Mount Sinai and gave him the Ten Commandments there." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-e06", level: 3, category: "Law", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 32,
    difficulty: "easy", correctIndex: 1, reference: "Exodus 32:4", tags: ["Moses"], verified: false,
    translations: { en: { question: "What idol did the Israelites make and worship while Moses was on the mountain?", choices: ["A stone altar", "A golden calf", "A silver ox", "A wooden idol"], explanation: "While Moses was on Mount Sinai, the Israelites grew impatient and made a golden calf to worship." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m01", level: 3, category: "Moses", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 2:3", tags: ["Moses"], verified: false,
    translations: {
      en: { question: "What was baby Moses placed in to save him from Pharaoh's order to kill Hebrew baby boys?", choices: ["A wooden box", "A basket among the reeds", "A tent", "A cave"], explanation: "Moses' mother placed him in a papyrus basket among the reeds of the Nile to save his life." },
      am: { question: "ህጻኑ ሙሴ ከፈርዖን የዕብራውያንን ወንዶች ልጆች የመግደል ትእዛዝ ለማዳን በምን ውስጥ ተቀመጠ?", choices: ["በእንጨት ሳጥን", "በሸምበቆ መካከል ባለ ቅርጫት", "በድንኳን", "በዋሻ"], explanation: "የሙሴ እናት ህይወቱን ለማዳን በአባይ ወንዝ ሸምበቆ መካከል ባለ ቅርጫት ውስጥ አስቀመጠችው።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l3-m02", level: 3, category: "Moses", canonicalCategory: "Women", book: "Exodus", testament: "old", chapter: 2,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 2:5", tags: ["Moses"], verified: false,
    translations: { en: { question: "Who found baby Moses among the reeds of the Nile River?", choices: ["Pharaoh's wife", "Pharaoh's daughter", "Miriam", "A servant"], explanation: "Pharaoh's daughter found the basket and raised Moses as her own." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m03", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 3,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 3:2", tags: ["Moses"], verified: false,
    translations: { en: { question: "How did God first appear to Moses to call him to lead Israel?", choices: ["In a dream", "In a burning bush", "As an angel in human form", "In a cloud"], explanation: "God spoke to Moses from a bush that burned but was not consumed." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m04", level: 3, category: "Moses", canonicalCategory: "Disciples", book: "Exodus", testament: "old", chapter: 4,
    difficulty: "medium", correctIndex: 0, reference: "Exodus 4:14-16", tags: ["Moses", "Aaron"], verified: false,
    translations: { en: { question: "Who was Moses' brother who spoke to Pharaoh on his behalf?", choices: ["Aaron", "Joshua", "Caleb", "Nadab"], explanation: "God appointed Aaron to speak for Moses, who felt he was not a skilled speaker." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m05", level: 3, category: "Moses", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 11,
    difficulty: "medium", correctIndex: 2, reference: "Exodus 11:5", tags: ["Moses", "Plagues"], verified: false,
    translations: { en: { question: "What was the last and most severe of the ten plagues on Egypt?", choices: ["Locusts", "Darkness", "Death of the firstborn", "Boils"], explanation: "The final plague was the death of every firstborn son in Egypt, which finally led Pharaoh to release Israel." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m06", level: 3, category: "Passover", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 12,
    difficulty: "medium", correctIndex: 0, reference: "Exodus 12:8", tags: ["Passover"], verified: false,
    translations: { en: { question: "What meal did the Israelites eat the night before leaving Egypt, which became the Passover?", choices: ["Unleavened bread and roasted lamb", "Fish and bread", "Manna", "Fruit and wine"], explanation: "God instructed Israel to eat roasted lamb with unleavened bread and bitter herbs the night of their deliverance." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m07", level: 3, category: "Passover", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 12,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 12:7,13", tags: ["Passover"], verified: false,
    translations: { en: { question: "What did the Israelites mark on their doorposts so the plague of death would pass over their homes?", choices: ["Oil", "Blood of a lamb", "Ash", "Water"], explanation: "God commanded Israel to put the lamb's blood on their doorposts as a sign for the plague to pass over." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m08", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 15,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 15:25", tags: ["Moses"], verified: false,
    translations: { en: { question: "What did Moses do to make the bitter water at Marah drinkable?", choices: ["Prayed over it", "Threw a piece of wood into it", "Boiled it", "Filtered it with sand"], explanation: "The Lord showed Moses a piece of wood; when he threw it into the water, the water became sweet." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m09", level: 3, category: "Moses", canonicalCategory: "People", book: "Exodus", testament: "old", chapter: 18,
    difficulty: "medium", correctIndex: 1, reference: "Exodus 18:17-24", tags: ["Moses"], verified: false,
    translations: { en: { question: "Who advised Moses to appoint other leaders to help judge the people?", choices: ["Aaron", "Jethro, his father-in-law", "Joshua", "Caleb"], explanation: "Moses' father-in-law Jethro advised him to delegate judging duties to capable leaders." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-m10", level: 3, category: "Law", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 25,
    difficulty: "medium", correctIndex: 0, reference: "Exodus 25:17-22", tags: ["Law"], verified: false,
    translations: { en: { question: "What was the name of the covering placed over the Ark of the Covenant?", choices: ["The mercy seat", "The veil", "The altar", "The lampstand"], explanation: "The mercy seat covered the Ark of the Covenant, and God said He would meet with Israel there." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h01", level: 3, category: "Moses", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 12,
    difficulty: "hard", correctIndex: 1, reference: "Exodus 12:40", tags: ["Moses"], verified: false,
    translations: {
      en: { question: "How many years did the Israelites live in Egypt before the Exodus?", choices: ["400", "430", "300", "600"], explanation: "Exodus states the Israelites lived in Egypt four hundred and thirty years before leaving." },
      am: { question: "እስራኤላውያን ከግብፅ ከመውጣታቸው በፊት በግብፅ ስንት ዓመታት ኖሩ?", choices: ["400", "430", "300", "600"], explanation: "ዘፀአት እስራኤላውያን ከመውጣታቸው በፊት በግብፅ አራት መቶ ሠላሳ ዓመታት እንደኖሩ ይናገራል።" },
    },
    translationStatus: { en: "machine", am: "machine" },
  },
  {
    id: "exp-en-l3-h02", level: 3, category: "Moses", canonicalCategory: "Women", book: "Exodus", testament: "old", chapter: 2,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 2:21", tags: ["Moses"], verified: false,
    translations: { en: { question: "What was the name of Moses' wife, a daughter of the priest of Midian?", choices: ["Zipporah", "Miriam", "Rebekah", "Asenath"], explanation: "Moses married Zipporah, one of the daughters of Reuel (Jethro), the priest of Midian." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h03", level: 3, category: "Moses", canonicalCategory: "People", book: "Exodus", testament: "old", chapter: 3,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 3:1; 18:1", tags: ["Moses"], verified: false,
    translations: { en: { question: "What was the name of Moses' father-in-law, the priest of Midian?", choices: ["Reuel (Jethro)", "Balak", "Amalek", "Laban"], explanation: "Moses' father-in-law was Reuel, also called Jethro, a priest of Midian." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h04", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 4,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 4:2-4", tags: ["Moses"], verified: false,
    translations: { en: { question: "What sign did God first give Moses involving his shepherd's staff?", choices: ["It turned into a snake", "It bloomed flowers", "It caught fire", "It split in two"], explanation: "God had Moses throw down his staff, and it turned into a snake, as a sign to convince Israel and Pharaoh." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h05", level: 3, category: "Moses", canonicalCategory: "Old Testament", book: "Exodus", testament: "old", chapter: 7,
    difficulty: "hard", correctIndex: 1, reference: "Exodus 7-12", tags: ["Moses", "Plagues"], verified: false,
    translations: { en: { question: "How many plagues in total did God send upon Egypt?", choices: ["7", "10", "12", "3"], explanation: "God sent ten distinct plagues on Egypt before Pharaoh finally released the Israelites." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h06", level: 3, category: "Passover", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 12,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 12:3-5", tags: ["Passover"], verified: false,
    translations: { en: { question: "What did God command each Israelite family to select on the tenth day of the month for Passover?", choices: ["A lamb without blemish", "A young bull", "A dove", "Fine flour"], explanation: "Each household was to select a year-old male lamb without defect for the Passover sacrifice." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h07", level: 3, category: "Moses", canonicalCategory: "Miracles", book: "Exodus", testament: "old", chapter: 13,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 13:21", tags: ["Moses"], verified: false,
    translations: { en: { question: "How did God guide the Israelites through the wilderness day and night?", choices: ["A pillar of cloud by day and fire by night", "Angels", "Stars", "A trumpet"], explanation: "The Lord went ahead of Israel in a pillar of cloud by day and a pillar of fire by night." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h08", level: 3, category: "Moses", canonicalCategory: "People", book: "Exodus", testament: "old", chapter: 17,
    difficulty: "hard", correctIndex: 1, reference: "Exodus 17:11-12", tags: ["Moses"], verified: false,
    translations: { en: { question: "Who held up his hands with Aaron and Hur's help so Israel would prevail in battle against Amalek?", choices: ["Joshua", "Moses", "Caleb", "Hur alone"], explanation: "As long as Moses held up his hands, supported by Aaron and Hur, Israel prevailed in the battle." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h09", level: 3, category: "Law", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 20,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 20:1-17", tags: ["Commandments"], verified: false,
    translations: { en: { question: "How many commandments did God give Moses on Mount Sinai?", choices: ["Ten", "Seven", "Twelve", "Five"], explanation: "God gave Moses the Ten Commandments as the foundation of His covenant law." } },
    translationStatus: { en: "machine" },
  },
  {
    id: "exp-en-l3-h10", level: 3, category: "Law", canonicalCategory: "Law", book: "Exodus", testament: "old", chapter: 25,
    difficulty: "hard", correctIndex: 0, reference: "Exodus 25:10-11", tags: ["Law"], verified: false,
    translations: { en: { question: "What material did God specify for building the Ark of the Covenant?", choices: ["Acacia wood overlaid with gold", "Solid gold", "Silver", "Bronze"], explanation: "God instructed that the Ark be made of acacia wood and overlaid with pure gold." } },
    translationStatus: { en: "machine" },
  },
];
