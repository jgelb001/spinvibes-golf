#!/bin/bash
# SpinVibes Golf — Build Script
# Concatenates src/ section files → index.html
# Run this before every push. push.command does it automatically.
#
# NEVER edit index.html directly — it gets overwritten here.
# Edit the relevant src/ file instead:
#
#   00-head.html          CSS variables, global styles, all of <head>
#   01-landing.html       Supabase script, #landing page, #app shell open, #topbar, #pages open
#   02-page-home.html     Home tab (all 5 profiles)
#   03-page-range.html    Range tab
#   04-page-stretch.html  Stretches tab
#   05-page-shortgame.html Short Game tab (all 5 profiles)
#   06-page-dad-progress.html  Dad My Game page + round modal
#   07-page-caddie.html   Caddie tab
#   08-page-strategy.html Strategy tab
#   09-pages-mygame.html  Son/Girl/Mom/Grandma progress pages + /pages close
#   06b-page-settings.html  Settings overlay — Sprint 3 (position:fixed, outside #pages)
#   10-nav.html           #nav bar + /app close
#   11-script.html        All JavaScript + </body></html>

set -e  # exit on any error

SRC="$(dirname "$0")/src"
OUT="$(dirname "$0")/index.html"

echo "🔨 Building index.html from src/..."

cat \
  "$SRC/00-head.html" \
  "$SRC/01-landing.html" \
  "$SRC/02-page-home.html" \
  "$SRC/03-page-range.html" \
  "$SRC/04-page-stretch.html" \
  "$SRC/05-page-shortgame.html" \
  "$SRC/06-page-dad-progress.html" \
  "$SRC/07-page-caddie.html" \
  "$SRC/08-page-strategy.html" \
  "$SRC/09-pages-mygame.html" \
  "$SRC/06b-page-settings.html" \
  "$SRC/10-nav.html" \
  "$SRC/11-script.html" \
  > "$OUT"

LINES=$(wc -l < "$OUT")
echo "✅ index.html built — $LINES lines"
