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

**Level structure:**

| Level | Name | Who | Focus |
|-------|------|-----|-------|
| 1 | Just for Fun | Daughter (age 5), new kids | Make contact, celebrate everything, no rules |
| 2 | Getting the Hang of It | Son (age 8), consistent kids | Basic swing mechanics, count pars, intro to rules |
| 3 | Learning the Game | Motivated junior | Full stats, approach tracking, strategy, scoring |
| 4 | Getting Serious | Teen / serious junior | Same depth as Dad section |

**Implementation:**
- Level stored in localStorage per profile (son_level, girl_level)
- Level Up ceremony: full-screen animation + new badge unlock
- Range/Short Game/My Game content gated by level
- Badges remain at all levels — they feed the intrinsic motivation
- Son current level: 2 (consistent hitter, starting to understand scoring)
- Daughter current level: 1 (just for fun)

**Level-up triggers (examples):**
- Level 1 → 2: Complete 3 rounds, make 5 good contacts in a range session
- Level 2 → 3: First par logged, 5 rounds completed
- Level 3 → 4: First birdie, consistent scoring

**Range content changes by level:**
- Level 1: "Make It Move" — celebrate every contact, no correction
- Level 2: "Contact Challenge" + basic ball position
- Level 3: Full phase structure + swing cues + stats tracking
- Level 4: Full Dad-style range plan

---

### Sprint 5 — Family Memories + Social Sharing

**The concept:** capture real memories from rounds and share them. This is the emotional core of the app — families building a story together on the course.

**Per-hole photo/video capture (upgrade from current):**
- Currently: base64 photo stored in memory only (lost when modal closes)
- Target: persist photos to **Supabase Storage** (image bucket with signed URLs)
- Store `photo_url` alongside each hole in the `holes` JSON
- Photos visible in round recap and family history

**Shareable round recap cards:**
- After a round, generate a shareable image with:
  - Scorecard overlay (hole-by-hole or summary)
  - Course name + date + total score vs par
  - Location tag (if available)
  - Best moment / milestone highlight (e.g., "First birdie! H5")
  - SpinVibes watermark / branding
- Export as PNG via `canvas` API
- Share to Instagram, Messages, etc. via native share sheet (Web Share API on mobile, Capacitor native share when wrapped)

**Family gallery:**
- A "Memories" tab or section showing all round photos by date
- Filter by player, course, or date range
- Private by default (only family can see)

**Social tagging / overlays:**
- Course name + hole number badge on each photo
- Score badge ("Birdie!", "Par", "+2") on player photos
- "Playing with: Dad, Son, Daughter" tag

---

### Sprint 6 — Multi-User Auth + Scale

**Goal:** any family can sign up and use SpinVibes. Jeremy's family is the proof of concept.

**Implementation:**
- Supabase Auth (email + Apple Sign-In)
- Replace PIN gate with real auth
- Unified `rounds` table with `profile_id` and `user_id`
- Family onboarding: "I'm the parent → add my family members"
- Sub-profiles for kids under parent account
- Cross-device sync for club averages
- Course list from Supabase (public read, user-submitted)

**Data model additions:**
- `round_type` column in `rounds` table: `'regulation_18' | '9_hole' | 'par3_exec' | 'range'`
- `family_id` linking parent + child profiles

---

### Sprint 7 — iOS App Store

- Capacitor project setup around existing web app
- Native GPS (more accurate than browser geolocation)
- Apple Sign-In native flow
- App icon, splash screen, App Store assets
- Privacy policy + Terms
- TestFlight beta → App Store submission

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

- [ ] Kids photos — consent and privacy approach for minor photos stored in cloud?
- [ ] Social sharing — direct share vs. shareable link vs. downloadable image?
- [ ] Level-up system — dad-controlled (you unlock your kid's next level) or auto-triggered?
- [ ] Free tier vs. paid tier — one-time purchase vs. subscription? (Decide in Sprint 6)
- [ ] Android — same Capacitor project or skip for now?
- [ ] Public courses data source — scrape, partner, or grow from user submissions?
- [ ] Range focus suggestions — static list or AI-generated from last round's stats?

---

## 8. Changelog

**Keep this updated.** Every meaningful web-app change gets a one-line entry here with date.

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

*Last updated: 2026-05-25 (Sprint 3A complete)*
