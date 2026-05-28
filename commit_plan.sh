#!/usr/bin/env bash
# commit_plan.sh — Two IKEAs project commit helper
#
# v6 module:
#   29: viz interactivity — all 5 viz get hover tooltips; map gets drag /
#                           scroll-zoom + clickable marker popups; bounds
#                           tightened slightly so each region zooms in more.
#
# Run: PUSH=1 bash commit_plan.sh 29

set -e
cd "$(dirname "$0")"

MODULE="${1:-}"

do_commit() {
    local msg="$1"
    echo ""
    echo "── Staged for this commit ──"
    git --no-pager diff --cached --stat
    echo ""
    git commit -m "$msg"
    echo ""
    echo "✓ Commit created."
    if [ "${PUSH:-0}" = "1" ]; then
        git push origin pengcheng
    fi
}

case "$MODULE" in

    status)
        git status
        echo ""
        git log --oneline -15
        ;;

    30)
        echo "=== Module 30: fix tooltip flicker + hit-detection off-by-padL ==="
        git add -A
        do_commit "viz: fix tooltip flicker + hit-detection across translated viz

Two bugs reported after v6:

1. Right-edge tooltip flicker
   The shared tooltip helper set its position to (cursor + offset) every
   draw frame, then used requestAnimationFrame to nudge it back inside
   the viewport. Because p5's draw() runs ~30fps and rAF fires once per
   frame, the tooltip alternated each frame between the overflowing
   position and the clamped position — visible to the user as fast
   flickering, and rightmost elements ended up effectively
   non-hoverable as the tooltip kept jumping back and forth.

   Fix: js/helpers/tooltip.js now measures the rendered tooltip
   synchronously (offsetWidth / offsetHeight) and FLIPS the anchor to
   the left of the cursor / above it when there isn't room on the right
   / below. Single layout pass per show() call, no rAF, no flicker.
   Also memoises innerHTML so re-rendering the same tooltip on every
   frame doesn't thrash layout.

2. Coda playbook chart entirely unresponsive
   Each viz translates its drawing origin by (padL, padT) for the
   canvas margin (typically padL = 80px). The hover hit-detection in
   viz_playbook / viz_timeline / viz_ecology / viz_response was
   comparing the UNTRANSLATED p.mouseX / p.mouseY against the
   TRANSLATED element coordinates — so the hit area was shifted left
   by padL relative to what was drawn on screen. Most visible in the
   playbook chart, where nodes are at discrete points: the user was
   hovering ~80px to the right of the actual hit area and nothing
   responded.

   Fix: every viz now computes mx = p.mouseX - padL, my = p.mouseY -
   padT and uses (mx, my) for hit detection. The tooltip is still
   anchored at the raw p.mouseX / p.mouseY (where the cursor actually
   is on screen).

   Playbook hit area also widened to cover the full visible label
   (intent: 'click anywhere along the row, not just the small dot')."
        ;;

    29)
        echo "=== Module 29: interactivity — tooltips for all viz + clickable map ==="
        git add -A
        do_commit "viz: interactivity across all five visualisations

New helper:
  js/helpers/tooltip.js — single floating <div> appended to <body>,
  shown/hidden by VizTooltip.show()/hide(). Each p5 viz computes hover
  state in its draw() and calls show() with HTML + sketch-local
  (mouseX, mouseY); the helper translates to page coordinates and
  clamps to the viewport.

Map (viz_map.js):
  - Bounds tightened slightly so each region zooms in further
    (NA 28-50N, -125 to -68W; EU 42-60N, -8 to 20E; EA 22-44N, 102-142E)
  - All interaction enabled: dragging, scrollWheelZoom, doubleClickZoom,
    touchZoom, zoomControl button
  - Markers are clickable (interactive: true, riseOnHover: true) and
    bound to a Leaflet popup with store name, city/country, opening
    year, closure year, format, notes, and dated source link
  - Clicking a marker pauses the auto-play timer; the year readout
    dims (.paused class) to signal that
  - Marker icon size 12 -> 14px for clearer hit area

Response (viz_response.js):
  - Hover any city row to see PTI, mortgage % income (if present),
    renter share (if present), counts of city-format open / closed /
    big-box stores in that city, and notes column

Timeline (viz_timeline.js):
  - Hover any event tile to see year, event_name, response_type,
    market, regime, short_description, and a clickable source link
    (clipped to hostname)

Ecology matrix (viz_ecology.js):
  - Hover any cell to see market name, dimension, qualitative value,
    challenge-to-IKEA level, market summary, and primary_sources

Playbook slope chart (viz_playbook.js):
  - Hover any node (either West or East column) to see the priority
    label and the West / East intensity scores with their evidence
    text side by side

Styling (css/style.css):
  - New #viz-tooltip dark-background tooltip with .tt-name / .tt-row /
    .tt-note / .tt-src variants
  - New .leaflet-popup.ikea-popup styling matching the article
    palette
  - .paused state on the year readout when auto-play is interrupted

index.html:
  - Loads js/helpers/tooltip.js before the viz modules"
        ;;

    28)
        echo "=== Module 28: viz_map — 2x2 grid (NA top, EU/EA below) ==="
        git add js/sketches/viz/viz_map.js index.html css/style.css
        do_commit "viz_map: switch to 2x2 grid (NA top, EU + EA bottom)"
        ;;

    1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27)
        echo "Module $MODULE was part of earlier rounds and is already committed."
        ;;

    *)
        echo "Usage: bash commit_plan.sh <module-number>"
        echo ""
        echo "v6 module: 29 — full interactivity (tooltips + map drag/zoom + popups)"
        echo ""
        echo "Run:  PUSH=1 bash commit_plan.sh 29"
        ;;
esac
