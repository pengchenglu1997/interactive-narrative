// viz_response.js — Two IKEAs viz 2: Housing pressure × IKEA response (combined)
// Renders BOTH regions side by side in one chart:
//   left  = East Asian cities (yellow bars, amber verdict text)
//   right = Western cities    (blue   bars, blue  verdict text)
//
// Sections 3 and 4 both call this with a `regime` hint (east_asia / western),
// but the chart itself is identical in both — the same comparison artifact.
// The prose in each section guides the reader to interpret a different
// column. PTI scale is SHARED across both columns so the height gap (East
// 23–34 vs West 7–16) is the point of the visual.
(function () {
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
    // Per-row store-format tally — drives bar colour and verdict text.
    function summarize(stores, city) {
        var cityStores = storesIn(stores, city);
        var cityFormat = cityStores.filter(function (s) {
            var f = s.store_format;
            return f === 'city_store' || f === 'planning_studio' || f === 'plan_order_point';
        });
        return {
            openCity:    cityFormat.filter(function (s) { return s.closure_year == null; }).length,
            closedCity:  cityFormat.filter(function (s) { return s.closure_year != null; }).length,
            bigBoxCount: cityStores.filter(function (s) { return s.store_format === 'big-box'; }).length,
        };
    }

    window.VizResponse = {
        draw: function (p, manager, ai, progress) {
            var housing = (manager.data && manager.data.housing) || [];
            var stores  = (manager.data && manager.data.stores)  || [];
            if (!housing.length) {
                p.push(); p.fill('#888'); p.textSize(13);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading housing data…', manager.width / 2, manager.height / 2);
                p.pop(); return;
            }

            // Both columns shown regardless of which section we're in.
            var east = housing
                .filter(function (c) { return c.region_type === 'east_asia' && c.price_to_income_ratio != null; })
                .slice()
                .sort(function (a, b) { return b.price_to_income_ratio - a.price_to_income_ratio; });
            var west = housing
                .filter(function (c) { return c.region_type === 'western'   && c.price_to_income_ratio != null; })
                .slice()
                .sort(function (a, b) { return b.price_to_income_ratio - a.price_to_income_ratio; });

            // SHARED PTI max — makes the East-high / West-low gap a
            // visual fact, not a number-reading exercise.
            var maxPTI = 10;
            east.concat(west).forEach(function (c) {
                if (c.price_to_income_ratio > maxPTI) maxPTI = c.price_to_income_ratio;
            });
            maxPTI = Math.ceil(maxPTI);   // a touch of headroom

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 20;
            var padT = (manager.margin && manager.margin.top)  || 0;

            p.push();
            p.translate(padL, padT);

            var innerT = 86, innerB = 20;
            var contentW = W - padL * 2;                 // both pads inside
            var colGap = 36;
            var colW = (contentW - colGap) / 2;
            var leftX  = 0;
            var rightX = colW + colGap;

            // Per-column internal layout — city label → bar → value → verdict.
            function colLayout(baseX) {
                var labelW   = 88;
                var labelX   = baseX + labelW;            // right-edge of city name
                var barX     = labelX + 8;                // bar start
                var verdictGap = 88;                      // px reserved for value + small gap
                var verdictW = 150;                       // verdict text column
                var barW     = colW - labelW - 8 - verdictGap - verdictW;
                if (barW < 60) barW = 60;
                var valueX   = barX + barW + 4;
                var verdictX = valueX + verdictGap - 4;
                return {
                    labelX:   labelX,
                    barX:     barX,
                    barW:     barW,
                    valueX:   valueX,
                    verdictX: verdictX,
                };
            }
            var L = colLayout(leftX);
            var R = colLayout(rightX);

            var maxRows = Math.max(east.length, west.length);
            var rowH = Math.max(28, Math.floor((H - innerT - innerB) / Math.max(maxRows, 1)));

            // === Title (centered, spans both columns) ===
            p.noStroke();
            p.fill('#1a1a1a');
            p.textStyle(p.BOLD); p.textSize(16);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text('CITY-FORMAT RESPONSE UNDER HOUSING PRESSURE', contentW / 2, innerT - 56);

            // === Subtitle ===
            p.fill('#666');
            p.textStyle(p.NORMAL); p.textSize(12);
            p.text('Selected cities, ranked by PTI within region · shared PTI scale', contentW / 2, innerT - 38);

            // === Column headers ===
            p.textStyle(p.BOLD); p.textSize(13);
            p.fill('#C9A800');                                    // amber — readable East
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text('EAST ASIAN CITIES', leftX  + colW / 2, innerT - 12);
            p.fill('#0058AB');                                    // IKEA blue — West
            p.text('WESTERN CITIES',    rightX + colW / 2, innerT - 12);
            p.textStyle(p.NORMAL);

            // Mouse → translated coords
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;
            var hoverRow = null;

            function drawRow(c, i, layout, regimeFill, regimeText) {
                var yPos   = innerT + i * rowH + rowH / 2;
                var rowTop = innerT + i * rowH;
                // Tooltip hit-test — column-specific
                if (mx >= layout.labelX - 90 && mx <= layout.verdictX + 150 &&
                    my >= rowTop && my < rowTop + rowH) {
                    hoverRow = c;
                }

                // City label (right-aligned to bar start)
                p.noStroke();
                p.fill('#1a1a1a');
                p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(c.city, layout.labelX, yPos);
                p.textStyle(p.NORMAL);

                // City-format status
                var s = summarize(stores, c.city);
                var hasCityStore = s.openCity > 0;

                // PTI bar — regime color only when a city-format store is
                // currently open; gray for "no urban response visible".
                var col = hasCityStore ? regimeFill : '#cfcfcf';
                var bw  = (c.price_to_income_ratio / maxPTI) * layout.barW;
                var bh  = Math.min(16, rowH - 10);
                p.fill(col);
                p.rect(layout.barX, yPos - bh / 2, bw, bh, 2);
                // PTI value at the bar's end
                p.fill('#1a1a1a');
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(11);
                p.text(c.price_to_income_ratio.toFixed(1), layout.barX + bw + 4, yPos);

                // Verdict (4 cases) — regime color for "any open", gray otherwise.
                var verdict, subtitle, vcolor;
                if (s.openCity === 0 && s.closedCity === 0) {
                    verdict  = 'No city store';
                    vcolor   = '#888';
                    subtitle = '';
                } else if (s.openCity === 0 && s.closedCity > 0) {
                    verdict  = 'All closed';
                    vcolor   = '#888';
                    subtitle = '(was ' + s.closedCity + ')';
                } else if (s.closedCity > 0) {
                    verdict  = s.openCity + ' city store' + (s.openCity > 1 ? 's' : '') + ' open';
                    vcolor   = regimeText;
                    subtitle = '(' + s.closedCity + ' closed since)';
                } else {
                    verdict  = s.openCity + ' city store' + (s.openCity > 1 ? 's' : '') + ' open';
                    vcolor   = regimeText;
                    subtitle = '';
                }
                p.noStroke();
                p.fill(vcolor);
                p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                var verdictY = subtitle ? yPos - 5 : yPos;
                p.text(verdict, layout.verdictX, verdictY);
                if (subtitle) {
                    p.fill('#888');
                    p.textStyle(p.NORMAL);
                    p.textSize(10);
                    p.text(subtitle, layout.verdictX, yPos + 8);
                }
                p.textStyle(p.NORMAL);
            }

            // === Draw both columns ===
            east.forEach(function (c, i) { drawRow(c, i, L, '#FBD914', '#C9A800'); });
            west.forEach(function (c, i) { drawRow(c, i, R, '#0058AB', '#0058AB'); });

            // === Footer note ===
            p.noStroke();
            p.fill('#888');
            p.textStyle(p.NORMAL);
            p.textSize(10);
            p.textAlign(p.LEFT, p.TOP);
            p.text('PTI = price-to-income ratio (Numbeo). Bar gray = no city-format store; coloured = at least one city-format store currently open.',
                0, innerT + maxRows * rowH + 4);

            p.pop();

            // === Tooltip ===
            if (hoverRow && window.VizTooltip) {
                var city = hoverRow;
                var s = summarize(stores, city.city);
                var html =
                    '<div class="tt-name">' + city.city + ', ' + (city.country || '') + '</div>' +
                    '<div class="tt-row"><b>PTI</b> ' + city.price_to_income_ratio.toFixed(2) + '</div>' +
                    (city.mortgage_pct_of_income ? '<div class="tt-row"><b>Mortgage % income</b> ' + city.mortgage_pct_of_income + '%</div>' : '') +
                    (city.renter_share ? '<div class="tt-row"><b>Renter share</b> ' + city.renter_share + '%</div>' : '') +
                    '<div class="tt-row"><b>Stores</b> ' +
                        (s.openCity + s.closedCity > 0 ? s.openCity + ' city-format open, ' + s.closedCity + ' closed; ' : '') +
                        s.bigBoxCount + ' big-box</div>' +
                    (city.notes ? '<div class="tt-note">' + city.notes + '</div>' : '');
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
