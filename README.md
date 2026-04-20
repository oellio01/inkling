# Inkling

A daily visual word puzzle inspired by pictionary. Each image represents one or more concepts which, when combined, spell the answer.

Built with [Next.js](https://nextjs.org) (App Router), TypeScript, CSS modules, Supabase (anonymous auth + results), and PostHog (analytics).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_KEY=<supabase anon key>
NEXT_PUBLIC_POSTHOG_KEY=<posthog public key>            # optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000              # optional, used for canonical/OG URLs
```

## Scripts

- `npm run dev` — start the dev server with Turbopack
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npm run compound-model` — run the tuned Vertex Gemini script in `generate-inklings/`

## Project layout

```
src/
  app/            Next.js App Router entry (layout, page, globals)
  components/     React components (popups, keyboard, header, stats)
  hooks/          Custom React hooks
  lib/            Non-React utilities (supabase client, date + time helpers)
  data/           Static game data (images + answers)
  providers/      React context providers (user, posthog)
public/           Static assets (images, favicon, manifest)
generate-inklings/  Offline tooling for generating/evaluating puzzle ideas
```

## Supabase tables (reference)

- `game_results` — `(user_id, game_id, time_seconds, guesses, hints)`
- `game_rating` — `(user_id, game_id, rating, comment)`
- `game_suggestion` — `(user_id, suggested_word, description)`
- `share_events` — `(user_id, game_id, share_method)`

A unique index on `game_results (user_id, game_id)` is recommended so `insert` can be replaced with `upsert`.
