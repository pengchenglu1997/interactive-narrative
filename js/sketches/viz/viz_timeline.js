// viz_timeline.js — Two IKEAs viz 3: Gantt-style strategic event timeline
// Y = response_type lanes, X = year 2014-2026. Tiles coloured by regime.
(function () {
    var lanes = [
        { key: 'urban_format', label: 'Urban format' },
        { key: 'service_partnership', label: 'Service partnership' },
        { key: 'resale_circularity', label: 'Resale / circularity' },
        { key: 'channel_innovation', label: 'Channel innovation' },
        { key: 'strategy_pivot', label: 'Strategy pivot' },
        { key: 'price_cut', label: 'Price cut' },
        { key: 'closure', label: 'City-store closure' },
        { key: 'store_expansion', label: 'Big-box expansion' },
    ];
    var Y_MIN = 2014, Y_MAX = 2026;

    function regimeFill(ev) {
        if (ev.regime_type === 'east_asia') return '#C8412C';
        if (ev.regime_type === 'western') return '#2A6FB0';
        if (ev.regime_type === 'both') return '#E0A800';
        return '#888';
    }

    window.VizTimeline = {
        draw: function (p, manager, ai, progress) {
            var events = (manager.data && manager.data.events) || [];
            events = events.filter(function (e) {
                var y = e.event_year;
                return y >= Y_MIN && y <= Y_MAX &&
                    e.response_type !== 'context_report' &&
                    e.response_type !== 'corporate_report';
            });
            if (!events.length) {
                p.push();
                p.fill('#888'); p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading event data…', manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var innerL = 150, innerR = 18, innerT = 28, innerB = 28;
            var laneH = (H - innerT - innerB) / lanes.length;
            function xYear(y) { return p.map(y, Y_MIN, Y_MAX + 0.5, innerL + 10, W - innerR - 10); }
            var yearW = (W - innerR - innerL - 20) / (Y_MAX - Y_MIN + 1);

            // Group events by (lane, year)
            var grouped = {};
            events.forEach(function (e) {
                var k = e.response_type + '|' + e.event_year;
                grouped[k] = grouped[k] || [];
                grouped[k].push(e);
            });

            // Lane backgrounds and labels
            lanes.forEach(function (lane, i) {
                p.noStroke();
                p.fill(i % 2 === 0 ? '#fafafa' : 'white');
                p.rect(innerL, innerT + i * laneH, W - innerL - innerR, laneH);
                p.fill('#1a1a1a'); p.textSize(11); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(lane.label, innerL - 8, innerT + i * laneH + laneH / 2);
                p.textStyle(p.NORMAL);
            });

            // Year axis (top)
            p.fill('#666'); p.textSize(10); p.textAlign(p.CENTER, p.BOTTOM);
            for (var y = Y_MIN; y <= Y_MAX; y++) {
                var x = xYear(y);
                p.stroke('#eee'); p.line(x, innerT, x, H - innerB);
                p.noStroke();
                if (y % 2 === 0 || y === Y_MIN) { p.fill('#666'); p.text(y, x, innerT - 4); }
            }

            // Tiles
            lanes.forEach(function (lane, li) {
                var ly = innerT + li * laneH;
                for (var yr = Y_MIN; yr <= Y_MAX; yr++) {
                    var k = lane.key + '|' + yr;
                    var evs = grouped[k];
                    if (!evs) continue;
                    var tileW = Math.min(yearW - 3, 100);
                    var tileH = (laneH - 6) / evs.length;
                    evs.forEach(function (ev, ei) {
                        var tx = xYear(yr) - tileW / 2;
                        var ty = ly + 3 + ei * tileH;
                        p.noStroke();
                        p.fill(regimeFill(ev));
                        p.rect(tx, ty, tileW, tileH - 1.5, 2);
                        p.fill(255);
                        p.textSize(Math.max(7, Math.min(9, tileH - 4)));
                        p.textAlign(p.LEFT, p.CENTER);
                        var label = ev.event_name || '';
                        var maxChars = Math.max(8, Math.floor(tileW / 5));
                        var shown = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
                        p.text(shown, tx + 4, ty + (tileH - 1.5) / 2);
                    });
                }
            });

            // Legend
            p.noStroke(); p.textSize(10); p.textAlign(p.LEFT, p.TOP); p.fill('#333');
            var legY = H - innerB + 6;
            var lx = innerL;
            [
                { c: '#2A6FB0', label: 'Western' },
                { c: '#C8412C', label: 'East Asian' },
                { c: '#E0A800', label: 'Global / both' },
            ].forEach(function (it) {
                p.fill(it.c); p.rect(lx, legY + 4, 9, 9);
                p.fill('#333'); p.text(it.label, lx + 13, legY + 2);
                lx += p.textWidth(it.label) + 35;
            });

            p.pop();
        }
    };
})();
