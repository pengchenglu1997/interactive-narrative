// sketch_renderer.js
// Two IKEAs renderer. Per-section vizConfig + Leaflet activation.
//
// v4 section index mapping (after Coda split):
//   0      Hero / title              — no viz
//   1, 2   Act 1: One IKEA           → Leaflet single global map (auto-play)
//   3      Act 2: East Asian PTI     → VizResponse {regime: east_asia}
//   4      Act 2: Western PTI        → VizResponse {regime: western}
//   5      Act 3: Western response   → VizTimeline {regime: western}
//   6      Act 3: East Asian resp.   → VizTimeline {regime: east_asia}
//   7      Act 4: East ecology       → VizEcology  {regime: east_asia}
//   8      Act 4: West ecology       → VizEcology  {regime: western}
//   9      Coda · Scorecard          — no viz (full-text scorecard table)
//   10     Coda · Playbook           → VizPlaybook
//   11     About authors             — no viz

(function () {
    var ROUTING = {
        1: { viz: 'map' },
        2: { viz: 'map' },
        3: { viz: 'response', config: { regime: 'east_asia' } },
        4: { viz: 'response', config: { regime: 'western'  } },
        5: { viz: 'timeline', config: { regime: 'western'  } },
        6: { viz: 'timeline', config: { regime: 'east_asia' } },
        7: { viz: 'ecology',  config: { regime: 'east_asia' } },
        8: { viz: 'ecology',  config: { regime: 'western'  } },
        10:{ viz: 'playbook' },
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
            var route = ROUTING[ai];

            var isMapSection = !!(route && route.viz === 'map');
            if (!isMapSection && window.VizMap && window.VizMap.deactivate) {
                window.VizMap.deactivate();
            }

            if (route && route.config) {
                manager.state.vizConfig = route.config;
            } else {
                manager.state.vizConfig = {};
            }

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
