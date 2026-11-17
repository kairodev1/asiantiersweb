# Deployment (Vercel)

Environment variables (Project → Settings → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — must be the project that holds `players`, `hall_of_fame`, `site_stats` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/publishable key (fallback alias `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Must belong to the same project as the URL.** Used by `/api/tier-update` and Hall of Fame writes |
| `BOT_SECRET` | Shared secret the Discord bot sends as `X-Bot-Secret` |
| `ADMIN_PASSWORD` | Password for `/admin/login` (password-only, no username) |
| `NEXT_PUBLIC_DISCORD_INVITE` | Optional Discord invite URL (defaults to `https://discord.gg/AsianTiers`) |

Bot side: set `WEBSITE_API_URL=https://<your-domain>/api/tier-update` and `WEBSITE_BOT_SECRET=<BOT_SECRET>`.

After deploying, verify `/api/data` returns players. If writes return
`SUPABASE_SERVICE_ROLE_KEY belongs to a different Supabase project`, the service key does not match the URL.

Reads work with the public key; only tier updates and Hall of Fame edits need the service role key. Player tier
**points** are read from the `*_points` columns (the site never invents scores); when a tier is set but points are
`0`, the dashboard ranks by tier first and uses a minimal tier weight for sorting only.
