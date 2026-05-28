// viz_response.js — Two IKEAs viz 2: Housing pressure × IKEA response
// Per-city row: PTI bar (left) joined with IKEA city-format markers (right) over time.
// Section 3 (Act 2 first):  filter to East Asian cities (the "high pressure no city store" story)
// Section 4 (Act 2 second): filter to Western cities (the "high pressure but city stores opened" story)
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    var MIN_YEAR = 1970;
    var MAX_YEAR = 2026;

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western': return '#2A6FB0';
            case 'east_asia': return '#C8412C';
            default: return '#888';
        }
    }

    var cityAliases = {
        'new york city': ['new york'],
        'washington dc': ['washington'],
    };
    function normalize(s) { return (s || '').trim().toLowerCase(); }
    function matchCity(housingCity, storeCity) {
        var h = normalize(housingCity), s = normalize(storeCity);
        if (h === s) return true;
        var aliases = cityAliases[h];
        if (aliases && aliases.indexOf(s) !== -1) return true;
        return false;
    }

    window.VizResponse = {
        draw: function (p, manager, ai, progress) {
            var housing = (manager.data && manager.data.housing) || [];
            var stores = (manager.data && manager.data.stores) || [];
            if (!housing.length) {
                p.push();
                p.fill('#888'); p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading housing data…', manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // Read regime filter from per-section config
            var cfg = (manager.state && manager.state.vizConfig) || {};
            var regimeFilter = cfg.regime || null;

            var rows = housing
                .filter(function (c) { return c.price_to_income_ratio != null; })
                .filter(function (c) { return !regimeFilter || c.region_type === regimeFilter; })
                .slice()
                .sort(function (a, b) { return b.price_to_income_ratio - a.price_to_income_ratio; });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var padInner = { l: 130, r: 18, t: 50, b: 30 };
            var rowH = Math.max(22, Math.floor((H - padInner.t - padInner.b) / Math.max(rows.length, 1)));

            var maxPTI = 0;
            rows.forEach(function (r) { if (r.price_to_income_ratio > maxPTI) maxPTI = r.price_to_income_ratio; });
            maxPTI = Math.ceil(maxPTI / 5) * 5;
            var barColW = Math.min(220, (W - padInner.l - padInner.r) * 0.35);
            var respColX = padInner.l + barColW + 28;
            var respColW = W - respColX - padInner.r;
            function xPTI(v) { return padInner.l + (v / maxPTI) * barColW; }
            function xYear(y) { return respColX + ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * respColW; }

            // Section title (which regime are we looking at?)
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C8412C' : regimeFilter === 'western' ? '#2A6FB0' : '#333');
            p.textStyle(p.BOLD); p.textSize(13);
            p.textAlign(p.LEFT, p.BOTTOM);
            var titleText = regimeFilter === 'east_asia'
                ? 'EAST ASIAN CITIES BY HOUSING PRESSURE'
                : regimeFilter === 'western'
                    ? 'WESTERN CITIES BY HOUSING PRESSURE'
                    : 'CITIES BY HOUSING PRESSURE';
            p.text(titleText, padInner.l, padInner.t - 22);

            // Column subheaders
            p.fill('#888'); p.textStyle(p.NORMAL); p.textSize(10);
            p.text('PRICE-TO-INCOME', padInner.l, padInner.t - 6);
            p.text("IKEA'S CITY-FORMAT RESPONSE  (yellow=open · ▼=closed · faint dot=big-box context)",
                respColX, padInner.t - 6);

            // Year ticks
            p.textAlign(p.CENTER, p.BOTTOM);
            for (var y = 1970; y <= 2020; y += 10) {
                var x = xYear(y);
                p.stroke('#eee'); p.line(x, padInner.t, x, H - padInner.b);
                p.noStroke(); p.fill('#aaa');
                p.text(y, x, padInner.t + 8);
            }
            p.text(2026, xYear(2026), padInner.t + 8);

            // Rows
            rows.forEach(function (c, i) {
                var yPos = padInner.t + i * rowH + rowH / 2;
                // city label
                p.noStroke(); p.fill('#1a1a1a'); p.textSize(11);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(c.city, padInner.l - 8, yPos);

                // PTI bar
                var col = regimeColor(c.region_type);
                var bw = xPTI(c.price_to_income_ratio) - padInner.l;
                p.fill(col);
                var bh = Math.min(16, rowH - 4);
                p.rect(padInner.l, yPos - bh / 2, bw, bh, 2);
                p.fill('#1a1a1a'); p.textAlign(p.LEFT, p.CENTER); p.textSize(10);
                p.text(c.price_to_income_ratio.toFixed(1), padInner.l + bw + 4, yPos);

                // separator
                p.stroke('#f3f3f3'); p.strokeWeight(1);
                p.line(respColX, yPos, respColX + respColW, yPos);
                p.noStroke();

                // IKEA response markers
                stores.forEach(function (st) {
                    if (!matchCity(c.city, st.city)) return;
                    if (st.opening_year != null && st.opening_year >= MIN_YEAR && st.opening_year <= MAX_YEAR) {
                        var x = xYear(st.opening_year);
                        var isCity = st.store_format === 'city_store' ||
                                     st.store_format === 'planning_studio' ||
                                     st.store_format === 'plan_order_point';
                        if (isCity) {
                            p.fill('#FFDB00'); p.stroke('#1a1a1a'); p.strokeWeight(1);
                            p.ellipse(x, yPos, 11, 11); p.noStroke();
                        } else {
                            p.fill(col + '55'); p.noStroke();
                            p.ellipse(x, yPos, 7, 7);
                        }
                    }
                    if (st.closure_year != null && st.closure_year >= MIN_YEAR && st.closure_year <= MAX_YEAR) {
                        var xc = xYear(st.closure_year);
                        p.fill('#3a3a3a'); p.noStroke();
                        p.triangle(xc, yPos + 6, xc - 5, yPos - 4, xc + 5, yPos - 4);
                    }
                });
            });

            p.pop();
        }
    };
})();
