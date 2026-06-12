# SpinVibes Golf — Roadmap & Architecture Plan

> **⚠️ LIVING DOCUMENT — KEEP THIS UPDATED**
>
> This roadmap is the single source of truth for where the SpinVibes Golf app is headed. **Update it every time we make meaningful tweaks to the web app** — changes to the data model, new features, renamed pages, refactored modules, scope changes, etc. A quick note in the Changelog section at the bottom is enough. If we don't maintain it, it becomes worse than useless.

---

## 1. The Headline

**Goal:** turn SpinVibes Golf from a personal pocket-guide into a standalone iPhone app anyone can use.

**Framework (revised 2026-06-07 — see Sprint 9.5):**

- **Web app (PWA):** keep the existing single-HTML, vanilla-JS app as the beta vehicle. It stays OS-agnostic, install-nothing, and is the design lab where flows/UX get validated with real families before being translated to native.
- **iOS app:** build **from scratch in SwiftUI** — a true native client, not a Capacitor/WebView wrapper. Decision driven by Jeremy wanting the app to *feel* native (system animations, gestures, haptics, Dynamic Type) rather than carrying forward "janky HTML on mobile" inside an app shell. Runs as a parallel track (Sprint 9.5) alongside the PWA beta — no urgency to ship fast, slower iteration accepted in exchange for polish.
- **Backend:** **Supabase** — Postgres + Auth + row-level security (RLS) + realtime. Shared by both clients; this is the moat and isn't duplicated by going native.
- **Auth:** Supabase Auth with email + **Apple Sign-In**. Because both the PWA and the native app authenticate against the same Supabase Auth records, migrating a beta user from PWA → native app is just "sign in with the same account" — no import flow.
- **Offline:** service worker for the PWA + Supabase's offline-retry patterns; native app gets native offline/caching idioms. Critical because cell service on a golf course is terrible.
- **Monetization (future):** [RevenueCat](https://www.revenuecat.com) + StoreKit if/when we add a subscription tier. Not a near-term concern.

**Why native instead of Capacitor?**
Originally the plan was Capacitor (wrap the existing web app, ship fast). That made sense under time pressure. It no longer does: Jeremy is fine trading speed for a genuinely native feel, the PWA already covers "ship something now" for beta, and Capacitor's WebView ceiling is exactly the kind of "misaligned HTML / not optimized for mobile" outcome Jeremy wants to avoid. Going native *now*, in parallel with beta — rather than after — means the native build can absorb Sprint 9's design learnings as they land instead of starting from a guess.

---

## 2. Current State (as of May 2026)

**Stable checkpoint:** `v1.0-stable` tag on GitHub (`jgelb001/spinvibes-golf`) — commit `a11e5fd`. This is the safe rollback point before the Sprint 1 file split. All features below are confirmed working at this tag.

**What exists:**

- Single `index.html` at `/Users/jeremygelbaum/Documents/SpinVibes/Golf/spinvibes-golf/index.html`, hosted via GitHub Pages (`jgelb001/spinvibes-golf`) → **spinvibes.com**. SW at v63 / cache v109.
- Pages: Home, Range, Stretches, Short Game, Strategy, Caddie (dad only), My Game (dad/son/girl each have own progress page).
- Bottom nav (mobile) switches pages. Profile selector (Dad/Son/Daughter/Mom/Grandma) gates each section.
- **Family Scorecard** — live feature. PIN-gated entry, all 5 players, per-hole scores, hole photos (in-memory only — not yet persisted), family caddie (player-aware), save-retry on failure. Saves to individual `*_rounds` tables + `family_rounds` snapshot.
- **AI Caddie** — routes through Netlify proxy at `golf.spinvibes.com/.netlify/functions/caddie`. No API key needed. Simplified: no context form, natural language only, max_tokens 80. Works in PWA (multi-turn) and guide (single-turn).
- **Off-course training** module added. Dark mode text color fixed.
- **Welk Fountains** 18-hole yardages fully entered in COURSES const.
- Supabase used for round storage: tables `dad_rounds`, `son_rounds`, `girl_rounds`, `mom_rounds`, `grandma_rounds`, `family_rounds` (separate tables per profile — still debt, but working).
- `localStorage` used for:
  - Club running averages (`sv-clubs`) — **device-specific, does not sync**.
  - PIN unlock flag (`sv-dad-unlocked`, etc.) — session-scoped.
  - Profile selection, last-used family course.
- Hardcoded:
  - User name ("Jeremy"), PIN `4417`
  - Full bag spec (Vice Boost driver/hybrid · Takomo 201 MKII irons · Callaway Opus wedges) in `CLUBS` const
  - Course list (~12 Temecula/Escondido-area courses in `COURSES` const)
- Dad and Son (and all 5 profiles) have near-duplicate code paths. **Still the biggest maintenance tax.**
- Access control = PIN overlay. No real auth, no RLS.

**Known problems this creates for a real multi-user app:**

1. No real auth — PIN is trivially bypassable; Supabase anon key exposes all data.
2. No row-level security — user A could theoretically fetch user B's rounds.
3. Per-device localStorage means club averages don't follow the user across devices.
4. All personalization is hardcoded — turning this into someone else's app requires code edits.
5. Profile code duplication scales as O(profile types), not O(1).
6. ~~Course list is static and Temecula-only.~~ → Custom courses now uploadable via scorecard photo + Claude vision → Supabase `courses` table.
7. ~~Hole photos from family rounds are in-memory only~~ → Fixed: Supabase Storage bucket `round-photos`, persisted on save.

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  iOS App (Capacitor shell)   │   Desktop / Mobile Web (PWA)  │
├─────────────────────────────────────────────────────────────┤
│                   Same HTML / JS / CSS                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI layer (pages, components)                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Storage abstraction (single `store` module)           │ │
│  │    ├─ Remote: Supabase (authoritative)                 │ │
│  │    └─ Local: localStorage / IndexedDB (cache + offline)│ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Service Worker — offline cache, background sync       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Supabase                            │
│   Auth (email + Apple Sign-In)                              │
│   Postgres with RLS                                         │
│     - profiles (user settings, handedness, goal, etc.)      │
│     - rounds (unified; replaces dad_rounds + son_rounds)    │
│     - clubs (per-user bag, with lofts and logged averages)  │
│     - courses (public + user-submitted, moderated)          │
│     - hole_shots (optional, for finer-grained club stats)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Free Future-Proofing — Do These Now

These cost little but make the eventual multi-user / iOS migration painless. In priority order:

### 4.1 PWA manifest + icons + service worker *(1 evening)*
- Adds a `manifest.json` + icon set + basic service worker.
- **Result:** any iPhone user can "Add to Home Screen" and get a fullscreen app icon with no Safari chrome. Also the prerequisite for Capacitor later.
- **Status:** ✅ DONE — `manifest.json` + `sw.js` live, currently v57.

### 4.2 Move rounds schema to Supabase with RLS *(1 weekend)*
- New tables: `profiles`, `rounds` (unified), `clubs`, `courses`.
- Add `user_id UUID REFERENCES auth.users(id)` to every row.
- Enable RLS so users only see their own rows.
- Migrate existing `dad_rounds` / `son_rounds` data into the new `rounds` table with a `profile_type` column.
- **Status:** not started.

### 4.3 Supabase Auth — email + Apple Sign-In *(1 evening)*
- Replace PIN gate with real auth.
- Apple Sign-In is mandatory in App Store if we add any other social login, so include it from the start.
- PIN becomes optional local-device quick-unlock (nice UX, but not the security boundary).
- **Status:** not started.

### 4.4 Unify dad / son code paths *(1 weekend — biggest cleanup)*
- Today: `openDadModal` / `openSonModal`, `loadDadRounds` / `loadSonRounds`, `renderDadHistory` / `renderSonHistory`, etc. Each feature written twice.
- Target: one `profile` entity with a `type` field (`"adult"`, `"junior"`, etc.), one set of functions parameterized by the active profile.
- Every future feature written once instead of twice.
- **Status:** not started.

### 4.5 Parameterize all hardcoded personal content *(ongoing)*
- Move "Welcome back, Jeremy", the Vice Boost bag, the Temecula courses, the 4417 PIN, etc. into a `user` / `profile` / `bag` / `courses` object loaded at boot.
- **Status:** partially done — CLUBS now has loft/display/wedge metadata but is still a const.

### 4.6 Move club averages to Supabase *(small task)*
- Keyed on `user_id + club_name` in a `clubs` table.
- Cross-device sync "just works" after this.
- Alternative (simpler v1): derive averages on page load from the `holes` JSON in saved rounds (which already includes approach club + yards).
- **Status:** not started. Related: user's question about mobile/desktop sync.

### 4.7 Abstract the storage layer *(small task, high leverage)*
- A `store` module already exists. Funnel ALL reads/writes through it.
- Later we swap localStorage → Supabase → offline-first SQLite on device without touching UI code.
- **Status:** partially in place; lots of direct `localStorage.getItem` calls still scattered around.

### 4.8 Move course data to Supabase *(small task)*
- `courses` table with public read + user-submitted-and-moderated entries.
- Fixes the Temecula-only problem.
- **Status:** ✅ DONE — `courses` table live in Supabase. Upload flow (photo → Claude vision → review → save) built into all three round setup modals. `getAllCourses()` merges DB + hardcoded. Courses shared across all devices. (2026-05-15)

---

## 5. Phased Roadmap

### Phase 0 — Personal tool + foundation ✅ COMPLETE
- Web app live at spinvibes.com, used every round.
- Service worker + manifest.json = installable PWA.
- CLUBS has lofts + display + wedge metadata. Full bag (driver/7-wood/hybrid/Takomo irons/Callaway Opus wedges/putter).
- Lock/save button on My Game. Mobile nav fits on screen.
- Family Scorecard feature: all 5 players, PIN gate, hole photos (in-memory), family caddie, save retry.
- AI Caddie simplified: natural language, no context form, routes through Netlify proxy.
- Off-course training module. Welk Fountains full 18-hole yardages.
- Round history in Supabase for Dad (5 rounds), Son (2 rounds).
- Milestones: broke 100 (Apr 28, 98), shot 95 (May 5), first birdie (May 11, Welk H5).
- **One open gap before Phase 0 is truly done:** hole photo persistence (currently in-memory only).

### Phase 1 — PWA + Multi-user foundation
Goal: anyone can sign up and use the app in their browser, with data synced across devices.

1. PWA manifest + icons + service worker *(4.1)*
2. Supabase schema migration to unified tables with RLS *(4.2)*
3. Supabase Auth with email + Apple Sign-In *(4.3)*
4. Unify dad/son code paths *(4.4)*
5. Parameterize hardcoded content *(4.5)*
6. Move club averages + courses to Supabase *(4.6, 4.8)*
7. Storage abstraction *(4.7)*

**Exit criterion:** a new user can sign up, create a profile, pick their clubs, play a round on any course, and see it sync across devices.

### Phase 2 — iOS native via Capacitor
Goal: ship to TestFlight, then App Store.

1. Capacitor project setup around existing web app *(1 weekend)*
2. Native GPS integration (more accurate than browser geolocation)
3. Apple Sign-In native flow
4. App icon, splash screen, App Store assets
5. Privacy policy + Terms (required for App Store)
6. TestFlight beta
7. App Store submission

**Exit criterion:** app live on App Store, anyone can download and use it.

### Phase 3 — Scale + Monetize
Goal: sustainable product.

1. Public course database (integrate with a provider, or grow user-submitted)
2. Social features: friend leaderboards, share rounds
3. Subscription tier (RevenueCat + StoreKit)
4. Analytics (PostHog or similar; avoid anything that requires painful App Store privacy disclosures)
5. Android via same Capacitor project (Capacitor supports both)

---

## 6. Specific Technical Decisions & Tradeoffs

### Why Capacitor over React Native / native Swift?
- **Capacitor:** keeps existing web code; weekend of wrapping work; good enough for this product's needs (GPS, local storage, auth, UI).
- **React Native:** full rewrite; better native feel but 3–6 months of work. Only worth it if Capacitor's UX ceiling is hit.
- **Native Swift:** even more work; best native feel; overkill for a web-shaped app.

### Why Supabase over Firebase?
- Already in use.
- Postgres → SQL familiarity, easy queries.
- RLS is elegant multi-tenancy.
- Open source option exists; can self-host later if needed.

### Why keep vanilla JS instead of React / Svelte?
- The app isn't complex enough to justify the framework tax.
- Single HTML file = fast iteration, no build step.
- If we ever want components, Web Components work inside the existing shell.
- Reassess only if the app grows past ~10k LOC.

### Auth: Apple Sign-In is non-negotiable
- Apple requires it in apps that offer any third-party social login.
- Easiest to include from day 1 alongside email auth.

---

## 7. Data Model (Target)

```sql
-- profiles: one per auth user, plus optional child profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  display_name text not null,
  profile_type text not null,            -- 'adult' | 'junior' | 'senior' | etc.
  handedness text,                        -- 'left' | 'right'
  handicap_goal int,
  home_course_id uuid references courses(id),
  created_at timestamptz default now()
);

-- rounds: unified replacement for dad_rounds / son_rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  course_id uuid references courses(id),
  course_name text,                       -- snapshot for custom courses
  date_played date not null,
  total_score int not null,
  score_vs_par int,
  stars int,
  reflection jsonb,
  holes jsonb not null,                   -- array of { hole, par, score, putts, fairway, gir, approach_club, approach_yards }
  created_at timestamptz default now()
);

-- clubs: per-profile bag and running averages
create table clubs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  name text not null,
  loft_deg numeric,
  display_name text,
  is_wedge boolean default false,
  default_carry_yds int,
  logged_carry_yds int,                   -- running average
  hit_count int default 0,
  sort_order int,
  unique (profile_id, name)
);

-- courses: public + user-submitted
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  par int not null,
  holes int not null,
  city text,
  state text,
  latitude numeric,
  longitude numeric,
  is_public boolean default false,
  submitted_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS policies (sketch)
alter table profiles enable row level security;
alter table rounds enable row level security;
alter table clubs enable row level security;
alter table courses enable row level security;

-- users see/modify only their own profiles, rounds, clubs
-- courses: public read if is_public, write via moderation
```

---

## 8. Changelog

**Keep this updated.** Every meaningful web-app change gets a one-line entry here with date + commit hash (if pushed).

### 2026-04-17
- Created this roadmap document.
- `655b1b3` — Mobile nav fit (`flex: 1 1 0`) + Welk Oaks par fix (54/18) + My Game lock button + clubs/lofts expander on home page.
- `a07bfb8` — Clubs expander reads live averages from `localStorage` via `getClubDist()`; updated CLUBS defaults; added `loft`/`display`/`wedge` metadata to CLUBS.

### 2026-04-28
- Supabase insert: Creek + Oaks, Sage, 98 total (broke 100). All 18 holes stored.
- Milestones section added to Progress tab with "Broke 100" card.
- Home tab "Next Target: <95" green card added.
- sw.js bumped to v41.

### 2026-05 (early — multiple sessions)
- **7-Wood added to bag** — Callaway Paradym Ai Smoke MAX · 21° · Aldila Ascent 40g · Senior flex. Stat row, bag table, Range Phase 2, and Upgrade Roadmap updated.
- **Family Scorecard built** — PIN-gated entry, all 5 players scored per hole, hole photos (base64, in-memory), family caddie (player-aware yardage cards), save retry UI, saves to `*_rounds` + `family_rounds`. Course dropdown with memory.
- **Daughter "My Game" nav tab** added → girl-progress page showing family round history.
- **Off-course training module** added; dark mode panel text color fix applied.
- **Welk Fountains** 18-hole yardages entered (par 62, 3,463 yds from scorecard photo).
- **Caddie simplified** — context form removed entirely, system prompt cut to ~50 tokens, max_tokens 80. Welcome card updated. Natural language only.
- **Guide builder updates** — Beginner Mode (3-question flow, `beg=1` param), Rose theme added (replaced Midnight), Resend email integration live (guide@spinvibes.com).
- sw.js progression: v41 → v42 → ... → v56.

### 2026-05-05
- Played Creek (Sage) + Stonehouse (White): **95**. New personal best. 7-wood debut.
- Supabase insert: dad_rounds, May 5 round.

### 2026-05-11
- Played Welk Oaks (par-3), Blue tees: **67 (+13)**. **First birdie ever** — H5 (92 yds). 5 pars.
- Supabase insert: dad_rounds, May 11 round (stored as May 10 in DB).

### 2026-05-15 (session 1)
- **Full bag update** — Takomo 201 MKII irons (LH, Regular, 4i–PW, ⏳ arriving), Callaway Opus SW 56° + LW 60° (⏳ arriving), Callaway Fairway 14 bag (⏳ arriving), putter weight adjusted (30g heel + 15g toe = 45g).
- CLUBS array rebuilt with 4i/5i added, SW updated to 56°, LW added at 60°.
- Caddie system prompt updated with full new yardage card (both solo and family caddie).
- Wedge Ladder card added to Dad home tab. Upgrade Roadmap replaced with "🎒 Bag fully upgraded."
- Range tab: Stock Yardage Card added (all 14 clubs, confirmed/estimated status).
- Progress tab: May 5 + May 11 round cards added. Birdie milestone + Bag Complete milestone added.
- Home hero: Next Target updated from <95 → <90. Subtitle updated.
- sw.js bumped v56 → **v57**. Commit: `5157616`.

### 2026-05-15 (session 2)
- **Safe area fixes** — `env(safe-area-inset-*)` added to all fixed overlays/modals in index.html + guide.html. Fixes Dynamic Island + home indicator on iPhone 17 Air/Max. sw.js v57 → v58. Commits: `fb23b53` (PWA), guide builder rebased.
- **Photo persistence** — Supabase Storage bucket `round-photos`. Canvas resize to 1200px/0.82 JPEG before upload. Base64 replaced with public URLs in `_famHoles`. `safeFamHoles` strips raw base64 from DB saves. sw.js v58 → v59. Commit: `e0fb1bf`.
- **Mid-round scorecard** — 📋 Card button added to family hole nav (`famMidRoundScorecard`) and Dad live hole nav (`dadMidRoundScorecard`). Shows full hole table with ← Back to Hole X. sw.js v59 → v60, v61.
- **Dad live hole compacted** — GPS yardage font 4rem → 2.8rem, reduced padding throughout, score stepper inline row. Fits one screen before Details dropdown.
- **Delete round** — `deleteFamilyRound`, `deleteGirlRound`, `deleteMomRound`, `deleteGrandmaRound` Supabase helpers added. Delete buttons added to family history list and girl round cards. sw.js v61 → v62. Commit: `7785c38`.
- **Approach tracking** — `approach_club` + `approach_yds` saved into `_dadHoles[idx]` in `dadLiveNext()` + `dadLiveBack()`. Falls back to `suggestClub()` if no club tapped. Persists to Supabase via existing holes JSON. Shown in 📋 Card table and round history expand. sw.js v62 → v63.

### 2026-05-15 (session 3)
- **Course scorecard upload** — "Add Course" button in all three setup modals (Dad, Son, Family). Photo → 1400px resize → `/.netlify/functions/parse-scorecard` → Claude Haiku vision → JSON (name, city, state, par, holes, holePars[], yardages[], teeColor) → editable review screen → save to Supabase `courses` table. `loadCustomCourses()` + `getAllCourses()` merges DB courses with hardcoded COURSES. Courses are shared across all devices/users. Closes roadmap item 4.8.
- **`parse-scorecard.js` Netlify function** — new file at `golf-guide-builder/netlify/functions/parse-scorecard.js`. Same CORS/origin pattern as caddie.js. max_tokens 700. Strips markdown fences from response.
- **`holePars` in rounds** — `dadStartRound()` and `startFamRound()` now use per-hole par from course data. Mixed-par courses score correctly.
- sw.js v63 → v64.

### 2026-05-22
- **New PB: 92** — Creek (Sage) + Stonehouse (Sage). Driver at 60% was the breakthrough. Pars on Creek H6, Stonehouse H6 + H9. Previous PB was 95.
- CURRENT-STATUS.md updated with new score, bag status (Opus wedges in, putter weights ⚠️), and cleanup items (round to add to Supabase, auto best-round feature).

### 2026-05-20 (session 10)
- **Guide builder branding** — SpinVibes logo (96px) on wizard landing screen only; removed from wizard topbar. Guide topbar logo was already removed in code (browser cache confusion). Email send bug fixed: relative `/.netlify/functions/send-guide-email` → absolute Netlify URL.
- **PWA logo cleanup** — removed SpinVibes logo from PWA landing (80px) and Dad home-hero (52px). User confirmed logo not wanted in PWA.
- **PIN access control redesigned (PWA)** — Info tabs (Home, Range, Stretches, Short Game) are open; Caddie + My Game remain PIN-locked. Family Round moved from home page to inside My Game only — now exclusively behind the PIN. Removed erroneous `enterProfile` PIN gate added earlier this session. Added `_pendingSonAfterPin` mechanism to son PIN handler to match dad pattern. Dead `.family-cta` CSS removed. SW v84 → v88.

### 2026-05-19 (session 9)
- **Guide builder content voice — scoped and approved.** Defined the coaching voice standard (Beginner: 1 sentence + landmark; Intermediate: what + 1-sentence why; Advanced: feel cue only). Before/after examples written for ball position and swing tips at all 3 levels. User confirmed "yes" to proceed. Execution deferred to morning session — user wants working prototype to show people.

### 2026-05-19 (session 8)
- **PWA white theme (spinvibes.com)** — Full palette migration from warm beige to clean white. `:root` updated: `--bg #F5F4F2 → #ffffff`, gold `#B89530 → #8a6010`, surfaces/borders adjusted. All hardcoded rgba values swept via replace_all (green rgba, old gold rgba, dark-mode gold rgba). Dark mode and family member accent colors preserved. Dad hero updated to champagne `#f5f1e8`. SW v81 → v82.
- **Range session ball position fix (PWA)** — Phase 2 (Mid Irons + Hybrid): "toward trail foot" → "toward lead foot" in card text, SVG diagram, and expanded tips. Hybrid cue "ball trail of center" → "ball lead of center". SVG ball cx moved from trail side (64) to lead side (95), label updated. Root cause fixed in `golf-reference.md` (LEFTY TRANSLATION GUIDE had irons going "left/trail" — now correctly "right/lead"). SW v82 → v83.
- **PGA Coaching Reference created** — New file `pga-coaching-reference.md`: 11-section professional coaching knowledge base. Covers 9 player profiles, setup fundamentals, 6-step swing sequence (with cues per skill level), 15 drills, 8 faults/fixes, full short game + putting systems, course management, teaching cues by audience, equipment notes, content style guidelines. Section 1 = lefty/righty translation table to prevent handedness errors in content generation.

### 2026-05-19 (session 7)
- **Netlify credit limit** — all deploys since May 15 skipped. Migrated guide builder static files to GitHub Pages (same repo `jgelb001/spinvibes-golf-guide`). DNS switch pending: GoDaddy CNAME `golf` → `jgelb001.github.io`. Caddie function stays on Netlify at `spinvibes-golf.netlify.app` (still live). SSL cert renewed via Netlify dashboard.
- **guide.html**: caddie fetch URL changed from relative `/.netlify/functions/caddie` → absolute `https://spinvibes-golf.netlify.app/.netlify/functions/caddie`. CNAME file added to repo root.
- **index.html — full JS emoji sweep**: warmup stretch icons → Tabler icon boxes with gold border; all cue-box `💬` prefixes stripped; strategy tips stripped of emoji prefixes; family member tips stripped; physical notes (`⚠️`, `🌱`) → plain bold text; equipment recs (`🏌️`, `🎒`) → clean text; lesson rec `📌` removed; `goalNum` fun → `'FUN'`; family `emoji` var → `'★'`.
- **Design feedback noted**: guide content voice still slightly AI/generic — tighten next session. Classic beige theme may feel less premium than clean white + gold — explore for next session.
- **Future**: caddie → Cloudflare Workers (free 100k req/day) when Netlify becomes friction point.

### 2026-05-19 (session 6)
- **Guide builder premium redesign (golf.spinvibes.com)** — Major UX/content upgrade to both files. `guide.html`: New `buildCoachBrief()` function — generates a direct, personalized coach briefing on the home tab using the user's name, goal, and flagged weaknesses. Each weakness gets a specific diagnosis sentence + fix cue. Followed by a frequency insight tailored to their practice cadence. Hero upgraded: `name.toUpperCase() + GAME PLAN`, goal as headline, hand/skill as `.profile-pill` chips, weaknesses as `.focus-pill` chips. Strava-style stat row: card borders, larger stat numbers (1.6rem), separate stat cards. `index.html`: New Review step (`step-review`) added to wizard flow before the Generate step. Shows all collected answers in tappable rows — each row displays a short label and the collected value. Tapping any row jumps back to that step to edit. `buildReviewStep()` called on navigation. STEP_SEQ updated: `[1,2,3,4,5,6,7,8,9,10,11,15,12,'review',14]` (full) + `[1,'b2','b3',15,'review',14]` (beginner). New CSS: `.review-row`, `.review-label`, `.review-value`, `.review-edit`, `.review-intro`, `.coach-brief`, `.cb-head`, `.profile-pill`, `.focus-pill`. Both files committed + pushed to Netlify.

### 2026-05-19 (session 5)
- **PWA emoji sweep (spinvibes.com)** — Full Tabler icon pass on last remaining emoji surfaces: approach stats (`renderApproachStats`), round history dynamic templates, caddie page icons + JS mic states (fixed `textContent` → `innerHTML`), caddie welcome bubbles. All `rgba(255,255,255,0.08/.12)` dark-era border values replaced with `var(--border)` across `.notes-area`, `input/select`, `.stepper-btn`, `.yardage-pill`, `#profileSwitch`, caddie bubbles + typing indicators. sw.js v57 → **v81**. Commit: "Polish: emoji sweep (Dad history, Caddie, approach stats), border sweep to var(--border), Tabler icons throughout".
- **Guide builder redesign (golf.spinvibes.com)** — Premium polish pass on both wizard + guide files. `index.html`: gradient buttons (`btn-next`, `btn-generate`) → solid `var(--green)`/`var(--gold)`; all 70+ option card emojis → Tabler icons; intro/done step heroes → Tabler icon boxes; dark toggle uses `innerHTML`; `'⭐'.repeat()` → `'★'.repeat()`. `guide.html`: same gradient → solid button fixes; logos (landing + topbar) `⛳` → `ti-flag-2`; landing card avatars emoji → gold-bordered initial letter boxes; dark toggle with `innerHTML` swap; distance sheet title, yardage chart edit button, callout pins → Tabler; all grid card icons, mic button, caddie reply club highlight, all swing thoughts, tips arrays, bag/physNote/lessonNote, warmup items, backyard drills, beginner content, strategy tips, mental game → Tabler; `gNum.fun` `😄` → `'FUN'`; all `💬` cue prefixes stripped; page header `data-icon` emoji attrs removed; loc-switcher buttons → Tabler. Both files committed + pushed to Netlify. Commit: "Polish: emoji sweep across wizard + guide — Tabler icons, initials avatars, solid buttons, no emoji chrome".

### 2026-05-17 (session 5 — prior numbering)
- **Practice mode** — "Round type" toggle (⛳ Scored / 🏌️ Practice) added to Dad and Family round setup screens. Practice rounds save with `is_practice: true`, shown in history with a "Practice" badge, and excluded from stats (avg score, best round, avg putts, approach stats).
- **Skip Save toggle** — On Dad post-round screen, a toggle to skip saving entirely. Useful for app testing. Round completes locally, nothing hits Supabase. Toast confirms "Test round — not saved."
- **Fixed `son_rounds` DELETE policy** — Added `anon_delete_son_rounds` RLS policy. In-app "Delete Round" button now actually deletes from DB (was silently failing before).
- `is_practice boolean NOT NULL DEFAULT false` column added to `dad_rounds`, `son_rounds`, `family_rounds` via SQL.
- sw.js v68 → v69.

### 2026-05-17 (session 4)
- **Full course sweep v2.1** — 26 courses bulk-inserted into Supabase `courses` table with complete hole-by-hole `holePars[]` + `yardages[]`. Available immediately in all round-start dropdowns via `loadCustomCourses()`. SD/Temecula: Ranch at Laguna Beach (9h), Native Oaks, Golf Club at Rancho California, Redhawk, Cross Creek, Golf Club of California (Fallbrook), Glen Ivy, Legends at Temeku Hills, Aviara, Coronado. LA area (lower priority): Rustic Canyon, Angeles National, Rancho Park, Sepulveda Balboa/Encino, Woodley Lakes, Griffith Park Harding/Wilson, Los Robles Greens, Sand Canyon (3 nines), Black Gold, Industry Hills Eisenhower/Zaharias, Los Verdes. Hole data sourced from Greenskeeper.org + official scorecards.
- **Hardcoded COURSES cleanup** — Removed CrossCreek and Redhawk stub entries (now in Supabase with full data). Bear Creek stub kept.
- **Backend cleanup** — Deleted 2 junk `son_rounds` rows (Apr 19 "test" + May 10 wrong-course-name). Fixed missing DELETE RLS policy on `son_rounds` — in-app "Delete Round" button was silently failing before, now works.
- sw.js v64 → v68. Commit: `ed6f135`.

### 2026-05-26 (session 16)
- **Auto best-round** — `loadDadBestRoundFromSupabase()` queries `MIN(total_score)` at startup, excludes practice rounds, updates `#dad-home-best` home hero. `refreshDadBestRound()` recomputes from cached rounds when My Game opens. Home HTML fallback → "Best: loading…". PB never needs a code update again.
- **Cloudflare Worker caddie** — `caddie-worker/index.js` + `wrangler.toml` created. ES module, native fetch, identical logic to Netlify function. Free tier: 100k req/day (vs Netlify ~125k/month). `CADDIE_URL` const added to `src/11-script.html` + `guide.html`; all hardcoded Netlify URLs replaced with the constant. Ready to deploy — Jeremy needs to run wrangler deploy + update `CADDIE_URL`.
- sw.js v82 → **v83** / cache v128 → **v129**.

### 2026-05-26 (session 15)
- **Club distance root cause fixed** — `getClubDist()` was reading hardcoded `CLUBS` as fallback, ignoring Settings/Supabase saves. Fixed to use `getActiveClubs()` as primary source of truth. `sv-clubs` rolling average is now legacy-only fallback. `suggestClub()` + `refreshClubSuggestion()` both updated to use `getActiveClubs()` for club list.
- **Range session distances committed** — 7W: 188→170 (165–175 carry confirmed), 7I: 135→137 (Vice irons confirmed), 6I flagged (ball position issue, reconfirm). Caddie system prompts updated.
- **Cross-device profile sync** — `loadUserProfile()` falls back to `pin_code` lookup when `device_id` not found. `sv-active-clubs` written to localStorage on save and read synchronously at init (distances survive refresh without Supabase).
- **Desktop layout fix** — `html.has-profile #app` specificity (1,1,1) overrode desktop media query `flex-direction:row` (1,0,0) on every refresh. Stripped redundant properties from has-profile rule.
- **Round editing** — `✎ Edit` button on all Dad round cards. Modal shows 18 holes with approach_club dropdown + approach_yds input. Saves via delete + reinsert (anon key has no UPDATE RLS). `_dadLoadedRounds` cache added.
- **Bad data fixed** — May 22 round H5 (7-Wood 50y) + H6 (4-Hybrid 100y) corrected to `approach_yds: null` via delete + reinsert. Root cause: stale `sv-clubs` localStorage values were being auto-saved during round tracking.
- sw.js v75 → **v81** / cache v121 → **v127**.

---

## 9. Open Questions / Future Decisions

- [ ] Do we want a free tier and a paid tier, or one-time purchase? (Affects Phase 3 planning.)
- [ ] Public courses data source — scrape, partner, or grow from user submissions?
- [ ] Offline-first sync strategy: PowerSync? Replicache? Custom? (Decide in Phase 2.)
- [ ] Android — same Capacitor project or skip for now?
- [ ] Do we want coaching content (range plans, strategy) to be shared across users or user-editable per account?
- [ ] Junior profile flow — separate account per kid, or sub-profiles under a parent?

---

## 10. Development Sprints — Benchmarks

> Each sprint is a discrete, shippable unit of work. Complete one before starting the next. This is the working queue.

### Sprint 1 — Stable Foundation ✅ COMPLETE (2026-05-22)
Goal: the PWA renders correctly on iPhone, layout is solid, file is manageable.

- [x] Nav bar fixed to bottom on mobile (`position: fixed; bottom: 0` + `flex-direction: column` on `#app`)
- [x] Round tracking page cleaned (milestones + history removed)
- [x] Shot tracker: slider + title + fixed club suggestion
- [x] Strategy page created and routing fixed
- [x] Short Game tab content for all 5 profiles
- [x] MyGame tab for Mom + Grandma (behind PIN)
- [x] Grandma rewritten: premium tone, no emojis, "getting back out there"
- [x] Extra `</div>` bug fixed (was closing `#pages` early, breaking layout)
- [x] Dad achievements restored to My Game tab
- [x] Stable checkpoint tagged: `v1.0-stable` on GitHub — safe rollback point
- [x] File split — `index.html` split into 12 `src/` section files + `build.sh`. `push.command` updated.
- [x] Layout confirmed working on iPhone 17 Air.

**Exit criterion met:** App loads correctly on iPhone, nav fixed at bottom, file is maintainable via `src/` sections.

---

### Sprint 2 — Master Coach Reference + Age/Skill Matrix ✅ COMPLETE (2026-05-22)
Goal: build the knowledge base that drives all coaching content in both the PWA and guide builder.

- [x] Restructured `pga-coaching-reference.md` into a full modular folder: `pga-coaching-reference/`
- [x] 10 universal reference files: lefty/righty, setup, swing sequence, drills library, faults & fixes, short game, course management, equipment, content style, README index
- [x] 9 profile cards in `profiles/` — full age × skill matrix (Toddler through Getting Back Out There)
- [x] Per cell: drills, distances, language patterns, swing focus (1–2 max), what NOT to say, LH/RH callouts
- [x] Full lefty/righty translation table in `00-lefty-righty.md` — always-check-first
- [x] Jeremy (LH, adult-intermediate) and Grandma (getting-back-out-there, zero emojis, premium tone) fully detailed
- [x] Family quick-lookup table in README (all 5 members → direct card reference)
- [x] Old file archived as `pga-coaching-reference-v1.md`

**Exit criterion met:** Any profile type (age + skill + handedness + goal) maps to a specific card that gives Claude everything needed to generate non-generic, correctly-handed coaching content.

---

### Sprint 3 — Profile Settings Editing *(Next — In-app)* 🔜
Goal: users can update their own profile without touching code.

- [ ] Profile settings page (behind PIN): name, goal score, handedness, age band, skill level
- [ ] Bag editor: add/remove clubs, update carry distances, mark as confirmed vs estimated
- [ ] PIN change flow
- [ ] Settings persist to Supabase (ties into Phase 1 auth work)
- [ ] On first launch for a new user: onboarding flow that populates these settings

**Exit criterion:** Jeremy can update his bag and distances from his phone after a range session, without opening a code editor.

---

### Sprint 4 — Caddie Infrastructure ✅ Nearly Complete
Goal: get caddie off Netlify (credit limits) onto Cloudflare Workers before beta.

- [x] Auto best-round — `loadDadBestRoundFromSupabase()` live, never needs a code update again
- [x] Cloudflare Worker built — `caddie-worker/index.js` + `wrangler.toml`, `CADDIE_URL` const wired in PWA + guide
- [x] **Wrangler deploy complete** — caddie live on Cloudflare Worker

**Removed from Sprint 4:** Takomo iron distances — handle when irons arrive, separate session.

**Exit criterion met:** Caddie routes through Cloudflare Worker. Netlify no longer needed for PWA or guide caddie.

---

### Sprint 5 — Guide for New People (Guide → PWA Bridge)
Goal: the guide wizard is the front door for new users — they build a guide and land in a pre-configured PWA ready to play.

- [ ] Guide "Generate" step adds a prominent "Open in SpinVibes" CTA below the guide
- [ ] CTA deep-links to spinvibes.com with profile params pre-populated (name, hand, skill, goal) as URL query params
- [ ] PWA reads those params on first load: pre-fills profile, skips onboarding, lands on the relevant home page
- [ ] Guide landing page updated: "Build your guide → Open your app" as the two-step product story
- [ ] Conceptually: guide = onboarding + reference card. PWA = daily home. They complement, not duplicate.

**Exit criterion:** A new user finds golf.spinvibes.com, builds their guide in 2 minutes, taps "Open SpinVibes," and lands in a pre-configured PWA with their profile ready.

---

### Sprint 6 — Multi-user Auth + Real Profiles ✅ DONE (Jun 4, 2026)
- Magic link auth, user_rounds table, PIN gate, guide builder return-user flow, photo storage
- Apple Sign-In deferred — ship magic link first, add Apple post-beta

---

### Sprint 7 — UI/UX Polish + Feel *(current focus)*
Goal: app feels like a premium family product, not a functional prototype. Lock the design before going native.

**Home tab — dynamic daily brief:**
- [ ] Rotating contextual suggestions (drills, family games, product tips) — date-seeded, personalized by skill/goal/family
- [ ] "Good morning" / time-of-day greeting with what's relevant today
- [ ] Pull-to-refresh feel — content changes, not static every open

**Copy + tone pass:**
- [ ] Age-appropriate voice per profile: Son (8, energetic/gamified), Daughter (6, celebratory/simple), Mom (friendly/peer), Grandma (dignified/no emojis), Dad/Jeremy (direct/data)
- [ ] Remove any clinical/lowest-common-denominator phrasing from cards and prompts
- [ ] Range sessions and drills already feel personal — preserve that voice throughout

**Caddie feel:**
- [ ] Quick-tap common questions so you don't have to type on a golf course
- [ ] Shorter, more confident response style ("Go 7-iron" not "You might consider...")
- [ ] Visual treatment that feels less like iMessage

**General:**
- [ ] Break up card monotony on key screens — full-bleed moments, inline elements, hierarchy
- [ ] Stability pass: test full family round flow end-to-end before Monday

**Exit criterion:** Jeremy runs a family round on Monday without hitting a single rough edge. Three people who've never seen the app open it and say it feels polished.

---

### Sprint 8 — Family Round Game Modes — ✅ COMPLETE 2026-06-10

> **Scope decision (2026-06-07):** Adults don't need games when tracking solo rounds — only the *family* (kid-inclusive) modes get built. All 7 adult-only formats below are **dropped from the plan**. Documented here for history only.

> **✅ Junior Scramble — SHIPPED** (commit `0f4bdf4`). Game-mode selector + inline how-to explainer; bomb-drive rescue mechanic (1 per kid per 9 holes) in live play + summary recap card; additive `game_mode`/`game_mode_data` fields on `family_rounds`.

> **✅ Team Scramble — SHIPPED** (commit `52d4e38`). Team setup (auto-balanced, tap-to-swap, custom names), best-ball per-hole + cumulative summary, dedicated "Team Scramble Recap" share card.

> **✅ Parents vs. Kids — SHIPPED** (commit `3916a6c`). Kids get auto-handicap assist by level (L≤1: +3 strokes, L2-3: +2, L4+: +1). Best-adjusted kid score vs. best adult score per hole. Live banner + win-count summary.

> **✅ Hole Challenge — SHIPPED** (commit `3916a6c`). Per-hole side game auto-assigned by par (par 3 → closest_pin; others rotate through fewest_putts / longest_drive / hit_fairway). Tap-to-pick winner per hole. Leaderboard summary.

> **✅ Kid Birdie Bomb — SHIPPED** (commit `3916a6c`). Each kid has a personal par target (par + level offset). Auto-detects "bomb" from live scores — no stored state. Summary computes from holes array.

> **✅ Team Captain — SHIPPED** (commit `3916a6c`). Rotating hole captain (cycles through kids). Captain picks which adult's shot the team plays. `@Published captainPicks` for live SwiftUI reactivity. Summary shows all captain decisions.

> **✅ All 6 modes also ported to iOS** (`FamilyRoundView.swift`, sessions 34-35). Full feature parity — `ObservableObject` data classes, banner Views, summary card Views, `startRound()` init, `save()` gameModeData, `validate()` guards.

Goal: beyond score tracking — let the family play *games* during a round. This is the thing that makes SpinVibes feel different from every other golf app.

**Why this matters:** The family round already tracks scores. But what adults actually play on the course — closest to the pin, scramble, match play, Wolf — isn't just score tracking, it's a game format layer on top. And the real opportunity: kid-inclusive versions that make a 6-year-old and a 68-year-old equally invested in every hole.

**Adult game formats:**
- **Closest to the Pin** — par 3s only, each player marks their closest shot, winner per hole
- **Scramble** — team picks best shot, everyone plays from there; great for mixed-ability rounds
- **Best Ball** — each player plays their own ball, team takes lowest score per hole
- **Match Play** — hole-by-hole wins instead of cumulative score
- **Wolf** — rotating "wolf" who picks a partner after seeing tee shots (4-player)
- **Bingo Bango Bongo** — 3 points per hole: first on green, closest to pin, first to hole out
- **Stableford** — points-based (birdie=2, par=1, bogey=0) instead of raw score

**Kid-inclusive variants (the real differentiator):**
- **Junior Scramble** — adults play normal, kids get to "rescue" the team with one bomb drive per 9 holes
- **Parents vs. Kids** — team format with auto-handicap assist (kids' scores reduced by a factor per age)
- **Hole Challenge** — per-hole side game: "who gets closest?" / "who makes it in fewest putts?" / "who hits the fairway?" — any player can participate
- **Kid Birdie Bomb** — if a kid scores par or better on any hole (at reduced expectations), they win the hole outright regardless of adult scores
- **Level-gated challenges** — kids at L3+ unlock "Approach Challenge" side bets, L5+ unlock full match play tracking
- **Team Captain** — rotating per hole; kid gets to be "captain" and pick which adult's shot the team uses

**Implementation approach:**
- Game mode selector on family round setup screen (before first hole)
- Mode determines what gets shown per hole (points, special scores, challenge markers)
- Summary screen adapts to show game-specific results, not just raw scores
- Modes stored in `family_rounds` as a `game_mode` JSON field (additive, backward compatible)

**Exit criterion:** Family plays a full 9-hole Junior Scramble with real point tracking. Kids care who wins each hole.

---

### Sprint 9 — Beta *(next up — Sprint 8 complete 2026-06-10)*
Goal: real users, real feedback.

- [ ] Share `app.spinvibes.com` link with 3–5 families who don't know Jeremy built it
- [ ] Watch them go through: guide builder → auth → first round → family round
- [ ] Collect feedback on auth flow, round tracking, caddie, family game modes
- [ ] Fix whatever breaks

**Exit criterion:** 3 families logged a round and came back the next week.

---

### Sprint 9.5 — Native iOS Build (parallel track, runs alongside Sprint 9) — DECIDED 2026-06-07

> **Architecture decision (2026-06-07):** Build a from-scratch native SwiftUI app instead of wrapping the web app in Capacitor. Rationale: Jeremy wants the app to feel genuinely native (system animations, gestures, haptics, Dynamic Type, native components) — not a WebView with plugin bridges. Capacitor would carry forward the same "janky HTML on mobile" risk Jeremy is actively trying to get away from, just inside an app shell. A native rewrite is the right call *because* there's no urgency to ship fast: Jeremy is willing to trade slower iteration for a polished result, and the PWA stays fully alive as the beta vehicle in the meantime — so nothing blocks on the native build finishing.

**Why this works (and isn't wasted effort vs. the PWA):**
- **Backend is shared and already built.** Supabase (Postgres + Auth + RLS + Storage) is backend-agnostic — the SwiftUI app and the PWA both read/write the same `guide_users`, `*_rounds`, `sv_clubs`, `kid_profiles` (post-Sprint 6), and `round-photos` storage bucket. The hard part (data model, RLS, auth) isn't duplicated — only the client view is new.
- **The PWA is the design lab.** Keep iterating flows/copy/game-modes/visual design in the fast file-split web codebase during Sprint 9 beta. Every validated decision becomes a translation spec for native — Jeremy builds the native UI against a *known-good* design instead of guessing, which directly addresses "design proper still needs work."
- **Migration is automatic, not a project.** Because both clients authenticate against the same Supabase Auth records, a beta user signs into the native app with the same account and all their rounds/profile/family/badges are already there — no import flow needed. This was Jeremy's explicit ask ("easy migration when the time comes... then roll it out big time").
- **PWA stays OS-agnostic and live** — it remains the public-facing, install-nothing way to generate interest and run beta (Sprint 9) indefinitely; the native app becomes the "graduate" experience layered on top later, not a replacement that forces a cutover.

**Status as of 2026-06-11 — ✅ SIMULATOR PASS COMPLETE (sessions 28–37):**

- [x] **Xcode project scaffolded** — builds + runs in iPhone 17 Pro Simulator
- [x] **Repo + backup pipeline** — `github.com/jgelb001/spinvibes-ios` private, wired into `push-all.command`
- [x] **1. Data layer** — `SupabaseService.swift` with live REST API calls (sign in, profile load, round fetch/save, club sync). `Models.swift` with Faktor Golf bag defaults. Apple Sign-In + email auth wired to `auth_id`.
- [x] **2. Home screen** — stats cards (best round, rounds played, level), coaching tips, daily brief
- [x] **3. My Game + Caddie** — round history from Supabase (live), scorecard share card (canvas → UIImage), delete action; Caddie with multi-turn chat, quick-tap chips, history ≤6
- [x] **4. Settings / bag** — 13-club editor, saves to `sv_clubs`
- [x] **Range + Short Game** — real drill/warm-up content replacing placeholder tabs
- [x] **5. Family Round + all 8 game modes** — full hole-by-hole flow, N/A option, Just for Fun, Family Outing share card, Junior Scramble, Team Scramble, Parents vs. Kids, Hole Challenge, Kid Birdie Bomb, Team Captain
- [x] **Kid leveling system** — `KidProgressManager`, `KidLevelView`, 9-level progression (L0–L8), check-ins, badges
- [x] **Dad solo share cards** — Full Scorecard + Hole Highlight, native share sheet
- [x] **App icon** — designed + wired into asset catalog
- [x] **Haptics** throughout (score steppers, level-up, game mode events)
- [x] **Fable design system enforced** — sentence case nav, no emoji in UI, player-color initial chips, custom tab bar with center Play button, family profile pills in hero, Short Game under Range tab, nav bugs fixed (kid pills → KidLevelView directly). Simulator-verified 2026-06-11.
- [ ] **Full profiles** — all family members have real bag/skill/goal/distances in the app. Requires `family_id` on `guide_users` + fetch-by-family or a multi-profile entry flow. **Next iOS item.**
- [ ] **Remove #if DEBUG auth bypass** — ContentView.swift + AuthManager.swift. Must happen before any on-device/TestFlight distribution.
- [ ] **Apple Developer Program** ($99/yr) — needed for on-device / TestFlight. Hold until full profiles done.
- [ ] **Game Rules Library** — native illustrated rule cards, bundled offline. Sprint 10 item.

**Cost watch:**
- Apple Developer Program: $99/yr — only near-term cost. Trigger when ready for on-device testing.
- Supabase free tier: comfortable for solo + early beta scale.
- Cloudflare Workers free tier: 100k req/day — no near-term concern.

**Exit criterion:** ✅ Simulator pass complete + Fable enforced. Next milestone: full profiles for all family members → on-device testing → App Store (Sprint 10).

---

### Sprint 10 — iOS App Store *(after Sprint 9.5 reaches parity)*
Goal: downloadable from the App Store.

- [ ] App icon, splash screen, App Store screenshots
- [ ] Native GPS, push notifications, HealthKit (as relevant)
- [ ] Privacy policy + Terms of Service
- [ ] TestFlight beta → App Store submission
- [ ] Game Rules Library polish (illustrated per-format rules, scoring examples, short looping clips for kid-inclusive variants — Junior Scramble, Parents vs. Kids, Hole Challenges)

**Exit criterion:** App live on App Store. Jeremy's investor demo is a real download, not a browser bookmark — and existing beta users migrate in seamlessly via shared Supabase auth.

> ~~Old plan (superseded 2026-06-07): Capacitor wrap around the existing web app.~~ See Sprint 9.5 for the architecture decision and rationale for going native instead.

---

---

## 11. File Split Plan

> **Why:** index.html is 8,000+ lines and growing. One bad `</div>` breaks the whole app. Editing any section risks breaking another. Not scalable past two developers (or one developer + Claude).

**Status: IN PROGRESS as of 2026-05-22.** Stable checkpoint `v1.0-stable` tagged before starting. Safe to roll back if anything goes wrong.

**Approach — Section files + build script (no framework, no new tools):**

Each logical section lives in its own file. A `build.sh` script concatenates them into `index.html` before push. Claude manages the split and the build. Jeremy still just double-clicks `push.command` — nothing changes for him.

```
spinvibes-golf/
  src/
    00-head.html           # <html>, <head>, CSS variables, global styles
    01-layout.html         # #app shell, #topbar, #nav HTML
    02-page-home.html      # Home tab (all 5 profiles)
    03-page-range.html     # Range tab
    04-page-stretch.html   # Stretches tab
    05-page-shortgame.html # Short Game tab (all 5 profiles)
    06-page-strategy.html  # Strategy tab
    07-page-caddie.html    # Caddie tab
    08-page-mygame.html    # My Game: dad-progress, son-progress, girl-progress, mom-progress, grandma-progress
    09-modals.html         # Dad round modal, Family scorecard modal, Family round modal
    10-js-core.js          # showPage, applyProfile, initApp, CLUBS, COURSES, store, helpers
    11-js-rounds-dad.js    # Dad round: openDadModal, dadLive*, loadDadRounds, renderDadHistory
    12-js-rounds-family.js # Family scorecard: openFamilyModal, famLive*, loadFamilyRounds
    13-js-rounds-other.js  # Son/Girl/Mom/Grandma round logic
    14-js-caddie.js        # Caddie: sendCaddie, renderBubble, multi-turn history
    15-js-badges.js        # BADGES const, renderBadges()
    16-js-profile.js       # PIN logic, applyProfile, lockDad*, profile switching
    17-tail.html           # closing </body></html>, SW registration script
  index.html               # GENERATED — do not edit directly
  build.sh                 # concatenates src/ → index.html, bumps SW version
  push.command             # ./build.sh && git add -A && git commit -m "..." && git push
```

**Rules once split is done:**
- Never edit `index.html` directly — it gets overwritten by `build.sh`
- All edits happen in the relevant `src/` file
- `push.command` handles building + pushing in one step
- Claude knows which `src/` file to edit for any given feature request

**No new tools. No framework. Same GitHub Pages. Same URL.**

---

## 12. Market Position — Honest Assessment (May 2026)

**Is anyone building this? No — not yet, and here's why that's real:**

The existing golf app landscape (18Birdies, Golfshot, The Grint, Arccos, Shot Scope, Kodiak Golf, ParPoints) is uniformly built around **one player improving their individual game.** Every one of them is a solo handicap tracker with GPS bolted on.

The family angle — multi-generational tracking, age-appropriate coaching for a 5-year-old and a 68-year-old in the same session, a dad logging his round alongside his kid's first birdie — **does not exist as a product.**

The closest things found in a May 2026 search:
- **PGA Jr. League** — organized team programs run by coaches, not a family app
- **ParPoints** — trying to be inclusive (beginners + kids) but it's still a solo scoring app
- **Junior Golf Scoreboard** — tournament results for competitive juniors, not casual family play

**The gap is real.** Golf is the #1 sport for family participation that spans generations (it's one of the only sports where a 6-year-old and a 70-year-old can play together meaningfully). No one has built the app for that family.

**Time pressure:** Golf participation surged post-2020 and family/junior participation is still growing. The window is open but not infinite. A well-funded team who sees the same gap could close it in 12–18 months. The moat SpinVibes builds before then is: the coaching content library (Sprint 2), the family data model (Sprint 5), and real user families generating real data (Sprint 5 exit criterion).

**Verdict: Not wasting time. Worth moving fast.**

---

## 13. Changelog (continued)

### 2026-06-12 (session 38 — beta tester fixes: auth, email, wizard handoff)
- **Wizard dead-end fixed** (golf-guide-builder): hide selectors missing `.wiz-body` made PIN/success screens render below the fold — tester thought generation failed. Flow now redirects **straight to `app.spinvibes.com?u=UUID`** after save; `showAppReady` success screen is dead code.
- **Supabase auth URL config** (dashboard, not code): Site URL `localhost:3000` → `https://app.spinvibes.com`; redirect allowlist was empty → added `app.spinvibes.com/**` + `golf.spinvibes.com/**`. This was why every magic link bounced to localhost.
- **Scanner-proof magic links:** Yahoo prefetch consumed one-time tokens (`otp_expired`). New `confirm.html` in spinvibes-app — human tap → `verifyOtp` → redirect. Email template now uses `token_hash`, never `{{ .ConfirmationURL }}`.
- **Auth emails from "SpinVibes Golf <guide@spinvibes.com>"** via Resend custom SMTP (smtp.resend.com:465, dedicated API key separate from Netlify's). 30 emails/hr.
- **Light mode fixed** (spinvibes-app): `sv-light` class had no CSS — added full light palette + localStorage persistence.
- **SW v2** (spinvibes-app): network-first for HTML — v1 was cache-first with a never-bumped version, silently pinning installed users to stale builds forever.
- New doc: **`spinvibes-app/AUTH-EMAIL-SETUP.md`** — full record of dashboard-only config.
- Mike (first beta tester) rescued via direct `?u=` link; profile had saved fine during the broken flow.

### 2026-06-11 (session 36 — Fable visual redesign, PWA + iOS)
- **Full visual redesign shipped (Sprint 7 centerpiece).** Direction chosen by Jeremy after 4 mockup rounds (Clubhouse Press / Twilight Fairway / Fairway Pop / editorial roster / Golfir-style synthesis): forest-ink chrome `#13291C`, white airy working screens with whisper-green tiles `#F3F7F3`, ONE kelly green `#249657` reserved for the primary action per screen. Gold demoted from app brand color to Dad's identity color (his pages keep gold accents; family/app chrome runs green + ink).
- **Typography:** Bebas Neue + Outfit fully removed (CSS, inline styles, SVG badges, canvas share cards — 100+ refs). Single family: Archivo 400–800. Heavy + tight (-0.5px) for titles/numbers, sentence case everywhere; caps only on tiny letterspaced labels.
- **Landing rebuilt** as dark-ink roster: SpinVibes Golf wordmark (white + mint), all 5 players as equal full-width stacked cards (Jeremy's call: no Dad-bigger hierarchy), lightened player-color names on ink.
- **Bottom nav:** taller (54px), sentence-case labels, no underline — active = ink + weight. NEW center kelly **PLAY button** (`svPlay()`): Dad → solo round setup, other profiles → family round (dad-PIN gated).
- **Family round setup:** player picker emoji replaced with player-color initial chips; selected state gold → green; Search button green; game-mode picker selected card green with light-border idle states (legacy dark-mode rgba whites cleaned out).
- **Misc fixes:** Course Strategy guide-card flex layout (dad-sect display:block bug → `_sectDisp()` helper), 2 stray tofu glyphs (emoji remnants), Daughter age 5 → 6 in 3 places, fam-modal label legacy blue → ink.
- **Dark mode** retuned to new tokens (ink-green family, green active states).
- **iOS:** new `DesignSystem.swift` — full token file (colors incl. on-ink player variants, SVType scale, cardStyle/statTile/primaryButton/secondaryButton/inkHeader/sectionHeader modifiers, SVAvatar + SVScoreBadge). `Theme.swift` SVColor/SVFont re-mapped as legacy bridge so existing views adopt the new palette.
- **iOS full view conversion (same session, later):** every screen moved to the light Fable palette. Color scheme → light app-wide; SignInView → ink brand screen; HomeView → ink hero + kelly Start Round card + surface stat tiles; MainTabView → white/ink tab bar; `SVColor.gold` legacy slot re-pointed to kelly. FamilyRoundView/KidLevelView/MyGameView: ~250 hardcoded dark hexes remapped by script with guards (Dad player gold, bogey chip, player-chip ink text, UIColor canvas share-card code untouched). Bebas `.custom` fonts → system heavy; player emoji → initials. Balance-checked; awaiting Xcode build + Simulator verification.
- Old PWA src backed up at `spinvibes-golf/src-backup-prefable/`. sw.js v103→v104, cache v149→v150. Build verified: 14,258 lines, JS syntax check passed, screenshot-verified via headless Chromium (landing, Dad home, Daughter home, family round setup).
- "Looks like a Claude-built app" pending bug → CLOSED.

### 2026-06-10 (sessions 34–35 — Sprint 8 final: 4 remaining game modes + push-all fix)

**PWA — 4 remaining family game modes shipped (commit `3916a6c`):**
- **Parents vs. Kids:** auto-handicap by kid level (L≤1: +3, L2-3: +2, L4+: +1), best-adjusted kid vs. best adult per hole, live banner + win-count summary card.
- **Hole Challenge:** auto-assigns challenge type by par (par 3 → closest_pin; others → fewest_putts / longest_drive / hit_fairway rotating). Tap-to-pick winner per hole. Leaderboard summary.
- **Kid Birdie Bomb:** personal par target per kid (par + level offset). Auto-detects "bomb" from live scores (no stored state). Summary computes from holes array.
- **Team Captain:** rotating hole captain (cycles through kids). Captain picks which adult's shot the team plays. Summary shows all picks with hole numbers.
- Build: `index.html` 14,207 lines, JS syntax clean.

**iOS — all 4 modes ported to `FamilyRoundView.swift` (+699 lines):**
- `kidHandicapOffset()` helper reads level from `UserDefaults` (`sv-{playerKey}-level`).
- `ParentsVsKidsData`, `HoleChallengeData`, `KidBirdieBombData`, `TeamCaptainData` — `ObservableObject` classes with `@Published` on mutable live-play properties.
- 8 new Views: 4 banners (live play) + 4 summary cards.
- `startRound()` inits, `save()` `gameModeData`, `validate()` guards all wired.

**Also session 34 — CLUBS / Models.swift updated for Faktor Golf:**
- PWA `CLUBS` array updated: Faktor Golf combo set replaces Takomo/Vice Boost entries.
- iOS `Models.swift` `defaultClubs()` updated to match.

**push-all.command rewrite (session 35):**
- Old pattern (git pull + push on FUSE-mounted repos) was failing with "could not parse HEAD" and remote-rejection errors.
- Rewrote to temp-clone pattern: `git clone` → `rsync --delete` → `git commit` → `git push`. Immune to FUSE git-index corruption.
- Credentials extracted at runtime from existing local `spinvibes-golf` remote URL — no hardcoded token (avoids GitHub push-protection rejection).

### 2026-06-09 (session 33 — Supabase Swift client live)
- `SupabaseService.swift` replaced all mock/stub data with real REST API calls (sign in, profile load, round history, round save, club load/save).
- Auth token stored in `UserDefaults`, refreshed on boot.
- All 5 repos pushed from sandbox via temp-clone pattern.

### 2026-06-08 (sessions 31–32 — kid leveling + share cards + app icon)
- **Kid leveling system:** `KidProgressManager.swift` reads/writes `UserDefaults` (`sv-{key}-level`, `sv-{key}-points`). `KidLevelView.swift` — level card with progress ring, badge grid, level-up animation. Compile error fixed (par redeclaration in `KidLevelView.swift`).
- **Dad solo share cards:** canvas-drawn Full Scorecard (hole grid, Front/Back 9, golf notation: birdie circle, bogey square) + Hole Highlight. Native `UIActivityViewController` share sheet.
- **App icon:** SpinVibes Golf green/gold design, all required sizes wired into `Assets.xcassets/AppIcon.appiconset`.
- Simulator build verified clean (no compile errors).

### 2026-06-07 (sessions 29–30 — iOS full feature build: My Game, Caddie, Range, haptics, camera)
- **HomeView:** stats cards (best round from Supabase, rounds played, current kid level), coaching tips carousel, daily brief.
- **MyGameView:** round history live-fetched from Supabase, scorecard share card (canvas → UIImage → UIActivityViewController), delete round action. Hole grid with color-coded score notation.
- **CaddieView:** full multi-turn chat against CF Worker, yardage chip row (real distances from bag), 8 situation quick-tap chips (mirrors PWA: Into wind, Downwind, Lay up or go?, etc.), history ≤6, max_tokens 80.
- **RoundFlowView:** per-hole caddie panel with approach distance + club suggestion. Hole photo capture via `UIImagePickerController` (camera + library). Draft persistence.
- **Range + Short Game:** replaced placeholder Text views with real drill/warm-up content.
- **Haptics:** `UIImpactFeedbackGenerator` on score steppers, `UINotificationFeedbackGenerator` on level-up + game mode events throughout.
- **Family Round iOS foundations:** setup flow, hole-by-hole scoring (N/A option added), Just for Fun mode (no game mode overlay), Family Outing share card. Junior Scramble + Team Scramble ported.

### 2026-06-07 (session 28 — pre-beta cleanup pass)
- **Pills not highlighting on iOS tap — FIXED.** Added a global no-op `touchstart` listener; Safari only reliably fires `:active` styles when a touch listener exists somewhere in the document.
- **Dad CARD view scroll bleed — FIXED.** Root cause: `.page`'s CSS `transform` created a new containing block for the `position:fixed` `#dad-modal` (nested inside `.page.dad-progress`, unlike the top-level `#family-modal`), so the Round History list bled through behind the live CARD view. Fixed with `html.modal-open .page { transform: none !important; }` plus a `modal-open` class toggle in `_lockBodyScroll()`/`_unlockBodyScroll()`.
- **Temecula Creek "Sage" tee — FIXED.** GolfCourseAPI has no Sage tee for Temecula Creek (confirmed via live probe — only Blue/White/Red). Added `_injectSageTee()` to merge Jeremy's verified scorecard tee data into course results and default the tee picker to Sage.
- **Found already-resolved (verified live, doc was stale — no code change needed):** family round share-picker flow ordering, family round CARD photo thumbnail, `guide_users` anon UPDATE RLS for PIN sync, `dad_rounds` anon UPDATE RLS / round-edit save (already a clean `.update()`, the old delete+reinsert workaround referenced in session 23 notes is gone).
- **CURRENT-STATUS.md cleaned up** — removed duplicated Known Issues entries (Takomo irons, 6-iron ball position, Hard reload after SW bump) and a stale "Round edit RLS — delete+reinsert" bullet that contradicted the session 23 fix.
- Build verified: `build.sh` → 13514 lines, JS syntax check passed.

### 2026-05-22 (session 12)
- **Sprint 2 complete — Master Coaching Reference rebuilt as multi-dimensional folder system.**
- `pga-coaching-reference/` folder created (replaces single flat `pga-coaching-reference.md`, archived as `-v1.md`).
- 10 universal reference files + 9 profile cards in `profiles/` subfolder. 3,578 lines across 19 files.
- Architecture: Claude loads README index → pulls specific profile card + only the reference files it needs. No more reading a 950-line monolith.
- Classification dimensions per card: age band × skill level × handedness × goal × session type.
- Key family members fully detailed: Jeremy (LH, adult-intermediate, break-90 math + full bag table with pending confirmations flagged), Grandma (getting-back-out-there, zero emojis, premium tone enforced at document level), Son (junior-8to12, RH, 5 skill levels), Daughter (beginner-kid-5to7, LH, dedicated LH junior club note).
- Publishing checklist + handedness verification protocol in `08-content-style.md`.
- CURRENT-STATUS.md updated. Sprint roadmap updated. Memory updated.

### 2026-05-22 (session 11)
- **Family content overhaul** — Grandma section fully rewritten: premium tone, no emojis, "getting back out there" framing. Short Game tab added for all 5 profiles (son: chipping basics; daughter: putting games; mom: bump & run + fundamentals; grandma: putting-first). MyGame tab added for Mom + Grandma behind PIN 4417. Golf Yoga section wrapped in dad-sect (hidden from all other profiles).
- **Nav bar layout fix** — reverted `#nav` to `position: fixed; bottom: 0; left: 0; right: 0; z-index: 100`. Fixed `flex-shrink: 0` approach that was breaking mobile. Removed extra `</div>` in stretch page that was closing `#pages` prematurely. `.page { padding-bottom: calc(var(--nav-h) + var(--safe-b) + 16px) }` restored.
- **Strategy page** — routing fixed (page-strategy div created, showPage handler added).
- **Shot tracker** — yardage pills replaced with slider (30–250 yds, 5 yd snap). Distance-to-pin title added. Static distances panel removed. 7-Wood excluded from approach suggestions.
- **Dad achievements restored** — `renderBadges()` was wired for Son + Girl but missing from `renderDadHistory`. Fixed: achievements section now renders above round history in Dad My Game.
- **CLUBS array** — reverted to Vice Boost irons (Takomo not yet arrived).
- **Stable checkpoint** — `v1.0-stable` git tag pushed to GitHub. Safe rollback point before file split.
- **File split** — IN PROGRESS. `src/` directory + `build.sh` being created. See Section 11.
- sw.js v88 → v109 (multiple nav/layout iterations this session).

### 2026-05-26 (sessions 13–14)
- **Sprint 3 complete — Profile Settings Editing In-App.**
- Settings page (`06b-page-settings.html`) added behind Dad PIN: editable bag distances, saves to `sv_clubs` Supabase table. Accessible via ⚙ button in Dad My Game.
- Supabase tables `sv_profiles` + `sv_clubs` created. Profile load on startup (pin_code, distances).
- **TDZ bug sweep:** `CLUBS`, `BADGES`, PIN vars moved to top of script. Supabase init guarded with `typeof supabase !== 'undefined'`.
- Duplicate `const BADGES` removed from line ~849.
- PIN session keys isolated: `sv-mom-unlocked`, `sv-grandma-unlocked` (was shared `sv-family-unlocked`).
- Daughter PIN overlay + JS added. Lock functions added for Girl/Mom/Grandma.
- Grandma + Mom My Game pages polished: proper page tags, lock buttons, "Round History" section titles.
- Grandma dot IDs standardized (`grandma-dot-X`), `grandmaPinKey` refactored to use `updatePinDots()`.
- Pre-render CSS flash fixed: added `display: flex !important` for family nav-btn during `html.pre-X` phase.
- SW: v73/v119 → v75/v121.

*Last updated: 2026-05-26 (sessions 13–14)*

### 2026-05-29 (session 26 — Caddie upgrade + Handicap + Course Search)
- **Caddie system prompt rewritten** — now thinks in plays (layup vs. go, where to miss), shows distance math, accounts for trouble at max carry range, factors in wind/lie. Max tokens raised to 120.
- **Miss Tendency setting** — dropdown added to Settings → My Profile (Pull Left / Push Right / Hook / Slice / Thin / Fat). Saves to localStorage, feeds caddie system prompt every session.
- **Handicap Index tracker** — WHS-style calculation in Dad My Game. Score differential per round `(score - rating) × 113 / slope`. Best N of last 20 regulation rounds per WHS table. Big gold number + differential sparkline. Only counts rounds at courses with rating/slope data.
- **TCI courses now have rating + slope** — Creek+Stonehouse, Creek+Oaks, Oaks+Creek all set to Rating 67.4 / Slope 124 (Sage tees, confirmed from physical scorecard).
- **GolfCourseAPI.com integrated** — free tier (300 req/day), 30,000 courses. CF Worker updated with `/course-search`, `/course-detail`, `/parse-scorecard` routes. API key stored as CF secret (`GOLF_COURSE_API_KEY`).
- **Add Course overlay rebuilt** — search-first UI: type course name → results list → tap to select → full card auto-populates (name, city, state, par, holes, pars, yardages, rating, slope). Tee switcher shows all available tees. Scorecard photo OCR fixed (was pointing at dead Netlify URL, now uses CF Worker + Claude Haiku vision).
- **Supabase `courses` table** — `rating` (numeric 4,1) and `slope` (integer) columns added. `loadCustomCourses()` now includes them.
- SW: v95/v141 → v97/v143.

### 2026-05-29 (session 27 — kid badges, shot dispersion, share, club fixes)
- **Kid parallel badge track** — 9 new badges: Bucket Emptier (10 range sessions), Hat Trick (3 rounds/month), Road Warrior (5 courses), Family Tradition (5 family rounds) auto-detected; Rainmaker, Early Bird, Sunset Round, Sidekick, Dynamic Duo manually awarded by account holder. Award/revoke UI in kid profile (account holder only).
- **Badge descriptions** — visible under every badge name. `badge-desc` CSS class added.
- **Shot dispersion tracking** — Miss Direction (Left/On/Right) + Miss Depth (Short/Pin High/Long) in hole Details during live round. Stored in holes JSON → Supabase. Bar chart + pattern callout in Approach Stats after 3+ data points.
- **Dad solo share card** — 📤 Share button on round reflection screen. `showDadSharePicker()` maps dad round data to family format, all 3 existing templates work (Full Scorecard, Hole Highlight, Best Moment).
- **Dad hole photos** — Camera + Roll buttons in hole Details section. Photos feed the share card collage background.
- **Club distances corrected** — 7-Wood: 180 yds, 4-Hybrid: 175 yds. Updated in CLUBS array, caddie system prompt, family yardage card, golf-reference.md.
- **Bag display bug fixed** — home screen bag dropdown was reading stale `sv-clubs` localStorage instead of confirmed Settings/Supabase distances. Now always reads `c.dist`.
- **Two JS syntax bugs fixed** — curly apostrophes in `wasn't` and `'s` inside single-quoted strings were crashing the entire script on load.
- SW: v97/v143 → v103/v149.

### 2026-06-02 (session 17 — UX fixes + family round overhaul)
- **5 UX fixes from solo round:** touch-action:manipulation on score buttons (no double-tap zoom); _lockBodyScroll upgraded to iOS top-offset technique; overscroll-behavior:contain on caddie msgs; HOLE N header 2rem prominent + par subtitle; X removed from live tracking → Exit Round footer button with confirmation; Resume Round banner on Dad home when draft exists.
- **Family round overhaul:** GolfCourseAPI course search replaces static dropdown; per-player tee box selection (Dad → longest, others → shortest); per-hole yardages shown in score rows; _hasPhoto() helper accepts http + data: URLs; includeAllTeeHoles:true Worker flag; account_id in wrangler.toml.
- **Family modal hardened:** body scroll lock on open/close, fixed header + scrollable body, HOLE N header, Exit Round footer, touch-action on all buttons.
- SW not bumped (JS-only changes compiled via build.sh).

### 2026-06-03 (session 18 — Guide → App bridge + app.spinvibes.com)
- **app.spinvibes.com launched:** new repo jgelb001/spinvibes-app → GitHub Pages. Personal PWA: loads guide_users profile by UUID, personalizes Home/Caddie/Range/My Game. Caddie uses CF Worker with their bag/skill/goal context. Rounds in localStorage keyed by UUID. PWA manifest + service worker.
- **Guide CTA:** guide.html shows "Open My SpinVibes App" banner + sticky bottom bar → app.spinvibes.com?u={uuid}.
- **Resend email updated:** app link is primary CTA with Add to Home Screen instructions; guide link secondary.
- **index.html:** appUrl built from UUID passed to email function alongside guideUrl.
- **push-app.command** added alongside push.command and push-guide.command.
- **GitHub PAT** created (no expiration, repo scope) for spinvibes-app pushes.
- **Share card photo fix:** _hasPhoto() helper replaces all startsWith('http') checks — share cards now work with locally-captured (base64) photos before upload.

*Last updated: 2026-06-03 (sessions 17–18)*

### 2026-06-03 afternoon (session 19 — share card redesign + tee dedup)
- **Share cards fully redesigned:** spinvibes_logo.png top-right (replaces text), gold border frame, gradient starts at 60% (15% less coverage), single hole photo background (no collage). All 3 templates rebuilt: Round Summary (2x2 player chip grid + winner), Hole Highlight (all player scores for that hole), Best Moment (single player, big score, Birdie/Eagle in gold + level shield for kids). `_loadSvLogo()` caches logo, `_drawCardChrome()` shared chrome renderer.
- **Tee picker dedup:** Worker deduplicates tees by name (case-insensitive) — courses with same tee in male + female data no longer show doubles.
- **Backup:** spinvibes-meta private GitHub repo created. `push-meta.command` syncs ROADMAP, CURRENT-STATUS, golf-reference, pga-coaching-reference, caddie-worker, LogoImages. All 4 repos visible in GitHub Desktop.

*Last updated: 2026-06-03 (sessions 17–19)*

### 2026-06-04 (sessions 19–20 — share cards, uniform tracking, app rebuild)
- **Share cards complete:** multi-photo per hole (scroll strip, add/remove), auto-grid collage, full scorecard per-hole grid (Front 9 + Back 9, birdie circle/bogey square notation), Best Moment photo picker if multiple photos. Preview before sharing on all templates. Share button on Dad history cards.
- **Uniform round tracking:** Dad solo round now uses GolfCourseAPI search + tee selection from API (same as family round + personal app). `dadStartRound()` uses `_dadCourseData`/`_dadSelectedTee`.
- **Level-gated stats:** L3+ shows putts per player in family round. L4+ shows fairway hit. `famHolePuttAdj()` + `famHoleFairway()` live-update without re-render.
- **app.spinvibes.com full rebuild:** 5 tabs (Home/Caddie/Range+Stretch/Short Game/My Game), hole-by-hole tracking with approach slider + live caddie + photos + draft persistence, share cards, hole grid history.
- **Guide post-wizard redirect:** "Your App Is Ready" success screen replaces direct guide redirect. App is primary CTA, guide is secondary.
- **New user flow PDF:** `spinvibes_user_flow.pdf` in Golf folder.

### 2026-06-04 (session 22 — Sprint 6 quick wins + magic link auth)
- **dad_rounds UPDATE RLS** — policy added, `saveRoundEdit()` now uses `.update()` instead of delete+reinsert. Verified via PATCH test (204).
- **Dad solo photos → Supabase Storage** — `_uploadHolePhotos(holesArr, roundId)` shared helper. `uploadDadRoundPhotos()` called in `saveDadRoundFull()` before save. `round-photos` bucket live (public, anon insert policy).
- **push-all.command** — deploys all 4 repos in one double-click. Clears all git lock files. Handles PWA build step automatically.
- **Magic link auth (app.spinvibes.com):** supabase-js client, `user_rounds` table + RLS, `auth_id` on `guide_users`, rewritten boot sequence (session → UUID fallback), `onAuthStateChange` handler, `migrateLocalRoundsToSupabase()`, auth topbar button, "Save your progress" nudge, login screen for direct/return visits.
- **spinvibes.com (PWA) stays PIN-only** — no auth needed there, stays as Jeremy's personal proof of concept.

### 2026-06-04 (session 21 — PIN auth)
- **PIN auth — guide builder:** After coaching plan generates, PIN setup screen intercepts before Supabase save. User enters 4-digit PIN × 2 to confirm. `app_pin` included in guide_users INSERT. Skip option saves null (no gate).
- **PIN auth — app.spinvibes.com:** Boot checks `profile.app_pin` OR `localStorage('sv-pin-{userId}')`. Full-screen PIN gate with shake on wrong entry; correct PIN → sessionStorage auth (per session). Preview/URL-param users bypass entirely.
- **PIN nudge:** Users who skipped see a gold-bordered card on Home tab → taps open in-app PIN setup modal. Saves to localStorage immediately + best-effort PATCH to Supabase.
- **CF Worker:** Added `app.spinvibes.com` to ALLOWED_ORIGINS. **Needs `wrangler deploy` from caddie-worker/ to go live.**
- **Supabase:** `app_pin` column (text, nullable) added to `guide_users`. ✅ Confirmed via API.

### 2026-06-04 (session 23 — Sprint 6 complete, while Jeremy was in meeting)
- **app.spinvibes.com photos:** `_uploadAppHolePhotos()` uploads to `round-photos/app/{id}/hole-{n}-{i}.jpg` before save. `saveCompletedRound()` fixed to `async` (await was silently ignored before).
- **guide builder return user flow:** supabase-js added, `onAuthStateChange` handler, "Sign in to open it →" on intro screen, magic link → `emailRedirectTo: golf.spinvibes.com` → auto-redirect to `app.spinvibes.com?u={uuid}`.
- **Sprint 6 complete.** All auth work shipped. Apple Sign-In deferred to post-beta.

### 2026-06-05 (session 25 — Full UI redesign + backend check + roadmap update)
- **Full UI redesign shipped (pending git lock clear):** V2-2 palette (#0D1F12 header, #FFFFFF body, #3DAA6B fairway green, #D4A843 gold). Phosphor light icons in nav. Profile switcher → solid filled avatar circles (Dad=gold, Son=blue, Daughter=pink, Mom=violet, Grandma=teal). Nav active state: 2px top underline, no pill. guide-grid → vertical list (premium). exp-trigger (approach stats) → full-width hairline, no rounded corners. Grandma home fully rebuilt. All emojis stripped throughout.
- **Bug fixes in this session:** Nav My Game not inline (scoped `.page .dad-sect` etc. instead of global). Dark mode nav stayed white (hardcoded `#ffffff` in `#nav`). `--nav-h` back to 44px. Responsive overrides breaking avatar circles removed. Mom + Grandma landing card name colors fixed (#B86530 → #7F77DD, #9A8050 → #1D9E75).
- **Backend check complete:** All family round functions verified. `openFamilyModal` ✅ (was `showFamilyModal` — naming confusion in analysis, not a real bug). Tables: 10 Supabase tables, no stale Netlify URLs, SW v103/cache v149.
- **Sprint 8 — Family Round Game Modes added to roadmap.** Positioned after Sprint 7 polish, before Beta. Covers adult formats (scramble, best ball, match play, Wolf, BingoBangoBongo, Stableford, closest to pin) + kid-inclusive variants (Junior Scramble, Parents vs. Kids, Hole Challenges, Kid Birdie Bomb, Level-gated modes).
- **DEPLOY BLOCKED:** git locks in repo. Jeremy must run: `rm -f .git/HEAD.lock .git/index.lock .git/objects/maintenance.lock .git/refs/remotes/origin/main.lock` then push-all.command (or `git add -A && git commit -m "..." && git push`).

### 2026-06-07 (session 27 — Team Scramble shipped + final QA pass)
- **Team Scramble shipped (commit `52d4e38`):** Built per Jeremy's exact spec — pick teams (auto-balanced assignment, tap-a-chip to swap sides), name each team (so photos can be shared under a fun team name), then play standard best-ball scoring as a team of 2. Added `GAME_MODES.team_scramble` config, `_famTeamAssign`/`_famTeamNames` setup state + `famRenderTeamPicker()` UI, `startFamRound()` validation (each team needs ≥1 player), `famTeamScrambleBanner(h)` for live per-hole best-ball scores, and `famTeamScrambleSummaryCard()` for the round-end recap with a winner banner.
- **New share template — "Team Scramble Recap":** `_buildTeamScrambleCard()` — a dedicated canvas card shown only for team_scramble rounds in the share picker, putting team names + member names + best-ball totals + a winner ribbon front and center against the round's photo collage. Built specifically for the "fun for sharing photos" ask.
- **Final QA pass:** Re-confirmed the iOS zoom fix (global `input[type="text"]` rule raised to 16px) covers every text input app-wide including the new team-name fields — no inline overrides below 16px anywhere. Audited all photo/share templates; everything renders correctly.
- **Sprint 8 now has two shipped family game modes** (Junior Scramble + Team Scramble) — both meet the exit criterion of real point tracking that kids/family care about.
- **Repo sync note:** local working copy had diverged from a partial autosave commit (`d86efff`, made by `push-all.command` mid-session); confirmed it was a strict subset of the final Team Scramble commit and reset local `main` to match origin — no work lost.

### 2026-06-07 (session 26 — Phosphor icon flair + Junior Scramble shipped + pre-round diagnostic)
- **KID_LEVELS icon flair restored:** Replaced the 9 emoji level icons with Phosphor `ph-light` classes (backpack, golf, magnifying-glass, target, gear-six, map-trifold, scissors, crown, trophy) — these inherit CSS color so they auto-match each level's existing palette color, unlike emoji which render as fixed platform glyphs. Updated all 3 render call sites.
- **Sprint 8 scope narrowed — Junior Scramble shipped (commit `0f4bdf4`):** Per Jeremy's direction, dropped all 7 adult-only game formats from the plan (solo tracking doesn't need games — only family play does). Built and deployed: `GAME_MODES` config (5 family modes — Junior Scramble live, 4 others "Coming soon"), game-mode selector + inline how-to explainer on family round setup, bomb-drive rescue mechanic (1 per kid per 9 holes, with undo) wired into live hole play, Junior Scramble recap card on the summary screen, and additive `game_mode`/`game_mode_data` fields on `family_rounds` (backward compatible — old rounds get `null`). Meets the Sprint 8 exit criterion.
- **Pre-round diagnostic — all clear:** Full read-through of family round flow (setup → live scoring → bomb drives → save → summary → history) ahead of Jeremy's round the next day. No blocking bugs found; verified zero-kids edge case, front/back-9 boundary logic, draft persistence, legacy-round null handling, and JSON round-trip integrity for `game_mode_data`.
- SW not bumped (pending push).

### 2026-06-05 (session 24 — Sprint 7 bug blitz + daily brief + caddie chips)

**Bug fixes (all staged, need push-all.command):**
- **Dad photo root cause:** `famResizePhoto(null, 1200, file)` silently dropped every photo (img.src=null, never loads). Fixed: FileReader → `famResizePhoto(e.target.result, 1200)`. Photo buttons moved outside Details (always visible).
- **Practice rounds:** `dadStartRound()` now bypasses course requirement for practice. Defaults to "Practice Session", optional-chains all course data. Save toggle defaults OFF for test sessions.
- **updateSaveUI():** Updates both toggle visual AND button text ("Save Round" vs "Done (not saved)"). `id="dr-save-btn"` added to save button.
- **iOS zoom:** `.modal-input { font-size: 16px }` — was 0.92rem (below 16px threshold).
- **Course name in results:** `dadSearchCourse()` now shows `c.course` (e.g. "Creek + Stonehouse") in gold in each result card.
- **Modal reordered:** `renderDadModalSetup()` — Round Type + Format pills now BEFORE course search, can't be buried under results.

**Sprint 7 features:**
- **Daily brief:** 100-tip `DAILY_TIPS` library (dad:25, son:20, girl:20, mom:20, grandma:15). `renderDailyBrief(who)` date-seeded. Profile home containers added. Replaces static Quick Reminders.
- **Caddie quick-taps:** Yardage chip row (from real Jeremy distances) + 8 situation chips (Into wind, Downwind, Lay up or go?, Short-sided, Bunker, Thick rough, Par 3, My miss). Caddie msgs max-height 55vh→45vh.

**Still pending:** pill tap highlight, family share picker flow, family CARD thumbnail, Dad CARD scroll, full redesign.

*Last updated: 2026-06-05 (session 24)*

---

## SPRINT 6 PLAN — Auth (NEXT UP)

### Decisions locked
1. Kids stay as sub-profiles with PIN — no magic link for Son/Daughter
2. Auth is optional for app users — UUID link = guest mode, "Save progress" prompt nudges to sign up, no hard wall
3. Unified `rounds` table replaces 5 separate tables (dad_rounds etc.) — additive migration
4. **Order: personal app first (lowest risk), then family PWA, then guide builder**

### Step 1 — Personal app auth (app.spinvibes.com)
- Add Supabase auth JS client (`supabase.createClient`)
- Add `auth_id` column to `guide_users` (nullable — backward compatible, UUID links still work)
- Create `user_rounds` table: `id, user_id, course_name, course_par, tee_color, total_score, score_vs_par, holes (JSONB), round_type, is_practice, photos (JSONB), date_played, created_at`
- "Save your progress" soft prompt on Home after first round saved (not a wall)
- Flow: email input → `supabase.auth.signInWithOtp({email})` → click link → session
- On auth: `UPDATE guide_users SET auth_id = auth.uid() WHERE id = userId`
- Migrate localStorage rounds to `user_rounds` on first login
- Return visits: check `supabase.auth.getSession()` first → if logged in, load from Supabase

### Step 2 — Family PWA auth (spinvibes.com)
- Add `auth_id` to `sv_profiles`
- Jeremy gets magic link login (replaces PIN for his own My Game access)
- Kid PINs stay — stored on `kid_profiles` table, not sessionStorage
- Create `kid_profiles` table: `id, family_id, name, role, level, activity_points, badges (JSONB), sessions (JSONB), notes`
- Migrate localStorage kid data → `kid_profiles` (one-time script)
- Create unified `rounds` table with `player_key` column
- Migrate existing round tables → `rounds` (one-time script, keep originals as backup)
- Add RLS: `auth.uid() = user_id` on rounds, `family owner = auth.uid()` on kid_profiles

### Step 3 — Guide builder (golf.spinvibes.com)
- "Already have an account?" login option at wizard start
- Post-wizard: if authenticated → link guide_users.id to auth.uid() automatically
- Profile pre-fills from existing data on return visit

### New Supabase tables needed
- `profiles` — id (FK auth.users), family_id, role, name, hand, skill, goal, bag, distances
- `families` — id, owner_id, name
- `kid_profiles` — id, family_id, name, role, level, points, badges, sessions, notes
- `user_rounds` — unified round storage with user_id
- Add `auth_id` column to: `guide_users`, `sv_profiles`

### Migration strategy (additive, not destructive)
- Phase 1: Add new tables + auth_id columns. Nothing breaks.
- Phase 2: Add RLS policies. Test before enabling.
- Phase 3: Migrate data with scripts. Verify completeness.
- Phase 4: Remove old tables only after Phase 3 fully verified.
