# SpinVibes Golf — Roadmap & Architecture Plan

> **⚠️ LIVING DOCUMENT — KEEP THIS UPDATED**
>
> This roadmap is the single source of truth for where the SpinVibes Golf app is headed. **Update it every time we make meaningful tweaks to the web app** — changes to the data model, new features, renamed pages, refactored modules, scope changes, etc. A quick note in the Changelog section at the bottom is enough. If we don't maintain it, it becomes worse than useless.

---

## 1. The Headline

**Goal:** turn SpinVibes Golf from a personal pocket-guide into a standalone iPhone app anyone can use.

**Framework (decided):**

- **Frontend:** keep the existing single-HTML, vanilla-JS web app. Don't rewrite.
- **Package:** wrap it with **[Capacitor](https://capacitorjs.com)** (by the Ionic team) when ready to ship to the App Store. Capacitor adds a Swift shell around the web code → a real native iOS app without a rewrite. Full access to native GPS, Apple Sign-In, push notifications, HealthKit, etc.
- **Backend:** **Supabase** — Postgres + Auth + row-level security (RLS) + realtime. Already in use for rounds.
- **Auth:** Supabase Auth with email + **Apple Sign-In** (required by App Store if any other social login is added).
- **Offline:** service worker for cached UI + Supabase's offline-retry patterns. Critical because cell service on a golf course is terrible.
- **Monetization (future):** [RevenueCat](https://www.revenuecat.com) + StoreKit if/when we add a subscription tier. Not a near-term concern.

**Why not rewrite in Swift / React Native first?**
Cost. The web app already works. Every week on a rewrite is a week not validating demand. Capacitor lets us ship to TestFlight/App Store with ~a weekend of wrapping work. If the native shell ever becomes a bottleneck (which is unlikely for this kind of app), we rewrite *then* — not preemptively.

---

## 2. Current State (as of April 2026)

**What exists:**

- Single `index.html` at `/Users/jeremygelbaum/Documents/SpinVibes/Golf/spinvibes-golf/index.html`, hosted via GitHub (`jgelb001/spinvibes-golf`).
- Pages: Home, Range, Stretches, Short Game, Putting, Strategy, Dad Progress, Son Progress.
- Bottom nav (mobile) / sidebar (desktop) switches between pages.
- Supabase used for round storage: tables `dad_rounds` and `son_rounds` (separate tables per profile — this is debt).
- `localStorage` used for:
  - Club running averages (`sv-clubs`) — **device-specific, does not sync**.
  - PIN unlock flag (`sv-dad-unlocked`, `sv-son-unlocked`) — session-scoped.
  - Profile selection (`sv_profile`, etc.).
- Hardcoded:
  - User name ("Jeremy")
  - Bag spec (Vice Boost, lefty, 10.5° driver, etc.)
  - PIN `4417`
  - Course list (~10 Temecula-area courses in the `COURSES` const)
  - Club defaults with lofts (`CLUBS` const)
- Dad and Son profiles have near-duplicate code paths for rounds, modals, PIN gates, history rendering. **Big source of maintenance tax.**
- Access control = PIN overlay, not real auth. No row-level security → any client with the anon key can read all rounds.

**Known problems this creates for a real multi-user app:**

1. No real auth — PIN is trivially bypassable; Supabase anon key exposes all data.
2. No row-level security — user A could theoretically fetch user B's rounds.
3. Per-device localStorage means club averages and anything else stored there don't follow the user across devices.
4. All personalization is hardcoded — turning "this is Jeremy's app" into "this is Alice's app" requires code edits.
5. Dad/Son code duplication scales as O(profile types), not O(1).
6. Course list is static and Temecula-only.

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
- **Status:** not started.

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
- **Status:** not started.

---

## 5. Phased Roadmap

### Phase 0 — Right now: personal tool + foundation ✅ (partially)
- Web app works, personal use.
- CLUBS has lofts + display metadata.
- Lock/save button on My Game.
- Mobile nav fits on screen.
- Welk Oaks par corrected.

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
- `a07bfb8` — Clubs expander reads live averages from `localStorage` via `getClubDist()`; updated CLUBS defaults to beginner/early-mid-handicap numbers (industry-sourced); added `loft`/`display`/`wedge` metadata to CLUBS.

---

## 9. Open Questions / Future Decisions

- [ ] Do we want a free tier and a paid tier, or one-time purchase? (Affects Phase 3 planning.)
- [ ] Public courses data source — scrape, partner, or grow from user submissions?
- [ ] Offline-first sync strategy: PowerSync? Replicache? Custom? (Decide in Phase 2.)
- [ ] Android — same Capacitor project or skip for now?
- [ ] Do we want coaching content (range plans, strategy) to be shared across users or user-editable per account?
- [ ] Junior profile flow — separate account per kid, or sub-profiles under a parent?

---

*Last updated: 2026-04-17*
