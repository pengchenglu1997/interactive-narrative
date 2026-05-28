// sketch_renderer.js
// Two IKEAs project renderer. Loads the 6 CSVs into manager.data, then
// dispatches drawing to the correct viz module based on data-active-index.
//
// Section index → visualization mapping (mirrors data-active-index in index.html):
//   0    Hero / title         — no viz drawn (full-text)
//   1, 2 Act 1: One IKEA      → VizMap (year animates via scroll progress)
//   3, 4 Act 2: Housing shift → VizResponse (PTI × IKEA response)
//   5, 6 Act 3: Two adaptations → VizTimeline (Gantt of strategic events)
//   7, 8 Act 4: Why East diff → VizEcology (retail ecology matrix)
//   9    Coda: Two playbooks  → VizPlaybook (slope chart)
//   10   About authors        — no viz (full-text)

(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;
            manager.data = { stores: [], housing: [], events: [], competitors: [], ecology: [], playbook: [] };

            if (!window.DataLoader || !window.DataLoader.loadTwoIKEAsData) {
                console.warn('Renderer: DataLoader.loadTwoIKEAsData missing — viz will show "Loading…" forever');
                return Promise.resolve(manager.data);
            }
            return window.DataLoader.loadTwoIKEAsData().then(function (data) {
                manager.data = data;
                console.log('Renderer: Two IKEAs data loaded',
                    'stores=' + data.stores.length,
                    'housing=' + data.housing.length,
                    'events=' + data.events.length,
                    'ecology=' + data.ecology.length,
                    'playbook=' + data.playbook.length);
                return data;
            }).catch(function (err) {
                console.error('Renderer: data load failed', err);
                return manager.data;
            });
        },

        draw: function (p, manager, ai, progress) {
            // Full-text sections — leave canvas blank
            if (ai === 0 || ai === 10) return;

            // Act 1 — map
            if (ai === 1 || ai === 2) {
                if (window.VizMap) window.VizMap.draw(p, manager, ai, progress);
                return;
            }
            // Act 2 — PTI x response
            if (ai === 3 || ai === 4) {
                if (window.VizResponse) window.VizResponse.draw(p, manager, ai, progress);
                return;
            }
            // Act 3 — strategic timeline
            if (ai === 5 || ai === 6) {
                if (window.VizTimeline) window.VizTimeline.draw(p, manager, ai, progress);
                return;
            }
            // Act 4 — retail ecology matrix
            if (ai === 7 || ai === 8) {
                if (window.VizEcology) window.VizEcology.draw(p, manager, ai, progress);
                return;
            }
            // Coda — playbook slope chart
            if (ai === 9) {
                if (window.VizPlaybook) window.VizPlaybook.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
