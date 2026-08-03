# Production Environment Audit

Values are intentionally omitted. This report records names and verification status only.

## Repository usage

| Variable | Scope | Local development presence | Production verification |
|---|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | Public | absent; safe production fallback now applies | **Unverified in Vercel** |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | configured | **Unverified in Vercel** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | configured | **Unverified in Vercel** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | configured | **Unverified in Vercel** |
| `SUPABASE_SECRET_KEY` | Server-only alternative | absent | Optional alternative; unverified |
| `GEMINI_API_KEY` | Server only | configured | **Unverified in Vercel** |
| `GEMINI_MODEL` | Server only | configured | **Unverified in Vercel** |
| `QUESTION_ADMIN_SECRET` | Local-development fallback | configured locally | Must not be relied on for production admin access |
| `QUESTION_GENERATOR_URL` | Optional integration | absent | Not referenced as a required runtime value |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Optional public flag | absent | Analytics remains off by default |
| `CAPACITOR_SERVER_URL` | Local native override | absent | Must remain absent for release sync/build |

No server-only variable found in the audit uses the `NEXT_PUBLIC_` prefix.

## Vercel owner verification

This session has no authenticated Vercel project access, so Production, Preview, and Development values cannot be asserted. In Vercel, verify names/presence separately for each environment and confirm:

- `NEXT_PUBLIC_SITE_URL=https://www.menorahbiblequiz.com` in Production.
- Public Supabase URL and publishable key point to the intended production project.
- Service-role/secret and Gemini keys exist only where needed and remain server-only.
- `CAPACITOR_SERVER_URL` is not set in Production or during release sync.
- Preview/Development do not accidentally use production privileged credentials.

## Public URL audit

- Production home, Privacy, Terms, Support, robots, and sitemap: HTTP 200.
- Metadata source now has canonical, Open Graph URL, and production-domain fallback.
- The currently deployed home still emits a localhost Open Graph image and lacks canonical/`og:url`; redeployment is required.
- Privacy URL: `https://www.menorahbiblequiz.com/privacy`
- Support URL exists but is not functional because no support contact is configured.
