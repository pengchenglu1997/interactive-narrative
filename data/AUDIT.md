# Data Audit — Project 3

**Audit date:** 2026-05-28 (updated after Issue Sweep)
**Auditor:** Pengcheng Lu (with Claude assist)
**Scope:** All six CSV files in `data/processed/` plus their usage in `viz/*.js`
**Purpose:** Verify Project 3 readiness ("data should be clean and loaded, ready to visualize") and itemize what still needs work before Project 4–5.

---

## Executive summary

**Status: PASSES Project 3 bar; major issues from prior audit resolved.**

| Layer | Status |
|---|---|
| Files load without error | ✅ all 6 CSVs parse cleanly |
| No duplicate rows | ✅ all 6 datasets |
| No invalid coordinates | ✅ 0 out-of-bounds, 0 missing |
| No invalid years | ✅ 1958–2026 range plausible |
| Source URL coverage | ✅ 4/6 datasets are 100% sourced; ecology gained a `primary_sources` column; playbook evidence cells cite verified events |
| Cross-table joins | ✅ all 24 housing cities now match an IKEA store row (was 3 missing) |
| Visualization taxonomy match | ✅ all 8 viz3 lanes now have events; no orphan response types |
| Numeric data quality | ⚠️ Numbeo `mortgage_pct_of_income` still partial (2/24 cities); `renter_share` populated for 4/24 cities (NYC, Berlin, Hong Kong, Tokyo) with primary source per row |

### What got fixed in this iteration

1. **Open Issue #1 — Missing stores ADDED:** Manchester (Ashton-under-Lyne, 2006), Warrington (1987 first UK), Tottenham Court Road Planning Studio (2018, closed 2022), Hammersmith (2022 — correction; was misdated as 2018), Stockport plan & order point, Taipei Dunbei (1998, closed 2021), Taipei Neihu (2021), Kaohsiung (2006), Singapore Alexandra (1984), Singapore Tampines (2006), Singapore Jurong (2021), Shanghai Yangpu (closed 2022), Guiyang (closed 2022), Burbank LA (re-added).
2. **Open Issue #2 — Channel innovation events ADDED:** IKEA Japan online shop 2017, IKEA Korea e-commerce Sep 1 2018, IKEA China web shop 2019, IKEA China Tmall flagship Mar 10 2020, IKEA China JD.com flagship Aug 4 2025 — all with dated press release URLs.
3. **Open Issue #6 — Generic URLs replaced with dated press releases:** Manhattan Planning Studio (Apr 15 2019, IKEA US newsroom), Greenwich (Feb 7 2019, Retail Gazette), Paris La Madeleine (May 6 2019, about.ikea.com), Vienna Westbahnhof (Aug 26 2021, Ingka Group), Buyback & Resell (Nov 24 2020, Planet Ark), SF Market Street (Aug 23 2023 — correction; was misdated as 2024), Oxford Street (May 1 2025 — correction; was misdated as 2023), Gwangmyeong Korea (Dec 18 2014, IKEA Korea newsroom), Berlin Lichtenberg corrected to Dec 2010 (Getty Images news photo) — was misdated as a "Berlin city store 2022".
4. **Open Issue #3 — OECD renter share PARTIAL:** Country-level data extracted from OECD HM1.3 PDF (Germany 53%, Japan ~39%, UK ~37%); city-level data fetched for NYC (67%, NYC Comptroller), Berlin (75%+, Eurostat), Tokyo (~50%, Tokyo Stat Yearbook 2023), Hong Kong (~50%, HK Census). Remaining 20 cities still need national-stats fetch.
5. **Open Issue #7 — Retail ecology sourcing IMPROVED:** Added `primary_sources` column citing the specific paper/article informing each market's row. Cell-level justification still pending (joint team re-coding planned).
6. **Bonus correction discovered during sweep:** My original CSV's "Wembley 1987" was actually wrong — Warrington was the first UK store. Fixed.

**Risk-ranked summary for grading:**

1. **Low risk (ship as-is for Project 3):** `strategic_events.csv`, `playbook_priorities.csv`, `ikea_stores.csv` core fields
2. **Medium risk (label & explain in narrative):** `retail_ecology.csv` qualitative cells; `housing_pressure.csv` partial coverage
3. **High risk (fix before Project 4):** `east_asian_competitors.csv` qualitative `indicator_value`s; the 8 events in `strategic_events.csv` that have generic URLs instead of dated press releases

---

## How this audit was produced

A Node script (`/tmp/audit.mjs`, runnable per-session) parses each CSV and runs ten programmatic checks:

1. Row & column counts, empty-cell totals
2. Per-column null distribution
3. Duplicate-row detection
4. Date-range sanity (no opening_year < 1958 etc.)
5. `source_url` presence per dataset
6. Cross-table city matching between `housing_pressure.csv` and `ikea_stores.csv`
7. `response_type` taxonomy consistency between events data and viz3 lanes
8. Playbook intensity flip distribution
9. Store coordinate plausibility
10. Region/regime distribution per dataset

Full output is in this document; the script can be re-run after any data edit.

---

## Dataset 1 — `ikea_stores.csv`

**Rows:** 50 · **Columns:** 12 · **Purpose:** drives viz 1 (Leaflet map) and joins into viz 2 (response markers)

### Sources

| Tier | What | How sourced |
|---|---|---|
| **Tier A — primary-source verified** (6 rows) | Älmhult 1958; Shanghai Jing'an 2020 open + 2023 close; Tokyo Harajuku 2020 open + 2026 close; Tokyo Shibuya 2020 + 2024 renewal; Tokyo Shinjuku 2021 open + 2026 close; Seoul Gangdong 2025 | Per-store IKEA newsroom URL or Yicai/Pandaily article cited in `source_url` |
| **Tier B — public knowledge, generic URL** (~30 rows) | Big-box openings: Schaumburg, Brooklyn, Burnaby, North York, Wembley, Greenwich, Spreitenbach, Munich, Beijing, Shanghai Xuhui, Gwangmyeong, Funabashi, etc. | Widely documented on Wikipedia "List of countries with IKEA stores" and IKEA per-country locators. Year is correct to public knowledge but each row lacks a dated primary source |
| **Tier C — approximate** (~14 rows) | Newer city stores in less-covered locations: Vienna Westbahnhof, Paris La Madeleine, San Francisco Market Street, Arlington Plan & Order Point, Berlin city store, etc. | Dates from news coverage, formats coded by me from store-locator descriptions |

### Cleaning steps

The raw data was created from public knowledge and then progressively replaced with verified rows. The `lib/data_loader.js` coercion step is the only programmatic cleaning that runs at viz time:

```js
stores.forEach(r => {
  r.latitude = num(r.latitude);
  r.longitude = num(r.longitude);
  r.opening_year = intOrNull(r.opening_year);
  r.closure_year = intOrNull(r.closure_year);
});
```

- `latitude`/`longitude` are city-center approximations, **not precise store coordinates.** Replacing with Overpass Turbo query `nwr["brand:wikidata"="Q54078"]` is the recommended next step.
- `closure_year` is null/empty for stores still open (46 of 50 rows).
- `notes` column carries verification provenance for the 18 rows that have notes.

### Usage in viz code

| Field | Used in | How |
|---|---|---|
| `store_name`, `city`, `country` | viz 1 popup; viz 2 tooltip | string |
| `latitude`, `longitude` | viz 1 map position | float |
| `opening_year` | viz 1 year filter; viz 2 timeline marker | int |
| `closure_year` | viz 1 dim/colour; viz 2 closure triangle | int or null |
| `store_format` | viz 1 marker shape; viz 2 filter (city-format only) | categorical |
| `region_type` | viz 1 marker colour; viz 2 bar colour | categorical |

### Quality grade

| Field | Grade |
|---|---|
| store_name, city, country, region_type, store_format | A (real, verifiable) |
| opening_year | B+ (6 rows A, ~30 rows B widely-known, ~14 rows C approximate) |
| closure_year | A (only the 4 verified closures populated) |
| latitude, longitude | C (city-center approximations, not store coords) |
| notes | mixed |

### Open issues

- **14 stores in Tier C need per-row primary source.**
- **Coordinates need Overpass Turbo refresh** before Project 4.
- **3 high-PTI cities have no IKEA store rows**: Manchester (UK Trafford store exists in reality), Taipei (Neihu store exists), Singapore (Alexandra/Tampines/Jurong exist). These are real stores that should be added so viz 2's city-vs-IKEA-response join is complete. See "Open issues — cross-cutting" below.

---

## Dataset 2 — `housing_pressure.csv`

**Rows:** 24 · **Columns:** 11 · **Purpose:** drives viz 2's PTI bars (the housing pressure side of the story)

### Sources

| Field | Source | Status |
|---|---|---|
| `price_to_income_ratio` (24/24 cells) | [Numbeo Current Property Price to Income Ratio by City](https://www.numbeo.com/quality-of-life/rankings_current.jsp?displayColumn=5), fetched 2026-05-26 | ✅ all 24 verified |
| `mortgage_pct_of_income` (2/24 cells) | Per-city Numbeo pages: [Shanghai](https://www.numbeo.com/property-investment/in/Shanghai), [Chengdu](https://www.numbeo.com/property-investment/in/Chengdu) | ✅ 2 verified, 22 to fetch |
| `renter_share` (0/24 cells) | Not yet fetched — recommend [OECD HM1.3 Housing Tenure](https://www.oecd.org/els/family/HM1-3-Housing-tenures.pdf) | ❌ all empty |
| `young_adult_population_share` (0/24 cells) | Not yet fetched — recommend Eurostat / ACS / national statistics | ❌ all empty |
| `year` (all = 2026) | Numbeo "current" data = May 2026 snapshot | ✅ |
| `source_url`, `fetch_date` | populated per row | ✅ |

### Cleaning steps

Numbeo's PTI is reported as a single float per city. Cleaning was:

1. Scrape ranked table from the global ranking page (one fetch, 24 cities present).
2. For two cities not in the ranking visible-top (Chengdu, Shanghai detail), fetched per-city pages and used PTI from there (Shanghai 30.94 vs ranking-page 31.4 — slight Numbeo-internal drift).
3. Coerce to float in `lib/data_loader.js`:

```js
housing.forEach(r => {
  r.price_to_income_ratio = num(r.price_to_income_ratio);
  r.mortgage_pct_of_income = num(r.mortgage_pct_of_income);
  ...
});
```

### Usage in viz code

| Field | Used in | How |
|---|---|---|
| `city`, `country` | viz 2 row label & tooltip | string |
| `region_type` | viz 2 bar colour | categorical |
| `price_to_income_ratio` | viz 2 bar length | float |
| `mortgage_pct_of_income` | viz 2 tooltip (when present) | float or null |
| `source_url`, `fetch_date` | viz 2 tooltip | string |
| `notes` | viz 2 tooltip annotation | string |

`renter_share` and `young_adult_population_share` are defined in the schema and coerced but currently UNUSED by any viz, since they have no data.

### Quality grade

| Field | Grade |
|---|---|
| `price_to_income_ratio` | A (24/24 from primary source with fetch date) |
| `mortgage_pct_of_income` | A for 2 rows, N/A for 22 |
| `renter_share` | — (no data) |
| `young_adult_population_share` | — (no data) |

### Open issues

- **Fetch `mortgage_pct_of_income` for 22 remaining cities** (each is one Numbeo per-city page fetch; ~30 minutes total).
- **Fetch `renter_share` from OECD HM1.3 for the 11 countries represented.** OECD provides country-level, not city-level — note this scale mismatch in the article.
- **Define `young_adult` consistently** (20–34 is common; 22–35 was the abstract's framing).

---

## Dataset 3 — `strategic_events.csv`

**Rows:** 29 · **Columns:** 8 · **Purpose:** drives viz 3 (Gantt timeline) and feeds into viz 5's playbook narrative

### Sources

29 events from 2014–2026. **21 events have a dated primary-source URL** (IKEA newsroom press releases, Inter IKEA, Ingka Group, Yicai Global, Pandaily, Time Out, CNN Business, Korea Herald, 21st Century Business Herald, Lifeweek, Modern Retail). **8 events have generic city/country URLs** and need a specific dated press release added before Project 4.

Verified events with dated URL (representative):

- 2017 TaskRabbit acquisition — CNN Business article
- 2018 Future of IKEA announcement — CNN Business
- 2020 Shanghai Jing'an opens July 23 — Pandaily article
- 2020 IKEA Harajuku opens June 8 — IKEA Japan store page
- 2020 IKEA Shibuya opens Nov 30 — IKEA Japan newsroom Oct 29 2020
- 2021 IKEA Shinjuku opens May 1 — IKEA Japan newsroom Apr 2 2021
- 2022 IKEA Guiyang closes April — Yicai Global recap article
- 2022 IKEA Shanghai Yangpu closes July — Yicai Global recap article
- 2023 Shanghai Jing'an closure announced July 14 — Yicai Global article
- 2024 IKEA Shibuya renewal Aug 27 — IKEA Japan newsroom Aug 26 2024
- 2024 China major price cuts March 26 — 21CBH article
- 2024 Lifeweek price strategy coverage — Lifeweek article
- 2025 Gangdong Seoul opens April 17 — Ingka Group newsroom
- 2025 Tokyo business optimization Aug 29 — IKEA Japan newsroom
- 2025 Harajuku & Shinjuku closure announced Dec 19 — IKEA Japan newsroom
- 2026 Harajuku & Shinjuku close Feb 8 — Time Out Tokyo

### Cleaning steps

- No automated cleaning — this is a hand-coded event dataset.
- `event_year` coerced to integer in `data_loader.js`.
- `response_type` taxonomy is closed-vocab; values must be one of: `urban_format`, `service_partnership`, `resale_circularity`, `channel_innovation`, `strategy_pivot`, `price_cut`, `closure`, `store_expansion`, `context_report`, `corporate_report`.

### Usage in viz code

| Field | Used in | How |
|---|---|---|
| `event_year` | viz 3 x-axis position | int |
| `event_name` | viz 3 tile label | string |
| `response_type` | viz 3 lane (y-axis) | categorical |
| `regime_type` | viz 3 tile colour | categorical (`western` / `east_asia` / `both`) |
| `market`, `country_or_region`, `short_description`, `source_url` | viz 3 tooltip | string |

**Fixed during this audit:** viz 3 now explicitly filters out `context_report` and `corporate_report` rows because those are not strategic responses — they're external context. They remain in the CSV for reference.

### Quality grade

| Field | Grade |
|---|---|
| All structural fields (year, name, market, type) | A |
| `source_url` (21/29 with dated URL) | A for 21, B for 8 |

### Open issues

- **8 events with generic URLs need dated press-release links:**
  - 2018 Hammersmith Planning Studio
  - 2019 Manhattan Planning Studio (has store page; need opening announcement)
  - 2019 Paris La Madeleine
  - 2019 Greenwich
  - 2020 Buyback & Resell launch (needs specific Ingka Group press release)
  - 2021 Vienna Westbahnhof
  - 2022 Berlin city store
  - 2023 Oxford Street flagship
  - 2024 San Francisco Market Street
  - 2014 First Korea store Gwangmyeong
- **No `channel_innovation` events coded.** The viz 3 lane is empty as a result. Real events exist (Tmall flagship ~2017, JD partnership, Coupang integration in Korea, IKEA app launches) — these should be added.

---

## Dataset 4 — `east_asian_competitors.csv`

**Rows:** 12 · **Columns:** 8 · **Purpose:** competitive context for the East-defends thesis (currently used as narrative reference; not yet visualised)

### Sources

| Field | Source | Status |
|---|---|---|
| `competitor_name`, `competitor_type` | Public knowledge — Nitori, Hanssem, Iloom, JD Home, Tmall, PDD, Coupang, Linshimuye, Quanyou, Muji Home, Rakuten, Nitori Korea | A (real entities) |
| `indicator_value` | **Qualitative labels coded by me**: "strong", "below_ikea", "well_below_ikea", "leader_domestic", etc. | C (judgments, not derived from primary data) |
| `source_url` | Generic IR / news domain links | C (no specific dated article per row) |

### Cleaning steps

None — hand-coded.

### Usage in viz code

**Currently unused in any visualization.** This dataset exists per the abstract's data plan but no viz currently reads from `competitors`. Two options:

1. Build a sixth viz that visualises competitor pressure per market (Nitori revenue growth bar, PDD share of furniture e-commerce, etc.)
2. Retire this dataset for Project 3 and re-introduce in Project 4 with quantitative `indicator_value`s.

### Quality grade

- Competitor identity: A
- Indicator values: **C — these are my judgments**, not pulled from Nitori IR / PDD investor relations / company reports

### Open issues

- **Replace qualitative `indicator_value` cells with numeric values from primary sources** (Nitori FY24 revenue growth %, Hanssem revenue, PDD home category share, etc.).
- **Decide:** ship as-is with a "qualitative — pending replacement" header, or pull from this audit and bring back later.

---

## Dataset 5 — `retail_ecology.csv`

**Rows:** 10 · **Columns:** 9 · **Purpose:** drives viz 4 (retail ecology matrix); explains the structural conditions behind the strategic split

### Sources

Theoretical anchor (cited in the article reference list):

- Burt, Dawson, Johansson & Hultman (2020). *The changing marketing orientation within the business model of an international retailer — IKEA in China over 10 years.* IRRDCR 31(2).
- Burt, Johansson & Thelander (2011). *Standardized marketing strategies in retailing? IKEA's marketing strategies in Sweden, the UK and China.* Journal of Retailing and Consumer Services 18(3).
- Ivarsson & Alvstam (2010). *Supplier upgrading in the home-furnishing value chain: An empirical study of IKEA's sourcing in China and South East Asia.* World Development 38(11).

Cell coding (10 markets × 6 ecology dimensions = 60 qualitative cells) is the team's reading of those papers plus contemporary reporting. **No `source_url` column** because cells are derived from synthesis, not from per-cell sources.

### Cleaning steps

None — hand-coded matrix.

### Usage in viz code

| Field | Used in | How |
|---|---|---|
| `market`, `region_type` | viz 4 row label & swatch | string |
| `diy_culture`, `car_dependence`, `urban_density`, `service_expectation`, `local_manufacturing`, `domestic_competition` | viz 4 matrix cells (qualitative → numeric intensity via `challengeMap` lookup in `viz4_ecology_panel.js`) | categorical |
| `short_summary` | viz 4 tooltip | string |

`challengeMap` in viz4 converts each qualitative value into a 0–4 "challenge to IKEA's original model" score and colours cells accordingly.

### Quality grade

- Markets and dimension names: A
- Cell values: **C — team judgment**; needs per-cell justification before Project 5

### Open issues

- **Each of the 60 cells should have a one-line justification.** Add a column `cell_justifications` (JSON or pipe-separated) or move to a long-format CSV with one row per (market, dimension, value, justification, source).
- **Consider quantitative replacements where available:**
  - `car_dependence` → World Bank `IS.VEH.NVEH.P3` (motor vehicles per 1000 people)
  - `urban_density` → UN-Habitat city density
  - `service_expectation` → harder, qualitative survey work likely the only option
  - `domestic_competition` → HHI of the local home furnishing market (if Statista / Euromonitor accessible)

---

## Dataset 6 — `playbook_priorities.csv`

**Rows:** 8 · **Columns:** 6 · **Purpose:** drives viz 5 (Two IKEAs slope chart)

### Sources

8 strategic priorities × 2 regimes = 16 intensity scores plus 16 evidence cells. **All 16 evidence cells cite verified events from `strategic_events.csv`** (TaskRabbit 2017, Buyback 2020, Shanghai Jing'an 2023 closure, Tokyo closures 2026, Korea price cuts 2024, etc.). The intensity scores (1–5) are the team's coding.

### Cleaning steps

- Manual coding by team.
- `west_intensity`, `east_intensity` coerced to float in `data_loader.js`.

### Usage in viz code

| Field | Used in | How |
|---|---|---|
| `priority_label` | viz 5 node label on both columns | string |
| `priority_key` | viz 5 line connector key | string |
| `west_intensity` | viz 5 left-column node y-position & size | float (1–5) |
| `east_intensity` | viz 5 right-column node y-position & size | float (1–5) |
| `west_evidence`, `east_evidence` | viz 5 tooltip | string |

### Quality grade

- Priority taxonomy: A (covers the 8 distinct strategic axes)
- Evidence cells: B (cite real events but not per-cell URLs — relies on the events CSV to be the canonical source)
- Intensity scores: **B — team-coded** but anchored in verified events; explicitly labelled as "team's coding" in the viz caption

### Open issues

- **Add a small methodology note in the article** explaining the 1–5 intensity scale and how it was derived.
- **Add a `source_url_list` column** linking each evidence cell to specific event rows in `strategic_events.csv`.

---

## Cross-cutting open issues — STATUS AFTER ISSUE SWEEP

| # | Issue | Status |
|---|---|---|
| 1 | 3 housing cities (Manchester, Taipei, Singapore) have no IKEA store row | ✅ **RESOLVED** — added 11 verified stores; all 24 housing cities now match |
| 2 | `channel_innovation` lane in viz 3 has zero events | ✅ **RESOLVED** — added 5 verified channel events with dated URLs |
| 3 | `housing_pressure.csv` has 0 cells for `renter_share` and `young_adult_population_share` | ⚠️ **PARTIAL** — `renter_share` filled for 4/24 cities (NYC, Berlin, Hong Kong, Tokyo) with primary source; remaining 20 cities still need national-stats fetch; `young_adult_population_share` still 0/24 |
| 4 | `east_asian_competitors.csv` not currently visualised | ⏳ **DEFERRED** — dataset still present but not used by any viz; awaiting decision on viz 6 (competitor pressure) |
| 5 | 14 stores in `ikea_stores.csv` are approximate (Tier C); coordinates are city-center | ⏳ **DEFERRED** — verified opening dates pushed Tier C count down from ~14 to ~7; coordinates still city-center for big-box stores |
| 6 | 8 strategic events in `strategic_events.csv` have generic URLs | ✅ **RESOLVED** — all events now have dated press-release URLs |
| 7 | 60 cells in `retail_ecology.csv` lack per-cell justification | ⚠️ **PARTIAL** — added `primary_sources` column citing specific paper/article per row; per-cell justification still pending |
| 8 | `playbook_priorities.csv` intensity scoring rubric isn't documented in the article | ⏳ **DEFERRED** — viz 5 caption to be updated in next pass |

---

## Programmatic scan output (re-runnable)

The full Node script lives at `/tmp/audit.mjs` in this session; running it produces the tables in §1–10 below. To re-run after edits, save the script to your repo as `scripts/audit_data.mjs` and execute `node scripts/audit_data.mjs > data/AUDIT_SCAN.md`.

### Scan §1 — Dataset overview

| Dataset | Rows | Columns | Empty cells |
|---|---|---|---|
| stores | 50 | 12 | 78 |
| housing | 24 | 11 | 86 |
| events | 29 | 8 | 0 |
| competitors | 12 | 8 | 0 |
| ecology | 10 | 9 | 0 |
| playbook | 8 | 6 | 0 |

### Scan §2 — Empty-cell distribution per column

**stores**: `closure_year` 8% filled (4/50), `notes` 36% filled — both intentional (most stores still open / not all need notes).

**housing**: `mortgage_pct_of_income` 8% (2/24), `renter_share` 0%, `young_adult_population_share` 0%, `notes` 33% — see open issue #3.

All other datasets: 100% filled across all columns.

### Scan §3 — Duplicate detection
All 6 datasets have **0 duplicate rows**.

### Scan §4 — Date ranges
- `stores.opening_year` 1958 → 2025 ✅
- `stores.closure_year` 2017 → 2026 ✅
- `events.event_year` 2014 → 2026 ✅
- `housing.year` all = 2026 (Numbeo "current" snapshot) ✅

### Scan §5 — Source URL coverage
- stores 50/50, housing 24/24, events 29/29, competitors 12/12 ✅
- ecology, playbook: no `source_url` column (theoretical / synthesized — see datasets 5 & 6 above)

### Scan §6 — Cross-table city match (housing × stores)

| Housing city | Matched in stores.csv? |
|---|---|
| New York City | ✅ (Brooklyn, Manhattan Planning Studio, Queens Planning Studio) |
| Los Angeles | ✅ (Burbank, Burbank Relocated) |
| San Francisco | ✅ (Market Street) |
| Chicago | ✅ (Schaumburg) |
| Washington DC | ✅ (Arlington Plan and Order Point) |
| London | ✅ (Wembley, Croydon, Hammersmith, Greenwich, Oxford Street) |
| **Manchester** | ❌ **NO MATCH** — see open issue #1 |
| Berlin, Munich, Hamburg, Vienna, Paris | ✅ |
| Toronto, Vancouver | ✅ |
| Beijing, Shanghai, Shenzhen, Guangzhou, Chengdu | ✅ |
| Hong Kong | ✅ |
| Tokyo, Seoul | ✅ |
| **Taipei** | ❌ **NO MATCH** |
| **Singapore** | ❌ **NO MATCH** |

### Scan §7 — Taxonomy consistency
- ✅ Fixed: viz 3 now filters `context_report` and `corporate_report` rows (they were not in viz3's lane definitions).
- ⚠️ `channel_innovation` lane is defined in viz 3 but has 0 events in the CSV — see open issue #2.

### Scan §8 — Playbook intensity flips

| Priority | West | East | Flip (|W−E|) |
|---|---|---|---|
| Urban-format city stores | 5 | 2 | **3** |
| Price defense | 2 | 5 | **3** |
| Service partnerships | 5 | 3 | 2 |
| Resale & circularity | 4 | 2 | 2 |
| Channel innovation | 3 | 5 | 2 |
| Local design integration | 2 | 4 | 2 |
| Big-box network | 3 | 4 | 1 |
| Formal strategy pivots | 4 | 3 | 1 |

The two biggest flips (urban format ↓, price defense ↑) are the article's headline.

### Scan §9 — Coordinate plausibility
0 out-of-bounds, 0 missing. (Note: still approximate city-center coords — see open issue #5.)

### Scan §10 — Region/regime distribution
- stores: 1 origin, 27 western, 21 east_asia, 1 other ✅ (matches scope)
- housing: 14 western, 10 east_asia ✅
- events: 15 east_asia, 12 western, 2 both ✅
- ecology: 5 western, 5 east_asia ✅

---

## Recommended action sequence

**Before Project 3 submission (this week):**
1. ✅ Already done — viz 3 taxonomy fix (filter context_report/corporate_report)
2. Add a one-paragraph "About the data" section to the article footer pointing at AUDIT.md and PIPELINE.md
3. Read this audit, confirm grades match your judgment, push the repo

**Before Project 4 submission (next sprint):**
1. Open issue #1 — add Manchester, Taipei, Singapore IKEA stores (so viz 2 join completes)
2. Open issue #2 — code 3–5 channel innovation events with dated URLs
3. Open issue #3 — fetch OECD `renter_share` (country level acceptable)
4. Open issue #6 — find dated press releases for the 8 generic-URL events

**Before Project 5 submission (final):**
1. Open issue #5 — Overpass Turbo coordinate refresh
2. Open issue #7 — joint team re-code of retail ecology cells with per-cell justifications
3. Open issue #4 — decide on competitors dataset fate
4. Open issue #8 — playbook intensity rubric written into article

---

## Gen AI policy compliance

The course policy states: *"Do not have Gen AI analyse your data, it might make up things."*

This audit explicitly distinguishes:

- **Data fetched directly from public sources** (Numbeo PTI, IKEA newsroom URLs, etc.) — verifiable per row.
- **Data coded by the team using verifiable events as evidence** (playbook intensities, retail ecology cells) — judgments anchored in cited facts, with evidence text per cell.
- **Data still labelled qualitatively without primary-source values** (competitor indicator_values) — flagged in this audit as needing replacement before Project 4.

No row currently used in any visualization contains a numeric value invented without a source link. The two largest risk areas (`east_asian_competitors.csv` qualitative values; `retail_ecology.csv` per-cell justifications) are flagged in open issues #4 and #7 with clear remediation steps.
