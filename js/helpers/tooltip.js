// tooltip.js — shared hover tooltip used by every p5 viz.
// One floating <div> appended to <body>; each viz computes hover state in
// its draw() and calls VizTooltip.show(sk, html, mouseX, mouseY).
//
// Position is computed SYNCHRONOUSLY (no requestAnimationFrame): we measure
// the tooltip's rendered size and flip its anchor to the left of the cursor
// or above it if showing on the right/below would overflow the viewport.
// This avoids the flicker we'd get if the helper first set an overflowing
// position and then nudged it inside the viewport on the next frame.
(function () {
    var el = null;
    var lastHtml = '';

    function ensure() {
        if (el) return;
        el = document.createElement('div');
        el.id = 'viz-tooltip';
        el.setAttribute('role', 'tooltip');
        document.body.appendChild(el);
    }

    function canvasOffset(sk) {
        if (sk && sk.canvas && sk.canvas.getBoundingClientRect) {
            var r = sk.canvas.getBoundingClientRect();
            return { x: r.left, y: r.top };
        }
        return { x: 0, y: 0 };
    }

    window.VizTooltip = {
        // sk is the p5 instance.
        // localX / localY are sketch (canvas-local) pixel coordinates — the
        // raw p.mouseX / p.mouseY of the viz's draw() call.
        show: function (sk, html, localX, localY) {
            ensure();
            var off = canvasOffset(sk);

            // Skip re-rendering identical content (avoids layout thrash and
            // makes the same tooltip stable when the user hovers the same
            // element across many frames).
            if (html !== lastHtml) {
                el.innerHTML = html;
                lastHtml = html;
            }
            el.style.display = 'block';

            var ttW = el.offsetWidth;
            var ttH = el.offsetHeight;
            var cursorPageX = off.x + localX;
            var cursorPageY = off.y + localY;
            var pad = 12;
            var margin = 8;
            var maxX = window.innerWidth - margin;
            var maxY = window.innerHeight - margin;

            // Default: anchor tooltip to the right of cursor and below it.
            // Flip to LEFT / ABOVE when there isn't enough room on that side.
            var finalX = cursorPageX + pad;
            var finalY = cursorPageY + pad;
            if (finalX + ttW > maxX) finalX = cursorPageX - pad - ttW;
            if (finalY + ttH > maxY) finalY = cursorPageY - pad - ttH;

            // Final clamp so we never drift past the left or top edges either
            if (finalX < margin) finalX = margin;
            if (finalY < margin) finalY = margin;

            el.style.left = finalX + 'px';
            el.style.top = finalY + 'px';
        },
        hide: function () {
            if (el) el.style.display = 'none';
        }
    };
})();
