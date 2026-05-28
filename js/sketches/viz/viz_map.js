// viz_map.js — Two IKEAs viz 1: store timeline map
// Equirectangular world map drawn in p5 (single-canvas template constraint).
// Reads manager.data.stores. Uses scroll progress to walk the year forward.
(function () {
    var MIN_YEAR = 1958;
    var MAX_YEAR = 2026;

    function regimeColor(rt) {
        switch ((rt || '').toLowerCase()) {
            case 'western': return '#2A6FB0';
            case 'east_asia': return '#C8412C';
            case 'origin': return '#FFDB00';
            default: return '#888';
        }
    }

    window.VizMap = {
        draw: function (p, manager, ai, progress) {
            var data = (manager.data && manager.data.stores) || [];
            if (!data.length) {
                p.push();
                p.fill('#888'); p.textSize(13);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading store data…', manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // Current displayed year: drift from MIN_YEAR to MAX_YEAR as scroll progresses
            // through this section. progress is 0..1 within the active section.
            var pr = progress || 0;
            var year = Math.round(MIN_YEAR + pr * (MAX_YEAR - MIN_YEAR));

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            // Background panel
            p.push();
            p.translate(padL, padT);
            p.noStroke();
            p.fill('#F7F3EC');
            p.rect(0, 0, W, H, 4);

            // World projection bounds (covers IKEA's footprint)
            var lonMin = -135, lonMax = 145;
            var latMin = 5, latMax = 62;
            function projX(lon) { return p.map(lon, lonMin, lonMax, 30, W - 30); }
            function projY(lat) { return p.map(lat, latMax, latMin, 30, H - 60); }

            // Graticule
            p.stroke('#E5DDD0'); p.strokeWeight(1);
            for (var lon = -120; lon <= 140; lon += 30) p.line(projX(lon), 30, projX(lon), H - 60);
            for (var lat = 10; lat <= 60; lat += 10) p.line(30, projY(lat), W - 30, projY(lat));

            // Rough continent outlines
            p.noStroke();
            p.fill('#EFE7D6');
            // North America
            p.beginShape();
            [[60,-130],[55,-90],[48,-70],[28,-80],[20,-105],[35,-125]].forEach(function (pt) {
                p.vertex(projX(pt[1]), projY(pt[0]));
            });
            p.endShape(p.CLOSE);
            // Europe
            p.beginShape();
            [[60,-10],[58,15],[55,40],[40,42],[36,15],[44,-5]].forEach(function (pt) {
                p.vertex(projX(pt[1]), projY(pt[0]));
            });
            p.endShape(p.CLOSE);
            // East Asia
            p.beginShape();
            [[50,80],[50,135],[35,140],[20,120],[20,95],[35,80]].forEach(function (pt) {
                p.vertex(projX(pt[1]), projY(pt[0]));
            });
            p.endShape(p.CLOSE);

            // Stores
            var visibleCount = 0, closedCount = 0;
            data.forEach(function (s) {
                if (s.opening_year == null || s.opening_year > year) return;
                if (s.latitude == null || s.longitude == null) return;
                var x = projX(s.longitude), y = projY(s.latitude);
                var closed = s.closure_year != null && s.closure_year <= year;
                var col = regimeColor(s.region_type);
                p.noStroke();
                p.fill(col + (closed ? '55' : 'CC'));
                var sz = 8;
                switch (s.store_format) {
                    case 'big-box':
                        p.rectMode(p.CENTER); p.rect(x, y, sz * 1.4, sz * 1.4);
                        break;
                    case 'city_store':
                        p.ellipse(x, y, sz * 1.6, sz * 1.6);
                        break;
                    case 'planning_studio':
                        p.push(); p.translate(x, y); p.rotate(p.PI / 4);
                        p.rectMode(p.CENTER); p.rect(0, 0, sz * 1.3, sz * 1.3);
                        p.pop();
                        break;
                    case 'plan_order_point':
                        p.triangle(x, y - sz, x - sz, y + sz * 0.7, x + sz, y + sz * 0.7);
                        break;
                    default:
                        p.ellipse(x, y, sz * 1.4, sz * 1.4);
                }
                visibleCount++;
                if (closed) closedCount++;
            });

            // Title + year readout
            p.noStroke();
            p.fill('#1a1a1a'); p.textSize(15); p.textStyle(p.BOLD);
            p.textAlign(p.LEFT, p.TOP);
            p.text('IKEA stores by year ' + year, 12, H - 50);
            p.textStyle(p.NORMAL); p.fill('#666'); p.textSize(11);
            p.text(visibleCount + ' open  ·  ' + closedCount + ' closed', 12, H - 32);

            // Legend
            p.textAlign(p.RIGHT, p.TOP); p.textSize(10); p.fill('#1a1a1a');
            var legendY = H - 50;
            var items = [
                { c: '#2A6FB0', label: 'Western' },
                { c: '#C8412C', label: 'East Asian' },
                { c: '#FFDB00', label: 'Origin' },
            ];
            items.forEach(function (it, i) {
                var yy = legendY + i * 14;
                p.noStroke(); p.fill(it.c); p.rectMode(p.CORNER); p.rect(W - 110, yy + 3, 8, 8);
                p.fill('#333'); p.textAlign(p.LEFT, p.TOP); p.text(it.label, W - 96, yy + 2);
            });
            p.textAlign(p.LEFT, p.TOP); p.textSize(9); p.fill('#888');
            p.text('▢ big-box   ◯ city store   ◇ planning studio   △ plan & order',
                12, H - 14);

            p.pop();
        }
    };
})();
