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
            case 'western': return '#2A6FB0';
            case 'east_asia': return '#C8412C';
            case 'origin': return '#FFDB00';
            default: return '#888';
        }
    }

    function formatHTML(format, color, dim) {
        var op = dim ? 0.32 : 0.95;
        var sz = 14;
        var base = 'display:inline-block;width:' + sz + 'px;height:' + sz + 'px;opacity:' + op +
            ';background:' + color + ';border:1.5px solid #fff;box-shadow:0 0 1px rgba(0,0,0,0.5)';
        switch (format) {
            case 'big-box': return '<div style="' + base + '"></div>';
            case 'city_store': return '<div style="' + base + ';border-radius:50%"></div>';
            case 'planning_studio': return '<div style="' + base + ';transform:rotate(45deg)"></div>';
            case 'plan_order_point':
                return '<div style="width:0;height:0;border-left:' + (sz/2) +
                    'px solid transparent;border-right:' + (sz/2) +
                    'px solid transparent;border-bottom:' + sz + 'px solid ' + color +
                    ';opacity:' + op + '"></div>';
            default: return '<div style="' + base + ';border-radius:50%"></div>';
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
            m.fitBounds(L.latLngBounds(r.bounds), { padding: [2, 2], animate: false });
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
            state.maps[r.id] = m;
            state.markerLayers[r.id] = L.layerGroup().addTo(m);
        });
        state.ready = true;
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
        REGIONS.forEach(function (r) { state.markerLayers[r.id].clearLayers(); });
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
            var marker = L.marker([s.latitude, s.longitude], {
                icon: icon,
                interactive: true,         // ← clickable
                keyboard: false,
                riseOnHover: true,
            }).addTo(state.markerLayers[region]);
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

    function tickForward() {
        if (state.year < MAX_YEAR) {
            state.year++;
            rebuildAll();
        } else {
            stopTimer();
        }
    }

    function startTimer() {
        if (state.timer) return;
        state.timer = setInterval(tickForward, TICK_MS);
    }

    function stopTimer() {
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        // Update the year readout style so the user sees auto-play paused
        var yearEl = document.getElementById('map-year-readout');
        if (yearEl) yearEl.classList.add('paused');
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
                state.year = MIN_YEAR;
                var yearEl = document.getElementById('map-year-readout');
                if (yearEl) yearEl.classList.remove('paused');
                rebuildAll();
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
