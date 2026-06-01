// viz_response.js — Two IKEAs viz 2: Housing pressure × IKEA response (cleaned up)
// Section 3: regime='east_asia' — East Asian cities ranked by PTI
// Section 4: regime='western'   — Western cities ranked by PTI
//
// Three columns only: city | PTI bar with value | verdict.
// The year timeline strip removed for clarity (per user feedback v3).
(function () {
    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western':   return '#0058AB';   // IKEA blue
            case 'east_asia': return '#FBD914';   // IKEA yellow
            default: return '#888';
        }
    }

    var cityAliases = { 'new york city': ['new york'], 'washington dc': ['washington'] };
    function normalize(s) { return (s || '').trim().toLowerCase(); }
    function matchCity(housingCity, storeCity) {
        var h = normalize(housingCity), s = normalize(storeCity);
        if (h === s) return true;
        var aliases = cityAliases[h];
        return !!(aliases && aliases.indexOf(s) !== -1);
    }

    function storesIn(stores, city) {
        return stores.filter(function (s) { return matchCity(city, s.city); });
    }

    window.VizResponse = {
        draw: function (p, manager, ai, progress) {
            var housing = (manager.data && manager.data.housing) || [];
            var stores = (manager.data && manager.data.stores) || [];
            if (!housing.length) {
                p.push(); p.fill('#888'); p.textSize(13);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading housing data…', manager.width / 2, manager.height / 2);
                p.pop(); return;
            }

            var cfg = (manager.state && manager.state.vizConfig) || {};
            var regime = cfg.regime || null;

            var rows = housing
                .filter(function (c) { return c.price_to_income_ratio != null; })
                .filter(function (c) { return !regime || c.region_type === regime; })
                .slice()
                .sort(function (a, b) { return b.price_to_income_ratio - a.price_to_income_ratio; });

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var innerL = 150;
            var innerR = 30;
            var innerT = 64;
            var innerB = 28;
            var n = Math.max(rows.length, 1);
            var rowH = Math.max(32, Math.floor((H - innerT - innerB) / n));

            var maxPTI = 0;
            rows.forEach(function (r) { if (r.price_to_income_ratio > maxPTI) maxPTI = r.price_to_income_ratio; });
            maxPTI = Math.max(maxPTI, 10);

            // Bar takes the middle 45% of the available width; verdict the right ~45%
            var contentW = W - innerL - innerR;
            var barW = Math.min(280, contentW * 0.42);
            var contentX = innerL;
            var verdictX = innerL + barW + 32;

            function xPTI(v) { return contentX + (v / maxPTI) * barW; }

            // Section title — amber for East (raw yellow is unreadable as text)
            p.noStroke();
            p.fill(regime === 'east_asia' ? '#C9A800' : regime === 'western' ? '#0058AB' : '#333');
            p.textStyle(p.BOLD); p.textSize(14);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text(regime === 'east_asia'
                ? 'EAST ASIAN CITIES — HOUSING PRESSURE × IKEA RESPONSE'
                : regime === 'western'
                    ? 'WESTERN CITIES — HOUSING PRESSURE × IKEA RESPONSE'
                    : 'HOUSING PRESSURE × IKEA RESPONSE',
                10, innerT - 38);

            // Column headers
            p.fill('#888'); p.textStyle(p.NORMAL); p.textSize(11);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text('PRICE-TO-INCOME RATIO', contentX, innerT - 8);
            p.text('CITY-FORMAT RESULT', verdictX, innerT - 8);

            // Convert canvas-space mouse coords into the sketch's translated
            // coordinate system so hit detection matches what's drawn.
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;

            var hoverRow = null;

            // Rows
            rows.forEach(function (c, i) {
                var yPos = innerT + i * rowH + rowH / 2;
                var rowTop = innerT + i * rowH;
                if (mx > 0 && mx < W &&
                    my >= rowTop && my < rowTop + rowH) {
                    hoverRow = c;
                }

                // City label
                p.noStroke(); p.fill('#1a1a1a'); p.textSize(13); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(c.city, innerL - 10, yPos);
                p.textStyle(p.NORMAL);

                // Compute city-format status first — it controls both the
                // PTI bar color AND the verdict.
                var cityStores = storesIn(stores, c.city);
                var cityFormatStores = cityStores.filter(function (s) {
                    var f = s.store_format;
                    return f === 'city_store' || f === 'planning_studio' || f === 'plan_order_point';
                });
                var openCity   = cityFormatStores.filter(function (s) { return s.closure_year == null; }).length;
                var closedCity = cityFormatStores.filter(function (s) { return s.closure_year != null; }).length;
                var bigBoxCount = cityStores.filter(function (s) { return s.store_format === 'big-box'; }).length;

                // PTI bar — regime color (IKEA blue for West, IKEA yellow
                // for East) only when the city actually HAS an active
                // city-format store. Cities without one get a neutral gray
                // bar so the eye doesn't misread 'colored bar' as
                // 'IKEA showed up'. Per user feedback: the prior all-bars-
                // colored variant was misleading.
                var hasCityStore = openCity > 0;
                var col = hasCityStore ? regimeColor(c.region_type) : '#cfcfcf';
                var bw = xPTI(c.price_to_income_ratio) - contentX;
                var bh = Math.min(20, rowH - 8);
                p.fill(col);
                p.rect(contentX, yPos - bh / 2, bw, bh, 2);
                p.fill('#1a1a1a'); p.textAlign(p.LEFT, p.CENTER); p.textSize(11);
                p.text(c.price_to_income_ratio.toFixed(1), contentX + bw + 6, yPos);

                // Verdict — no amber on either page. The "warning" weight
                // of mixed / all-closed status is communicated by a gray
                // subtitle ("(N closed since)") rather than by a third
                // colour that competed with the regime palette. Verdict
                // main color stays binary: regime if any city store is
                // currently open, gray if none.
                //
                //   ✓ N open                  → regime color (blue / amber-yellow text)
                //   ⚠ N open + M closed       → regime color + gray "(M closed since)" subtitle
                //   ⚠ all opened then closed → gray + gray "(was N)" subtitle
                //   ✗ none ever               → gray
                var verdict, subtitle, verdictColor;
                // Yellow itself is unreadable as small bold text on white —
                // use amber (#C9A800) for East verdicts; IKEA blue for West.
                var regimeText = c.region_type === 'east_asia' ? '#C9A800' : '#0058AB';
                if (openCity === 0 && closedCity === 0) {
                    verdict      = '✗  No city store';
                    verdictColor = '#888';
                    subtitle     = '';
                } else if (closedCity > 0 && openCity === 0) {
                    verdict      = '⚠  All closed';
                    verdictColor = '#888';
                    subtitle     = '(was ' + closedCity + ')';
                } else if (closedCity > 0) {
                    verdict      = '✓  ' + openCity + ' city store' + (openCity > 1 ? 's' : '') + ' open';
                    verdictColor = regimeText;
                    subtitle     = '(' + closedCity + ' closed since)';
                } else {
                    verdict      = '✓  ' + openCity + ' city store' + (openCity > 1 ? 's' : '') + ' open';
                    verdictColor = regimeText;
                    subtitle     = '';
                }
                p.noStroke(); p.fill(verdictColor);
                p.textSize(13); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(verdict, verdictX, yPos);
                var cursor = verdictX + p.textWidth(verdict);
                if (subtitle) {
                    p.fill('#888'); p.textStyle(p.NORMAL); p.textSize(11);
                    p.text(' ' + subtitle, cursor, yPos);
                    cursor += p.textWidth(' ' + subtitle);
                }
                if (bigBoxCount > 0) {
                    p.fill('#888'); p.textStyle(p.NORMAL); p.textSize(11);
                    p.text('  (+' + bigBoxCount + ' big-box)', cursor, yPos);
                }
            });

            p.pop();

            // Tooltip
            if (hoverRow && window.VizTooltip) {
                var cs = storesIn(stores, hoverRow.city);
                var city = hoverRow;
                var cf = cs.filter(function (s) {
                    var f = s.store_format;
                    return f === 'city_store' || f === 'planning_studio' || f === 'plan_order_point';
                });
                var openC = cf.filter(function (s) { return s.closure_year == null; }).length;
                var closedC = cf.filter(function (s) { return s.closure_year != null; }).length;
                var bb = cs.filter(function (s) { return s.store_format === 'big-box'; }).length;
                var html =
                    '<div class="tt-name">' + city.city + ', ' + (city.country || '') + '</div>' +
                    '<div class="tt-row"><b>PTI</b> ' + city.price_to_income_ratio.toFixed(2) + '</div>' +
                    (city.mortgage_pct_of_income ? '<div class="tt-row"><b>Mortgage % income</b> ' + city.mortgage_pct_of_income + '%</div>' : '') +
                    (city.renter_share ? '<div class="tt-row"><b>Renter share</b> ' + city.renter_share + '%</div>' : '') +
                    '<div class="tt-row"><b>Stores</b> ' +
                        (openC + closedC > 0 ? openC + ' city-format open, ' + closedC + ' closed; ' : '') +
                        bb + ' big-box</div>' +
                    (city.notes ? '<div class="tt-note">' + city.notes + '</div>' : '');
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
