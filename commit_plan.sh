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

    32)
        echo "=== Module 32: layout fixes + prose alignment with algorithmic playbook ==="
        git add -A
        do_commit "viz + prose: layout fixes + align Coda prose with algorithmic ranks

Layout fixes (visible bugs from v8 screenshots):

1. Playbook (Coda) right-column labels were being cut off at the
   canvas right edge:
     'Channel innovation (e-commerce/pla' -> ...
     'Resale & circularity (Buyback & Resel'
     'Service partnerships (assembly/planni'

   Two compounding causes:
   a) The parenthetical part of each priority_label was too long.
   b) Right-column anchor sat at W*0.70 so labels only had 30%
      of W to extend rightward.
   c) The v8 algorithm-note subtitle (newly added) was also pushed
      into the column-header band, eating ~14px of vertical space.

   Fixes:
   - scripts/compute_playbook_intensities.mjs: shorten LANES labels
     (drop the '(e-commerce/platforms)', '(Buyback & Resell)',
     '(assembly/planning)' parentheticals)
   - Regenerate playbook_priorities.csv
   - viz_playbook.js: anchors pulled in (leftX 0.30->0.34,
     rightX 0.70->0.66) so labels have +5% width each side
   - The algorithm-note moved from a second header line to a tiny
     footer line below the existing color/thickness legend — no
     longer competes with column headers

2. Ecology matrix (Act 4) column headers were rotated -30° and
   extended ~55px upward, overlapping the regime title and the
   'Warm cells = condition challenges...' subtitle.

   Fix: viz_ecology.js now uses HORIZONTAL column headers
   (textAlign CENTER, BOTTOM, 10.5px bold) anchored just above
   the matrix. Subtitle still sits 30px above headers — no
   overlap. Also shortened dim labels to fit horizontally:
     'Car dependence' -> 'Car deps.'
     'Urban density' -> 'Density'
     'Service expect.' -> 'Service exp.'
     'Domestic comp.' -> 'Local comp.'
   innerT reduced 96 -> 78 to remove the wasted band where the
   rotated headers used to sit.

Prose alignment with algorithmic playbook (v8 → v10 sweep):
- Coda takeaway updated: now lists the three biggest rank flips
  computed by the algorithm — service partnerships (W#3 → E#8),
  urban-format (W#1 → E#5), channel innovation (E#1 → W#5) — instead
  of the old hand-coded 'Urban-format West #1 → East #7'.
- Coda explanatory paragraph updated to call out West's top four
  (urban-format, big-box, service, resale) and East's top four
  (channel, strategy repositioning, price, big-box) — these match
  the algorithm output exactly.
- Three Takeaways #2 expanded: East Asia has led on BOTH platform
  integration AND formal strategy repositioning (FY24 revenue
  trough -> RMB 6.3B reinvestment -> Tokyo optimization) — this is
  the algorithm's biggest narrative finding (strategy_pivot flipped
  from W#4/E#3 hand-coded to W#7/E#2 algorithmic).
- data/AUDIT.md updated: playbook section notes intensities are now
  algorithmic; Issue #8 (intensity scoring rubric) marked RESOLVED.
- README.md updated: playbook intensities described as algorithmic.

All numeric claims in the Coda now match the regenerated
data/processed/playbook_priorities.csv to-the-rank."
        ;;

    31)
        echo "=== Module 31: algorithmic playbook intensities (replaces hand-coded scores) ==="
        git add -A
        do_commit "playbook: replace hand-coded intensities with algorithmic scoring

Previously the 1-5 intensity scores in playbook_priorities.csv were
hand-coded judgments — defensible but not reproducible. Reviewers
could legitimately question any specific score ('why is West urban-
format a 5 not a 4?'). This commit replaces that with a transparent
algorithm anchored in dated public events plus auditable external
signals.

New files:
  scripts/compute_playbook_intensities.mjs
    Reads strategic_events.csv + ikea_stores.csv +
    playbook_external_signals.csv, computes raw per-(lane × regime)
    scores, ranks within each regime, maps rank → 1-5 intensity, and
    regenerates playbook_priorities.csv. Logs the full math to
    stdout AND to data/PLAYBOOK_COMPUTATION.md.

  data/processed/playbook_external_signals.csv
    Documented external signals (e.g. China revenue -30% bumps
    East price_cut by +2.5; Burt 2020 China localization bumps
    East local_integration by +2.0). Each row carries an explicit
    reason and source so reviewers can challenge any bump.

  data/PLAYBOOK_COMPUTATION.md (audit log)
    Step-by-step record of every event contribution, every store
    bump, and every external signal that added up to each cell's
    raw score. Re-run scripts/compute_playbook_intensities.mjs to
    refresh this file after any data edit.

Regenerated:
  data/processed/playbook_priorities.csv
    All 8 intensities are now derived. Evidence text per cell is
    auto-built from real event_names + signal reasons (no more
    hand-written summaries). Notable changes from v7:
      - East urban_format: 2 → 3 (algorithm captures 8 opening
        events offset by 5 closure events via a -1.2× penalty)
      - East strategy_pivot: 3 → 5 (China revenue trough +
        Tokyo optimization + RMB 6.3B reinvestment events all
        flow into this lane and outweigh the 2016/2018 Western
        announcements)
      - West service_partnership: 5 → 4 (TaskRabbit alone gives
        ~2.9 raw, behind urban_format's 11.6 and big_box's 3.1)

Caption updated:
  viz_playbook.js notes the algorithm + points to the audit log.

Algorithm summary (Step-by-step):
  1. impactWeight(event) — keyword-based weight (1.0 default; 1.7
     for EUR/billion/RMB; 1.4 for global/acquisition; 1.25 for
     flagship; 1.15 for closure; 0.65 for announce/coverage)
  2. 'both' regime events contribute 0.7 to each side
  3. 'closure' events apply a -1.2× penalty to urban_format
  4. Each open city-format store adds 0.30 to urban_format
  5. Each open big-box adds 0.10 to big_box
  6. External signals (playbook_external_signals.csv) add weighted
     bumps with documented reasons
  7. Rank lanes within each regime; map rank → intensity:
     rank 1-2 → 5; rank 3-4 → 4; rank 5 → 3; rank 6-7 → 2; rank 8 → 1"
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
