# SpinVibes Golf — Current Status
> **Update this at the end of every Cowork session.** This is the first thing to read when starting a new session. It answers: where are we, what's broken, what's next.

*Last updated: 2026-05-26 (session 17 — Start New Round fixed, TCI Oaks+Creek added)*

---

## App Status

| Item | Status |
|------|--------|
| spinvibes.com (PWA) | ✅ Live — GitHub Pages |
| golf.spinvibes.com (guide builder) | ✅ Live — GitHub Pages |
| Service worker | **v85 / cache v131** |
| Stable checkpoint | **`v1.0-stable`** tag on GitHub — safe rollback before file split |
| Last commit | Sprint 4: kids leveling system — level cards, progress bars, confetti ceremony, range badges |
| Supabase | ✅ Operational |
| Caddie proxy | ✅ Live at `spinvibes-golf.netlify.app/.netlify/functions/caddie` |
| Netlify | ⚠️ Credit limit resets ~June 1. Caddie function still live |

---

## Jeremy's Golf Status

| Item | Detail |
|------|--------|
| Best score (regulation 18h) | **92** — Creek + Stonehouse (both Sage), May 22, 2026 |
| Next goal | Break 90 — 3 strokes away |
| Bag | Callaway Driver + 7-wood. Vice Boost 4H + irons (Takomo still arriving). Callaway Opus 50°/56°/60° wedges. Odyssey Ai-ONE #7 putter ⚠️ weights too heavy — returning to lighter config |
| Pin | 4417 |

---

## What Was Just Finished (Session 17 — May 26, 2026)

### Critical Bug Fix: Start New Round + TCI Course ✅

| Fix | What changed |
|-----|-------------|
| Start New Round broken | Root cause: `KID_LEVELS` declared mid-file (~line 2856) but called by `updateRangeLevelBadge()` at init (~line 5885). Script crashed → `_dadRound` never initialized → `openDadModal()` threw TDZ error on every tap |
| KID_LEVELS moved to top | Same pattern as BADGES/CLUBS fix. Now declared right after CLUBS, before any init code |
| CADDIE_URL self-reference | `const CADDIE_URL = CADDIE_URL` (left over from CF deploy session) was crashing entire script on load — fixed to correct Netlify URL |
| TCI — Oaks + Creek | New course added: Oaks front 9 → Creek back 9, par 72, Sage tees, per-hole yardages |
| SW bumped | v85 / cache v131, BUILD_ID v35 |

---

## What Was Just Finished (Session 16 — May 25, 2026)

### Session 16 — Housekeeping + Handoff ✅
- Sprint 4 git commit confirmed pushed by Jeremy
- `round_type` column in `dad_rounds` verified via Supabase REST API — all rows returning `regulation_18` ✅
- Dark mode HTML + PDF (v2) saved to Golf folder (`spinvibes_roadmap_strategy_dark_v2.html` + `.pdf`)
- Photo/Supabase Storage infrastructure reviewed — `uploadRoundPhotos()` already wired for family rounds
- Sprint 5 scoped and ready to start in new Cowork task

---

## What Was Just Finished (Session 15 — May 25, 2026)

### Sprint 4 — Kids Leveling System — COMPLETE ✅

| Feature | What changed |
|---------|-------------|
| Level cards | Son (default L2) + Daughter (default L1) pages show level badge, name, description, progress bar toward next level |
| PROMOTE button | Dad-only promote button with confirm dialog — deliberate moment, not accidental |
| Auto-flag | Toast fires once when round threshold is hit ("Son is ready for Level 2!") — Dad still approves |
| Level Up ceremony | Full-screen confetti burst, bouncing emoji, new level name, "Let's Go!" dismiss |
| Range level badges | Son + Daughter range headers show current level pill, updates live |
| Level thresholds | L1→2: 3 rounds · L2→3: 5 rounds · L3→4: 8 rounds |
| SW bumped | v67 / cache v113 |

---

## What Was Just Finished (Session 14 — May 25, 2026)

### Sprint 3B — COMPLETE ✅

**Code changes shipped:**

| Fix | What changed |
|-----|-------------|
| Format pills in round entry modal | New "Format" pill row: ⛳ 18-Hole / 🏌️ 9-Hole / 📍 Par-3. Auto-selects based on chosen course par (≤36 → 9-Hole, ≤58 → Par-3, else 18-Hole). |
| `round_type` stored in Supabase | `dadStartRound()` captures selected format, `saveDadRoundFull()` includes `round_type` in saved object. Column `round_type text DEFAULT 'regulation_18'` added to `dad_rounds`. |
| `isRegulationRound()` updated | Checks `round_type === 'regulation_18'` first; falls back to `course_par >= 60` for legacy rounds. |
| `roundTypeTag()` updated | Uses explicit `round_type` field; falls back to par inference for legacy rounds without the field. |
| Duplicate son round | Already deleted — son_rounds clean (only 2 Welk Oaks rounds remain). |
| Investor overview PDF | 4-page dark-themed PDF: Strategy / Roadmap / Market / Investor View. Saved to Golf folder. |
| SW bumped | v66 / cache v112 |

---

## What Was Just Finished (Session 13 — May 25, 2026)

### Sprint 3A — COMPLETE ✅

**Code changes shipped:**

| Fix | What changed |
|-----|-------------|
| 7-Wood suggestion | Removed from `suggestClub()` exclusion list. Now suggested for 170+ yd approaches and layups. |
| Slider/chip direction | Club chips reversed to LW→7-Wood (low→high distance, left→right), matching slider. |
| Best score regulation-only | `isRegulationRound()` helper (course_par >= 60). Best/avg only count regulation 18h rounds. |
| Round type tags | `roundTypeTag()` adds "9 HOLES" / "PAR-3" badge on non-regulation history cards. |
| Legacy cards removed | Hardcoded Apr-26 (48) and Dec-25 (118) cards gone. All history from Supabase. |
| Per-club swing tips | `clubNote()` returns specific swing tip for every club (Driver through LW). |
| Range Focus card | "Today's Focus" card at top of Dad Range tab. Pick 1–2 focus areas, saved to localStorage. |
| ROADMAP.md | Full rewrite with 7-sprint plan, kids leveling detail, family memories/social plan, positioning. |

---

## File Structure (EDIT src/ FILES — never index.html directly)

| File | Contents |
|------|----------|
| `src/00-head.html` | All CSS, `<head>`, variables |
| `src/01-landing.html` | Supabase script, landing page, app shell, topbar, pages open |
| `src/02-page-home.html` | Home tab (all 5 profiles) |
| `src/03-page-range.html` | Range tab — **Today's Focus card added at top of Dad section** |
| `src/04-page-stretch.html` | Stretches tab |
| `src/05-page-shortgame.html` | Short Game tab (all 5 profiles) |
| `src/06-page-dad-progress.html` | Dad My Game page + round entry modal |
| `src/07-page-caddie.html` | Caddie tab |
| `src/08-page-strategy.html` | Strategy tab |
| `src/09-pages-mygame.html` | Son/Girl/Mom/Grandma progress pages |
| `src/10-nav.html` | Bottom nav bar + family scorecard modal |
| `src/11-script.html` | All JavaScript — **most logic changes go here** |

`push.command` runs `build.sh` automatically.

---

## Next Up — Sprint 5: Family Memories + Social Sharing

**Goal:** capture real memories from rounds and make them shareable.

**Key tasks:**
1. Persist photos to Supabase Storage (image bucket with signed URLs) — currently stored in memory only
2. Shareable round recap card — canvas-generated PNG with scorecard overlay, course, score vs par, SpinVibes branding
3. Web Share API — native share sheet on mobile (Instagram, Messages, etc.)
4. Family gallery view — all round photos by date on the family round history

---

## Sprint Roadmap (quick ref)

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Stable foundation — layout, file split | ✅ DONE |
| 2 | Master Coach Reference (age × skill matrix) | ✅ DONE |
| 3A | Round intelligence + Range polish | ✅ DONE |
| 3B | Round type differentiation + mobile stroke fix | ✅ DONE |
| 4 | Kids leveling system (Level 1→4 progression) | ✅ DONE |
| 4 | Kids leveling system (Level 1→4 progression) | ✅ DONE |
| 5 | Family memories + social sharing (photos, recap cards) | **← YOU ARE HERE** |
| 6 | Multi-user auth + real Supabase profiles + family onboarding | Queued |
| 7 | App Store via Capacitor | Queued |

---

## Known Issues / Cleanup Items

- **Putter weights** — 60g total too heavy. Update when Jeremy confirms new config.
- **Takomo irons** — arriving ~4–5 weeks from May 17. Update CLUBS when confirmed.
- **7-wood carry** — 180–195 yds estimated, needs range confirmation.
- **SW (56°) + LW (60°) distances** — in bag; confirm carry at range, update "Estimated" → "Confirmed".
- **Auto best-round** — now dynamically computed from Supabase (regulation rounds only). ✅

---

## Key Files Quick Reference

| File | What it is |
|------|-----------|
| `spinvibes-golf/src/` | **Edit here** — 12 section files that build index.html |
| `spinvibes-golf/index.html` | GENERATED — do not edit directly |
| `spinvibes-golf/sw.js` | Service worker — **bump version on every deploy** |
| `spinvibes-golf/build.sh` | Concatenates src/ → index.html |
| `push.command` | Double-click to build + push PWA → spinvibes.com |
| `golf-guide-builder/index.html` | Guide builder wizard |
| `golf-guide-builder/netlify/functions/caddie.js` | Caddie proxy + system prompt |
| `push-guide.command` | Double-click to push guide → golf.spinvibes.com |
| `pga-coaching-reference/` | Coaching knowledge base (Sprint 2) |
| `golf-reference.md` | Jeremy's bag, yardages, courses, round history |
| `ROADMAP.md` | Full architecture, sprint plan, changelog |
| `CURRENT-STATUS.md` | This file |

---

## Hosting & Infrastructure Quick Reference

| Service | What | Detail |
|---------|------|--------|
| GitHub Pages | spinvibes.com | Repo: `jgelb001/spinvibes-golf` |
| GitHub Pages | golf.spinvibes.com | Repo: `jgelb001/spinvibes-golf-guide` |
| Supabase | Database | `https://zairvjyiwhajsulefyoi.supabase.co` |
| GoDaddy | DNS | Manages spinvibes.com + golf.spinvibes.com |
| Netlify | Caddie function only | `spinvibes-golf.netlify.app` |
| Resend | Email | guide@spinvibes.com |

**Rollback to stable:** `git checkout v1.0-stable` inside `spinvibes-golf/`
**Git lock fix:** `rm "/Users/jeremygelbaum/Documents/SpinVibes/Golf/spinvibes-golf/.git/index.lock"`
