// viz_ecology.js — Two IKEAs viz 4: Retail ecology matrix
// Section 7: Eastern markets only (the warm-glow side)
// Section 8: Western markets only (the cool side) — comparison
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    var dims = [
        { key: 'diy_culture',         label: 'DIY culture' },
        { key: 'car_dependence',      label: 'Car deps.' },
        { key: 'urban_density',       label: 'Density' },
        { key: 'service_expectation', label: 'Service exp.' },
        { key: 'local_manufacturing', label: 'Local mfg.' },
        { key: 'domestic_competition',label: 'Local comp.' },
    ];

    var challengeMap = {
        diy_culture:          { weak: 3, moderate: 2, strong: 1, very_strong: 0 },
        car_dependence:       { weak: 3, moderate: 2, strong: 1, very_strong: 0 },
        urban_density:        { low: 1, moderate: 2, high: 3, very_high: 4 },
        service_expectation:  { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
        local_manufacturing:  { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
        domestic_competition: { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
    };

    // Heatmap palette: cool IKEA blue tones = condition fits the original model;
    // warm IKEA yellow tones = condition challenges the model. On-brand bipolar scale.
    function challengeColor(level) {
        if (level <= 1) return '#e6eef6';   // pale blue — fits
        if (level <= 2) return '#b9d0e6';   // blue
        if (level <= 3) return '#f8e288';   // pale yellow — challenges
        return '#FBD914';                    // IKEA yellow — very high challenge
    }

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western':   return '#0058AB';   // IKEA blue
            case 'east_asia': return '#FBD914';   // IKEA yellow
            default: return '#888';
        }
    }

    var MAX_CHALLENGE = 24;   // 6 dims × max level 4
    function challengeTotal(row) {
        var total = 0;
        for (var i = 0; i < dims.length; i++) {
            var k = dims[i].key;
            total += (challengeMap[k] && challengeMap[k][row[k]]) || 0;
        }
        return total;
    }

    // Aggregate IKEA's actual presence in `market` from the stores table —
    // this is the "so what" of the matrix: high challenge → does IKEA win or lose?
    var CITY_FORMATS = ['city_store', 'planning_studio', 'plan_order_point'];
    function outcomeFor(marketName, stores) {
        var inMkt = (stores || []).filter(function (s) { return s.country === marketName; });
        return {
            bigOpen:    inMkt.filter(function (s) { return s.store_format === 'big-box' && !s.closure_year; }).length,
            cityOpen:   inMkt.filter(function (s) { return CITY_FORMATS.indexOf(s.store_format) >= 0 && !s.closure_year; }).length,
            cityClosed: inMkt.filter(function (s) { return CITY_FORMATS.indexOf(s.store_format) >= 0 &&  s.closure_year; }).length,
        };
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

            // Filter to the active regime, then attach aggregate + outcome
            // so we can sort and display them. The sort is the most direct
            // answer to the professor's complaint that the matrix had no
            // takeaway: highest challenge bubbles to the top, and the right
            // edge shows what actually happened to IKEA in that market.
            var stores = (manager.data && manager.data.stores) || [];
            var rows = ecology
                .filter(function (r) { return !regimeFilter || r.region_type === regimeFilter; })
                .map(function (r) {
                    return Object.assign({}, r, {
                        _total:   challengeTotal(r),
                        _outcome: outcomeFor(r.market, stores),
                    });
                })
                .sort(function (a, b) { return b._total - a._total; });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            // Layout — reserve right-side bands for the two new columns.
            var CHAL_COL_W    = 84;     // bar (60) + "score/24" label
            var OUTCOME_COL_W = 130;    // "7 big · 1 closed" badges
            var innerL = 130;
            var innerR = 14 + CHAL_COL_W + OUTCOME_COL_W;
            var innerT = 78, innerB = 70;       // two-line legend needs more room
            var cellW  = (W - innerL - innerR) / dims.length;
            var rowH   = Math.min(64, (H - innerT - innerB) / Math.max(rows.length, 1));
            var chalColX    = innerL + dims.length * cellW + 4;
            var outcomeColX = chalColX + CHAL_COL_W + 4;

            // Section title — amber for East (yellow itself is unreadable as text)
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C9A800' : regimeFilter === 'western' ? '#0058AB' : '#333');
            p.textStyle(p.BOLD); p.textSize(13);
            p.textAlign(p.LEFT, p.BOTTOM);
            var title = regimeFilter === 'east_asia'
                ? 'EAST ASIAN MARKETS — RETAIL ECOLOGY'
                : regimeFilter === 'western'
                    ? 'WESTERN MARKETS — RETAIL ECOLOGY'
                    : 'RETAIL ECOLOGY MATRIX';
            p.text(title, innerL, innerT - 56);

            // Subtitle — make the causal payload explicit.
            // Cells = structural friction; right side = what IKEA actually got.
            p.fill('#666'); p.textStyle(p.NORMAL); p.textSize(11);
            var subtitle = regimeFilter === 'east_asia'
                ? 'Sorted by total challenge. Right column = IKEA\'s actual result. Watch the gradient: more friction ↔ more closures.'
                : regimeFilter === 'western'
                    ? 'Sorted by total challenge. Right column = IKEA\'s actual result. Watch the gradient: low friction ↔ stores stay open.'
                    : 'Sorted by total challenge. Right columns show the aggregate friction score and IKEA\'s actual presence in each market.';
            p.text(subtitle, innerL, innerT - 40);

            // Column headers (horizontal, single line — was rotated -30°
            // which extended ~55px upward and overlapped the subtitle)
            p.noStroke(); p.fill('#1a1a1a'); p.textSize(10.5);
            p.textStyle(p.BOLD);
            p.textAlign(p.CENTER, p.BOTTOM);
            dims.forEach(function (d, j) {
                var x = innerL + j * cellW + cellW / 2;
                p.text(d.label, x, innerT - 8);
            });
            // New right-side column headers
            p.text('CHALLENGE / 24', chalColX + CHAL_COL_W / 2, innerT - 8);
            p.text('IKEA RESULT',     outcomeColX + OUTCOME_COL_W / 2, innerT - 8);
            p.textStyle(p.NORMAL);

            // Convert canvas mouse → translated sketch coords
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;

            // Hover state
            var hoverCell = null;

            // Rows
            rows.forEach(function (row, i) {
                var y = innerT + i * rowH + rowH / 2;
                p.noStroke(); p.fill(regimeColor(row.region_type));
                p.rect(2, y - 8, 4, 16);
                p.fill('#1a1a1a'); p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(row.market, 12, y);

                p.textStyle(p.NORMAL);
                dims.forEach(function (d, j) {
                    var x = innerL + j * cellW;
                    var rawVal = row[d.key];
                    var level = (challengeMap[d.key] && challengeMap[d.key][rawVal]) || 0;
                    var col = challengeColor(level);
                    p.noStroke(); p.fill(col);
                    var cellRectX = x + 3, cellRectY = innerT + i * rowH + 4;
                    var cellRectW = cellW - 6, cellRectH = rowH - 8;
                    p.rect(cellRectX, cellRectY, cellRectW, cellRectH, 4);
                    // Dark ink on both blue and yellow cells — readable across the scale.
                    p.fill('#1a1a1a');
                    p.textSize(10);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text((rawVal || '').replace(/_/g, ' '), x + cellW / 2, innerT + i * rowH + rowH / 2);

                    if (mx >= cellRectX && mx <= cellRectX + cellRectW &&
                        my >= cellRectY && my <= cellRectY + cellRectH) {
                        hoverCell = { row: row, dim: d, val: rawVal, level: level };
                    }
                });

                // === Challenge / 24 column ============================
                var total = row._total;
                var barW  = CHAL_COL_W - 28;
                var barH  = 10;
                var barX  = chalColX + 4;
                var barY  = innerT + i * rowH + rowH / 2 - barH / 2;
                p.noStroke(); p.fill('#eee');
                p.rect(barX, barY, barW, barH, 2);
                // Fill color stays on the IKEA bipolar scale
                p.fill(total >= 17 ? '#FBD914' : total >= 11 ? '#f8e288' : '#b9d0e6');
                p.rect(barX, barY, barW * (total / MAX_CHALLENGE), barH, 2);
                p.fill('#1a1a1a'); p.textSize(10); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(total + '/24', barX + barW + 6, barY + barH / 2);
                p.textStyle(p.NORMAL);

                // === IKEA Result column ===============================
                var o = row._outcome;
                var oy = innerT + i * rowH + rowH / 2;
                var ox = outcomeColX + 4;
                p.textSize(10.5); p.textAlign(p.LEFT, p.CENTER);
                function drawBadge(text, col) {
                    p.fill(col); p.textStyle(p.BOLD);
                    p.text(text, ox, oy);
                    ox += p.textWidth(text);
                    p.textStyle(p.NORMAL);
                }
                function drawSep() {
                    p.fill('#bbb'); p.text(' · ', ox, oy);
                    ox += p.textWidth(' · ');
                }
                drawBadge(o.bigOpen + ' big', '#0058AB');
                if (o.cityOpen) {
                    drawSep();
                    drawBadge(o.cityOpen + ' city', '#0058AB');
                }
                if (o.cityClosed) {
                    drawSep();
                    drawBadge(o.cityClosed + ' closed', '#C57F00');
                }
                if (!o.bigOpen && !o.cityOpen && !o.cityClosed) {
                    p.fill('#999'); p.textStyle(p.NORMAL);
                    p.text('no stores', ox, oy);
                }
            });

            // Legend (bottom — in the bottom margin).
            // Two rows: cell-level scale, then a key for the result column.
            p.noStroke(); p.textSize(10); p.fill('#666');
            p.textAlign(p.LEFT, p.TOP);
            var legY = H - innerB + 14;
            p.text("Cell — challenge to IKEA's original model:", innerL, legY);
            var lx = innerL + 226;
            [
                { c: '#e6eef6', label: 'Low' },
                { c: '#b9d0e6', label: 'Moderate' },
                { c: '#f8e288', label: 'High' },
                { c: '#FBD914', label: 'Very high' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, legY - 2, 10, 10);
                p.fill('#333'); p.text(it.label, lx + 14, legY);
                lx += p.textWidth(it.label) + 26;
            });
            var legY2 = legY + 16;
            p.fill('#666');
            p.text("Result — IKEA presence in the market:", innerL, legY2);
            var lx2 = innerL + 226;
            p.fill('#0058AB'); p.textStyle(p.BOLD);
            p.text('N big', lx2, legY2); lx2 += p.textWidth('N big') + 14;
            p.fill('#0058AB'); p.text('N city', lx2, legY2); lx2 += p.textWidth('N city') + 14;
            p.fill('#C57F00'); p.text('N closed', lx2, legY2); lx2 += p.textWidth('N closed') + 14;
            p.textStyle(p.NORMAL);
            p.fill('#666');
            p.text("= active big-box · active city-format · closed city-format stores", lx2, legY2);

            p.pop();

            // Tooltip
            if (hoverCell && window.VizTooltip) {
                var h = hoverCell;
                var challengeLabel = ['Low', 'Low', 'Moderate', 'High', 'Very high'][Math.min(4, h.level)];
                var html =
                    '<div class="tt-name">' + h.row.market + ' · ' + h.dim.label + '</div>' +
                    '<div class="tt-row"><b>Value</b> ' + (h.val || '').replace(/_/g, ' ') + '</div>' +
                    '<div class="tt-row"><b>Challenge to IKEA</b> ' + challengeLabel + '</div>' +
                    (h.row.short_summary ? '<div class="tt-note">' + h.row.short_summary + '</div>' : '') +
                    (h.row.primary_sources ? '<div class="tt-src">Sources: ' + h.row.primary_sources + '</div>' : '');
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
