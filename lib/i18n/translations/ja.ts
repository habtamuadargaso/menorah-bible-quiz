import type { DeepPartial, UIStrings } from "../types";

// Mission 10 adds "ja" (Japanese) to LangCode/LANGUAGES as a real language
// the app knows about, but no UI-chrome string translations exist for it
// yet — intentionally empty rather than guessed/machine-translated. Every
// key here falls back to English (see LanguageContext.tsx's deepMerge)
// until a native Japanese speaker reviews and fills this in. This is
// independent of Bible QUESTION content, which is Mission 10's actual
// focus and is tracked separately via public.question_translations.
export const ja: DeepPartial<UIStrings> = {};
