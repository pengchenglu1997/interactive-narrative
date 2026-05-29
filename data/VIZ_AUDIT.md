# Visualization Semantic Audit

**Audit date:** 2026-05-28
**Scope:** All 5 visualizations + their narrative captions + Act prose in `index.html`
**Question being asked:** Does each viz accurately and completely express what the underlying data actually says?

This is different from `data/AUDIT.md` (data quality) and `data/PIPELINE.md` (data provenance). This audit asks: *given the data we have, do the visualizations tell a faithful story?*

---

## Executive summary

| Viz | Story intent (from abstract / Act prose) | Faithful? | Most important issue |
|---|---|---|---|
| 1. Leaflet map | Show how IKEA's physical footprint shifted from suburban big-box to urban formats | ✅ Faithful | Year-slider direction is counterintuitive (drag *backwards* to see growth contract) |
| 2. PTI × IKEA response | "Western pattern = openings without closures; East Asian pattern = openings followed by closures" | ⚠️ **Caption oversells** | Many East Asian cities show NO city-format experiment at all (Hong Kong, Beijing, Taipei, Singapore). The "openings followed by closures" pattern is true only for Shanghai and Tokyo. |
| 3. Gantt timeline | "Top 3 rows = Western response; bottom 3 = East Asian response" | ⚠️ **Data contradicts framing** | `channel_innovation` row is entirely red (East Asian). The abstract framed channel innovation as a Western move; data shows it's *more* prominent in East Asia. |
| 4. Retail ecology matrix | Show structural conditions challenging IKEA's original model | ✅ Faithful | Two-layer encoding (cell text = condition, cell color = challenge) has cognitive load; legend explains it but easy to misread |
| 5. Slope chart playbook | West vs East priority order with rank flips | ⚠️ **Internal inconsistency with viz 3** | Playbook says channel innovation = West 3 / East 5, but viz 3 shows 0 western channel events (all 5 are East Asian). Reader sees a "3" but can't find supporting events. |

**The headline finding:** the data IS telling a sharper, more interesting story than the abstract claims. The original "West innovates on channel, East defends on price" framing is only half right — **East Asia is also out-innovating West on digital channels** (Tmall 2020, JD 2025, Korea e-commerce 2018, Japan online 2017). The Western adaptation is physical-format-led (city stores, service partnerships), not digital-channel-led.

---

## Viz 1 — IKEA Store Timeline Map

**Story intent:** show that IKEA's physical footprint shifted from suburban big-box to urban formats, and that this shift played out differently in Western vs East Asian markets (urban-format expansion in West vs retreat in East).

**Data used:** 57 rows from `ikea_stores.csv`. Fields: lat/lon (position), region_type (color), store_format (shape), opening_year & closure_year (year filter & dimming).

**Encoding:**
- Position: Leaflet map (OpenStreetMap tiles, full pan/zoom)
- Color: blue=Western, red=East Asian, yellow=origin
- Shape: square=big-box, circle=city store, diamond=planning studio, triangle=plan&order
- State: dimmed (opacity 0.35) when closed in current year

**Faithful?** ✅ Yes — but two improvements would sharpen the story:

### Issues

1. **Year-slider direction is counterintuitive.** Default position is 2026 (all stores visible). Reader must drag *backwards* to see contraction. For narrative impact, dragging *forward* from 1958 → 2026 would show:
   - Slow European/North American spread 1958–2000s (suburban big-box)
   - China/Korea/Japan additions in 1990s–2000s (still big-box)
   - 2018+ explosion of urban formats in West
   - 2020+ East Asian city-store experiments
   - 2022–2026 East Asian closures (Jing'an, Guiyang, Yangpu, Harajuku, Shinjuku)
   - This forward animation IS the story. Currently the chart starts at the ending.

2. **No annotations on key moments.** Reader can scroll the year but no callouts highlight: "First planning studio" (Tottenham Court Rd 2018), "First city-centre store" (Paris 2019), "First China city store" (Shanghai 2020), "First closure of city experiment" (Jing'an 2023), etc.

### Suggested fixes (low effort)
- Auto-play button that animates 1958 → 2026 in ~10 seconds
- Pre-set year buttons: 1990, 2005, 2018, 2020, 2023, 2026

---

## Viz 2 — Housing Pressure × IKEA Response

**Story intent (current caption):** "Western pattern is openings without closures; East Asian pattern is openings followed by closures."

**Data used:**
- `housing.csv` for PTI bars (left side, sorted desc)
- `stores.csv` joined by city name for response markers (right side)
- Only city-format stores get bright yellow open / dark triangle close markers; big-box openings shown as faint dim dots

**Encoding:**
- Bar length = PTI; bar color = regime
- Yellow circle = city-format store opens; dark triangle = city-format closes; faint dim dot = big-box opens

**Faithful?** ⚠️ **Partially — caption is oversimplified.**

### What the chart actually shows (city by city, sorted by PTI descending)

| Rank | City | PTI | Region | City-format events |
|---|---|---|---|---|
| 1 | Taipei | 34.5 | East | None (Neihu 2021 = big-box) |
| 2 | Hong Kong | 31.6 | East | **None** (only big-box since 1975) |
| 3 | Shanghai | 30.9 | East | Jing'an open 2020 → close 2023 ✓ |
| 4 | Beijing | 29.7 | East | None |
| 5 | Shenzhen | 29.1 | East | None |
| 6 | Seoul | 27.8 | East | Gangdong 2025 (city) |
| 7 | Singapore | 23.4 | East | Jurong 2021 (city) |
| 8 | Guangzhou | 22.9 | East | None |
| 9 | Tokyo | 16.2 | East | Harajuku/Shibuya/Shinjuku 2020-21, **2 closed 2026** ✓ |
| 10 | London | 15.8 | West | TCR 2018, Hammersmith 2022, Oxford St 2025 |
| 11 | Paris | 15.6 | West | La Madeleine 2019 |
| 12 | Chengdu | 13.5 | East | None |
| 13 | Vienna | 13.1 | West | Westbahnhof 2021 |
| 14 | Vancouver | 11.2 | West | None in data |
| 15 | Munich | 11.4 | West | None in data |
| 16 | Toronto | 10.7 | West | None in data |
| 17 | Berlin | 10.3 | West | None in data |
| 18 | Hamburg | 9.7 | West | None in data |
| 19 | LA | 9.5 | West | None in data |
| 20 | Manchester | 7.0 | West | None in data |
| 21 | SF | 7.0 | West | Market St 2023 (city) |
| 22 | Washington DC | 4.8 | West | Arlington plan&order 2022 |
| 23 | NYC | 14.3 | West | Manhattan studio 2019, Queens 2020 |

### The story this chart *actually* tells

- **Five of the top eight highest-PTI cities have ZERO city-format IKEA stores** (Taipei, Hong Kong, Beijing, Shenzhen, Guangzhou). Most of East Asia's highest-pressure cities haven't seen IKEA try city format at all.
- Only **Shanghai, Seoul, Singapore, and Tokyo** got East Asian city-format experiments. Three of those (Shanghai Jing'an, Tokyo Harajuku, Tokyo Shinjuku) have already closed.
- In the West, city-format markers are concentrated in **London, Paris, NYC, SF, Vienna** — high-PTI cities, with no closures visible.

So the more accurate caption is **"Where Western IKEA met high housing pressure, it opened city stores and kept them open. Where East Asian IKEA met high housing pressure, it mostly stayed in big-box format — and the few city stores it tried have been closing."**

### Required fix

Update the Act 2 prose AND viz 2 caption to reflect what the chart actually shows. Specifically: the absence of city stores in 5 of 8 high-PTI East Asian cities is a finding, not noise.

---

## Viz 3 — Strategic Response Gantt Timeline

**Story intent (current Act 3 prose):** "Scan the top three rows — the Western response. Scan the bottom three rows — the East Asian response. The contrast between the top half and bottom half of the chart is the contrast between the two IKEAs."

**Data used:** 34 events from `strategic_events.csv` (after filtering out context_report/corporate_report). Fields: response_type (lane), event_year (x), regime_type (tile color), event_name (tile label).

**Encoding:**
- Lane (y-axis): one of 8 response types in fixed order
- Tile position (x-axis): year 2014–2026
- Tile color: blue=Western, red=East Asian, gold=both
- Tile label: event_name (truncated to fit)

**Faithful?** ⚠️ **Mostly yes — but the data subverts the original "West=channel, East=price" framing.**

### What each lane actually contains (after fixes)

| Lane | Tiles | Color distribution |
|---|---|---|
| Urban format | 11 tiles | **Mixed**: 6 East (Shanghai, Harajuku, Shibuya, Shinjuku, Neihu, Jurong, Gangdong), 5 West (TCR, Manhattan, Paris, Greenwich, Vienna, Hammersmith, Berlin Lichtenberg gets misfiled actually it's big-box, SF, Oxford St) |
| Service partnership | 1 tile | Blue (TaskRabbit 2017) |
| Resale/circularity | 1 tile | Gold (Buyback 2020, both regimes) |
| Channel innovation | **5 tiles, all red** | **Pure East**: Japan 2017, Korea 2018, China web 2019, Tmall 2020, JD 2025 |
| Strategy pivot | 3 tiles | 1 gold (2016 CEO), 1 blue (2018 Future of IKEA), 1 red (2025 Tokyo optimization) |
| Price cut | 2 tiles | **Pure red** (China 2024 ×2) |
| Closure | 5 tiles | **Pure red** (Guiyang, Yangpu, Jing'an announce, Harajuku/Shinjuku announce + actual) |
| Big-box expansion | 1 tile | Red (Gwangmyeong 2014) |

### The story this chart *actually* tells

- The visual pattern is **NOT** "top rows = Western, bottom rows = East Asian." The actual pattern is:
  - **Pure Western moves:** Service partnership, Strategy pivot (mostly)
  - **Pure East Asian moves:** Channel innovation, Price cut, Closure, Big-box expansion
  - **Mixed:** Urban format (where the two IKEAs collide)
- The biggest surprise: **East Asia is winning on channel innovation.** Western IKEA has no explicit channel events in the data. This contradicts the abstract's framing of "the West pivots on channel."

### Required fix

Either:
- (a) **Reframe the prose** to acknowledge that channel innovation is East-led; West's adaptation is physical-format-led (Reframing is honest and is actually a stronger article — finding > original hypothesis).
- (b) Add Western channel events. Real ones exist (IKEA Place AR app 2017, US online expansion, UK omnichannel investments), but they're less newsworthy than the Asian platform integrations and require additional research to date precisely.

Recommended: **option (a)** — let the data update the story.

---

## Viz 4 — Retail Ecology Matrix

**Story intent (current Act 4 prose):** "Six structural conditions explain a lot of the gap. The matrix below shades each market by how much each condition challenges IKEA's original big-box DIY model. Western markets glow cool; East Asian markets glow warm."

**Data used:** 10 markets × 6 dimensions from `retail_ecology.csv` (qualitative: weak/moderate/strong/very_strong or low/moderate/high/very_high).

**Encoding:**
- Row = market; column = ecology dimension
- Cell color: derived via `challengeMap` in viz4 — maps qualitative value to a 0–4 "challenge to IKEA" intensity, then to color (light blue → red)
- Cell text: the original qualitative value
- Row background highlights on click

**Faithful?** ✅ Yes — `challengeMap` is consistent (verified in audit), and the color story (cool West, warm East) holds.

### Cognitive-load issue

The cells display two encodings:
- **Text** = the observed condition (e.g., "weak" DIY culture)
- **Color** = the implication for IKEA's model (red because "weak DIY" challenges IKEA)

A reader scanning quickly might see "weak" + red and infer "weak is bad" — but actually "weak DIY culture" means it's harder for IKEA's self-assembly model, not that DIY itself is bad.

The legend ("Challenge to IKEA's original big-box DIY model") explains this, but it's a two-step inference.

### Minor improvement (optional)

Replace cell text with a short clarifying phrase per cell: e.g., instead of just "weak", show "weak (challenge to IKEA)". Or add a small arrow icon: ↑ = helps IKEA, ↓ = challenges IKEA. Not blocking — legend is already correct.

---

## Viz 5 — Two IKEAs Playbook Slope Chart

**Story intent (current Coda prose):** "Each line connects the same item across the two columns. Steep lines are the rank flips — where one IKEA's headline move is the other IKEA's afterthought."

**Data used:** 8 priorities from `playbook_priorities.csv`. Fields: `west_intensity` and `east_intensity` (1–5 scale, team-coded), `west_evidence` and `east_evidence` (text per cell).

**Encoding:**
- Two vertical columns (West left, East right)
- Each item appears once per column at y-position = rank in that column
- Bezier line connects same item across columns
- Line color: blue if West-higher, red if East-higher, gray if ≈equal
- Line thickness: |West − East| difference
- Node size: intensity score in that column

**Faithful?** ⚠️ Faithful to the playbook CSV, but the playbook CSV has an inconsistency with the events data.

### The channel innovation inconsistency

| Source | What it says about Channel innovation |
|---|---|
| `strategic_events.csv` | 5 East Asian events (Japan 2017, Korea 2018, China web 2019, Tmall 2020, JD 2025); **0 Western events** |
| `playbook_priorities.csv` | West intensity = **3** (out of 5); East intensity = 5 |
| Viz 3 displays | 5 red tiles, 0 blue tiles in channel innovation row |
| Viz 5 displays | West node size moderate (3); East node size large (5) — line drops moderately |

A skeptical reader will see viz 5 say "West priority 3" for channel innovation, then look at viz 3 and find no Western events at all. The "3" is unsupported by visible evidence.

### Two fixes possible

**Fix A:** Lower `west_intensity` for channel_innovation from 3 to 2, with note "Western IKEA's omnichannel is present but not headline-strategic". This aligns viz 5 with the events data.

**Fix B:** Add Western channel events to `strategic_events.csv`. Real candidates:
- 2017: IKEA Place AR app launch (well-documented)
- 2017–2020: IKEA US/UK e-commerce rollout (less newsworthy single events)
- 2018: IKEA US Click & Collect expansion

Option B requires more data hunting; option A is a 1-character change. Recommended: **Fix A** (now), then **Fix B** in Project 4 if the team wants to argue West is also innovating digitally.

### Other inconsistency: Big-box network

- Playbook: West 3 / East 4
- Events: only 1 store_expansion event in the data (Gwangmyeong 2014, East)
- This is OK because the playbook intensity is about *strategic importance*, not *recent events* — but the gap should be flagged in the article.

---

## Cross-viz narrative consistency check

| Claim in Act prose | Supported by data? |
|---|---|
| Act 1: "Until the late 2000s, almost every dot is a big-box suburban store. After 2018, a new shape appears in city centres" | ✅ Yes — verifiable on Leaflet map |
| Act 2: "the East Asian pattern is openings followed by closures" | ⚠️ Only Shanghai + Tokyo. Most East Asian cities show no city-format experiment at all |
| Act 3: "the West pivots on channel" (implicit framing) | ❌ Data shows channel innovation is East-dominant |
| Act 4: "Western markets glow cool; East Asian markets glow warm" (ecology matrix) | ✅ Yes |
| Coda: "rank flips" between Western and East Asian priorities | ✅ Yes, slope chart shows them |

---

## Required fixes — prioritized

| # | Fix | Severity | Effort |
|---|---|---|---|
| A | **Reframe Act 2 prose & viz 2 caption** to acknowledge that most high-PTI East Asian cities never got city-format IKEA at all (it's not just "openings followed by closures") | High | 10 min |
| B | **Reframe Act 3 prose & viz 3 caption** to acknowledge that channel innovation is East-led, not West-led; rewrite Act 3 around "West adapts physical format; East adapts digital channel" | High | 15 min |
| C | **Lower playbook West intensity for channel_innovation** from 3 to 2 to align with events data | Medium | 1 line edit in CSV |
| D | Add small disclaimer in viz 5 caption that intensity scores 1–5 are team-coded interpretive ratings | Low | 1 line |
| E | (Optional) Add forward auto-play button to viz 1 year slider | Low | 30 min |
| F | (Optional) Add per-cell arrow icons or short phrases to viz 4 to disambiguate "value" from "implication" | Low | 20 min |

Fixes A, B, C are NARRATIVE INTEGRITY issues — they make the article *more honest* to its own data. They should be done before submission.

Fixes D, E, F are polish.

---

## Bottom line

The visualizations are **technically correct** (they accurately render the data they're given). The semantic gap is between the **original story framing** (West = channel, East = price) and the **story the data actually tells** (West = physical format adaptation, East = both digital channel innovation AND price defense, with city-format retreat).

The honest fix is to update the prose to match the data — which produces a sharper, more interesting article than the original frame. This is exactly the kind of "let the data update your hypothesis" move that IS academic writing rewards.
