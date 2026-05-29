// viz_timeline.js — Two IKEAs viz 3: Gantt-style strategic event timeline
// Section 5: Western response highlighted (other tiles faded)
// Section 6: East Asian response highlighted
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    var lanes = [
        { key: 'urban_format',        label: 'Urban format' },
        { key: 'service_partnership', label: 'Service partner.' },
        { key: 'resale_circularity',  label: 'Resale / circ.' },
        { key: 'channel_innovation',  label: 'Channel innov.' },
        { key: 'strategy_pivot',      label: 'Strategy pivot' },
        { key: 'price_cut',           label: 'Price cut' },
        { key: 'closure',             label: 'City-store closure' },
        { key: 'store_expansion',     label: 'Big-box expansion' },
    ];
    var Y_MIN = 2014, Y_MAX = 2026;

    function regimeFill(ev, dimmed) {
        var base;
        if (ev.regime_type === 'east_asia') base = '#FBD914';      // IKEA yellow
        else if (ev.regime_type === 'western') base = '#0058AB';   // IKEA blue
        else if (ev.regime_type === 'both') base = '#1a1a1a';      // neutral (was orange #E0A800)
        else base = '#888';
        return dimmed ? base + '40' : base;
    }

    // Tile label: dark ink on yellow, white on blue/black.
    function tileTextColor(ev) {
        return ev.regime_type === 'east_asia' ? '#1a1a1a' : '#fff';
    }

    function isHighlighted(ev, regimeFilter) {
        if (!regimeFilter) return true;
        return ev.regime_type === regimeFilter || ev.regime_type === 'both';
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

            var cfg = (manager.state && manager.state.vizConfig) || {};
            var regimeFilter = cfg.regime || null;

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            var innerL = 130, innerR = 30, innerT = 50, innerB = 50;
            var laneH = (H - innerT - innerB) / lanes.length;
            // Pad both ends of the year range by 0.5 so 2014/2026 tiles don't clip
            function xYear(y) { return p.map(y, Y_MIN - 0.5, Y_MAX + 0.5, innerL + 10, W - innerR - 10); }
            var yearW = (W - innerR - innerL - 20) / (Y_MAX - Y_MIN + 1);

            var grouped = {};
            events.forEach(function (e) {
                var k = e.response_type + '|' + e.event_year;
                grouped[k] = grouped[k] || [];
                grouped[k].push(e);
            });

            // Section title — amber for East (yellow itself is unreadable as text)
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C9A800' : regimeFilter === 'western' ? '#0058AB' : '#333');
            p.textStyle(p.BOLD); p.textSize(13);
            p.textAlign(p.LEFT, p.BOTTOM);
            var title = regimeFilter === 'east_asia'
                ? 'EAST ASIAN STRATEGIC RESPONSE (2014-2026)'
                : regimeFilter === 'western'
                    ? 'WESTERN STRATEGIC RESPONSE (2014-2026)'
                    : 'STRATEGIC RESPONSE TIMELINE';
            p.text(title, innerL, innerT - 24);

            // Lane backgrounds + labels
            lanes.forEach(function (lane, i) {
                p.noStroke();
                p.fill(i % 2 === 0 ? '#fafafa' : 'white');
                p.rect(innerL, innerT + i * laneH, W - innerL - innerR, laneH);
                p.fill('#1a1a1a'); p.textSize(11); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(lane.label, innerL - 8, innerT + i * laneH + laneH / 2);
                p.textStyle(p.NORMAL);
            });

            // Year axis ticks
            p.fill('#888'); p.textSize(10); p.textAlign(p.CENTER, p.BOTTOM);
            for (var y = Y_MIN; y <= Y_MAX; y++) {
                var x = xYear(y);
                p.stroke('#eee'); p.line(x, innerT, x, H - innerB);
                p.noStroke();
                if (y % 2 === 0 || y === Y_MIN) { p.fill('#888'); p.text(y, x, innerT - 6); }
            }

            // Convert canvas mouse → translated sketch coords
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;

            // Tiles + hover detection
            var hoverEv = null;
            lanes.forEach(function (lane, li) {
                var ly = innerT + li * laneH;
                for (var yr = Y_MIN; yr <= Y_MAX; yr++) {
                    var k = lane.key + '|' + yr;
                    var evs = grouped[k];
                    if (!evs) continue;
                    var tileW = Math.min(yearW - 3, 78);
                    var tileH = (laneH - 6) / evs.length;
                    evs.forEach(function (ev, ei) {
                        var tx = xYear(yr) - tileW / 2;
                        var ty = ly + 3 + ei * tileH;
                        var hi = isHighlighted(ev, regimeFilter);
                        p.noStroke();
                        p.fill(regimeFill(ev, !hi));
                        p.rect(tx, ty, tileW, tileH - 1.5, 2);
                        if (hi) {
                            p.fill(tileTextColor(ev));
                            p.textSize(Math.max(7, Math.min(9, tileH - 4)));
                            p.textAlign(p.LEFT, p.CENTER);
                            var label = ev.event_name || '';
                            var maxChars = Math.max(8, Math.floor(tileW / 5));
                            var shown = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
                            p.text(shown, tx + 4, ty + (tileH - 1.5) / 2);
                        }
                        // hover check (in translated sketch space)
                        if (mx >= tx && mx <= tx + tileW &&
                            my >= ty && my <= ty + tileH) {
                            hoverEv = ev;
                        }
                    });
                }
            });

            // Legend (bottom — placed in the dedicated bottom-margin band)
            p.noStroke(); p.textSize(10); p.textAlign(p.LEFT, p.TOP); p.fill('#333');
            var legY = H - innerB + 18;
            var lx = innerL;
            // Show one swatch per color the reader actually sees on screen.
            // When a regime is highlighted, tiles from the OTHER regime are
            // drawn with +'40' alpha — so the faded swatch must use the SAME
            // base color, not a generic gray.
            var legendItems = regimeFilter === 'east_asia'
                ? [
                    { c: '#FBD914',   label: 'East Asian (focus)' },
                    { c: '#1a1a1a',   label: 'Global / both' },
                    { c: '#0058AB40', label: 'Western (faded)' },
                ]
                : regimeFilter === 'western'
                ? [
                    { c: '#0058AB',   label: 'Western (focus)' },
                    { c: '#1a1a1a',   label: 'Global / both' },
                    { c: '#FBD91440', label: 'East Asian (faded)' },
                ]
                : [
                    { c: '#0058AB', label: 'Western' },
                    { c: '#FBD914', label: 'East Asian' },
                    { c: '#1a1a1a', label: 'Global / both' },
                ];
            legendItems.forEach(function (it) {
                // Faded swatches at 25% alpha are nearly invisible on the white
                // toolbar strip — add a thin neutral border so the reader can
                // still locate them.
                var isFaded = /\(faded\)/.test(it.label);
                if (isFaded) { p.stroke('#bbb'); p.strokeWeight(0.6); }
                else         { p.noStroke(); }
                p.fill(it.c);
                p.rect(lx, legY + 4, 9, 9);
                p.noStroke();
                p.fill('#333'); p.text(it.label, lx + 13, legY + 2);
                lx += p.textWidth(it.label) + 35;
            });

            p.pop();

            // Tooltip
            if (hoverEv && window.VizTooltip) {
                var ev = hoverEv;
                var regimeLabel = ev.regime_type === 'east_asia' ? 'East Asia'
                                : ev.regime_type === 'western'   ? 'West'
                                : ev.regime_type === 'both'      ? 'Global / both' : 'Other';
                var html =
                    '<div class="tt-name">' + ev.event_year + ' · ' + ev.event_name + '</div>' +
                    '<div class="tt-row"><b>Type</b> ' + (ev.response_type || '').replace(/_/g, ' ') + '</div>' +
                    '<div class="tt-row"><b>Market</b> ' + (ev.market || '') + (ev.country_or_region ? ' (' + ev.country_or_region + ')' : '') + ' · ' + regimeLabel + '</div>' +
                    (ev.short_description ? '<div class="tt-note">' + ev.short_description + '</div>' : '') +
                    (ev.source_url ? '<div class="tt-src"><a href="' + ev.source_url + '" target="_blank" rel="noopener">' +
                        (function(u){ try { return new URL(u).hostname; } catch (e) { return 'source'; }})(ev.source_url) +
                     '</a></div>' : '');
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
