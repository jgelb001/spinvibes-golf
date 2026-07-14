#!/bin/bash
# SpinVibes Golf — Build Script  ⚠️ RETIRED 2026-07-13
# ─────────────────────────────────────────────────────────────────────
# spinvibes.com is now the PUBLIC MARKETING / SIGN-UP page, hand-maintained
# directly in index.html. It is NO LONGER concatenated from src/.
#
# The old behavior (cat src/*.html > index.html) rebuilt the RETIRED family
# prototype and OVERWROTE the marketing landing. On 2026-07-02 that actually
# happened (commit f8cf73b) and nearly replaced the live site. This guard
# now refuses to clobber index.html.
#
# The prototype source lives in src/ for reference only. To edit the public
# site, edit index.html directly. To resurrect the prototype build, restore
# the old cat pipeline from git history (commit before f8cf73b) — deliberately.
# ─────────────────────────────────────────────────────────────────────

echo "⛔ build.sh is retired. spinvibes.com/index.html is hand-maintained now."
echo "   Edit index.html directly. src/ is the retired prototype (reference only)."
echo "   Nothing was overwritten."
exit 0
