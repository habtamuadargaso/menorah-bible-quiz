# Final language and gameplay update

## Completed
- Language changes now remount the active quiz and load the selected language bank.
- Non-English gameplay no longer silently mixes English questions into the selected language.
- Amharic gameplay stays fully Amharic, including question text, choices, references, explanations, campaign labels, result progression messages, and local Battle Arena labels.
- Amharic question rotation was expanded to reduce immediate repeats while the reviewed bank grows.
- Languages without a reviewed question bank show a clear unavailable/coming-soon state instead of English questions.
- Campaign labels and progression messages are now translatable.
- Battle Arena setup, scoring, status, and winner labels are now translatable.
- Supabase test page import was corrected.
- Production build passes with Next.js 14.2.5.

## Important content note
The English bank contains 100 source questions. The Amharic bank currently contains reviewed/drafted native questions plus native-language variations for replayability. Before a public commercial launch, a pastor or native Amharic Bible editor should review every Bible reference, wording, and explanation.

## Security
`.env.local` is intentionally excluded from the downloadable ZIP. Keep your Supabase URL and publishable key in your own local `.env.local` and in Vercel environment variables.
