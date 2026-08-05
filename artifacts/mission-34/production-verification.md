# Production Verification

Target: `https://www.menorahbiblequiz.com`  
Checked: 2026-08-05

## Routes

HTTP 200: `/`, `/learn`, `/leaderboard`, `/profile`, `/settings`, `/friends-battle`, `/multiplayer`, `/privacy`, `/terms`, `/support`, `/.well-known/assetlinks.json`, `/robots.txt`, `/sitemap.xml`.

HTTP 404: `/church`. The completed source route must be deployed before public submission.

A six-width production Playwright sweep found no hydration errors or general console/page errors on the 200 routes. The only first-party failure was `/church`. No mock-data banner or localhost metadata was found. Support displays `support@menorahbiblequiz.com`.

The deployed route pages currently inherit the Home canonical URL. Route-specific canonicals are fixed in this source RC but require deployment. Open Graph and robots metadata use the production domain. The source sitemap now includes `/learn`, `/church`, and `/profile`; production must be rechecked after deployment.

## Android App Links

- www endpoint: direct HTTP 200, no redirect
- JSON syntax: valid
- Package: `com.menorah.biblequiz`
- Production fingerprint matches the signed AAB
- No placeholder remains

## Supabase

- Signed-out Leaderboard renders without PostgreSQL 42501, HTTP RPC errors, console errors, or a mock banner.
- Repository migration `20260804_mission32_1_leaderboard_rpc_grants.sql` preserves SECURITY DEFINER, revokes Public, and grants execute only to `anon` and `authenticated`; it changes no table policy or write grant.
- Existing admin browser regression unlocked the admin dashboard with locally configured owner credentials and passed live stats, question-bank, validation, translations, import/export, and unauthenticated API rejection checks. No credential value was logged.
- Service-role environment variables are referenced only by server/admin modules; browser clients use the public publishable key.
- Anonymous auth and the complete Live Battle create/join/synchronize/finish/cleanup lifecycle were not freshly proven with two sessions in this pass. No production test room/user was created, so none required cleanup.
