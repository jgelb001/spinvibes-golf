#!/bin/bash
# ── SpinVibes Push All ──────────────────────────────────────────
# Temp-clone pattern — clones fresh from GitHub, rsyncs local
# changes in, then pushes. Immune to FUSE git-index corruption.
# Credentials pulled from existing local git remote (no hardcoding).
# ───────────────────────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
STAMP="$(date '+%Y-%m-%d %H:%M')"
TMPD="/tmp/sv-push-$$"
RESULTS=()

# Extract auth from existing local repo remote URL
# (avoids hardcoding token in this file)
_raw=$(git -C "$ROOT/spinvibes-golf" remote get-url origin 2>/dev/null)
if [[ "$_raw" == *"@github.com"* ]]; then
  _creds="${_raw%%@github.com*}"   # https://user:token
  _creds="${_creds##*://}"          # user:token
  GH="https://$_creds@github.com/jgelb001"
else
  GH="https://github.com/jgelb001"  # fall back to Keychain auth
fi

clone_push() {
  local label="$1"
  local repo="$2"    # GitHub repo name
  local src="$3"     # absolute path to local source dir
  local msg="$4"
  local clone="$TMPD/$repo"

  git clone --quiet "$GH/$repo.git" "$clone" 2>/dev/null || {
    RESULTS+=("❌ $label — clone failed"); return
  }
  git -C "$clone" config user.email "jeremy.gelbaum@gmail.com"
  git -C "$clone" config user.name  "Jeremy Gelbaum"

  # Sync source → clone, preserving .git/ and skipping build artifacts
  rsync -a --delete \
        --exclude='.git/' \
        --exclude='DerivedData/' \
        --exclude='.DS_Store' \
        --exclude='*.xcuserstate' \
        "$src/" "$clone/"

  git -C "$clone" add -A
  if git -C "$clone" diff --cached --quiet; then
    RESULTS+=("⬛ $label — nothing to push"); return
  fi

  git -C "$clone" commit -m "$msg $STAMP" --quiet
  if git -C "$clone" push origin main 2>/dev/null; then
    RESULTS+=("✅ $label — pushed")
  else
    RESULTS+=("❌ $label — push FAILED")
  fi
}

mkdir -p "$TMPD"
echo ""
echo "🏌️  SpinVibes — pushing all repos..."
echo "────────────────────────────────────"

# 1. PWA (spinvibes.com) — build first
echo "🔨 Building PWA..."
cd "$ROOT/spinvibes-golf" && bash build.sh
clone_push "spinvibes.com (PWA)"        "spinvibes-golf"       "$ROOT/spinvibes-golf"     "Update PWA"

# 2. Guide builder (golf.spinvibes.com)
clone_push "golf.spinvibes.com (Guide)" "spinvibes-golf-guide" "$ROOT/golf-guide-builder"  "Update guide"

# 3. Personal app (app.spinvibes.com)
clone_push "app.spinvibes.com"          "spinvibes-app"        "$ROOT/spinvibes-app"        "Update app"

# 4. Native iOS
clone_push "spinvibes-ios (Native iOS)" "spinvibes-ios"        "$ROOT/spinvibes-ios"        "Update iOS"

# 5. Meta backup — merge loose ROOT docs into meta staging dir
META_SRC="$TMPD/_meta_staging"
mkdir -p "$META_SRC"
rsync -a --exclude='.git/' "$ROOT/spinvibes-meta/" "$META_SRC/" 2>/dev/null
for f in ROADMAP.md CURRENT-STATUS.md golf-reference.md golf_courses_data.js; do
  [ -f "$ROOT/$f" ] && cp "$ROOT/$f" "$META_SRC/"
done
for d in pga-coaching-reference caddie-worker LogoImages; do
  [ -d "$ROOT/$d" ] && cp -r "$ROOT/$d" "$META_SRC/"
done
clone_push "Meta (backup)"              "spinvibes-meta"       "$META_SRC"                  "Backup meta"

# Cleanup
rm -rf "$TMPD"

echo ""
echo "────────────────────────────────────"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "────────────────────────────────────"
echo "Done — live in ~60 seconds."
echo ""
read -p "Press Enter to close..."
