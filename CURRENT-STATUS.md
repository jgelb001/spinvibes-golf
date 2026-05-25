# SpinVibes Golf — Current Status
> **Update this at the end of every Cowork session.** This is the first thing to read when starting a new session. It answers: where are we, what's broken, what's next.

*Last updated: 2026-05-25 (session 13 — Sprint 3A complete)*

---

## App Status

| Item | Status |
|------|--------|
| spinvibes.com (PWA) | ✅ Live — GitHub Pages |
| golf.spinvibes.com (guide builder) | ✅ Live — GitHub Pages |
| Service worker | **v64 / cache v110** |
| Stable checkpoint | **`v1.0-stable`** tag on GitHub — safe rollback before file split |
| Last commit | Sprint 3A: 7-Wood fix, slider direction, best score, legacy cards removed, Range focus, swing tips |
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

## What Was Just Finished (Session 13 — May 25, 2026)

### Sprint 3A — COMPLETE ✅

**Big strategy/product discussion:** family-first positioning, kids leveling, social sharing, new sprint roadmap.

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

## Next Up — Sprint 3B: Round Type + Mobile Fixes

**Priority items:**

1. **Round type dropdown in round entry modal** — "18 holes (regulation)" / "9 holes" / "Par-3 course" / "Range". Need to add `round_type` column to `dad_rounds` in Supabase SQL editor, then store on save.

2. **Per-hole stroke counter mobile fix** — Clarify with Jeremy exactly what's broken. Current theory: modal footer (+/− buttons) may be hidden behind iPhone home bar or not rendering correctly. Fix before next round.

3. **Delete duplicate "test" son round** — son_rounds table has a duplicate Apr 19 entry (course "test", score 110).

---

## Sprint Roadmap (quick ref)

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Stable foundation — layout, file split | ✅ DONE |
| 2 | Master Coach Reference (age × skill matrix) | ✅ DONE |
| 3A | Round intelligence + Range polish | ✅ DONE |
| 3B | Round type differentiation + mobile stroke fix | **← YOU ARE HERE** |
| 4 | Kids leveling system (Level 1→4 progression) | Queued |
| 5 | Family memories + social sharing (photos, recap cards) | Queued |
| 6 | Multi-user auth + real Supabase profiles + family onboarding | Queued |
| 7 | App Store via Capacitor | Queued |

---

## Known Issues / Cleanup Items

- **Per-hole stroke counter on mobile** — needs clarification from Jeremy. May be a footer visibility issue on iPhone.
- **Round type column** — needs `round_type text` added to `dad_rounds` in Supabase SQL editor.
- **Duplicate "test" son round** — delete from son_rounds table (Apr 19, course "test", score 110).
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
