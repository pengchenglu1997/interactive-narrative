// viz_response.js — Two IKEAs viz 2: Housing pressure × IKEA response
// Per-city row: PTI bar (left) joined with IKEA city-format markers (right) over time
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

            // Sort descending by PTI; cap to top N to fit
            var rows = housing
                .filter(function (c) { return c.price_to_income_ratio != null; })
                .slice()
                .sort(function (a, b) { return b.price_to_income_ratio - a.price_to_income_ratio; });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var padInner = { l: 110, r: 20, t: 36, b: 22 };
            var maxRows = Math.min(rows.length, 24);
            var rowH = Math.max(14, Math.floor((H - padInner.t - padInner.b) / maxRows));
            rows = rows.slice(0, maxRows);

            var maxPTI = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.price_to_income_ratio; })) / 5) * 5;
            var barColW = Math.min(220, (W - padInner.l - padInner.r) * 0.32);
            var respColX = padInner.l + barColW + 24;
            var respColW = W - respColX - padInner.r;
            function xPTI(v) { return padInner.l + (v / maxPTI) * barColW; }
            function xYear(y) { return respColX + ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * respColW; }

            // Column titles
            p.noStroke(); p.fill('#1a1a1a'); p.textStyle(p.BOLD); p.textSize(10);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text('PRICE-TO-INCOME RATIO', padInner.l, padInner.t - 8);
            p.text("IKEA'S CITY-FORMAT RESPONSE", respColX, padInner.t - 8);
            p.textStyle(p.NORMAL);

            // PTI scale
            p.fill('#888'); p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM);
            for (var v = 0; v <= maxPTI; v += 10) p.text(v, xPTI(v), padInner.t - 4);
            // Year scale
            for (var y = 1970; y <= 2020; y += 10) {
                var x = xYear(y);
                p.stroke('#eee'); p.line(x, padInner.t, x, H - padInner.b);
                p.noStroke(); p.fill('#888'); p.text(y, x, padInner.t - 4);
            }
            p.text(2026, xYear(2026), padInner.t - 4);

            // Rows
            rows.forEach(function (c, i) {
                var yPos = padInner.t + i * rowH + rowH / 2;
                // city label
                p.noStroke(); p.fill('#1a1a1a'); p.textSize(10);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(c.city, padInner.l - 6, yPos);

                // PTI bar
                var col = regimeColor(c.region_type);
                var bw = xPTI(c.price_to_income_ratio) - padInner.l;
                p.fill(col);
                p.rect(padInner.l, yPos - Math.min(7, rowH / 2 - 1), bw, Math.min(14, rowH - 2), 2);
                p.fill('#1a1a1a'); p.textAlign(p.LEFT, p.CENTER); p.textSize(9);
                p.text(c.price_to_income_ratio.toFixed(1), padInner.l + bw + 3, yPos);

                // separator
                p.stroke('#f3f3f3'); p.strokeWeight(1);
                p.line(respColX, yPos, respColX + respColW, yPos);
                p.noStroke();

                // IKEA response markers
                stores.forEach(function (st) {
                    if (!matchCity(c.city, st.city)) return;
                    if (st.opening_year != null && st.opening_year >= MIN_YEAR && st.opening_year <= MAX_YEAR) {
                        var x = xYear(st.opening_year);
                        var isCity = st.store_format === 'city_store' || st.store_format === 'planning_studio' || st.store_format === 'plan_order_point';
                        if (isCity) {
                            p.fill('#FFDB00'); p.stroke('#1a1a1a'); p.strokeWeight(1);
                            p.ellipse(x, yPos, 9, 9); p.noStroke();
                        } else {
                            p.fill(col + '55'); p.noStroke();
                            p.ellipse(x, yPos, 6, 6);
                        }
                    }
                    if (st.closure_year != null && st.closure_year >= MIN_YEAR && st.closure_year <= MAX_YEAR) {
                        var xc = xYear(st.closure_year);
                        p.fill('#3a3a3a'); p.noStroke();
                        p.triangle(xc, yPos + 5, xc - 4, yPos - 4, xc + 4, yPos - 4);
                    }
                });
            });

            // Legend
            p.noStroke(); p.textSize(9); p.textAlign(p.LEFT, p.TOP);
            var legY = H - padInner.b + 6;
            p.fill('#FFDB00'); p.stroke('#1a1a1a'); p.strokeWeight(1);
            p.ellipse(respColX + 6, legY + 6, 8, 8); p.noStroke();
            p.fill('#333'); p.text('city-format open', respColX + 14, legY + 2);
            p.fill('#3a3a3a'); p.triangle(respColX + 130, legY + 9, respColX + 126, legY + 2, respColX + 134, legY + 2);
            p.fill('#333'); p.text('city-format closed', respColX + 140, legY + 2);
            p.fill('#888'); p.ellipse(respColX + 270, legY + 6, 6, 6);
            p.text('big-box (context)', respColX + 280, legY + 2);

            p.pop();
        }
    };
})();
