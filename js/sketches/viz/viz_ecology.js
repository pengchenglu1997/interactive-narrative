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
//     chart). Every level — Low → Very-high — is shaded in the
//     regime hue (pale → saturated). No gray steps, so the
//     East panel reads as "all yellow" and the West panel reads
//     as "all blue" at a glance.
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

    // Per-regime single-hue heatmap. Every level is clearly tinted
    // in the regime hue — no near-white steps — so East panel reads
    // as "all yellow" and West as "all blue" even at "Low".
    // Brand colour (IKEA yellow / IKEA blue) sits at L3 (High); L4
    // (Very high) goes DEEPER to communicate maximum challenge.
    function challengeColor(level, regime) {
        if (regime === 'east_asia') {
            if (level <= 1) return '#FFEC8A';                       // recognizable yellow (not cream)
            if (level <= 2) return '#FFD647';                       // warm yellow
            if (level <= 3) return '#FBD914';                       // IKEA yellow
            return '#B58700';                                        // dark amber — depth
        }
        if (level <= 1) return '#8EBADD';                           // clear sky blue
        if (level <= 2) return '#3F84BC';                           // mid blue
        if (level <= 3) return '#0058AB';                           // IKEA blue
        return '#00375A';                                            // navy — depth
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
            var innerT = 96, innerB = 92;        // innerT +18 for group caption; innerB now fits 2 wrapped lines of method note
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
            p.text(title, innerL, innerT - 80);

            // Subtitle — short, bigger. One sentence that says what
            // the chart is plotting. (The per-cell encoding details
            // and the data-provenance microcopy used to live here too;
            // both now sit in the footer note below the legend, so
            // this line stays the punchline and reads at a glance.)
            p.fill('#444'); p.textStyle(p.NORMAL); p.textSize(14.5);
            var subtitle = regimeFilter === 'east_asia'
                ? 'East Asian markets sorted by total challenge to the original IKEA model.'
                : regimeFilter === 'western'
                    ? 'Western markets sorted by total challenge to the original IKEA model.'
                    : 'Markets sorted by total challenge to the original IKEA model.';
            p.text(subtitle, innerL, innerT - 56);

            // Group caption row — three dims:
            //   index 0 = density (QUANTITATIVE, single col)
            //   index 1-2 = service / competition (OBSERVATIONAL, two cols)
            p.fill('#888'); p.textSize(12); p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            var quantX = innerL + 0.5 * cellW;                      // center of dim 0
            var obsX   = innerL + 2   * cellW;                      // center of dims 1+2
            // QUANTITATIVE accent matches the panel's regime: amber
            // on East, IKEA blue on West. The blue-on-yellow panel
            // looked like cross-regime contamination.
            // Inline " (stats)" / " (coded)" parens added so a casual
            // reader sees the source-confidence distinction without
            // having to read the method note below the legend.
            var quantAccent = regimeFilter === 'east_asia' ? '#C9A800' : '#0058AB';
            p.fill(quantAccent);
            p.text('QUANTITATIVE (stats)',  quantX, innerT - 36);
            p.fill('#888');
            p.text('OBSERVATIONAL (coded)', obsX,   innerT - 36);

            // Thin underline under each group caption
            p.stroke('#ddd'); p.strokeWeight(0.8);
            p.line(innerL + 6,             innerT - 30, innerL + cellW - 6,     innerT - 30);
            p.line(innerL + cellW + 6,     innerT - 30, innerL + 3 * cellW - 6, innerT - 30);
            p.noStroke();

            // Dimension headers — quantitative dim styled darker/bold,
            // observational dims slightly faded.
            p.textSize(12.5);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            dims.forEach(function (d, j) {
                // Quantitative dim header inherits the panel's regime
                // accent so East-yellow never carries an IKEA-blue label.
                p.fill(d.group === 'quantitative' ? quantAccent : '#1a1a1a');
                var x = innerL + j * cellW + cellW / 2;
                p.text(d.label, x, innerT - 8);
            });
            p.fill('#1a1a1a');
            p.textSize(13);
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
                p.fill('#1a1a1a'); p.textSize(13.5); p.textStyle(p.BOLD);
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
                    // Text colour adapts to the cell shade:
                    //   - West L2 #3F84BC, L3 #0058AB, L4 #00375A —
                    //     mid-to-saturated blue → white text. Earlier
                    //     threshold (≥3) only caught L3+, leaving the
                    //     mid blue cells with hard-to-read dark text.
                    //   - East yellow palette (all 4 shades) keeps
                    //     dark ink — yellow needs contrast from dark.
                    var darkBg = (row.region_type === 'western' && level >= 2);
                    p.fill(darkBg ? '#ffffff' : '#1a1a1a');
                    p.textSize(12.5);
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
                // Bar fill — same gradient as the cells. Top tier picks
                // the depth shade (max challenge), mid = brand hue,
                // low = the recognizable-but-light tier.
                var topShade = row.region_type === 'east_asia' ? '#B58700' : '#00375A';
                var midShade = row.region_type === 'east_asia' ? '#FBD914' : '#0058AB';
                var lowShade = row.region_type === 'east_asia' ? '#FFD647' : '#3F84BC';
                p.fill(total >= 8 ? topShade : total >= 5 ? midShade : lowShade);
                p.rect(barX, barY, barW * (total / MAX_CHALLENGE), barH, 2);
                p.fill('#1a1a1a'); p.textSize(13); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(total + '/12', barX + barW + 6, barY + barH / 2);
                p.textStyle(p.NORMAL);
            });

            // Legend — cell scale only. Per-regime single-hue means one
            // legend row is enough.
            p.noStroke(); p.textSize(13); p.fill('#666');
            p.textAlign(p.LEFT, p.TOP);
            var legY = H - innerB + 18;
            p.text("Cell — challenge to IKEA's original model:", innerL, legY);
            var lx = innerL + 252;
            // 4-stop gradient legend, matches challengeColor():
            //   L1 light tinted → L2 warm → L3 IKEA brand → L4 depth.
            var l1 = regimeFilter === 'east_asia' ? '#FFEC8A' : '#8EBADD';
            var l2 = regimeFilter === 'east_asia' ? '#FFD647' : '#3F84BC';
            var l3 = regimeFilter === 'east_asia' ? '#FBD914' : '#0058AB';
            var l4 = regimeFilter === 'east_asia' ? '#B58700' : '#00375A';
            [
                { c: l1, label: 'Low' },
                { c: l2, label: 'Moderate' },
                { c: l3, label: 'High' },
                { c: l4, label: 'Very high' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, legY - 2, 14, 14);
                p.fill('#333'); p.text(it.label, lx + 18, legY);
                lx += p.textWidth(it.label) + 30;
            });

            // Method note — moved out of the subtitle into a small
            // footnote below the legend. Sourcing details that the
            // reader only needs once per region.
            // Use the (x, y, w, h) form of text() so p5 wraps it to
            // multiple lines when the viewport is narrow. Without the
            // width arg, single-line text() runs off the right edge on
            // sub-1200px viewports.
            p.noStroke();
            p.fill('#888');
            p.textStyle(p.ITALIC);
            p.textSize(11.5);
            p.textAlign(p.LEFT, p.TOP);
            p.text('Density is sourced from national statistics agencies; service expectation and local competition are observation-based. Per-cell sources documented in the colophon.',
                innerL, legY + 22, W - innerL - 20, 60);
            p.textStyle(p.NORMAL);

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
