# SpinVibes Golf — Current Status
> **Update this at the end of every Cowork session.** This is the first thing to read when starting a new session. It answers: where are we, what's broken, what's next.

*Last updated: 2026-06-13 (session 41 — SHIPPED full family stack into app.spinvibes.com + closed the PWA↔app gap. See below.)*

---

## ✅ SHIPPED — App brought to family-PWA parity (session 41, 2026-06-13)

The "NEXT SPRINT" below is **done and far exceeded**. Over session 41 the app went from solo-only to full family parity, deployed in batches (app SW v5 → **v13**):

- **Per-member custom plans + profile switcher** — members flow in from `members`/`?fm=`, each gets a dynamic plan (age/hand/goal), age-gated kid voice. In-app add/edit/remove family (Settings → Family).
- **Family round** — one-card hole-by-hole multi-player scoring + combined recap + **canvas recap share card**. Per-member round history (`RK()` includes `activeKey`).
- **All 7 game modes** — Just for fun, Junior Scramble (bomb drives), Parents vs. Kids (age handicaps), Team Scramble, Hole Challenge, Kid Birdie Bomb, Team Captain.
- **Kid leveling** — play-based points → 9 levels (Fresh Caddie→Tour Bound), badge grid, **per-level PGA challenges** (auto-verified), **daily check-ins**, **manual grown-up level controls**.
- **Round polish (PWA-parity)** — adult achievement badges, memories photo gallery, **log a past round**, **log practice sessions**, **edit a saved round**, **caddie voice input**, **wake lock** (screen stays on), centered PLAY in PWA + app nav.
- **Honesty system** — in-app "Coming at launch" card (data-driven), now down to one item.
- **Family stats sync** — app code built (members → `family_rounds` table by guide link); **PENDING: run `spinvibes-app/family-rounds-table.sql` in Supabase**, then it's live. Until then members are local-only. Last item on the Coming-at-launch list.
- **Beta docs** — rebuilt `BETAUSERDOCS/beta-invite.html` (+ regenerated PDF/PNG) with honest live-features list; `beta-user-guide.md` aligned; new `BETAUSERDOCS/update-emails/` (template + first session email + README — **send once per session at wrap-it**, not per push); `BETAUSERDOCS/FEATURES.md` tracker.
- **Guide link** — `&fm=` appended in both wizards (belt-and-suspenders); confirmed members DO persist (live wizard `golf-guide-builder/index.html` POSTs them).

**Verification:** all JS syntax-clean; logic verified via headless-DOM (jsdom) tests for every feature; switcher / family round / game modes / kid level card screenshotted live in Chrome at mobile width.

**Open follow-ups:** (1) run the `family_rounds` SQL → verify sync → remove last Coming-at-launch item. (2) Port these app features back to iOS for parity. (3) Send the session update email (`BETAUSERDOCS/update-emails/2026-06-13-update.html`) to `guide_users` — Jeremy's manual step.

---

## 🔜 (DONE — see above) NEXT SPRINT — App Family/Kid Custom Plans (Jeremy's call, 2026-06-12)

**Goal:** In app.spinvibes.com, a beta user can add their kids, and **each kid gets a CUSTOM plan exactly like the main user** — dynamic, keyed to the kid's age/hand/skill, in the metaphor/game voice. Just like the PWA, but **not hardcoded** (PWA is fixed to Jeremy's Son/Daughter via `FAM_PLAYERS` + 32 `son-sect`/`girl-sect` blocks).

**Why:** The public app is currently **solo-only** — no family/kid/add-player/leveling/game-modes code at all. But `beta-user-guide.md` already promises testers family rounds, up to 5 profiles, kid leveling, and game modes. Mismatch a tester hits immediately.

**KEY:** the **wizard already collects family** — `create-my-guide.html` adds up to 3 members `{name, age, hand, goal}`, encodes them as the `fm` URL param (`name~age~handInitial~goal`, pipe-separated), and `guide_users` has a `members` JSON column that `guide.html` reads back (`u.members`). **The app simply never loads them.** So this is an APP-side build, not new data capture.

**Scope:**
1. **App loads family** — pull `members` from the `?u=UUID` guide_users fetch; also parse a `?fm=` param fallback (same format as guide.html `parseFM`). Belt-and-suspenders: have guide.html append `&fm=` to the app link so family always reaches the app.
2. **Profile switcher** — topbar pills (main user + each member), like the PWA. Tapping switches the active profile and re-renders Home/Range/Short Game/Strategy/Caddie/daily-thoughts.
3. **Per-member custom plan** — each member becomes a profile `{name, hand, goal, age, skill(derived from age/goal), isKid}` run through the SAME render engine as the main user. Kids get beginner content in the metaphor voice; age tier drives kid game-voice (6–8 superhero pose/squish the bug; 9+ simple analogies; PGA doc §9).
4. **In-app add/edit family (post-wizard)** — Settings → "Family": add / edit / remove members in the app itself after the guide is made (same fields as the wizard: name, age, hand, goal). Persist to `guide_users.members` (PATCH) + localStorage. So a user who skipped family in the wizard, or whose family changes, can manage it without redoing the guide.
5. **Honest "Coming at launch" list (in-app beta-status bar/list)** — a visible, always-honest list in the app of features promised but **not yet in beta**, clearly framed as "available at launch" (e.g. family rounds, game modes, kid leveling/badges, scorecard-photo round import, etc.). Goal: **shrink this list every day as features ship** while never implying something works that doesn't. Likely a card on Home or a Settings entry "What's coming." This also reconciles the `beta-user-guide.md` over-promise — guide should say these are "coming," app shows the live status.
6. **Follow-ups (later):** per-member round history + handicap, kid leveling, family round + game modes (to fully match the guide) — fold into the "Coming at launch" list until shipped.

**Honesty principle (Jeremy):** be obvious about what's promised vs. live; close the gap daily but never over-state. The in-app "Coming at launch" list is the mechanism. Until it ships, `beta-user-guide.md` Step 2 over-promises (family rounds, leveling, game modes) — trim it or ship the list.

**Discovered this session — exact data shapes (start here next session):**
- **Wizard member fields** (`create-my-guide.html` getAnswers): `{ name, age (int), hand ('right'|'left'), goal }`. Encoded into `fm` param as `encodeURIComponent(name)~age~hand[0]~goal`, pipe-separated (`generateGuide`, line ~1479).
- **⚠ Member `goal` values differ from the main user's!** Member goal `<select>` options are `fun | learn | compete | return` (create-my-guide.html ~line 1016) — NOT the main user's `break100/90/80/70`. App `GOAL` map has `fun`/`return` but NOT `learn`/`compete`. **Must map:** `learn`→`beginner`, `compete`→`break90` (or `consistency`), keep `fun`/`return`. Add labels for any unmapped keys.
- **App maps** (app index.html ~306–309): `GOAL{break120,break100,break90,break80,break70,consistency,beginner,fun,return}`, `SKILL{beginner,some,mid,low,advanced}`, `HAND{l,r,left,right}` (handles both initial + word).
- **App boot** (~335–405): `profile = rows[0]` from `GET guide_users?id=eq.UUID&select=*`. So `profile.members` IS available *if* the column is populated. Active profile pattern to add: `mainProfile`, `family[]`, `activeKey`, with `profile` pointing at the active one. Render fns (`renderHome/Range/ShortGame/Strategy/Caddie/dailyThoughtsHtml`) all key off `profile.skill/goal/hand` — switching profile + re-rendering = custom plan per member, no engine changes.
- **Per-member rounds:** make `RK()` include `activeKey` (`'sv-app-rounds-'+userId+(activeKey==='main'?'':'-'+activeKey)`) so each member gets their own round history/handicap; reload rounds on switch.
- **⚠ OPEN QUESTION:** could NOT find where the wizard persists the `guide_users` row / `members` column (no POST in create-my-guide.html, guide.html, or netlify/functions; UUID only set from `?u=`). guide.html *reads* `u.members` (line ~1835) so the column is expected. **Verify members is actually saved.** If not reliable, the robust path is: app reads `?fm=` param fallback AND have `guide.html` append `&fm=` to its app link (`getAppLink` ~line 499, currently `?u=UUID` only).
- **Kid voice depth:** app training is already metaphor-rich (beginner tier). Full age-gated kid game-voice (6–8 "superhero pose/squish the bug", 9+ analogies; PGA §9) is a follow-up; MVP = each member gets their skill/goal/hand-keyed plan + switcher.
- **Build tasks queued:** #16 load family, #17 switcher + per-member plan, #18 guide link + deploy/verify.

---

---

## App Status

| Item | Status |
|------|--------|
| spinvibes.com (PWA) | ✅ Live — GitHub Pages |
| golf.spinvibes.com (guide builder) | ✅ Live — GitHub Pages |
| Service worker | **v104 / cache v150** (bumped for redesign deploy) |
| Stable checkpoint | **`v1.0-stable`** tag on GitHub — safe rollback before file split |
| Last PWA build | Fable redesign — `index.html` 14,258 lines, JS syntax clean. **STAGED — needs push-all** |
| Supabase | ✅ Operational — 26 courses, `app_pin` + `auth_id` on `guide_users`, `user_rounds` with RLS, `round-photos` storage bucket, `sv_clubs` per-user bag |
| Caddie proxy | ✅ CF Worker live — `app.spinvibes.com` allowed |
| wrangler.toml | ✅ `account_id` set — `wrangler deploy` works without re-login |
| app.spinvibes.com | ✅ Live — GitHub Pages (`spinvibes-app` repo). SW **v2 network-first for HTML** — deploys reach installed users automatically |
| Auth emails | ✅ Custom SMTP via Resend — from **SpinVibes Golf <guide@spinvibes.com>**, scanner-proof confirm.html flow. **See `spinvibes-app/AUTH-EMAIL-SETUP.md`** — config is dashboard-only, not in code |
| **spinvibes-ios (native SwiftUI)** | ✅ **Full feature parity** — all screens + game modes built. See iOS section below. |
| push-all.command | ✅ Rewritten to temp-clone pattern — immune to FUSE git corruption |

---

## 🍎 Native iOS Track (Sprint 9 beta — Simulator pass complete 2026-06-11)

**Architecture decision:** Native SwiftUI (NOT Capacitor). Shares the same Supabase backend as the PWA. Full rationale in `ROADMAP.md` → Sprint 9.5.

**Status as of 2026-06-11 — SIMULATOR PASS COMPLETE, BETA LIVE:**

- ✅ **Data layer** — `SupabaseService.swift` live with real API calls (sign in, profile load, round fetch/save, club sync via `sv_clubs`). `Models.swift` with full bag defaults (Faktor Golf irons). Apple Sign-In + email auth wired to Supabase `auth_id`.
- ✅ **Home screen** — stats cards (best round, rounds played, current level), coaching tips carousel, daily brief
- ✅ **My Game** — round history from Supabase (live fetch), scorecard share card (canvas → UIImage → UIActivityViewController), delete round action
- ✅ **Caddie** — full multi-turn chat, yardage + situation quick-tap chips, history ≤6, max_tokens 80
- ✅ **Round flow** — hole-by-hole scoring with per-hole caddie panel, approach distance, club suggestion, hole photo capture/upload, draft persistence
- ✅ **Settings / bag** — 13-club bag editor, save to `sv_clubs` in Supabase
- ✅ **Range + Short Game** — replaced placeholder tabs with real content (drills, warm-up, putting/chipping)
- ✅ **Haptic feedback** — throughout (score stepper, level-up, game mode events)
- ✅ **Family Round** — setup flow, hole-by-hole scoring (N/A option), Just for Fun mode, Family Outing share card
- ✅ **All 8 family game modes** — Junior Scramble, Team Scramble, Parents vs. Kids, Hole Challenge, Kid Birdie Bomb, Team Captain (+ Just for Fun baseline)
- ✅ **Kid leveling system** — `KidLevelView.swift`, `KidProgressManager`, 9-level progression (L0–L8), check-in awards, badge display
- ✅ **Dad solo share cards** — Full Scorecard + Hole Highlight (canvas-drawn, native share sheet)
- ✅ **App icon** — designed and wired into Xcode asset catalog

**Fable design system — enforced and verified in Simulator (2026-06-11):**
- ✅ All nav tab titles sentence case
- ✅ No emoji in UI — player-color initial chips throughout (MyGameView, KidLevelView, FamilyRoundView)
- ✅ Round type + game mode labels stripped of emoji prefixes
- ✅ Custom tab bar: Home | Caddie | [Play↑] | Range | My Game — center Play button own slot, nothing overlapped
- ✅ Family profile pills in hero (Dad active/ringed, Son/Daughter → KidLevelView directly, Mom/Grandma visual)
- ✅ Short Game accessible via link card at bottom of Range tab
- ✅ #if DEBUG auth bypass in place for Simulator — **MUST REMOVE before TestFlight/production**

**Next on iOS roadmap (in order):**
1. **Full profiles** — every family member's profile is populated in the app (bag, skill, goal, hand). Currently only Jeremy/Dad has real data; Son/Daughter/Mom/Grandma show defaults. Needs either: (a) multi-profile entry flow, or (b) pull each member's `guide_users` record by `family_id`
2. **Remove #if DEBUG bypass** — before any TestFlight or on-device distribution
3. Apple Developer Program enrollment ($99/yr) — needed for on-device/TestFlight
4. Supabase Swift client (currently direct REST — works, not idiomatic)
5. Game Rules Library (Sprint 10)

**Key fact:** PWA and native app hit the same Supabase backend. A beta user from the PWA just signs in on iOS — no migration.

---

## Jeremy's Golf Status

| Item | Detail |
|------|--------|
| Best score | **92** — Creek + Stonehouse (both Sage), May 22, 2026 |
| Next goal | Break 90 — 3 strokes away |
| Bag | Faktor Golf combo set. Callaway driver + 7-wood · Faktor 4H + irons · Callaway Opus 50°/56°/60° wedges · Odyssey Ai-ONE #7 putter |
| Pin | 4417 |

---

## What Was Just Finished (Session 40 — June 12, training voice + daily thoughts + Best Moment + kids polish)

| Item | Result |
|------|--------|
| Training metaphor voice (app) | Range / Short Game / Strategy rewritten with visualization/metaphor across all levels (PGA doc §9 + §11), incl. "next shot is the only one that matters" reframe. Voice approved via samples. Live. |
| Daily thoughts feed (app) | New "Today" Home section, 2 date-seeded cards from an 18-tip universal pool + lefty bonus (`dailyThoughtsHtml`). Live + verified. |
| Best Moment share (app) | 3rd template `buildBestMomentCard()` — auto-picks standout hole. Full PWA share parity. Live + verified (picked birdie-with-photo). |
| Layout pass | Reviewed mobile screens; clean, no blind changes. |
| PWA kids' polish | Son chip → kid metaphor; girl "shaft lean" → "hands leading"; **Daughter Age 5→6** fixed. Already-great game cards left alone. Live + verified. |
| **Family-into-app (decided, building next)** | Wizard already collects family; app never loaded it. Jeremy: each added member gets a CUSTOM plan like the main user. See NEXT SPRINT block at top. |

SW: app v5, PWA v153.

---

## What Was Just Finished (Session 39 — June 12, app↔PWA parity + nav/overlap fixes)

> Closed the three "still open" items from the Fable session, fixed the real bottom-nav overlap, and added Short Game back buttons. All deployed + verified live (app at `?u=preview`, PWA as Dad).

| Item | Result |
|------|--------|
| Coach's Plan raw markdown | **Fixed (app)** — `mdToHtml()` renders headings/bold/italics/lists/paragraphs; `.md` styles. Only shows when a `coaching_plan` exists. |
| Handicap index tracker | **Ported to app My Game** — WHS estimate (best-N diffs × 0.96) + 8-bar sparkline. Rounds now capture tee **rating/slope** at start; only regulation-18 w/ rating+slope count. Hidden until ≥1 eligible round. |
| Scorecard OCR | **Ported to app round setup** — "OR SCAN A SCORECARD": tee pills → photo → `/parse-scorecard` → pre-fills course (pars/yardages/par/rating/slope) → Start Round. Verified live. |
| OCR editable review | **Added** — after scan, editable course name + per-hole par/yards table (live total) to fix misreads before Start Round (full PWA parity). Verified live. |
| Handicap backfill | **Added** — "+ Handicap data" chip on regulation-18 rounds missing rating/slope → sheet to enter them so they count toward the index. Verified live (3→4 eligible). |
| Caddie nav overlap | **Fixed (app)** — input row was hidden under the nav (fixed `100dvh` height inside a padded `.page`). Rebuilt as flex; input pinned above nav. Verified live. |
| Short Game dead-end | **Fixed (both)** — "‹ Range" back button atop Short Game (app `.back-chip`; PWA header button). Verified live. |
| PWA notch nav overlap | **Fixed** — `#nav` height now includes `env(safe-area-inset-bottom)` so 54px buttons stop overflowing up over content on notched phones (border-box). |
| Share sheets | Added ✕ (app); audit confirmed all other modals already have close/back. |
| Beta docs email | `jeremy.gelbaum@gmail.com` → **`spinvibespb@gmail.com`** in `beta-user-guide.md` + invite PDF/PNG (design preserved). |
| SW bumps | app v2→v3; PWA cache v151→v152 (sw v105→v106). |
| Meta backup | Was blocked by GitHub secret-scanning — live PAT in `spinvibes-meta/SESSION-START.md` redacted; backup pushes again. |

**Deferred — Security (Jeremy: "we're not big enough to worry just yet… but it'll be a big task"):** rotate the GitHub PAT (it's in plaintext in every repo's remote URL + `push-*.command`), purge it from meta git history, and do a broader secrets/auth pass. Tracked as a future sprint.

---

## What Was Just Finished (Session 38 — June 12, Beta Tester Fixes)

> First real beta feedback (Mike, Yahoo Mail) surfaced 5 production bugs. All fixed + deployed same day. Full auth/email writeup: `spinvibes-app/AUTH-EMAIL-SETUP.md`.

| Item | Result |
|------|--------|
| Wizard dead-end | `generateGuide()` hide selectors were missing `.wiz-body` — PIN/success screens rendered below the fold, wizard appeared to reset. Fixed + flow now **redirects straight to `app.spinvibes.com?u=UUID`** after save (no intermediate screen). |
| Supabase auth URLs | Site URL was default `localhost:3000`, redirect allowlist **empty** → all magic links bounced to localhost. Now `https://app.spinvibes.com` + allowlist for app/golf domains. |
| `otp_expired` on magic links | Yahoo prefetch-scanner consumed one-time tokens. New `confirm.html` (spinvibes-app) requires human tap → `verifyOtp`. Email template updated to `token_hash` link. **Never revert to `{{ .ConfirmationURL }}`.** |
| Auth email sender | Custom SMTP via Resend: **SpinVibes Golf <guide@spinvibes.com>** (was "Supabase Auth"). New dedicated Resend API key, separate from Netlify's. 30 emails/hr. |
| Light mode (app) | ☀️ button toggled non-existent CSS class. Added `body.sv-light` palette + localStorage persistence. |
| SW stale-cache trap | spinvibes-app sw.js was cache-first on HTML with never-bumped version — users would never get updates. **v2: network-first for HTML**, cache-first assets. |
| Mike rescued | Profile saved fine during the broken flow; Jeremy texted him his direct `?u=` link. |

---

## What Was Just Finished (Session 37 — June 11, iOS Simulator Pass)

### iOS Simulator pass — Fable violations fixed + beta UX additions

All changes pushed to `jgelb001/spinvibes-ios` (main). 6 commits this session.

**Fable fixes:**
- `CaddieView`, `MyGameView`, `RangeView`, `ShortGameView` — ALL CAPS nav titles → sentence case
- `MyGameView` — `kidMiniCard` emoji → player-color initial chip (ZStack/Circle pattern)
- `KidLevelView` — `playerEmoji: String` → `playerColor: Color`, `Text(playerEmoji)` → initial chip
- `FamilyRoundView` — round type labels (`"⛳ Scored"` etc.) + all 6 game mode labels stripped of emoji prefixes

**UX additions (mirrors PWA):**
- `MainTabView` — full custom tab bar replaces system TabView bar; layout: Home | Caddie | [52px kelly Play circle↑] | Range | My Game
- `HomeView` — family profile pills in ink hero card (Dad gold/active, Son blue, Daughter pink, Mom purple, Grandma teal); Son/Daughter tap → `KidLevelView` fullScreenCover directly; `KidProgressManager` instances owned by HomeView
- `RangeView` — Short Game link card at scroll bottom → `ShortGameView` fullScreenCover

**Beta signup visibility:** `guide_users` table in Supabase → sort by `created_at` desc. Email field in guide wizard already required-feeling. Beta distributed via PDF.

---

## What Was Just Finished (Session 36 — June 11, Fable Visual Redesign)

### ⚠️ STAGED, NOT YET DEPLOYED — run `push-all.command` to go live

Full visual identity redesign across the family PWA + iOS design tokens. Kills the "Claude-built app" template look (pending bug → CLOSED).

**The system (chosen by Jeremy after 4 direction rounds + his 18Birdies/TheGrint/Golfir references):**
- Forest-ink chrome `#13291C` (topbar, landing, PWA status bar) · white working screens · whisper-green tiles `#F3F7F3`
- ONE kelly green `#249657` = primary action only (PLAY button, CTAs, Search, selected states)
- Gold is now **Dad's color**, not the app brand — his pages keep gold, family/app chrome runs green + ink
- Typography: Bebas Neue + Outfit GONE everywhere (incl. canvas share cards + SVG badges). Archivo 400–800 only — heavy/tight titles + numbers, sentence case, caps only for tiny labels

**What changed:**
- Landing → dark-ink roster: all 5 players equal full-width stacked cards (per Jeremy)
- Bottom nav → 54px, sentence case, active = ink + weight, NEW center kelly **PLAY** button (`svPlay()`: dad → solo round modal, others → family round)
- Family round setup: emoji player chips → player-color initial chips, selection states gold → green, picker legacy dark-styling cleaned out
- Fixes: Course Strategy guide-card layout bug (`_sectDisp()` helper), 2 tofu glyphs, Daughter age 5→6 (×3), fam-modal label blue → ink
- Dark mode retuned to new tokens
- Rollback: old src at `spinvibes-golf/src-backup-prefable/`

**iOS (full Fable pass — all views converted):**
- `DesignSystem.swift` (full tokens: colors + on-ink player variants, SVType, cardStyle/primaryButton/statTile/inkHeader modifiers, SVAvatar/SVScoreBadge) — auto-included (folder-synced Xcode project)
- `Theme.swift` bridge: `SVColor.background`→white, `cream`→ink, `muted`→`#6B7A6E`, **`gold`→kelly `#249657`** (legacy accent slot; real Dad-gold = `Color.svDad`). SVPill now takes a `tint:` param.
- `ContentView`/`RoundFlowView` → `.preferredColorScheme(.light)`, Settings nav bar → light
- `SignInView` → ink brand screen (white+mint wordmark, kelly CTAs, translucent inputs)
- `HomeView` → ink hero band (sentence-case name), whisper-green stat tiles, quick-action grid with **Start Round as the single kelly card**
- `MainTabView` → white tab bar, ink active, muted idle icons
- `FamilyRoundView`/`KidLevelView`/`MyGameView` → scripted remap of ~250 dark-palette hexes to light tokens (dark bgs→white, cream text→ink, old green→kelly, accent gold→kelly with guards: Dad player color, bogey chip, ink-on-player-chips). Bebas custom fonts → system heavy. Player emoji → initial letters. Canvas share cards intentionally left dark (photo cards stay moody by design).
- Brace/paren balance verified on all 12 edited files. **⚠️ Needs an Xcode build + Simulator pass — sandbox can't compile Swift.**

**Build verification:** `build.sh` → 14,258 lines ✅ · JS syntax check ✅ · headless-Chromium screenshots verified (landing, Dad home, Daughter home, family setup) ✅

---

---

## What Was Finished Before That (Sessions 34–35 — June 10, Sprint 8 Final + push-all fix)

### Sprint 8 Complete — all 4 remaining family game modes shipped

**PWA (src/11-script.html → index.html):**

All 4 modes added to the game-mode selector (previously showing "Coming soon"):
- **Parents vs. Kids** (`parents_vs_kids`) — kids get handicap assist based on level (L≤1: +3 strokes, L2-3: +2, L4+: +1). Best-adjusted kid score vs. best adult score per hole. Live banner + summary card with win counts.
- **Hole Challenge** (`hole_challenge`) — per-hole side game auto-assigned by par (par 3 → closest_pin; others rotate through fewest_putts / longest_drive / hit_fairway). Winner tap-to-pick per hole. Leaderboard summary card.
- **Kid Birdie Bomb** (`kid_birdie_bomb`) — each kid has a personal target (par + offset). Auto-detects "bomb" from live scores. Summary card computes from holes array, no stored state.
- **Team Captain** (`team_captain`) — rotating hole captain (cycle through kids). Captain picks which adult's shot the team uses. `@Published captainPicks` for live reactivity. Summary shows all captain decisions.

Build verification: `index.html` 14,207 lines, Node.js syntax check clean. Committed as `3916a6c`.

**iOS (`FamilyRoundView.swift` — +699 lines):**

Same 4 modes ported to native SwiftUI using ObservableObject data classes. Key additions:
- `kidHandicapOffset()` helper reads level from `UserDefaults` (`sv-{playerKey}-level`)
- `ParentsVsKidsData`, `HoleChallengeData`, `KidBirdieBombData`, `TeamCaptainData` — all `ObservableObject` with `@Published` on mutable live properties
- 8 new Views: `PvkBanner`, `HoleChallengeBanner`, `KidBirdieBombBanner`, `TeamCaptainBanner` + 4 summary card views
- `startRound()` initializations + `save()` `gameModeData` + `validate()` guards all wired

Also: club defaults in `Models.swift` updated to Faktor Golf combo set (replaced Takomo/Vice Boost).

### push-all.command rewrite (session 35)

Old pattern (`git pull --rebase + git push` on FUSE-mounted repos) was failing with "could not parse HEAD" and remote-rejection errors. Rewritten to temp-clone pattern:
1. `git clone $GH/repo.git /tmp/sv-push-$$`
2. `rsync -a --delete --exclude='.git/'` from local source into clone
3. `git add -A && git commit && git push origin main`
4. Cleanup `/tmp/sv-push-$$`

Credentials extracted at runtime from existing local `spinvibes-golf` remote URL (no hardcoded token — avoids GitHub push-protection rejection). Self-healing: the script rsyncs itself on every run, so it stays current across all repos.

---

## What Was Just Finished Before That (Sessions 29–33 — June 7–9, iOS Full Build)

### Session 33 — Supabase Swift client live
- `SupabaseService.swift` replaced all mock/stub data with real REST API calls
- Sign in, profile load, round history, round save, club load/save all hitting live Supabase
- Auth token stored in `UserDefaults`, refreshed on boot

### Sessions 31–32 — Kid leveling + share cards + app icon
- `KidProgressManager.swift` — reads/writes `UserDefaults` (`sv-{key}-level`, `sv-{key}-points`), check-in awards, badge definitions
- `KidLevelView.swift` — full level card with progress ring, badge grid, level-up animation
- Dad solo share cards — canvas-drawn Full Scorecard (hole grid, golf notation) + Hole Highlight, native share sheet
- App icon — SpinVibes Golf green/gold design, all sizes wired into `Assets.xcassets`

### Sessions 29–30 — iOS polish sweep
- Stats + coaching cards on `HomeView` (best round, rounds played, daily tips)
- Scorecard share flow in `MyGameView` (canvas → `UIImage`, `UIActivityViewController`)
- Range + Short Game real content (replaced placeholder Text views)
- Quick-tap caddie chips (yardage row + 8 situation chips, mirrors PWA)
- Haptics throughout (`UIImpactFeedbackGenerator`, `UINotificationFeedbackGenerator`)
- Camera capture for hole photos (`UIImagePickerController` sheet, `PHPhotoLibrary` permission)

---

## What Was Just Finished Before That (Sessions 26–28 — June 7, Sprint 7 + Sprint 8 Kickoff)

### Session 28 — Pre-beta cleanup (last pure PWA session)
Fixed 3 real bugs: iOS pill `:active` highlighting, Dad CARD scroll bleed (CSS transform/containing-block root cause), Temecula Creek Sage tee data injection.

### Session 27 — Team Scramble shipped
Full team setup (auto-balance, tap-to-swap, custom names), best-ball per-hole + cumulative summary, dedicated "Team Scramble Recap" share card.

### Session 26 — Junior Scramble shipped + UI redesign
Junior Scramble: bomb-drive mechanic (1 per kid per 9), live banner + summary recap. UI redesign: Phosphor icons, dark green header (`#0D1F12`), gold/green palette, avatar colors per player.

---

## Current Sprint — Sprint 9 (Beta, Active)

Beta is live. PWA at `app.spinvibes.com` + `golf.spinvibes.com`. iOS Simulator pass complete.

**Sprint 9 checklist:**
- [x] Fable visual redesign — PWA + iOS
- [x] iOS Simulator pass — all Fable violations fixed
- [x] Center Play button + profile pills in iOS
- [x] Nav bugs fixed (kid profile pills → KidLevelView directly)
- [ ] 3 families log a round and come back the next week ← **exit criterion**
- [ ] Iterate on beta feedback as it comes in

**Next on iOS (Sprint 9 ongoing):**
1. **Full profiles** — all family members have real data in the app (bag, skill, goal, distances). Requires `family_id` link in `guide_users` or a multi-profile entry flow.
2. Remove `#if DEBUG` auth bypass before any on-device distribution
3. Continue fixing nav bugs as surfaced

---

## Sprint Roadmap (quick ref)

| Sprint | Goal | Status |
|--------|------|--------|
| 1 | Stable foundation — layout, file split | ✅ DONE |
| 2 | Master Coach Reference (age × skill matrix) | ✅ DONE |
| 3 | Profile settings editing in-app | ✅ DONE |
| 4 | Auto best-round · Caddie → Cloudflare | ✅ DONE |
| 5 | Guide → app.spinvibes.com bridge + personal PWA | ✅ DONE Jun 3 |
| 6 | Multi-user auth + PIN gate + real Supabase profiles | ✅ DONE Jun 4 |
| 7 | UI/UX Polish + Redesign | ✅ DONE Jun 7 |
| 8 | Family Round Game Modes (all 8 modes, PWA + iOS) | ✅ DONE Jun 10 |
| 9 | Beta — real families, real feedback | **⬅ CURRENT** — beta live, iOS Simulator pass done |
| 9.5 | Native iOS build (parallel) | ✅ Simulator pass complete Jun 11. Next: full profiles |
| 10 | iOS App Store | Queued — after Sprint 9 beta settles |

---

## Known Issues / Cleanup Items

| Item | Status |
|------|--------|
| Faktor irons — confirm distances at range | ⏳ In-hand, need range session to dial in yardages |
| 6-iron ball position | ⏳ High dispersion May 26 — reconfirm next range session |
| Caddie `max_tokens: 80` | Watch for truncation on complex asks |
| Hard reload after SW bump | Chrome: Cmd+Shift+R |
| App visual identity | Still open — distinct from other Claude-built apps. Defer to Sprint 9.5 polish if beta goes well. |

---

## File Structure Quick Reference

**Never edit `index.html` directly — it's generated by `build.sh`.**

| File | What it is |
|------|-----------|
| `spinvibes-golf/src/` | **Edit here** — 12 section files that build index.html |
| `spinvibes-golf/index.html` | GENERATED — do not edit directly |
| `spinvibes-golf/sw.js` | Service worker — bump version on every deploy |
| `spinvibes-golf/build.sh` | Concatenates src/ → index.html |
| `spinvibes-ios/SpinVibesGolf/` | Native SwiftUI Xcode project |
| `push-all.command` | Double-click → builds PWA + pushes all 5 repos |
| `golf-guide-builder/index.html` | Guide builder wizard |
| `golf-guide-builder/guide.html` | Guide renderer |
| `caddie-worker/index.js` | CF Worker caddie proxy |
| `pga-coaching-reference/` | Modular coaching knowledge base |
| `golf-reference.md` | Jeremy's bag, yardages, courses, round history |
| `ROADMAP.md` | Full architecture, sprint plan, changelog |
| `CURRENT-STATUS.md` | This file |

---

## Hosting & Infrastructure Quick Reference

| Service | What | Detail |
|---------|------|--------|
| GitHub Pages | spinvibes.com | Repo: `jgelb001/spinvibes-golf` |
| GitHub Pages | golf.spinvibes.com | Repo: `jgelb001/spinvibes-golf-guide` |
| GitHub Pages | app.spinvibes.com | Repo: `jgelb001/spinvibes-app` |
| GitHub (private) | Native iOS | Repo: `jgelb001/spinvibes-ios` |
| GitHub (private) | Docs backup | Repo: `jgelb001/spinvibes-meta` |
| Supabase | Database + Auth + Storage | `https://zairvjyiwhajsulefyoi.supabase.co` |
| Cloudflare Workers | Caddie proxy | `spinvibes-caddie` worker |
| GoDaddy | DNS | Manages spinvibes.com, golf.spinvibes.com, app.spinvibes.com |
| Resend | Email | guide@spinvibes.com |

**Rollback to stable:** `git checkout v1.0-stable` inside `spinvibes-golf/`
