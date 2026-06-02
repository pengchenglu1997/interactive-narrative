// viz_timeline.js — Two IKEAs viz 3: Gantt-style strategic event timeline
// Section 5: Western response highlighted (other tiles faded)
// Section 6: East Asian response highlighted
//
// Filter passed via manager.state.vizConfig.regime ("east_asia" | "western" | null).
(function () {
    // Lanes grouped narratively, with a dashed divider between groups
    // and a group-name label rendered in the left margin so the reader
    // can see WHAT the three groups are without consulting prose.
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
    // One label per 2-lane group, rendered in the left margin
    // vertically centered between the two lanes it covers.
    var groupLabels = ['PHYSICAL', 'SERVICE', 'PRICING'];

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

    // No more dimming — both regimes always at full opacity. The
    // prose in each section directs the reader to look at the
    // yellow tiles vs the blue tiles. Faded tiles previously read
    // as bugs / colour bleed and broke the comparison.
    function regimeFill(ev) {
        if (ev.regime_type === 'east_asia') return '#FBD914';      // IKEA yellow
        if (ev.regime_type === 'western')   return '#0058AB';      // IKEA blue
        if (ev.regime_type === 'both')      return '#888';         // global / neutral
        return '#bbb';
    }

    // Tile label: dark ink on yellow + gray (light fills), white on blue.
    function tileTextColor(ev) {
        if (ev.regime_type === 'east_asia') return '#1a1a1a';
        if (ev.regime_type === 'both')      return '#fff';
        return '#fff';
    }

    // Tile labels — target 10–16 characters. Was 7–10 with cryptic
    // codes like 'HRJ+SHJ', 'TaskRabbt', 'Place AR', 'Future IK' that
    // a first-time reader couldn't decode without tooltip-hovering.
    // With tileW bumped to 140 (was 110) and font to 13pt (was 11),
    // there's room for human-readable forms.
    function shortLabel(name) {
        if (!name) return '';
        return name
            // Closures
            .replace(/^IKEA Harajuku and Shinjuku close$/i, 'Tokyo closures')
            .replace(/^IKEA Shanghai Yangpu closes$/i, 'Shanghai Yangpu')
            .replace(/^IKEA Guiyang closes$/i, 'Guiyang')
            .replace(/^Shanghai Jing'an closure announced$/i, "Jing'an close")
            // Urban-format openings
            .replace(/^Tottenham Court Road.*$/i, 'Tottenham')
            .replace(/^San Francisco Market Street.*$/i, 'SF Market St')
            .replace(/^Oxford Street London flagship opens$/i, 'Oxford St')
            .replace(/^Greenwich sustainability flagship opens$/i, 'Greenwich')
            .replace(/^Vienna Westbahnhof.*$/i, 'Vienna')
            .replace(/^Manhattan Planning Studio opens$/i, 'Manhattan')
            .replace(/^Hammersmith London opens$/i, 'Hammersmith')
            .replace(/^Taipei Neihu.*$/i, 'Taipei Neihu')
            .replace(/^Singapore Jurong opens$/i, 'Singapore Jurong')
            .replace(/^Gangdong Seoul opens$/i, 'Seoul Gangdong')
            .replace(/^Paris La Madeleine opens$/i, 'Paris')
            .replace(/^IKEA Shibuya renewal reopens$/i, 'Shibuya renewal')
            .replace(/^IKEA Shibuya opens$/i, 'Shibuya')
            .replace(/^IKEA Harajuku opens$/i, 'Harajuku')
            .replace(/^IKEA Shinjuku opens$/i, 'Shinjuku')
            .replace(/^Shanghai Jing'an city store opens$/i, "Shanghai Jing'an")
            // Strategy / pricing
            .replace(/^Tokyo business optimization announcement$/i, 'Tokyo reset')
            .replace(/^IKEA global price cuts EUR 2\.1B$/i, '€2.1B cuts')
            .replace(/^China major price cuts March$/i, 'China price cuts')
            .replace(/^IKEA China RMB 6\.3B reinvestment$/i, '¥6.3B reinvest')
            .replace(/^IKEA China revenue trough$/i, 'Revenue dip')
            .replace(/^Lifeweek price strategy coverage$/i, 'Price strategy')
            .replace(/^Future of IKEA announcement$/i, 'Future IKEA')
            .replace(/^CEO urban strategy announcement$/i, 'Urban strategy')
            // Service & circular
            .replace(/^Buyback and Resell launched$/i, 'Buyback & Resell')
            .replace(/^TaskRabbit acquisition$/i, 'TaskRabbit')
            // Channel
            .replace(/^IKEA Place AR app launches$/i, 'Place AR app')
            .replace(/^IKEA Japan online shop launches$/i, 'Japan online')
            .replace(/^IKEA Korea e-commerce launches$/i, 'Korea online')
            .replace(/^IKEA China web shop launches$/i, 'China online')
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

            // Layout — innerL widened 130→170 to fit a group-label
            // column to the left of the lane labels. innerT pushed
            // 50→80 so title + subtitle both fit above the chart.
            var innerL = 170, innerR = 30, innerT = 80, innerB = 50;
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
            p.text(title, innerL - 100, innerT - 52);

            // Subtitle — short punchline so a fresh reader sees what
            // the chart says before reading any tile labels.
            p.fill('#444'); p.textStyle(p.NORMAL); p.textSize(14);
            var subtitle = regimeFilter === 'east_asia'
                ? 'Platform launches alongside price cuts and city-store closures.'
                : regimeFilter === 'western'
                    ? 'Format additions: urban stores, services, AR — no closures.'
                    : 'Strategic responses, 2016–2026, across both regions.';
            p.text(subtitle, innerL - 100, innerT - 28);

            // Lane backgrounds + labels — lane label font bumped 11→13
            // for legibility.
            lanes.forEach(function (lane, i) {
                p.noStroke();
                p.fill(i % 2 === 0 ? '#fafafa' : 'white');
                p.rect(innerL, innerT + i * laneH, W - innerL - innerR, laneH);
                p.fill('#1a1a1a'); p.textSize(13); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(lane.label, innerL - 8, innerT + i * laneH + laneH / 2);
                p.textStyle(p.NORMAL);
            });

            // Group labels — PHYSICAL / SERVICE / PRICING in the left
            // margin, vertically centered in each 2-lane group. Lets
            // the reader see the three narrative buckets at a glance
            // without consulting prose.
            groupLabels.forEach(function (label, gi) {
                var midY = innerT + (gi * 2 + 1) * laneH;
                p.fill('#888'); p.textSize(10); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                // Right-aligned at innerL - 100 so it sits well left of
                // the lane labels (innerL - 8). Letter-spacing via
                // p.text() isn't supported in p5, so the all-caps
                // glyphs do the visual heavy lifting.
                p.text(label, innerL - 100, midY);
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

            // Year axis ticks — every year now labelled. Even years
            // bold and slightly larger to give the eye anchor points;
            // odd years lighter so they recede. Was: only even years
            // visible at 10pt, all the same weight.
            p.textAlign(p.CENTER, p.BOTTOM);
            for (var y = Y_MIN; y <= Y_MAX; y++) {
                var x = xYear(y);
                p.stroke('#eee'); p.line(x, innerT, x, H - innerB);
                p.noStroke();
                if (y % 2 === 0) {
                    p.textStyle(p.BOLD); p.textSize(12); p.fill('#444');
                } else {
                    p.textStyle(p.NORMAL); p.textSize(11); p.fill('#999');
                }
                p.text(y, x, innerT - 6);
            }
            p.textStyle(p.NORMAL);

            // Convert canvas mouse → translated sketch coords
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;

            // Tiles + hover detection — all tiles full opacity now,
            // no East/West fade. tileW cap raised 110→140 and font cap
            // raised 11→13 to fit the longer, more readable labels.
            var hoverEv = null;
            lanes.forEach(function (lane, li) {
                var ly = innerT + li * laneH;
                for (var yr = Y_MIN; yr <= Y_MAX; yr++) {
                    var k = lane.key + '|' + yr;
                    var evs = grouped[k];
                    if (!evs) continue;
                    var tileW = Math.min(yearW - 3, 140);
                    var tileH = (laneH - 6) / evs.length;
                    evs.forEach(function (ev, ei) {
                        var tx = xYear(yr) - tileW / 2;
                        var ty = ly + 3 + ei * tileH;
                        p.noStroke();
                        p.fill(regimeFill(ev));
                        p.rect(tx, ty, tileW, tileH - 1.5, 2);
                        p.fill(tileTextColor(ev));
                        p.textSize(Math.max(9, Math.min(13, tileH - 4)));
                        p.textAlign(p.LEFT, p.CENTER);
                        var label = shortLabel(ev.event_name || '');
                        var maxChars = Math.max(12, Math.floor(tileW / 5.5));
                        var shown = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
                        p.text(shown, tx + 5, ty + (tileH - 1.5) / 2);
                        // hover check (in translated sketch space)
                        if (mx >= tx && mx <= tx + tileW &&
                            my >= ty && my <= ty + tileH) {
                            hoverEv = ev;
                        }
                    });
                }
            });

            // Legend — same 3 swatches in both sections now that fade
            // is gone. Prose tells the reader which colour to focus on.
            p.noStroke(); p.textSize(12); p.textAlign(p.LEFT, p.TOP); p.fill('#333');
            var legY = H - innerB + 18;
            var lx = innerL;
            var legendItems = [
                { c: '#FBD914', label: 'East Asian' },
                { c: '#0058AB', label: 'Western' },
                { c: '#888',    label: 'Global / both' },
            ];
            legendItems.forEach(function (it) {
                p.noStroke();
                p.fill(it.c);
                p.rect(lx, legY + 4, 11, 11);
                p.fill('#333'); p.text(it.label, lx + 15, legY + 2);
                lx += p.textWidth(it.label) + 38;
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
