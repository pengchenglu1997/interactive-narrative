// viz_timeline.js — Two IKEAs viz 3: Gantt-style strategic event timeline
// Section 5: Western response highlighted (other tiles faded)
// Section 6: East Asian response highlighted
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    // Lanes grouped narratively, with a dashed divider between groups.
    // `groupAfter: true` means "draw the dashed divider line below this
    // lane" (so it sits between the last lane of group N and the first
    // lane of group N+1).
    //
    //   Physical network  → urban_format, city-store closure
    //   Service / channel → channel innovation, service partner., resale
    //   Pricing / strategy → price cut, strategy pivot
    //
    // store_expansion (big-box) dropped per author feedback — only 1
    // dated event in the data anyway (Gwangmyeong 2014, outside the new
    // 2016+ window) and it competed visually with the city-format story.
    // service_partnership + resale_circularity merged into one
    // "Service & circular" lane — each had only 1 event in the
    // post-2016 window (TaskRabbit 2017, Buyback 2020), and they
    // both belong to the same "extends original model with
    // service / sustainability additions" semantic group.
    var lanes = [
        { key: 'urban_format',       label: 'Urban format',         groupAfter: false },
        { key: 'closure',            label: 'City-store closure',   groupAfter: true  },
        { key: 'channel_innovation', label: 'Channel innov.',       groupAfter: false },
        { key: 'service_circular',   label: 'Service & circular',   groupAfter: true  },
        { key: 'price_cut',          label: 'Price cut',            groupAfter: false },
        { key: 'strategy_pivot',     label: 'Strategy pivot',       groupAfter: false },
    ];

    // event.response_type → lane.key. Most are identity; only the
    // merged lane needs aliasing.
    function laneKeyFor(responseType) {
        if (responseType === 'service_partnership' ||
            responseType === 'resale_circularity') return 'service_circular';
        return responseType;
    }
    // Y_MIN starts at the CEO urban-strategy announcement; the
    // pre-2016 events were big-box openings that aren't in this chart.
    var Y_MIN = 2016, Y_MAX = 2026;

    function regimeFill(ev, dimmed) {
        var base;
        if (ev.regime_type === 'east_asia') base = '#FBD914';      // IKEA yellow
        else if (ev.regime_type === 'western') base = '#0058AB';   // IKEA blue
        else if (ev.regime_type === 'both') base = '#888';         // neutral gray (was black; black read as a heavier third regime)
        else base = '#bbb';
        return dimmed ? base + '40' : base;
    }

    // Tile label: dark ink on yellow + gray (light fills), white on blue.
    function tileTextColor(ev) {
        if (ev.regime_type === 'east_asia') return '#1a1a1a';
        if (ev.regime_type === 'both')      return '#fff';
        return '#fff';
    }

    // Tile labels target 7-10 characters because the year columns
    // are only ~60-70 px wide at typical viewport, fitting roughly
    // 10 chars at 11pt. Earlier 12-18 char outputs were still
    // truncating to '…' on screen.
    function shortLabel(name) {
        if (!name) return '';
        return name
            // Per-event explicit short forms (target 7-10 chars).
            .replace(/^IKEA Harajuku and Shinjuku close$/i, 'HRJ+SHJ')
            .replace(/^Tottenham Court Road.*$/i, 'Tottenham')
            .replace(/^San Francisco Market Street.*$/i, 'SF Market')
            .replace(/^Oxford Street London flagship opens$/i, 'Oxford St')
            .replace(/^Greenwich sustainability flagship opens$/i, 'Greenwich')
            .replace(/^Vienna Westbahnhof.*$/i, 'Vienna')
            .replace(/^Manhattan Planning Studio opens$/i, 'Manhattan')
            .replace(/^Hammersmith London opens$/i, 'Hammersm.')
            .replace(/^Taipei Neihu.*$/i, 'Taipei')
            .replace(/^Singapore Jurong opens$/i, 'Jurong')
            .replace(/^Gangdong Seoul opens$/i, 'Gangdong')
            .replace(/^Paris La Madeleine opens$/i, 'Paris')
            .replace(/^Tokyo business optimization announcement$/i, 'Tokyo opt')
            .replace(/^IKEA Shibuya renewal reopens$/i, 'Shibuya re')
            .replace(/^IKEA Shibuya opens$/i, 'Shibuya')
            .replace(/^IKEA Harajuku opens$/i, 'Harajuku')
            .replace(/^IKEA Shinjuku opens$/i, 'Shinjuku')
            .replace(/^Shanghai Jing'an city store opens$/i, "Jing'an")
            .replace(/^Shanghai Jing'an closure announced$/i, "Jing'an x")
            .replace(/^IKEA Shanghai Yangpu closes$/i, 'Yangpu')
            .replace(/^IKEA Guiyang closes$/i, 'Guiyang')
            .replace(/^IKEA global price cuts EUR 2\.1B$/i, 'EUR 2.1B')
            .replace(/^China major price cuts March$/i, 'Price cut')
            .replace(/^IKEA China RMB 6\.3B reinvestment$/i, 'RMB 6.3B')
            .replace(/^IKEA China revenue trough$/i, 'Rev −30%')
            .replace(/^Lifeweek price strategy coverage$/i, 'Lifeweek')
            .replace(/^Future of IKEA announcement$/i, 'Future IK')
            .replace(/^CEO urban strategy announcement$/i, 'CEO urban')
            .replace(/^Buyback and Resell launched$/i, 'Buyback')
            .replace(/^TaskRabbit acquisition$/i, 'TaskRabbt')
            .replace(/^IKEA Place AR app launches$/i, 'Place AR')
            .replace(/^IKEA Japan online shop launches$/i, 'Japan onl')
            .replace(/^IKEA Korea e-commerce launches$/i, 'Korea EC')
            .replace(/^IKEA China web shop launches$/i, 'CN web')
            .replace(/^IKEA China Tmall flagship launches$/i, 'Tmall')
            .replace(/^IKEA China JD\.com flagship launches$/i, 'JD.com')
            // Generic safety net for anything else
            .replace(/^IKEA\s+/, '')
            .replace(/\s+launches?$/i, '')
            .replace(/\s+opens?$/i, '')
            .replace(/\s+closes?$/i, ' close');
    }

    // Display-time filter for redundant near-duplicate events:
    //   - 2025 "Harajuku and Shinjuku closure announced" duplicates
    //     2026 "IKEA Harajuku and Shinjuku close" (same event, two
    //     reporting moments). Keep the 2026 actual closure tile.
    //   - 2025 "Tokyo Harajuku format optimization reset" overlaps
    //     2025 "Tokyo business optimization announcement" (same
    //     IKEA Japan strategic reset). Keep the broader business
    //     optimization tile.
    var REDUNDANT_EVENTS = [
        'Harajuku and Shinjuku closure announced',
        'Tokyo Harajuku format optimization reset',
    ];
    function isRedundantForTimeline(ev) {
        return REDUNDANT_EVENTS.indexOf(ev.event_name) >= 0;
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
                    e.response_type !== 'corporate_report' &&
                    !isRedundantForTimeline(e);
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
                var k = laneKeyFor(e.response_type) + '|' + e.event_year;
                grouped[k] = grouped[k] || [];
                grouped[k].push(e);
            });

            // Section title — amber for East (yellow itself is unreadable as text)
            p.noStroke();
            p.fill(regimeFilter === 'east_asia' ? '#C9A800' : regimeFilter === 'western' ? '#0058AB' : '#333');
            p.textStyle(p.BOLD); p.textSize(16);
            p.textAlign(p.LEFT, p.BOTTOM);
            var title = regimeFilter === 'east_asia'
                ? 'EAST ASIAN STRATEGIC RESPONSE (' + Y_MIN + '–' + Y_MAX + ')'
                : regimeFilter === 'western'
                    ? 'WESTERN STRATEGIC RESPONSE (' + Y_MIN + '–' + Y_MAX + ')'
                    : 'STRATEGIC RESPONSE TIMELINE';
            p.text(title, innerL, innerT - 28);

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

            // Dashed group dividers — drawn between lanes that have
            // `groupAfter: true`. Sits on the lane boundary (laneH * (i+1))
            // and spans the chart's data area + the label strip so the
            // group break reads in the label column too.
            p.stroke('#bbb'); p.strokeWeight(0.9);
            // p5 doesn't have built-in dashed lines; draw a sequence
            // of short segments instead.
            function drawDashed(x1, y, x2, dash, gap) {
                var dx = dash + gap;
                for (var x = x1; x < x2; x += dx) {
                    var xe = Math.min(x + dash, x2);
                    p.line(x, y, xe, y);
                }
            }
            lanes.forEach(function (lane, i) {
                if (!lane.groupAfter) return;
                var dy = innerT + (i + 1) * laneH;
                drawDashed(innerL - 100, dy, W - innerR, 6, 4);
            });
            p.noStroke();

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
                    // Tile width: capped at 110 (was 78) — gives event text
                    // ~40% more room. Font cap raised to 11 (was 9). Both
                    // changes assume the new 6-lane / merged-resale layout
                    // gives laneH more room vertically too.
                    var tileW = Math.min(yearW - 3, 110);
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
                            p.textSize(Math.max(8, Math.min(11, tileH - 4)));
                            p.textAlign(p.LEFT, p.CENTER);
                            var label = shortLabel(ev.event_name || '');
                            var maxChars = Math.max(10, Math.floor(tileW / 5.5));
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
            p.noStroke(); p.textSize(12); p.textAlign(p.LEFT, p.TOP); p.fill('#333');
            var legY = H - innerB + 18;
            var lx = innerL;
            // Show one swatch per color the reader actually sees on screen.
            // When a regime is highlighted, tiles from the OTHER regime are
            // drawn with +'40' alpha — so the faded swatch must use the SAME
            // base color, not a generic gray.
            var legendItems = regimeFilter === 'east_asia'
                ? [
                    { c: '#FBD914',   label: 'East Asian (focus)' },
                    { c: '#888',      label: 'Global / both' },
                    { c: '#0058AB40', label: 'Western (faded)' },
                ]
                : regimeFilter === 'western'
                ? [
                    { c: '#0058AB',   label: 'Western (focus)' },
                    { c: '#888',      label: 'Global / both' },
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
