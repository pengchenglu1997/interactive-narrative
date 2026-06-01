// viz_map.js — Two IKEAs viz 1
// Three Leaflet maps in a 2×2 grid (NA full-width on top, EU + EA below).
// Maps are fully interactive — drag to pan, scroll to zoom, click a marker
// to see store details. Auto-plays year forward 1958 → 2026 on entry; the
// year animation pauses if the user actively interacts (drags or clicks).
(function () {
    var MIN_YEAR = 1958;
    var MAX_YEAR = 2026;
    var TICK_MS = 220;

    // Tighter bounds than v5 so each region's stores fill more of the
    // available container pixels (user feedback: "再放大一点").
    var REGIONS = [
        { id: 'na', label: 'North America', bounds: [[28, -125], [50, -68]] },
        { id: 'eu', label: 'Europe',         bounds: [[42, -8],   [60, 20]] },
        { id: 'ea', label: 'East Asia',      bounds: [[22, 102],  [44, 142]] },
    ];

    var state = {
        ready: false,
        active: false,
        maps: {},
        markerLayers: {},
        year: MIN_YEAR,
        timer: null,
        stores: [],
    };

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western':   return '#0058AB';   // IKEA blue
            case 'east_asia': return '#FBD914';   // IKEA yellow
            // 'origin' (Älmhult) now uses Western blue — it's geographically
            // Western anyway. The founding-store identity lives in the popup
            // text. Keeps the map's colour grammar to exactly two regimes,
            // matching the legend strip below the year scrubber.
            case 'origin':    return '#0058AB';
            default:          return '#888';
        }
    }

    function formatHTML(format, color, closed) {
        var sz = 14;
        // Closed / scheduled-to-close stores: black background + white ✗
        // (replaces the prior "fade the regime color to 32% alpha" treatment
        // which was hard to spot at small map sizes).
        if (closed) {
            var radius = (format === 'big-box') ? '1px' : '50%';
            return '<div style="' +
                'display:flex;align-items:center;justify-content:center;' +
                'width:' + sz + 'px;height:' + sz + 'px;' +
                'background:#1a1a1a;border:1px solid #fff;border-radius:' + radius + ';' +
                'box-shadow:0 0 1px rgba(0,0,0,0.4);' +
                'color:#fff;font:bold ' + (sz - 4) + 'px/1 -apple-system,Helvetica,Arial,sans-serif;' +
                '">✗</div>';
        }
        // Active markers — yellow needs a dark blue border, others use a white border.
        var bord = (color === '#FBD914') ? '1.5px solid #0058AB' : '1.5px solid #fff';
        var base = 'display:inline-block;width:' + sz + 'px;height:' + sz + 'px;opacity:0.95;' +
            'background:' + color + ';border:' + bord + ';box-shadow:0 0 1px rgba(0,0,0,0.4)';
        switch (format) {
            case 'big-box':         return '<div style="' + base + '"></div>';
            case 'city_store':      return '<div style="' + base + ';border-radius:50%"></div>';
            // planning_studio + plan_order_point both render as circles now —
            // the prior diamond / triangle shapes added a third symbol the
            // reader had to decode without enough visual budget on the small
            // markers. They are all small-format urban stores, so one shape
            // (circle) communicates 'city-format' adequately. Subtype lives
            // in the popup metadata.
            case 'planning_studio':  return '<div style="' + base + ';border-radius:50%"></div>';
            case 'plan_order_point': return '<div style="' + base + ';border-radius:50%"></div>';
            default:                 return '<div style="' + base + ';border-radius:50%"></div>';
        }
    }

    function formatLabel(format) {
        if (!format) return '';
        return format.replace(/_/g, ' ');
    }

    function buildPopupHTML(s, closed) {
        var lines = [];
        lines.push('<div class="popup-name">' + (s.store_name || s.city) + '</div>');
        lines.push('<div class="popup-where">' + (s.city || '') + (s.country ? ', ' + s.country : '') + '</div>');
        lines.push('<div class="popup-meta">');
        lines.push('  <span>Opened ' + (s.opening_year || '?') + '</span>');
        if (s.closure_year) lines.push('  <span class="closed">· Closed ' + s.closure_year + '</span>');
        lines.push('  <span>· ' + formatLabel(s.store_format) + '</span>');
        lines.push('</div>');
        if (s.notes) lines.push('<div class="popup-note">' + s.notes + '</div>');
        if (s.source_url) {
            try {
                var host = new URL(s.source_url).hostname;
                lines.push('<div class="popup-src"><a href="' + s.source_url + '" target="_blank" rel="noopener">' + host + '</a></div>');
            } catch (e) { /* ignore bad URL */ }
        }
        return lines.join('');
    }

    function ensureInit(stores) {
        if (state.ready) return;
        if (typeof L === 'undefined') {
            console.error('VizMap: Leaflet (L) not loaded');
            return;
        }
        state.stores = stores;

        REGIONS.forEach(function (r) {
            var el = document.getElementById('map-' + r.id);
            if (!el) { console.error('VizMap: #map-' + r.id + ' missing'); return; }
            var m = L.map(el, {
                zoomControl: true,         // user can zoom + button
                attributionControl: false,
                scrollWheelZoom: true,     // ← interaction enabled
                dragging: true,            // ← interaction enabled
                doubleClickZoom: true,
                touchZoom: true,
                boxZoom: false,
                keyboard: false,
            });
            // Initial framing — we also save it on the map object so the
            // per-map Reset-view control below can restore it after the
            // user pans / zooms.
            var initialBounds = L.latLngBounds(r.bounds);
            m._initialBounds = initialBounds;
            m.fitBounds(initialBounds, { padding: [2, 2], animate: false });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 14,
                subdomains: 'abcd',
            }).addTo(m);
            // In-map region label
            var label = L.control({ position: 'topleft' });
            label.onAdd = function () {
                var div = L.DomUtil.create('div', 'region-label');
                div.innerHTML = r.label;
                return div;
            };
            label.addTo(m);
            // Per-map Reset-view button — appended directly to the
            // existing zoom-control bar so it becomes the third button
            // in the same rounded "+ / − / ↺" group (sits flush below
            // the minus button instead of floating as a separate bar).
            // Restores pan + zoom to the original fitBounds; does not
            // touch the year scrubber (which has its own reset above).
            if (m.zoomControl && m.zoomControl.getContainer()) {
                var zoomBar = m.zoomControl.getContainer();
                var btn = L.DomUtil.create(
                    'a',
                    'leaflet-control-zoom-reset map-reset-btn',
                    zoomBar
                );
                btn.href = '#';
                btn.title = 'Reset view';
                btn.setAttribute('role', 'button');
                btn.setAttribute('aria-label', 'Reset map view');
                btn.innerHTML = '↺';
                L.DomEvent.on(btn, 'click', function (e) {
                    L.DomEvent.stop(e);
                    m.fitBounds(m._initialBounds, { padding: [2, 2], animate: true });
                });
                L.DomEvent.disableClickPropagation(btn);
            }
            state.maps[r.id] = m;
            // Marker layering — split open vs closed into two
            // INDEPENDENT cluster groups so they never share a bubble
            // and visually stay distinct:
            //   - openLayer: regime-coloured bubble (IKEA two-tone
            //     inversion — West is blue with a yellow ring, East
            //     is yellow with a blue ring).
            //   - closedLayer: a separate cluster group with a black
            //     bubble + white digits + dashed ring. Because the
            //     two cluster groups compute centroids independently,
            //     their bubbles offset themselves naturally at metros
            //     with both kinds of stores (e.g. Shanghai 3 open +
            //     2 closed).
            var isEast    = (r.id === 'ea');
            var openFill  = isEast ? '#FBD914' : '#0058AB';   // bubble background
            var openText  = isEast ? '#0058AB' : '#FBD914';   // digits
            var openRing  = isEast ? '#0058AB' : '#FBD914';   // border
            function makeIcon(opts) {
                return function (cluster) {
                    var n = cluster.getChildCount();
                    var sz = n < 10 ? 28 : n < 30 ? 34 : 40;
                    var html =
                        '<div class="ikea-cluster-bubble" style="' +
                            'width:' + sz + 'px;height:' + sz + 'px;' +
                            'background:' + opts.fill + ';' +
                            'color:' + opts.text + ';' +
                            'border:' + (opts.dashed ? '2px dashed ' : '2px solid ') + opts.ring + ';' +
                        '">' + (opts.prefix || '') + n + '</div>';
                    return L.divIcon({
                        html: html,
                        className: 'ikea-cluster',
                        iconSize: L.point(sz, sz),
                    });
                };
            }
            var clusterOpts = {
                maxClusterRadius: 28,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
            };
            var hasPlugin = (typeof L.markerClusterGroup === 'function');
            var openLayer = hasPlugin
                ? L.markerClusterGroup(Object.assign({}, clusterOpts, {
                    iconCreateFunction: makeIcon({
                        fill: openFill, text: openText, ring: openRing,
                    }),
                }))
                : L.layerGroup();
            // Closed bubble — black, white digits, dashed white ring,
            // "✗ " prefix so even at a glance the bubble reads as
            // "closed × N" rather than a regime count.
            var closedLayer = hasPlugin
                ? L.markerClusterGroup(Object.assign({}, clusterOpts, {
                    iconCreateFunction: makeIcon({
                        fill: '#1a1a1a', text: '#ffffff', ring: '#ffffff',
                        dashed: true, prefix: '✗ ',
                    }),
                }))
                : L.layerGroup();
            openLayer.addTo(m);
            closedLayer.addTo(m);
            state.markerLayers[r.id] = { open: openLayer, closed: closedLayer };
        });
        state.ready = true;
        wireToolbar();
        rebuildAll();
    }

    function regionFor(lat, lon) {
        if (lat == null || lon == null) return null;
        if (lon > -170 && lon < -50 && lat > 15 && lat < 75) return 'na';
        if (lon > -15 && lon < 50 && lat > 35 && lat < 72) return 'eu';
        if (lon > 70 && lon < 150 && lat > -10 && lat < 55) return 'ea';
        if (lon > 10 && lon < 30 && lat > 55 && lat < 65) return 'eu';
        return null;
    }

    function rebuildAll() {
        if (!state.ready) return;
        REGIONS.forEach(function (r) {
            state.markerLayers[r.id].open.clearLayers();
            state.markerLayers[r.id].closed.clearLayers();
        });
        var totals = { open: 0, closed: 0 };
        var perRegion = { na: 0, eu: 0, ea: 0 };

        state.stores.forEach(function (s) {
            if (s.opening_year == null || s.opening_year > state.year) return;
            if (s.latitude == null || s.longitude == null) return;
            var region = regionFor(s.latitude, s.longitude);
            if (!region || !state.markerLayers[region]) return;
            var closed = s.closure_year != null && s.closure_year <= state.year;
            var col = regimeColor(s.region_type);
            var icon = L.divIcon({
                className: 'ikea-marker',
                html: formatHTML(s.store_format, col, closed),
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });
            // Open stores → cluster group; closed stores → flat layer.
            // Keeps "this metro had a store IKEA shut" visible as an
            // individual black ✗ instead of being absorbed into the
            // open-store count bubble.
            var targetLayer = closed
                ? state.markerLayers[region].closed
                : state.markerLayers[region].open;
            var marker = L.marker([s.latitude, s.longitude], {
                icon: icon,
                interactive: true,         // ← clickable
                keyboard: false,
                riseOnHover: true,
            }).addTo(targetLayer);
            marker.bindPopup(buildPopupHTML(s, closed), {
                maxWidth: 260,
                className: 'ikea-popup',
                autoPan: false,
            });
            // Pause auto-play when user opens a popup; resume on close
            marker.on('click', stopTimer);
            if (closed) totals.closed++; else totals.open++;
            perRegion[region]++;
        });

        var yearEl = document.getElementById('map-year-readout');
        if (yearEl) yearEl.textContent = state.year;
        var statsEl = document.getElementById('map-stats');
        if (statsEl) {
            statsEl.innerHTML =
                '<span class="open-n">' + totals.open + ' open</span>' +
                (totals.closed ? '  ·  <span class="closed-n">' + totals.closed + ' closed</span>' : '');
        }
        REGIONS.forEach(function (r) {
            var lbl = document.querySelector('#map-' + r.id + ' .leaflet-control.region-label');
            if (lbl) lbl.innerHTML = r.label + '<span class="region-n"> · ' + perRegion[r.id] + '</span>';
        });
    }

    // Central place to change the year — keeps the scrubber UI in sync.
    function setYear(y) {
        y = Math.max(MIN_YEAR, Math.min(MAX_YEAR, y));
        if (y === state.year) return;
        state.year = y;
        rebuildAll();
        var slider = document.getElementById('map-year-scrubber');
        if (slider) {
            slider.value = y;
            var pct = ((y - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
            slider.style.setProperty('--pct', pct.toFixed(1) + '%');
        }
    }

    function setPlayUI(playing) {
        var btn    = document.getElementById('map-year-play');
        var yearEl = document.getElementById('map-year-readout');
        if (btn) {
            btn.classList.toggle('playing', playing);
            btn.textContent = playing ? '❚❚' : '▶';
        }
        if (yearEl) yearEl.classList.toggle('paused', !playing);
    }

    function tickForward() {
        if (state.year < MAX_YEAR) setYear(state.year + 1);
        else stopTimer();
    }

    function startTimer() {
        if (state.timer) return;
        state.timer = setInterval(tickForward, TICK_MS);
        setPlayUI(true);
    }

    function stopTimer() {
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        setPlayUI(false);
    }

    // Wire the scrubber + play + reset buttons once the toolbar is
    // in the DOM.
    function wireToolbar() {
        var slider = document.getElementById('map-year-scrubber');
        var play   = document.getElementById('map-year-play');
        var reset  = document.getElementById('map-year-reset');
        if (slider && !slider.__wired) {
            slider.__wired = true;
            slider.addEventListener('input', function () {
                stopTimer();                                // user takes over
                setYear(parseInt(this.value, 10));
            });
        }
        if (play && !play.__wired) {
            play.__wired = true;
            play.addEventListener('click', function () {
                if (state.timer) { stopTimer(); return; }
                if (state.year >= MAX_YEAR) setYear(MIN_YEAR);  // restart from start
                startTimer();
            });
        }
        if (reset && !reset.__wired) {
            reset.__wired = true;
            reset.addEventListener('click', function () {
                stopTimer();
                setYear(MIN_YEAR);
            });
        }
    }

    window.VizMap = {
        draw: function (p, manager, ai, progress) {
            var stage = document.getElementById('leaflet-stage');
            var vis = document.getElementById('vis');
            if (!stage) return;
            if (!state.active) {
                state.active = true;
                stage.style.display = 'grid';
                if (vis) vis.style.visibility = 'hidden';
                ensureInit((manager.data && manager.data.stores) || []);
                // Force a reset so setYear() actually changes state and
                // syncs the scrubber UI (it short-circuits when y === state.year).
                state.year = MIN_YEAR - 1;
                setYear(MIN_YEAR);
                setTimeout(function () {
                    REGIONS.forEach(function (r) {
                        if (state.maps[r.id]) {
                            state.maps[r.id].invalidateSize();
                            state.maps[r.id].fitBounds(L.latLngBounds(r.bounds), { padding: [2, 2], animate: false });
                        }
                    });
                    startTimer();
                }, 120);
            }
        },
        deactivate: function () {
            if (!state.active) return;
            state.active = false;
            stopTimer();
            var stage = document.getElementById('leaflet-stage');
            var vis = document.getElementById('vis');
            if (stage) stage.style.display = 'none';
            if (vis) vis.style.visibility = '';
        },
    };
})();
