// viz_playbook.js — Two IKEAs viz 5: Side-by-side slope chart of priorities
// 8 strategic priorities, each appears in West column and East column at its rank;
// lines connect same item across columns, colored by which side weighs it more.
(function () {
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

            var innerT = 64, innerB = 24;
            var rowH = (H - innerT - innerB) / items.length;

            // Ranked order in each column
            var westRanked = items.slice().sort(function (a, b) { return b.west_intensity - a.west_intensity; });
            var eastRanked = items.slice().sort(function (a, b) { return b.east_intensity - a.east_intensity; });
            var westPos = {}, eastPos = {};
            westRanked.forEach(function (it, i) { westPos[it.priority_key] = i; });
            eastRanked.forEach(function (it, i) { eastPos[it.priority_key] = i; });

            var leftX = W * 0.32;
            var rightX = W * 0.68;
            var midGap = rightX - leftX;

            // Column headers
            p.noStroke(); p.textStyle(p.BOLD); p.textSize(14);
            p.fill('#2A6FB0'); p.textAlign(p.RIGHT, p.BOTTOM);
            p.text('WESTERN IKEA', leftX - 14, innerT - 22);
            p.fill('#C8412C'); p.textAlign(p.LEFT, p.BOTTOM);
            p.text('EAST ASIAN IKEA', rightX + 14, innerT - 22);
            p.textStyle(p.NORMAL); p.fill('#666'); p.textSize(10);
            p.textAlign(p.RIGHT, p.TOP);
            p.text('top = highest priority ↓', leftX - 14, innerT - 18);
            p.textAlign(p.LEFT, p.TOP);
            p.text('top = highest priority ↓', rightX + 14, innerT - 18);

            function yFor(idx) { return innerT + idx * rowH + rowH / 2; }
            function radius(v) { return 6 + v * 2.5; }

            // Lines first
            items.forEach(function (it) {
                var yL = yFor(westPos[it.priority_key]);
                var yR = yFor(eastPos[it.priority_key]);
                var diff = it.west_intensity - it.east_intensity;
                var strokeCol;
                if (Math.abs(diff) <= 0.5) strokeCol = p.color(180, 180, 180, 180);
                else if (diff > 0) strokeCol = p.color('#2A6FB0CC');
                else strokeCol = p.color('#C8412CCC');
                p.stroke(strokeCol);
                p.strokeWeight(1.5 + Math.abs(diff));
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

            // Nodes + labels
            items.forEach(function (it) {
                var yL = yFor(westPos[it.priority_key]);
                var yR = yFor(eastPos[it.priority_key]);

                // Left node
                p.noStroke(); p.fill('#2A6FB0');
                var rL = radius(it.west_intensity);
                p.ellipse(leftX, yL, rL, rL);
                p.fill('#1a1a1a'); p.textSize(11); p.textStyle(p.BOLD);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(it.priority_label, leftX - rL - 6, yL);
                p.fill('#999'); p.textSize(9); p.textStyle(p.NORMAL);
                p.text('intensity ' + it.west_intensity, leftX - rL - 6, yL + 12);

                // Right node
                p.fill('#C8412C');
                var rR = radius(it.east_intensity);
                p.ellipse(rightX, yR, rR, rR);
                p.fill('#1a1a1a'); p.textSize(11); p.textStyle(p.BOLD);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(it.priority_label, rightX + rR + 6, yR);
                p.fill('#999'); p.textSize(9); p.textStyle(p.NORMAL);
                p.text('intensity ' + it.east_intensity, rightX + rR + 6, yR + 12);
            });

            p.pop();
        }
    };
})();
