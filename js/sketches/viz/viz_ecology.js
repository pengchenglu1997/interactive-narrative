// viz_ecology.js — Two IKEAs viz 4: Retail ecology matrix
// Section 7: Eastern markets only (the warm-glow side)
// Section 8: Western markets only (the cool side) — comparison
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    var dims = [
        { key: 'diy_culture',         label: 'DIY culture' },
        { key: 'car_dependence',      label: 'Car dependence' },
        { key: 'urban_density',       label: 'Urban density' },
        { key: 'service_expectation', label: 'Service expect.' },
        { key: 'local_manufacturing', label: 'Local mfg.' },
        { key: 'domestic_competition',label: 'Domestic comp.' },
    ];

    var challengeMap = {
        diy_culture:          { weak: 3, moderate: 2, strong: 1, very_strong: 0 },
        car_dependence:       { weak: 3, moderate: 2, strong: 1, very_strong: 0 },
        urban_density:        { low: 1, moderate: 2, high: 3, very_high: 4 },
        service_expectation:  { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
        local_manufacturing:  { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
        domestic_competition: { weak: 1, moderate: 2, strong: 3, very_strong: 4 },
    };

    function challengeColor(level) {
        if (level <= 1) return '#cfe2f3';
        if (level <= 2) return '#a4c2db';
        if (level <= 3) return '#e69080';
        return '#C8412C';
    }

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western': return '#2A6FB0';
            case 'east_asia': return '#C8412C';
            default: return '#888';
        }
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

            var rows = ecology.filter(function (r) {
                return !regimeFilter || r.region_type === regimeFilter;
            });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var innerL = 130, innerR = 14, innerT = 96, innerB = 52;
            var cellW = (W - innerL - innerR) / dims.length;
            var rowH = Math.min(64, (H - innerT - innerB) / Math.max(rows.length, 1));

            // Section title
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C8412C' : regimeFilter === 'western' ? '#2A6FB0' : '#333');
            p.textStyle(p.BOLD); p.textSize(13);
            p.textAlign(p.LEFT, p.BOTTOM);
            var title = regimeFilter === 'east_asia'
                ? 'EAST ASIAN MARKETS — RETAIL ECOLOGY'
                : regimeFilter === 'western'
                    ? 'WESTERN MARKETS — RETAIL ECOLOGY'
                    : 'RETAIL ECOLOGY MATRIX';
            p.text(title, innerL, innerT - 56);

            // Subtitle
            p.fill('#666'); p.textStyle(p.NORMAL); p.textSize(11);
            var subtitle = regimeFilter === 'east_asia'
                ? 'Warm cells = condition challenges IKEA\'s original big-box DIY model'
                : regimeFilter === 'western'
                    ? 'Cool cells = condition fits IKEA\'s original model well'
                    : 'Cell color = challenge to IKEA\'s original model';
            p.text(subtitle, innerL, innerT - 40);

            // Column headers (rotated)
            dims.forEach(function (d, j) {
                var x = innerL + j * cellW + cellW / 2;
                p.push();
                p.translate(x, innerT - 6);
                p.rotate(-p.PI / 6);
                p.noStroke(); p.fill('#1a1a1a'); p.textSize(11);
                p.textAlign(p.LEFT, p.BOTTOM);
                p.text(d.label, 0, 0);
                p.pop();
            });

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
                    p.fill(level >= 3 ? 'white' : '#1a1a1a');
                    p.textSize(10);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text((rawVal || '').replace(/_/g, ' '), x + cellW / 2, innerT + i * rowH + rowH / 2);

                    if (mx >= cellRectX && mx <= cellRectX + cellRectW &&
                        my >= cellRectY && my <= cellRectY + cellRectH) {
                        hoverCell = { row: row, dim: d, val: rawVal, level: level };
                    }
                });
            });

            // Legend (bottom — in the bottom margin)
            p.noStroke(); p.textSize(10); p.fill('#666');
            p.textAlign(p.LEFT, p.TOP);
            var legY = H - innerB + 18;
            p.text("Challenge to IKEA's original model:", innerL, legY);
            var lx = innerL + 220;
            [
                { c: '#cfe2f3', label: 'Low' },
                { c: '#a4c2db', label: 'Moderate' },
                { c: '#e69080', label: 'High' },
                { c: '#C8412C', label: 'Very high' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, legY - 2, 10, 10);
                p.fill('#333'); p.text(it.label, lx + 14, legY);
                lx += p.textWidth(it.label) + 30;
            });

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
