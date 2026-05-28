// viz_ecology.js — Two IKEAs viz 4: Retail ecology matrix
// 10 markets × 6 dimensions, cell colour = challenge to IKEA's original model
(function () {
    var dims = [
        { key: 'diy_culture', label: 'DIY culture' },
        { key: 'car_dependence', label: 'Car dependence' },
        { key: 'urban_density', label: 'Urban density' },
        { key: 'service_expectation', label: 'Service expectation' },
        { key: 'local_manufacturing', label: 'Local mfg.' },
        { key: 'domestic_competition', label: 'Domestic comp.' },
    ];

    // For each dim, map qualitative value -> "challenge to IKEA" intensity (0..4)
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

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var innerL = 130, innerR = 14, innerT = 78, innerB = 30;
            var cellW = (W - innerL - innerR) / dims.length;
            var rowH = (H - innerT - innerB) / ecology.length;

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

            // Rows
            ecology.forEach(function (row, i) {
                var y = innerT + i * rowH + rowH / 2;
                // regime swatch
                p.noStroke(); p.fill(regimeColor(row.region_type));
                p.rect(2, y - 6, 3, 12);
                // row label
                p.fill('#1a1a1a'); p.textSize(11);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(row.market, 10, y);

                dims.forEach(function (d, j) {
                    var x = innerL + j * cellW;
                    var rawVal = row[d.key];
                    var level = (challengeMap[d.key] && challengeMap[d.key][rawVal]) || 0;
                    var col = challengeColor(level);
                    p.noStroke(); p.fill(col);
                    p.rect(x + 2, innerT + i * rowH + 3, cellW - 4, rowH - 6, 3);
                    p.fill(level >= 3 ? 'white' : '#1a1a1a');
                    p.textSize(9);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text((rawVal || '').replace(/_/g, ' '), x + cellW / 2, innerT + i * rowH + rowH / 2);
                });
            });

            // Legend (bottom)
            p.noStroke(); p.textSize(10); p.fill('#333');
            p.textAlign(p.LEFT, p.TOP);
            p.text('Challenge to IKEA\'s original big-box DIY model:', innerL, H - 22);
            var lx = innerL + 230;
            [
                { c: '#cfe2f3', label: 'Low' },
                { c: '#a4c2db', label: 'Moderate' },
                { c: '#e69080', label: 'High' },
                { c: '#C8412C', label: 'Very high' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, H - 22, 10, 10);
                p.fill('#333'); p.text(it.label, lx + 14, H - 22);
                lx += p.textWidth(it.label) + 32;
            });

            p.pop();
        }
    };
})();
