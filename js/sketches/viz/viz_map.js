// viz_map.js — Two IKEAs viz 1
// Three Leaflet maps side-by-side (North America / Europe / East Asia),
// each showing IKEA stores. A shared year state advances automatically
// from 1958 to 2026 when Act 1 is in view.
//
// Because Leaflet uses its own DOM (not the p5 canvas), this module also
// handles the show/hide swap between the p5 canvas (#vis) and the Leaflet
// container (#leaflet-stage). sketch_renderer calls VizMap.activate() when
// activeIndex is in Act 1 and VizMap.deactivate() when leaving.
(function () {
    var MIN_YEAR = 1958;
    var MAX_YEAR = 2026;
    var TICK_MS = 200;   // ms per year advance during auto-play
    var REGIONS = [
        { id: 'na', label: 'North America', center: [40, -95], zoom: 3 },
        { id: 'eu', label: 'Europe',        center: [50, 10],   zoom: 3 },
        { id: 'ea', label: 'East Asia',     center: [33, 120],  zoom: 3 },
    ];

    var state = {
        ready: false,
        active: false,
        maps: {},           // id -> Leaflet map instance
        markerLayers: {},   // id -> L.layerGroup
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
        var sz = 12;
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

    // Initialise three Leaflet maps (lazy — only on first activate).
    function ensureInit(stores) {
        if (state.ready) return;
        if (typeof L === 'undefined') {
            console.error('VizMap: Leaflet (L) not loaded — check the CDN <script> tag in index.html');
            return;
        }
        state.stores = stores;

        REGIONS.forEach(function (r) {
            var el = document.getElementById('map-' + r.id);
            if (!el) { console.error('VizMap: #map-' + r.id + ' not found in DOM'); return; }
            var m = L.map(el, {
                center: r.center,
                zoom: r.zoom,
                zoomControl: false,
                attributionControl: false,
                worldCopyJump: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                boxZoom: false,
                keyboard: false,
            });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 12,
                subdomains: 'abcd',
            }).addTo(m);
            // Region label overlay
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
        // Quick bbox sort
        if (lon > -170 && lon < -50 && lat > 15 && lat < 75) return 'na';
        if (lon > -15 && lon < 50 && lat > 35 && lat < 72) return 'eu';
        if (lon > 70 && lon < 150 && lat > -10 && lat < 55) return 'ea';
        // Sweden Älmhult sits between EU/EA bbox edges — treat as EU
        if (lon > 10 && lon < 30 && lat > 55 && lat < 65) return 'eu';
        return null;
    }

    function rebuildAll() {
        if (!state.ready) return;
        // Clear all layers
        REGIONS.forEach(function (r) {
            state.markerLayers[r.id].clearLayers();
        });
        // Counters for label updates
        var counts = { na: 0, eu: 0, ea: 0 };

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
                iconSize: [14, 14],
                iconAnchor: [7, 7],
            });
            var m = L.marker([s.latitude, s.longitude], { icon: icon, interactive: false })
                .addTo(state.markerLayers[region]);
            counts[region]++;
        });

        // Update year readouts in DOM
        var yearEl = document.getElementById('map-year-readout');
        if (yearEl) yearEl.textContent = state.year;
        REGIONS.forEach(function (r) {
            var el = document.getElementById('map-count-' + r.id);
            if (el) el.textContent = counts[r.id] + ' stores';
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
    }

    // ===================== Public API =====================
    window.VizMap = {
        // Called every frame by sketch_renderer when Act 1 is active.
        // The first call lazy-inits Leaflet, shows the container, starts auto-play.
        draw: function (p, manager, ai, progress) {
            var stage = document.getElementById('leaflet-stage');
            var vis = document.getElementById('vis');
            if (!stage) return;
            if (!state.active) {
                state.active = true;
                stage.style.display = 'flex';
                if (vis) vis.style.visibility = 'hidden';
                ensureInit((manager.data && manager.data.stores) || []);
                state.year = MIN_YEAR;
                rebuildAll();
                // Tiny delay before starting so the user sees the 1958 start
                setTimeout(function () {
                    REGIONS.forEach(function (r) {
                        if (state.maps[r.id]) state.maps[r.id].invalidateSize();
                    });
                    startTimer();
                }, 100);
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
