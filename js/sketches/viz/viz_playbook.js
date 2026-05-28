// viz_playbook.js — Two IKEAs viz 5: Side-by-side slope chart of priorities
// 8 strategic priorities, each appears in West column and East column at its rank;
// bezier lines connect same items, colored by which side weighs it more, thickness
// by the size of the priority flip.
//
// Styled to match the typography and palette of viz_response/timeline/ecology.
(function () {
    var REGIME_WEST = '#2A6FB0';
    var REGIME_EAST = '#C8412C';

    window.VizPlaybook = {
        draw: function (p, manager, ai, progress) {
            var items = (manager.data && manager.data.playbook) || [];
            if (!items.length) {
                p.push();
                p.fill('#888'); p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading playbook data…', manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            var W = manager.width, H = manager.height;
            var padL = (manager.margin && manager.margin.left) || 80;
            var padT = (manager.margin && manager.margin.top) || 0;

            p.push();
            p.translate(padL, padT);

            // Layout
            var innerT = 86, innerB = 30;
            var contentH = H - innerT - innerB;
            var rowH = contentH / items.length;

            // Ranked order in each column
            var westRanked = items.slice().sort(function (a, b) { return b.west_intensity - a.west_intensity; });
            var eastRanked = items.slice().sort(function (a, b) { return b.east_intensity - a.east_intensity; });
            var westPos = {}, eastPos = {};
            westRanked.forEach(function (it, i) { westPos[it.priority_key] = i; });
            eastRanked.forEach(function (it, i) { eastPos[it.priority_key] = i; });

            var leftX = W * 0.30;
            var rightX = W * 0.70;
            var midGap = rightX - leftX;

            // Section title
            p.noStroke();
            p.fill('#1a1a1a'); p.textStyle(p.BOLD); p.textSize(13);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text('TWO IKEAS — PLAYBOOK PRIORITIES SIDE BY SIDE', 20, innerT - 56);

            // Subtitle
            p.fill('#666'); p.textStyle(p.NORMAL); p.textSize(11);
            p.text('Each item appears in both columns at its rank in that regime. Steep lines = rank flips.', 20, innerT - 40);

            // Column headers — match Act 4 stat-card style (uppercase, accent color, kicker tracking)
            p.textStyle(p.BOLD); p.textSize(14);
            p.fill(REGIME_WEST); p.textAlign(p.RIGHT, p.BOTTOM);
            p.text('WESTERN IKEA', leftX - 18, innerT - 16);
            p.fill(REGIME_EAST); p.textAlign(p.LEFT, p.BOTTOM);
            p.text('EAST ASIAN IKEA', rightX + 18, innerT - 16);

            p.textStyle(p.NORMAL); p.fill('#888'); p.textSize(10);
            p.textAlign(p.RIGHT, p.TOP);
            p.text('top = highest priority', leftX - 18, innerT - 12);
            p.textAlign(p.LEFT, p.TOP);
            p.text('top = highest priority', rightX + 18, innerT - 12);

            function yFor(idx) { return innerT + idx * rowH + rowH / 2; }
            function radius(v) { return 8 + v * 3; }

            // Connector lines (draw first so nodes overlay)
            items.forEach(function (it) {
                var yL = yFor(westPos[it.priority_key]);
                var yR = yFor(eastPos[it.priority_key]);
                var diff = it.west_intensity - it.east_intensity;
                var strokeCol;
                if (Math.abs(diff) <= 0.5) strokeCol = p.color(180, 180, 180, 170);
                else if (diff > 0) strokeCol = p.color(REGIME_WEST + 'CC');
                else strokeCol = p.color(REGIME_EAST + 'CC');
                p.stroke(strokeCol);
                p.strokeWeight(2 + Math.abs(diff));
                p.noFill();
                p.beginShape();
                p.vertex(leftX, yL);
                p.bezierVertex(
                    leftX + midGap * 0.4, yL,
                    rightX - midGap * 0.4, yR,
                    rightX, yR
                );
                p.endShape();
            });

            // Convert canvas mouse → translated sketch coords (critical: the
            // playbook chart was completely unresponsive to hover in v6 because
            // mouseX was being compared against post-translate node positions)
            var mx = p.mouseX - padL;
            var my = p.mouseY - padT;

            // Nodes + labels + hover detect
            var hoverItem = null, hoverSide = '';
            items.forEach(function (it) {
                var yL = yFor(westPos[it.priority_key]);
                var yR = yFor(eastPos[it.priority_key]);

                // West node
                p.noStroke(); p.fill(REGIME_WEST);
                var rL = radius(it.west_intensity);
                p.ellipse(leftX, yL, rL, rL);
                p.fill('#1a1a1a'); p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(it.priority_label, leftX - rL - 6, yL);
                p.fill('#888'); p.textSize(9); p.textStyle(p.NORMAL);
                p.text('intensity ' + it.west_intensity + '/5', leftX - rL - 6, yL + 12);

                // East node
                p.noStroke(); p.fill(REGIME_EAST);
                var rR = radius(it.east_intensity);
                p.ellipse(rightX, yR, rR, rR);
                p.fill('#1a1a1a'); p.textSize(12); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(it.priority_label, rightX + rR + 6, yR);
                p.fill('#888'); p.textSize(9); p.textStyle(p.NORMAL);
                p.text('intensity ' + it.east_intensity + '/5', rightX + rR + 6, yR + 12);

                // Hover check (either column's node — use a generous hit area
                // that covers the visible label as well as the circle, so
                // users can reach the tooltip even when hovering the priority
                // label text rather than the small dot)
                var hitR_west = Math.max(rL / 2 + 10, 16);
                var hitR_east = Math.max(rR / 2 + 10, 16);
                if (Math.abs(my - yL) < rowH / 2 && Math.abs(mx - leftX) < 180) {
                    hoverItem = it; hoverSide = 'west';
                } else if (Math.abs(my - yR) < rowH / 2 && Math.abs(mx - rightX) < 180) {
                    hoverItem = it; hoverSide = 'east';
                }
            });

            // Legend (bottom)
            p.noStroke(); p.textSize(10); p.fill('#666');
            p.textAlign(p.CENTER, p.TOP);
            p.text('Line color: blue → Western priority higher · red → East-Asian priority higher · gray → ≈ equal · thickness = magnitude of flip',
                W / 2, H - 22);

            p.pop();

            // Tooltip
            if (hoverItem && window.VizTooltip) {
                var it = hoverItem;
                var html =
                    '<div class="tt-name">' + it.priority_label + '</div>' +
                    '<div class="tt-row"><b style="color:#9ecfff">West (' + it.west_intensity + '/5)</b> ' + (it.west_evidence || '') + '</div>' +
                    '<div class="tt-row" style="margin-top:4px"><b style="color:#ff9b80">East (' + it.east_intensity + '/5)</b> ' + (it.east_evidence || '') + '</div>';
                window.VizTooltip.show(p, html, p.mouseX, p.mouseY);
            } else if (window.VizTooltip) {
                window.VizTooltip.hide();
            }
        }
    };
})();
