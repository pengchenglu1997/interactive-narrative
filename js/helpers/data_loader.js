// data_loader.js
// Data loading module. Loads the 6 Two IKEAs CSVs and exposes them as
// window.TWO_IKEAS_DATA. Also keeps the original TSV loader for backwards
// compatibility with the course template examples.
(function () {

    // ============ TSV loader (kept from template) ============
    function parseTSV(text) {
        var lines = (text || '').trim().split(/\r?\n/);
        if (!lines || lines.length === 0) return [];
        var header = lines[0].split('\t');
        var rows = lines.slice(1);
        return rows.map(function (line) {
            var parts = line.split('\t');
            var word = (parts[0] || '').replace(/^"|"$/g, '');
            var time = parseFloat(parts[1]);
            var filler = parts[2] ? (parts[2].trim() === '1' || parts[2].trim() === 'true') : false;
            return { word: word, time: time, filler: filler, min: Math.floor(time / 60) };
        });
    }

    function loadTSV(url) {
        return fetch(url).then(function (r) { return r.text(); }).then(function (text) {
            return parseTSV(text);
        });
    }

    // ============ CSV loader (added for Two IKEAs project) ============
    function splitCSVLine(line) {
        var out = []; var cur = ''; var q = false;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
            if (c === '"') { q = !q; continue; }
            if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
            cur += c;
        }
        out.push(cur);
        return out;
    }

    function parseCSV(text) {
        var lines = (text || '').replace(/\r\n/g, '\n').split('\n').filter(function (l) { return l.length > 0; });
        if (lines.length === 0) return [];
        var headers = splitCSVLine(lines[0]);
        return lines.slice(1).map(function (line) {
            var cols = splitCSVLine(line);
            var row = {};
            headers.forEach(function (h, i) { row[h] = cols[i] !== undefined ? cols[i] : ''; });
            return row;
        });
    }

    function loadCSV(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error('Failed to load ' + url);
            return r.text();
        }).then(parseCSV);
    }

    function num(v) {
        if (v === '' || v === null || v === undefined) return null;
        var n = parseFloat(v);
        return isNaN(n) ? null : n;
    }
    function intOrNull(v) {
        var n = num(v);
        return n === null ? null : Math.round(n);
    }

    function loadTwoIKEAsData() {
        return Promise.all([
            loadCSV('data/processed/ikea_stores.csv'),
            loadCSV('data/processed/housing_pressure.csv'),
            loadCSV('data/processed/strategic_events.csv'),
            loadCSV('data/processed/east_asian_competitors.csv'),
            loadCSV('data/processed/retail_ecology.csv'),
            loadCSV('data/processed/playbook_priorities.csv'),
        ]).then(function (results) {
            var stores = results[0], housing = results[1], events = results[2];
            var competitors = results[3], ecology = results[4], playbook = results[5];

            stores.forEach(function (r) {
                r.latitude = num(r.latitude);
                r.longitude = num(r.longitude);
                r.opening_year = intOrNull(r.opening_year);
                r.closure_year = intOrNull(r.closure_year);
            });
            housing.forEach(function (r) {
                r.price_to_income_ratio = num(r.price_to_income_ratio);
                r.mortgage_pct_of_income = num(r.mortgage_pct_of_income);
                r.renter_share = num(r.renter_share);
                r.young_adult_population_share = num(r.young_adult_population_share);
                r.year = intOrNull(r.year);
            });
            events.forEach(function (r) { r.event_year = intOrNull(r.event_year); });
            playbook.forEach(function (r) {
                r.west_intensity = num(r.west_intensity);
                r.east_intensity = num(r.east_intensity);
            });

            var data = {
                stores: stores,
                housing: housing,
                events: events,
                competitors: competitors,
                ecology: ecology,
                playbook: playbook,
            };
            window.TWO_IKEAS_DATA = data;
            return data;
        });
    }

    // ============ Shared color helpers (regime / response type) ============
    function regimeColor(regime) {
        switch ((regime || '').toLowerCase()) {
            case 'western': return '#2A6FB0';
            case 'east_asia': return '#C8412C';
            case 'origin': return '#FFDB00';
            case 'both': return '#E0A800';
            default: return '#888';
        }
    }

    function responseColor(type) {
        var t = (type || '').toLowerCase();
        if (t.indexOf('urban') !== -1) return '#2A6FB0';
        if (t.indexOf('service') !== -1) return '#5F9EA0';
        if (t.indexOf('resale') !== -1 || t.indexOf('circular') !== -1) return '#7BB661';
        if (t.indexOf('price') !== -1) return '#C8412C';
        if (t.indexOf('channel') !== -1) return '#9467bd';
        if (t.indexOf('strategy') !== -1) return '#FFDB00';
        if (t.indexOf('expansion') !== -1) return '#888';
        if (t.indexOf('closure') !== -1) return '#3a3a3a';
        if (t.indexOf('competitor') !== -1) return '#E07B00';
        return '#999';
    }

    // ============ Exports ============
    window.DataLoader = {
        // template TSV (kept for backwards compatibility)
        parseTSV: parseTSV,
        loadTSV: loadTSV,
        // Two IKEAs additions
        parseCSV: parseCSV,
        loadCSV: loadCSV,
        loadTwoIKEAsData: loadTwoIKEAsData,
        regimeColor: regimeColor,
        responseColor: responseColor,
    };

    // Template preprocess helper (kept for backwards compatibility)
    window.DataLoader.preprocess = function (data) {
        data = data || [];
        return data.map(function (d, i) {
            return {
                word: (d.word || '').replace(/^"|"$/g, ''),
                filler: !!d.filler,
                time: +d.time || 0,
                min: (typeof d.min === 'number') ? d.min : Math.floor((+d.time || 0) / 60),
                index: i
            };
        });
    };
})();
