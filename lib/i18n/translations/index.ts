import type { LangCode } from "@/lib/i18n/locales";
import type { DeepPartial, UIStrings } from "../types";

import { en } from "./en";
import { am } from "./am";
import { om } from "./om";
import { ti } from "./ti";
import { es } from "./es";
import { fr } from "./fr";
import { ar } from "./ar";
import { pt } from "./pt";
import { sw } from "./sw";
import { hi } from "./hi";
import { zh } from "./zh";
import { ko } from "./ko";
import { de } from "./de";
import { it } from "./it";

// English is the only required, fully-complete translation (source of
// truth / fallback). Every other language may be partial — any missing key
// is filled in from English at read time (see LanguageContext.tsx).
export const TRANSLATIONS: Record<LangCode, DeepPartial<UIStrings>> = {
  en,
  am,
  om,
  ti,
  es,
  fr,
  ar,
  pt,
  sw,
  hi,
  zh,
  ko,
  de,
  it,
};
