// viz_ecology.js — viz 4: Retail ecology matrix (Act 4)
// Section 7: East Asian markets (yellow scale)
// Section 8: Western markets    (blue scale)
//
// Project-3 / SOURCING.md redesign:
//   - 4 dimensions cut to 3 — diy_culture dropped because no
//     country-level metric exists for it. The DIY observation
//     stays in the prose, anchored to Burt 2020.
//   - Dimensions regrouped along source-confidence (not topical
//     similarity): QUANTITATIVE (density — backed by national
//     statistical agencies for every market) vs OBSERVATIONAL
//     (service expectation + local competition — observation- or
//     mixed-citation-based). Group caption + label-style differ so
//     the reader knows which is which.
//   - Single-hue heatmap PER regime (no mixed blue+yellow on a
//     chart). Low/Moderate are gray; only High / Very-high carry
//     the regime hue.
//   - CHALLENGE total now /12 (3 dims × max level 4) instead of /16.
//   - Outcomes (BIG-BOX / CITY OPEN / CITY SHUT) remain in the prose,
//     not in the matrix.
(function () {
    // QUANTITATIVE: directly cited from a national statistics agency
    //               per row (`density_source` column on retail_ecology.csv).
    // OBSERVATIONAL: backed by mixed evidence — some markets have
    //                published market-share data (China, Japan, Korea
    //                for competition), others are author observation
    //                across multiple mid-size players.
    var dims = [
        { key: 'urban_density',        label: 'Density',      group: 'quantitative' },
        { key: 'service_expectation',  label: 'Service exp.', group: 'observational' },
        { key: 'domestic_competition', label: 'Local comp.',  group: 'observational' },
    ];

    var challengeMap = {
        urban_density:        { low: 1, moderate: 2, high: 3, very_high: 4 },
        service_expectation:  { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
        domestic_competition: { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
    };

    // Per-regime monochrome heatmap. Low/Moderate are neutral grays so
    // the two regime views never visually mix blue and yellow.
    function challengeColor(level, regime) {
        if (level <= 1) return '#efefef';                          // light gray
        if (level <= 2) return '#d4d4d4';                          // mid gray
        if (regime === 'east_asia') {
            return level <= 3 ? '#fff5b2' : '#FBD914';             // pale yellow → IKEA yellow
        }
        // western (and combined view) — single blue gradient
        return level <= 3 ? '#b9d0e6' : '#0058AB';                 // pale blue → IKEA blue
    }

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western':   return '#0058AB';
            case 'east_asia': return '#FBD914';
            default: return '#888';
        }
    }

    var MAX_CHALLENGE = 12;   // 3 dims × max level 4 (diy_culture dropped — no country-level metric)

    function challengeTotal(row) {
        var total = 0;
        for (var i = 0; i < dims.length; i++) {
            var k = dims[i].key;
            total += (challengeMap[k] && challengeMap[k][row[k]]) || 0;
        }
        return total;
    }

    window.VizEcology = {
        draw: function (p, manager, ai, progress) {
            var ecology = (manager.data && manager.data.ecology) || [];
            if (!ecology.length) {
                p.push();
                p.fill('#888'); p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading ecology data…', manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            var cfg = (manager.state && manager.state.vizConfig) || {};
            var regimeFilter = cfg.regime || null;

            // Filter to active regime + sort by total challenge desc.
            var rows = ecology
                .filter(function (r) { return !regimeFilter || r.region_type === regimeFilter; })
                .map(function (r) { return Object.assign({}, r, { _total: challengeTotal(r) }); })
                .sort(function (a, b) { return b._total - a._total; });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            // Layout — wider cells because we cut 2 dims and dropped the
            // IKEA Result column. innerB bumped to fit the group caption.
            var CHAL_COL_W = 92;
            var innerL = 130;
            var innerR = 14 + CHAL_COL_W;
            var innerT = 96, innerB = 52;        // innerT +18 for group caption row
            var cellW  = (W - innerL - innerR) / dims.length;
            var rowH   = Math.min(64, (H - innerT - innerB) / Math.max(rows.length, 1));
            var chalColX = innerL + dims.length * cellW + 6;

            // Section title — amber for East (yellow text unreadable).
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C9A800' : regimeFilter === 'western' ? '#0058AB' : '#333');
            p.textStyle(p.BOLD); p.textSize(16);
            p.textAlign(p.LEFT, p.BOTTOM);
            var title = regimeFilter === 'east_asia'
                ? 'EAST ASIAN MARKETS — RETAIL ECOLOGY'
                : regimeFilter === 'western'
                    ? 'WESTERN MARKETS — RETAIL ECOLOGY'
                    : 'RETAIL ECOLOGY MATRIX';
            p.text(title, innerL, innerT - 78);

            // Subtitle — explicit about which dims are quantitative vs observation.
            p.fill('#666'); p.textStyle(p.NORMAL); p.textSize(11);
            var subtitle = (regimeFilter === 'east_asia' || regimeFilter === 'western')
                ? 'Density is sourced from national statistics agencies; service expectation and local competition are observation-based. Sorted by total challenge. See data/SOURCING.md for per-cell sources.'
                : 'Density is quantitative; service and competition are observation-based. Sorted by total challenge.';
            p.text(subtitle, innerL, innerT - 58);

            // Group caption row — three dims:
            //   index 0 = density (QUANTITATIVE, single col)
            //   index 1-2 = service / competition (OBSERVATIONAL, two cols)
            p.fill('#888'); p.textSize(9.5); p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            var quantX = innerL + 0.5 * cellW;                      // center of dim 0
            var obsX   = innerL + 2   * cellW;                      // center of dims 1+2
            p.fill('#0058AB');
            p.text('QUANTITATIVE',  quantX, innerT - 36);
            p.fill('#888');
            p.text('OBSERVATIONAL', obsX,   innerT - 36);

            // Thin underline under each group caption
            p.stroke('#ddd'); p.strokeWeight(0.8);
            p.line(innerL + 6,             innerT - 30, innerL + cellW - 6,     innerT - 30);
            p.line(innerL + cellW + 6,     innerT - 30, innerL + 3 * cellW - 6, innerT - 30);
            p.noStroke();

            // Dimension headers — quantitative dim styled darker/bold,
            // observational dims slightly faded.
            p.textSize(10.5);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            dims.forEach(function (d, j) {
                p.fill(d.group === 'quantitative' ? '#0058AB' : '#1a1a1a');
                var x = innerL + j * cellW + cellW / 2;
                p.text(d.label, x, innerT - 8);
            });
            p.fill('#1a1a1a');
            p.text('CHALLENGE / 12', chalColX + (CHAL_COL_W - 12) / 2, innerT - 8);
            p.textStyle(p.NORMAL);

            // Group divider — light vertical line between QUANTITATIVE (1 dim)
            // and OBSERVATIONAL (2 dims). Sits between dim 0 and dim 1.
            p.stroke('#e8e8e8'); p.strokeWeight(1);
            var groupX = innerL + 1 * cellW;
            p.line(groupX, innerT - 4, groupX, innerT + rows.length * rowH + 4);
            p.noStroke();

            // Mouse coords (translated)
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;
            var hoverCell = null;

            // Rows
            rows.forEach(function (row, i) {
                var y = innerT + i * rowH + rowH / 2;

                // Regime stripe + market label
                p.noStroke(); p.fill(regimeColor(row.region_type));
                p.rect(2, y - 8, 4, 16);
                p.fill('#1a1a1a'); p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(row.market, 12, y);
                p.textStyle(p.NORMAL);

                // Cells
                dims.forEach(function (d, j) {
                    var x = innerL + j * cellW;
                    var rawVal = row[d.key];
                    var level = (challengeMap[d.key] && challengeMap[d.key][rawVal]) || 0;
                    var col = challengeColor(level, row.region_type);
                    p.noStroke(); p.fill(col);
                    var cellRectX = x + 3, cellRectY = innerT + i * rowH + 4;
                    var cellRectW = cellW - 6, cellRectH = rowH - 8;
                    p.rect(cellRectX, cellRectY, cellRectW, cellRectH, 4);
                    // Dark ink always — readable on every shade in the
                    // per-regime palette (gray / pale color / saturated).
                    p.fill('#1a1a1a');
                    p.textSize(10);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text((rawVal || '').replace(/_/g, ' '), x + cellW / 2, innerT + i * rowH + rowH / 2);

                    if (mx >= cellRectX && mx <= cellRectX + cellRectW &&
                        my >= cellRectY && my <= cellRectY + cellRectH) {
                        hoverCell = { row: row, dim: d, val: rawVal, level: level };
                    }
                });

                // CHALLENGE / 16 — bar + numeric label, regime-tinted
                var total = row._total;
                var barW  = CHAL_COL_W - 32;
                var barH  = 10;
                var barX  = chalColX + 4;
                var barY  = innerT + i * rowH + rowH / 2 - barH / 2;
                p.noStroke(); p.fill('#eee');
                p.rect(barX, barY, barW, barH, 2);
                // Bar fill stays in the regime hue family. Thresholds
                // rescaled for the /12 scale: 8+ = saturated, 5+ = pale,
                // below = neutral gray.
                var topShade = row.region_type === 'east_asia' ? '#FBD914' : '#0058AB';
                var midShade = row.region_type === 'east_asia' ? '#fff5b2' : '#b9d0e6';
                p.fill(total >= 8 ? topShade : total >= 5 ? midShade : '#d4d4d4');
                p.rect(barX, barY, barW * (total / MAX_CHALLENGE), barH, 2);
                p.fill('#1a1a1a'); p.textSize(10); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(total + '/12', barX + barW + 6, barY + barH / 2);
                p.textStyle(p.NORMAL);
            });

            // Legend — cell scale only. Per-regime monochrome means one
            // legend row is enough.
            p.noStroke(); p.textSize(12); p.fill('#666');
            p.textAlign(p.LEFT, p.TOP);
            var legY = H - innerB + 18;
            p.text("Cell — challenge to IKEA's original model:", innerL, legY);
            var lx = innerL + 226;
            var topHi  = regimeFilter === 'east_asia' ? '#FBD914' : '#0058AB';
            var midHi  = regimeFilter === 'east_asia' ? '#fff5b2' : '#b9d0e6';
            [
                { c: '#efefef', label: 'Low' },
                { c: '#d4d4d4', label: 'Moderate' },
                { c: midHi,     label: 'High' },
                { c: topHi,     label: 'Very high' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, legY - 2, 10, 10);
                p.fill('#333'); p.text(it.label, lx + 14, legY);
                lx += p.textWidth(it.label) + 26;
            });

            p.pop();

            // Tooltip — now uses the per-dimension source from retail_ecology.csv
            // (density_source / competition_source / service_source).
            // This is the per-cell provenance the reader / reviewer asked for.
            if (hoverCell && window.VizTooltip) {
                var h = hoverCell;
                var challengeLabel = ['Low', 'Low', 'Moderate', 'High', 'Very high'][Math.min(4, h.level)];
                var srcKey = ({
                    urban_density:        'density_source',
                    service_expectation:  'service_source',
                    domestic_competition: 'competition_source',
                })[h.dim.key];
                var perCellSource = srcKey ? h.row[srcKey] : '';
                var groupLabel = h.dim.group === 'quantitative'
                    ? 'Quantitative — sourced from a national statistics agency'
                    : 'Observational — observation-based, see source for details';
                var html =
                    '<div class="tt-name">' + h.row.market + ' · ' + h.dim.label + '</div>' +
                    '<div class="tt-row"><b>Value</b> ' + (h.val || '').replace(/_/g, ' ') + '</div>' +
                    '<div class="tt-row"><b>Challenge to IKEA</b> ' + challengeLabel + '</div>' +
                    '<div class="tt-row" style="opacity:0.8"><i>' + groupLabel + '</i></div>' +
                    (perCellSource ? '<div class="tt-src">Source: ' + perCellSource + '</div>' : '') +
                    (h.row.short_summary  ? '<div class="tt-note">' + h.row.short_summary + '</div>' : '');
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
