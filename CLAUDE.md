# Sartre

Code name for a book tracking + ranking app ("Strava for reading") for semi-frequent readers. A calmer, prettier alternative to Goodreads/StoryGraph: log finished books fast, rank them head-to-head (Beli-style) instead of star ratings, show a reader identity on a profile, share beautiful completion cards. First users: the author and a few friends.

**Current phase: UI prototype on mock data.** No backend yet. Web (Next.js) and mobile (Expo) render the same shared screens. Next phase is Firebase.

## Product principles (check every design decision against these)

- **Confident, never beginner.** No coaching voice, no praise for small things, no "start small" copy.
- **Good at small numbers.** Every screen must look intentional with 1–3 books. Sections only render once they have enough data to mean something: no empty slots, no zeros, no "0 day streak".
- **Progress without shame.** Monthly, never daily. Empty months are quiet dots. No streak counters, no averages, nothing that needs weeks of data.
- **Intentional over volume.** Reward taste/reflection, not book count.
- **Privacy is a dial:** `private → completions → reports → open` (see `packages/core/src/privacy.ts`).
- **Linkable beats feed-like.** Profiles (`/@handle`) and completion links (`/c/:readId`), no infinite feed, no public follower counts.
- Visual references: Beli (ranking), Monkeytype (minimal, themeable, mono stats), GitHub profiles.

## Commands

```sh
pnpm install
pnpm dev            # web at http://localhost:3000 (turbo → next dev)
pnpm dev:mobile     # Expo (set EXPO_PUBLIC_API_URL, see .env.example)
pnpm test           # vitest in core, data, mock
pnpm typecheck      # all packages + both apps (web runs `next typegen` first)
pnpm build
```

Bundle-check the mobile app without a device: `cd apps/mobile && CI=1 npx expo export --platform android --platform web --output-dir <tmp>`.

On the author's Windows machine Node lives in `C:\Program Files\nodejs` and pnpm in `%APPDATA%\npm`. If `node`/`pnpm` aren't found in a shell, prepend those to PATH.

## Layout (pnpm workspaces + Turborepo, `nodeLinker: hoisted` for Metro)

```
apps/web        Next.js 16 App Router (Turbopack). Routes are thin: they mount shared screens.
                app/screens.tsx = the 'use client' boundary re-exporting @sartre/app screens.
                app/api/books/*  = Open Library proxy (server-side, cached). lib/books.ts.
                app/providers.tsx = web adapter: Next router + prototype settings in the URL query.
                app/style-registry.tsx = flushes react-native-web CSS into SSR HTML.
apps/mobile     Expo SDK 58 / Expo Router. app/_layout.tsx = native adapter. Thin shell for now.
packages/core   Pure TS, no React: domain types, ranking state machine, scoring, stats, privacy, ulid.
packages/tokens Themes (paper, ink, serika, moss), type scale, spacing, radii, cover sizes. fonts.web.ts vs fonts.ts.
packages/ui     RN primitives: ThemeProvider/makeStyles/useTheme, Text, Cover, Button, Tabs, Segmented, Card, useViewport…
packages/app    Shared screens + state: Profile, Rank, Log, Card, Design; Prototype wrapper, DevToolbar, store, nav, settings.
packages/data   BookProvider interface; OpenLibraryProvider, HttpBookProvider (talks to /api/books), MockBookProvider.
packages/mock   Fixture catalog (real Open Library work IDs/cover IDs) + 1/4/30-book dataset builder.
tooling/tsconfig Shared base tsconfig.
```

Packages export TypeScript source directly (`main: ./src/index.ts`); no build step. Turbopack and Metro transpile them.

## Conventions

- **Styling:** React Native `StyleSheet` + typed tokens. No NativeWind/Tailwind (NativeWind stable needs Tailwind 3 and v5 is an RC; decided in session 1). Never hard-code colors: use `useTheme().colors` or `makeStyles((t) => …)` from `@sartre/ui`. Shadows use the `boxShadow` string style (works in RN 0.88 + RNW).
- **Layout by screen size:** use `useViewport()` from `@sartre/ui`, **not** `useWindowDimensions()`. The latter is 0×0 during SSR and causes hydration mismatches that React won't patch.
- **Images under SSR:** don't gate visibility on `onLoad` (it can fire before hydration and never reach React). See `Cover.tsx`.
- **Platform-specific code** uses `.web.ts(x)` siblings (resolved by both Turbopack, configured in `next.config.ts`, and Metro). Example: `exportCard.web.ts` (html-to-image) vs `exportCard.ts` (native stub).
- **Navigation:** shared code only uses `useNav()` / `routes` from `packages/app/src/nav.tsx` (URL paths; both routers understand them). No Solito.
- **Next.js 16 has breaking changes vs older versions.** Read `node_modules/next/dist/docs/` before writing Next code (see `apps/web/AGENTS.md`, which `next dev` maintains; keep it committed). Notably: async `params`/`searchParams`, `PageProps<'/route'>` / `RouteContext` helpers, top-level `turbopack` config.
- **React Native 0.88 types:** `View`/`ScrollView` are function components. Type refs as `ComponentRef<typeof View>` and pass `ref` as a prop (React 19), not `forwardRef`. `StyleSheet.NamedStyles` no longer exists (use `NamedStyles` from `@sartre/ui`).
- Profile route: Next forbids folders starting with `@` (parallel routes), so `app/[handle]` strips the leading `@` from `/%40handle`.
- Comments explain *why*; match the existing density. Tests live next to code (`*.test.ts`, vitest).

## Domain rules

- **Ranking** (`core/ranking.ts`): buckets are strictly ordered `loved > liked > meh`. A new book is binary-inserted within its bucket via a pure state machine (`startInsertion` → `answer('new' | 'existing' | 'tooClose')` → `applyInsertion`), at most ⌈log₂(n+1)⌉ questions. "Too close" places it directly below the pivot. Re-rank = remove + reinsert (bucket change allowed).
- **Derived score** (Beli-style bands): loved 6.8–10, liked 3.4–6.7, meh 0–3.3, spread evenly by position; a lone book sits mid-band.
- **Completions snapshot** `rankAtTime` / `rankTotalAtTime` when first ranked, so share cards don't silently change after re-ranks.
- **Pages read** come from check-in deltas plus the remainder at finish (`core/stats.ts`). A finish resets the counter so rereads count again.
- **Work vs edition:** rankings and completions attach to the work (`Book`); page counts come from the user's chosen `Edition`.

## Data model decisions (made; hard to undo)

- Our own IDs everywhere (ULIDs; fixtures use readable `bk-…`/`ed-…`). External IDs (Open Library work/edition, ISBNs, Google volume) live **only** on `books`/`editions` and an `externalKeys/{provider:type:id} → bookId` dedupe map. User data never references external IDs.
- Planned Firestore shape: `books/{bookId}` (+ `editions` subcollection), `externalKeys`, `users/{uid}` (private) with `library/{bookId}` (one doc per work, `reads[]` for rereads), `rankings/main` (ordered arrays per bucket in one doc), `checkins`, `completions/{readId}`; `handles/{handle}` for uniqueness; **public projection** `profiles/{uid}` (+ `completions`) written by a Cloud Function according to the privacy dial (rules can't hide fields). Firebase Auth uid = user ID.
- The in-memory store (`packages/app/src/store.tsx`) mirrors these shapes so screens won't change when Firebase lands.
- Hosting: web on Vercel; Firebase for Auth/Firestore/Storage. Share-card images for link previews will move to `next/og` (Satori), which is why cards are flexbox-only.

## Book data (Open Library)

- Always request covers **by cover ID**: `https://covers.openlibrary.org/b/id/{id}-{S|M|L}.jpg?default=false` (ISBN cover URLs are rate-limited; `default=false` makes missing covers 404 so the typographic fallback shows). The CDN sends CORS headers, so browser PNG export works.
- Send an identifying User-Agent; contact info comes from `OPEN_LIBRARY_CONTACT` (never hard-code personal details). Keep request rates low (the proxy caches).
- Search results are noisy: duplicate works, translations as separate works, study guides, original-language titles, wrong first-publish years. Our `books` cache must own curated display fields; search needs dedupe/language ranking before real users.
- Google Books is a future fallback (API key, quotas, terms restrict charging users).

## Prototype controls

The DevToolbar (bottom-right pill) and URL query params drive: volume `n=1|4|30` (default 1), `theme`, `as=public` + `privacy`, `months=covers|bars|both`, `rank=position|score|both`, `banner=topFour|collage`, `src=live|mock`. Logged books live in memory and reset on full reload or volume change.

## Open product questions (the prototype has toggles for the first four)

Monthly view (covers vs bars vs both) · rank shown as position, score, or both · which share-card direction (A Cover / B Stats / C Editorial) · banner style · shelves (deferred: Overview section first) · app name (placeholder `APP_NAME` in `packages/tokens`).

## Known gaps / next steps

- Native: load brand fonts (expo-font), card export via react-native-view-shot + share sheet, crypto polyfill for `ulid` (currently falls back to Math.random on Hermes).
- Phone layouts re-render once after hydration (`useViewport` SSR default is desktop). Move breakpoints to CSS media queries when it matters.
- Port the chosen card direction to `next/og` for OG images and `/c/:readId` link previews.
- Firebase phase: repositories behind the store API, security rules, `profiles` projection function, real auth.
- `pnpm-workspace.yaml` has a `minimumReleaseAgeExclude` list that pnpm added for then-brand-new Expo/turbo releases. Prune it once those versions age past the policy.
- Repo license is GPL-3.0. Revisit before outside contributions if closed source is ever wanted.
