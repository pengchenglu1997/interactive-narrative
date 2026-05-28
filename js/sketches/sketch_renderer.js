// sketch_renderer.js
// Two IKEAs renderer. Dispatches to per-section viz modules and passes a
// per-section configuration (e.g. regime filter) via manager.state.vizConfig.
//
// Section index → viz + config (mirrors data-active-index in index.html):
//   0    Hero / title              — no viz (full-text)
//   1, 2 Act 1: One IKEA, six decades → Leaflet 3-region map (auto-play)
//   3    Act 2: East Asian housing pressure  → VizResponse  {regime: "east_asia"}
//   4    Act 2: Western response              → VizResponse  {regime: "western"}
//   5    Act 3: Western adaptation            → VizTimeline  {regime: "western"}
//   6    Act 3: East Asian adaptation         → VizTimeline  {regime: "east_asia"}
//   7    Act 4: East Asian ecology            → VizEcology   {regime: "east_asia"}
//   8    Act 4: Western ecology               → VizEcology   {regime: "western"}
//   9    Coda: Two playbooks                  → VizPlaybook
//   10   About authors                        — no viz (full-text)

(function () {
    // Map activeIndex → { viz, config }
    var ROUTING = {
        1: { viz: 'map' },
        2: { viz: 'map' },
        3: { viz: 'response', config: { regime: 'east_asia' } },
        4: { viz: 'response', config: { regime: 'western'  } },
        5: { viz: 'timeline', config: { regime: 'western'  } },
        6: { viz: 'timeline', config: { regime: 'east_asia' } },
        7: { viz: 'ecology',  config: { regime: 'east_asia' } },
        8: { viz: 'ecology',  config: { regime: 'western'  } },
        9: { viz: 'playbook' },
    };

    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;
            manager.data = { stores: [], housing: [], events: [], competitors: [], ecology: [], playbook: [] };
            if (!manager.state) manager.state = {};
            manager.state.vizConfig = {};

            if (!window.DataLoader || !window.DataLoader.loadTwoIKEAsData) {
                console.warn('Renderer: DataLoader.loadTwoIKEAsData missing');
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
            // Pull routing for this active index
            var route = ROUTING[ai];

            // Manage Leaflet stage visibility (Act 1 only)
            var isMapSection = !!(route && route.viz === 'map');
            if (!isMapSection && window.VizMap && window.VizMap.deactivate) {
                window.VizMap.deactivate();
            }

            // Pass per-section config to viz
            if (route && route.config) {
                manager.state.vizConfig = route.config;
            } else {
                manager.state.vizConfig = {};
            }

            // Full-text sections — leave canvas blank
            if (!route) return;

            switch (route.viz) {
                case 'map':
                    if (window.VizMap) window.VizMap.draw(p, manager, ai, progress);
                    return;
                case 'response':
                    if (window.VizResponse) window.VizResponse.draw(p, manager, ai, progress);
                    return;
                case 'timeline':
                    if (window.VizTimeline) window.VizTimeline.draw(p, manager, ai, progress);
                    return;
                case 'ecology':
                    if (window.VizEcology) window.VizEcology.draw(p, manager, ai, progress);
                    return;
                case 'playbook':
                    if (window.VizPlaybook) window.VizPlaybook.draw(p, manager, ai, progress);
                    return;
            }
        }
    };
})();
