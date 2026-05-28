# Two IKEAs — Interactive Narrative

How IKEA's global model split under housing affordability pressure.

**IMT 561 Data Visualization: Design and Development · Spring 2026**
**Team:** Pengcheng Lu, Samantha Wang

Built on the course Interactive Narrative template (scrolling article + sticky p5.js canvas), originally derived from [Jim Vallandingham's scrollytelling template](https://github.com/vlandham).

---

## Live site

> https://pengchenglu1997.github.io/interactive-narrative/

(Deploys automatically from the `gh-pages` branch.)

## Run locally

Pure-frontend, no build step.

```bash
cd interactive-narrative
python3 -m http.server 8000
# open http://localhost:8000
```

Or use VS Code Live Server (right-click `index.html` → "Open with Live Server").

## Project structure

```
interactive-narrative/
├── index.html                  Scroll-based article with 11 sections
├── css/
│   ├── bootstrap.min.css       (template)
│   └── style.css               Two IKEAs styling (IKEA palette + stat cards)
├── js/
│   ├── helpers/
│   │   ├── data_loader.js      CSV loader + Two IKEAs data bootstrap
│   │   ├── scroller.js         (template) scroll position tracker
│   │   ├── sections.js         (template) orchestrator
│   │   └── visual_controller.js (template) show/hide #vis based on section
│   └── sketches/
│       ├── sketch_manager.js   (template) single p5 instance manager
│       ├── sketch_renderer.js  Dispatches activeIndex → viz module
│       └── viz/
│           ├── viz_map.js          Viz 1: store timeline map (Act 1)
│           ├── viz_response.js     Viz 2: PTI × IKEA city-format response (Act 2)
│           ├── viz_timeline.js     Viz 3: Gantt strategic events (Act 3)
│           ├── viz_ecology.js      Viz 4: retail ecology matrix (Act 4)
│           └── viz_playbook.js     Viz 5: slope chart of priorities (Coda)
├── data/
│   ├── processed/
│   │   ├── ikea_stores.csv             57 stores, dated sources
│   │   ├── housing_pressure.csv        24 cities, Numbeo PTI fetched 2026-05-26
│   │   ├── strategic_events.csv        38 events, all with press-release URLs
│   │   ├── east_asian_competitors.csv  12 rows, Nitori/Hanssem revenue figures
│   │   ├── retail_ecology.csv          10 markets × 6 dimensions
│   │   └── playbook_priorities.csv     8 strategic priorities, West vs East
│   ├── AUDIT.md           Data quality audit
│   ├── AUDIT_SCAN.md      Programmatic scan output (re-runnable)
│   ├── PIPELINE.md        Per-row provenance
│   ├── STORY_AUDIT.md     Claim-by-claim verification of article prose
│   ├── VIZ_AUDIT.md       First-round semantic audit of visualizations
│   └── VIZ_AUDIT_v2.md    Second-round semantic audit (post-rewrite)
├── scripts/
│   └── audit_data.mjs     Node script for the 10 data integrity checks
└── README.md              This file
```

## How the article works

Sticky p5 canvas on the right, scrolling text on the left. Each `<section
class="step" data-active-index="N">` tells the canvas which visualization to
draw via `js/sketches/sketch_renderer.js`.

| Index | Section | Viz drawn |
|---|---|---|
| 0 | Hero / title (full-text) | — |
| 1, 2 | Act 1: One IKEA, one model | viz_map |
| 3, 4 | Act 2: The housing shift | viz_response |
| 5, 6 | Act 3: Two parallel adaptations | viz_timeline |
| 7, 8 | Act 4: Why East Asia is different | viz_ecology |
| 9 | Coda: Two playbooks (full-viz) | viz_playbook |
| 10 | About authors (full-text) | — |

## Data — provenance and quality

All data is from public sources with dated URLs per row. The Gen AI course
policy ("Do not have Gen AI analyse your data, it might make up things") shaped
the pipeline:

- **Numeric fields** are extracted directly from primary sources (Numbeo,
  Statista, McKinsey, IKEA Japan/Korea/China newsroom, Yicai Global, ConCall
  analysis, etc.). Every row carries `source_url` and `fetch_date` so any
  reader can re-verify.
- **Qualitative codings** (retail ecology cells, playbook intensity scores) are
  team judgments anchored in cited research (Burt 2011/2020; Ivarsson 2010) and
  explicitly flagged as interpretive in the audit documents.

The full audit trail lives in `data/AUDIT.md`, `data/PIPELINE.md`,
`data/STORY_AUDIT.md`, `data/VIZ_AUDIT.md`, and `data/VIZ_AUDIT_v2.md`.

Re-run the programmatic data checks:

```bash
node scripts/audit_data.mjs > data/AUDIT_SCAN.md
```

## Adding a new visualization for a section

1. Create `js/sketches/viz/viz_foo.js` exposing `window.VizFoo = { draw(p, manager, ai, progress) { ... } }`.
2. Add a `<script src="js/sketches/viz/viz_foo.js"></script>` in `index.html` before `sketch_renderer.js`.
3. Route to it in `sketch_renderer.js` by mapping the relevant `activeIndex` values to `window.VizFoo.draw(...)`.
4. Add a new `<section class="step" data-active-index="N">` in `index.html` with the prose for that section.

## Branch workflow

- `gh-pages` — deployed site (GitHub Pages serves from here)
- `pengcheng` — Pengcheng's working branch
- `samantha` — Samantha's working branch

Workflow: commit on a personal branch, push to GitHub, open a PR into `gh-pages`
for review, merge after approval.

## Acknowledgments

Template by [Jim Vallandingham](https://github.com/vlandham) (scrollytelling
pattern), adapted for IMT 561 by @bcsaldias. Two IKEAs project content,
data pipeline, and visualization designs © Pengcheng Lu and Samantha Wang.
