# SpinVibes Golf — Roadmap & Architecture Plan

> **⚠️ LIVING DOCUMENT — KEEP THIS UPDATED**
>
> This roadmap is the single source of truth for where the SpinVibes Golf app is headed. **Update it every time we make meaningful tweaks to the web app** — changes to the data model, new features, renamed pages, refactored modules, scope changes, etc. A quick note in the Changelog section at the bottom is enough. If we don't maintain it, it becomes worse than useless.

---

## 0. The Core Positioning (ALWAYS FIRST)

**SpinVibes is not another single-player golf improvement app.**

The tagline: **"Learn to golf with your family. Make memories on the course. Get better together."**

Every major competitor (18Birdies, Arccos, Golfshot, SwingU, Hole19, The Grint) treats golf as an individual sport — one profile, one handicap, one journey. Nobody builds for the family that plays together. That's the white space SpinVibes owns.

**The three defensible differentiators:**

1. **Family-first, not player-first** — multi-profile, shared rounds, family leaderboard, range sessions together. No competitor to displace.
2. **Your distances, not average distances** — caddie and recommendations use confirmed carry distances. The "whoa" moment.
3. **Economic accessibility** — built for range, sim, backyard, living room. Not just $150 rounds and Trackman owners.

**Why this works long-term:** Single-player golf apps churn when the player loses motivation. Family apps don't — you'd be pulling your kids off it too. The social layer IS the retention mechanism.

**Dad still benefits from using SpinVibes alone** — the round tracking, caddie, approach stats, and range planning are genuinely better for his specific game than generic apps. But the family dimension makes it irreplaceable.

---

## 1. The Headline

**Goal:** turn SpinVibes Golf from Jeremy's personal pocket guide into a family golf app that anyone can download and use.

**Framework (decided):**

- **Frontend:** keep the existing single-HTML, vanilla-JS web app. Don't rewrite.
- **Package:** wrap with **[Capacitor](https://capacitorjs.com)** when ready to ship. Capacitor adds a Swift shell around the web code → real native iOS app without a rewrite.
- **Backend:** **Supabase** — Postgres + Auth + RLS + realtime. Already in use.
- **Auth:** Supabase Auth with email + **Apple Sign-In** (required by App Store).
- **Offline:** service worker for cached UI. Critical on a golf course.
- **Monetization (future):** RevenueCat + StoreKit. Not a near-term concern.

---

## 2. Current State (as of May 2026)

**What exists:**
- `spinvibes-golf/src/` (12 section files, built via `build.sh` → `index.html`)
- Pages: Home, Range, Stretch, Short Game, Caddie, My Game (per profile)
- Profiles: Dad (full), Son (partial), Daughter (just for fun), Mom (placeholder), Grandma (placeholder)
- Supabase: `dad_rounds`, `son_rounds`, `girl_rounds`, `mom_rounds`, `grandma_rounds`, `family_rounds`
- Family scorecard with per-hole photo capture (in-memory only, not persisted)
- Club suggestion system with GPS + manual yardage
- PGA coaching reference (`pga-coaching-reference/`) — full age × skill matrix

**Jeremy's best score:** 92 (Creek + Stonehouse, Sage tees, May 22 2026)

**Known technical debt:**
- No real auth — PIN-only
- No row-level security
- Per-device localStorage for club averages
- Dad/Son code paths duplicated
- All personalization hardcoded for Jeremy
- Course list static and Temecula-only

---

## 3. Sprint History

### Sprint 1 — Stable Foundation ✅ COMPLETE (2026-05-22)
- Nav bar fixed to `position:fixed;bottom:0`
- Dad achievements (`renderBadges`) fixed
- File split: `index.html` → 12 `src/` files + `build.sh`
- `v1.0-stable` git tag pushed

### Sprint 2 — Master Coaching Reference ✅ COMPLETE (2026-05-22)
- `pga-coaching-reference/` folder: 10 universal reference files + 9 profile cards
- Full age × skill matrix (toddler through getting-back-out-there)
- Jeremy and Grandma profiles fully detailed

### Sprint 3A — Round Intelligence + Range Polish ✅ COMPLETE (2026-05-25)
- **7-Wood suggestion fix** — removed from exclusion list; now suggested for 170+ yd approaches and layups
- **Slider direction fix** — club chips now display LW (left) → 7-Wood (right), matching slider direction (30 = left, 250 = right)
- **Best score regulation-only** — `isRegulationRound()` filters rounds with `course_par < 60`; best/avg only count 18-hole regulation rounds. Par-3 and 9-hole rounds tagged visually in history.
- **Legacy cards removed** — duplicate hardcoded round cards gone; all history from Supabase
- **Per-club swing tips** — `clubNote()` now returns a specific swing tip for every club in the bag (Driver through LW)
- **Range "Today's Focus" card** — pick 1-2 things to work on per session, saved to localStorage

---

## 4. Upcoming Sprints

### Sprint 3B — Round Type + Mobile Fixes ✅ COMPLETE (2026-05-25)
Priority items:

**Round type differentiation:**
- Add `round_type` dropdown in round entry modal: "18 holes (regulation)" / "9 holes" / "Par-3 / Executive course" / "Range session"
- Store as new column in `dad_rounds` Supabase table (add via SQL editor)
- Use for filtering best score (more reliable than inferring from `course_par`)
- Show round type label on history cards

**Per-hole stroke counter (mobile fix):**
- Investigate and fix the per-hole `+/−` stroke counter on iPhone
- Ensure the footer is sticky, accessible above the home indicator
- Consider whether a persistent floating counter overlay is needed

**Known round cleanup:**
- Welk Oaks rounds (Apr 19 / May 10) — already tagged as par-3 via course_par inference; verify correct
- Apr 12 Stonehouse 9-hole (48) — already in Supabase; legacy card removed; verify not duplicated
- Delete duplicate "test" son round (Apr 19, course "test", score 110)

---

### Sprint 4 — Kids Leveling System ✅ COMPLETE (2026-05-25)

**The concept:** gamify progression for kids with a level system. As they develop, new content and complexity unlocks — just like a video game.

---

#### Level Structure (FINAL — decided 2026-05-26)

| Level | Name | Emoji | Who | Core Focus |
|-------|------|-------|-----|------------|
| 1 | Just for Fun | 🌟 | Daughter (age 5), brand-new juniors | Make contact, celebrate every shot, zero rules |
| 2 | Getting the Hang of It | ⚡ | Son (age 8), consistent hitters | Basic swing mechanics, count total score, intro to rules |
| 3 | Learning the Game | 🎯 | Motivated juniors | Full stats, approach tracking, score vs par, real strategy |
| 4 | Getting Serious | 🏆 | Teen / serious junior | Full Dad-level complexity, tournament mindset |

---

#### What Changes at Each Level (FINAL)

**Level 1 — Just for Fun**
- Range: "Make It Move" card — celebrate every contact, no corrections, fun emojis
- My Game: sticker-style badges only, no stroke counting, no history pressure
- Short Game: "Try it!" prompts — simple chip/putt challenges, no technique
- Scoring: optional, not shown in recap unless account holder enables it
- Tone: pure celebration. Every swing is a win.

**Level 2 — Getting the Hang of It**
- Range: "Contact Challenge" — basic ball position cues, one swing thought per session
- My Game: total score per round, basic badges, round history card (score only, no per-hole)
- Short Game: technique intro — grip, setup, one chipping drill, one putting drill
- Scoring: total score tracked, displayed as "X shots today"
- Tone: encouraging and playful, but starting to build real habits

**Level 3 — Learning the Game**
- Range: Full phase structure (warmup / irons / scoring clubs / finisher), junior swing cues, 1–2 focus areas, stats-informed suggestions
- My Game: unlocks per-hole score tracking, score vs par per hole, putting stats, approach tracking, fairways hit — junior version of Dad's stats page
- Short Game: full drill library with technique explanations, course strategy tips (when to chip vs pitch vs putt from fringe)
- Strategy tab: simplified — basic course management, layup vs go decisions, par-3 tips
- Scoring: real hole-by-hole scoring, score vs par displayed
- Tone: serious but fun. Real feedback, real growth.

**Level 4 — Getting Serious**
- Everything Dad has — full stats, caddie access, approach planning, round reflection
- Range: same as Dad's range plan (add AI-suggested focus from last round)
- Tone: peer-level with Dad. Tournament ready.

---

#### Level-Up Triggers (FINAL)

Triggers are a combination of round count + skill milestone. The app flags readiness — the **account holder** (not "Dad" — moms, grandparents, any caretaker) makes the final call and taps Promote.

| Transition | Auto-flag fires when… | Account holder approves? |
|------------|----------------------|--------------------------|
| L1 → L2 | 3 rounds played | ✅ Always |
| L2 → L3 | 5 rounds + first par logged | ✅ Always |
| L3 → L4 | 8 rounds + first birdie logged | ✅ Always |

**Language note:** All UI text uses "account holder" approval framing — never "Dad". The promote button and confirmation dialog should be warm and inclusive.

---

#### Implementation Status
- Level cards, progress bars, promote button, confetti ceremony: ✅ DONE (Sprint 4)
- Range level badges: ✅ DONE
- Per-level content changes (Range, My Game, Short Game): ⬜ Sprint 4B / Sprint 5 refinement
- Skill milestone tracking (first par, first birdie auto-detection): ⬜ Sprint 4B
- Account holder language audit (rename "Dad-only" → account holder): ⬜ Sprint 4B

---

### Sprint 5 — Family Memories + Social Sharing

**The concept:** capture real memories from rounds and share them. This is the emotional core of the app — families building a story together on the course.

---

#### Decisions (FINAL — 2026-05-26)

**Photo storage:**
- Photos stored in **Supabase Storage** (private bucket, signed URLs)
- Private by default — only accessible to the family
- Account holder can opt-in to make individual photos shareable (per-photo, explicit toggle)
- Future (lower priority): VistaPrint-style merch integration — print photos on balls, canvas, cards

**Sharing formats — multiple card templates, account holder picks:**
1. **Full scorecard + image gallery** — complete hole-by-hole scorecard with round photos tiled
2. **Hole image + scorecard overlay** — a single hole photo with the scorecard laid over it
3. **Course logo / course look** — stylized card with course name, date, score vs par, SpinVibes branding (no photo needed)
4. **Hole badge card** — single photo with hole number and score badge ("Birdie! · Hole 7")
5. **App overlay only** — any photo with just the SpinVibes app branding overlay

All formats export as PNG via `canvas` API → shared via Web Share API (native sheet on mobile: Instagram, Messages, etc.)

**Course data (user-submitted scorecard photo approach):**
- User can photograph a physical scorecard and upload it to the course database
- Available to all users once approved
- Future research: proper course API (greens, bunkers, slope data) — look at golfbert, golfcourseapi, etc.

**AI range suggestions:**
- Caddie analyzes last round stats and suggests 1–2 focus areas for next range session
- Suggestion shown on Range tab with brief rationale ("Your approach shots from 100–130 yds cost you 4 strokes — work on your gap wedge")
- Account holder / player can swap it out manually if they want something different
- Default to a clear recommendation — don't ask users to choose if we can make the call for them

---

#### Build Plan

1. **Supabase Storage setup** — create `round-photos` bucket, RLS policy (private per family), signed URL generation
2. **Photo persistence** — wire `uploadRoundPhotos()` (already scaffolded) to actually write to storage; store `photo_url` per hole in `holes` JSON
3. **Recap card builder** — canvas-based PNG generator with 5 card templates (see above)
4. **Web Share API** — native share sheet on mobile; fallback to download PNG on desktop
5. **Family gallery view** — Memories section on Home tab: all round photos by date, filterable by player/course
6. **AI range suggestion** — post-round Caddie call that produces a range focus suggestion stored in localStorage

---

### Sprint 6 — Multi-User Auth + Scale

**Goal:** any family can sign up and use SpinVibes. Jeremy's family is the proof of concept.

**Implementation:**
- Supabase Auth (email + Apple Sign-In)
- Replace PIN gate with real auth
- Unified `rounds` table with `profile_id` and `user_id`
- Family onboarding: "I'm the account holder → add my family members"
- Sub-profiles for kids under account holder's account
- Cross-device sync for club averages
- Course list from Supabase (user-submitted scorecards, account holder curates)

**Monetization (DECIDED — finalize after competitive analysis):**
- Structure: one-time unlock + family member add-ons (no recurring subscription pressure)
- Founders Family tier: early adopters get a discount or lifetime access
- Referral program: free invite codes that unlock family add-ons
- Competitive analysis required before setting price points — look at 18Birdies, Arccos, Golfshot, The Grint
- Premium features: family profiles, photo storage, sharing cards, AI range suggestions
- Core solo Dad tracking: free forever

**Platform (DECIDED):**
- iOS first. Android added based on demand — Capacitor supports both from same codebase.

**Data model additions:**
- `family_id` linking account holder + child profiles
- `account_holder_id` replacing hardcoded "Dad" references

---

### Sprint 7 — iOS App Store

- Capacitor project setup around existing web app
- Native GPS (more accurate than browser geolocation)
- Apple Sign-In native flow
- App icon, splash screen, App Store assets
- Privacy policy + Terms
- TestFlight beta → App Store submission
- Android: add after iOS ships, based on user demand

---

## 5. Architecture (Target)

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
│   Storage (photos bucket)                                   │
│   Postgres with RLS                                         │
│     - profiles (user settings, handedness, goal, level)     │
│     - rounds (unified; replaces per-member tables)          │
│     - clubs (per-profile bag + logged averages)             │
│     - courses (public + user-submitted)                     │
│     - family_rounds (shared round snapshots)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Data Model (Target)

```sql
-- profiles: one per auth user, plus optional child profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  family_id uuid,                             -- links parent + kids
  display_name text not null,
  profile_type text not null,                 -- 'adult' | 'junior' | 'toddler' | 'senior'
  handedness text,                            -- 'left' | 'right'
  skill_level int default 1,                  -- 1=fun 2=learning 3=serious 4=competitive
  handicap_goal int,
  home_course_id uuid,
  created_at timestamptz default now()
);

-- rounds: unified replacement for per-member tables
create table rounds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  course_name text not null,
  course_par int,
  round_type text default 'regulation_18',    -- 'regulation_18' | '9_hole' | 'par3_exec' | 'range'
  date_played date not null,
  total_score int not null,
  score_vs_par int,
  tee_color text,
  stars int,
  is_practice boolean default false,
  reflection jsonb,
  holes jsonb not null,
  created_at timestamptz default now()
);

-- clubs: per-profile bag
create table clubs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) not null,
  name text not null,
  loft_deg numeric,
  default_carry_yds int,
  logged_carry_yds int,
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
  course_type text default 'regulation',      -- 'regulation' | 'par3' | 'executive' | 'links'
  city text,
  state text,
  is_public boolean default false,
  created_at timestamptz default now()
);
```

---

## 7. Open Questions

- [x] Kids photos — **private by default, shareable per-photo (opt-in). Stored in Supabase Storage.**
- [x] Social sharing — **5 card templates (see Sprint 5). PNG export via canvas + Web Share API.**
- [x] Level-up system — **round count + skill milestone triggers flag; account holder always approves.**
- [x] Free tier vs. paid — **one-time unlock + family add-ons. Founders Family discount. Competitive analysis before price points.**
- [x] Android — **iOS first, Android later based on demand.**
- [x] Public courses — **user-submitted scorecard photos for now. Explore proper course API (golfbert etc.) in Sprint 6.**
- [x] Range focus suggestions — **AI-suggested from last round + manual override. Default to a clear recommendation.**
- [ ] VistaPrint / merch integration — print photos on balls, canvas, scorecards. Lower priority, post-Sprint 5.
- [ ] Course API research — golfbert, golfcourseapi, or similar for slope/greens/bunker data. Sprint 6 prep.
- [ ] Kids photos consent — formalize privacy policy language for minor photos before Sprint 6 public launch.
- [ ] "Account holder" UX — audit all UI text to remove "Dad" framing. Sprint 4B / Sprint 6.

---

## 8. Changelog

**Keep this updated.** Every meaningful web-app change gets a one-line entry here with date.

### 2026-05-27 — Session 19 (round flow test + guide caddie CF Worker migration)
- Verified full round flow at TCI Oaks+Creek: PIN → course select → scoring → scorecard → caddie ✅
- Added `golf.spinvibes.com` to `ALLOWED_ORIGINS` in `caddie-worker/worker.js`
- Updated `guide.html` (spinvibes-golf-guide repo): caddie URL → CF Worker, request body → CF Worker format (`systemPrompt` + `messages[]` + `max_tokens: 60`)
- guide.html committed to GitHub — Netlify auto-deployed golf.spinvibes.com
- ⚠️ Jeremy must `npx wrangler deploy` from `caddie-worker/` to push updated CF Worker

### 2026-05-26 — Session 17–18 (bug fixes + planning)
- Fixed Start New Round crash: KID_LEVELS TDZ — moved to top of src/11-script.html (same pattern as BADGES/CLUBS)
- Fixed CADDIE_URL self-reference crash (leftover from CF deploy session)
- Added TCI — Oaks + Creek course (Oaks front 9 → Creek back 9, par 72, Sage tees)
- SW bumped: v85 / cache v131
- All roadmap open questions resolved (see Section 7)
- Leveling system fully detailed (L1–L4 content per tab)
- Sprint 5 fully scoped (6 build tasks in order)

### 2026-05-25 — Sprint 3B
- Added `round_type text DEFAULT 'regulation_18'` column to `dad_rounds` in Supabase
- Added Format pill row to round entry modal (⛳ 18-Hole / 🏌️ 9-Hole / 📍 Par-3); auto-selects on course change
- `dadStartRound()` captures format; `saveDadRoundFull()` writes `round_type` to Supabase
- `isRegulationRound()` and `roundTypeTag()` use explicit `round_type` with legacy `course_par` fallback
- SW bumped: v66 / cache v112

### 2026-05-25 — Sprint 3A
- Fixed 7-Wood suggestion: removed from exclusion list in `suggestClub()`; now available for 170+ yd approaches
- Fixed slider/chip direction: club chips now LW→7-Wood (short to long, left to right), matching slider
- Fixed best score: `isRegulationRound()` + `course_par >= 60` filter; only regulation 18-hole rounds count toward best/avg
- Added `roundTypeTag()`: visual 9-HOLE / PAR-3 badge on non-regulation round cards in history
- Removed hardcoded legacy round cards (Apr 2026 48, Dec 2025 118) — all history from Supabase
- Added per-club swing tips in `clubNote()` (all clubs from Driver to LW)
- Added Range "Today's Focus" card with chip selector and localStorage persistence
- SW bumped: v64 / cache v110

### 2026-05-22 — Sprint 1 + Sprint 2
- Sprint 1: Nav bar `position:fixed`, achievements fix, file split (12 src files + build.sh), `v1.0-stable` tag
- Sprint 2: `pga-coaching-reference/` folder — full coaching matrix (10 files + 9 profile cards)

### 2026-04-17
- Created roadmap document
- Mobile nav fit, Welk Oaks par fix, My Game lock button, clubs/lofts expander

---

*Last updated: 2026-05-26 (Sprint 4 complete — all open questions resolved, Sprint 5 scoped)*
