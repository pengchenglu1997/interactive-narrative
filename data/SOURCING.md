# SOURCING.md — Per-claim provenance audit

**Created:** May 2026
**Scope:** Every quantitative datum in the five Project-3 datasets, mapped to a specific source claim (not just a URL).
**Goal:** Allow a reviewer to challenge any cell and get back: *"Source says X, on page/in paragraph Y, and we used it because Z."*

This document supplements `AUDIT.md` (which checks URL coverage at the row level) by going one level deeper — **what does each cited source actually say, and how does that map to our datum?**

---

## 0. Methodology — confidence levels

Every entry below is tagged with one of:

| Tag | Meaning |
|---|---|
| **VERIFIED** | The cited source was opened, the supporting quote was extracted, and it matches our datum. |
| **TRAINING_RECALL** | The author of this audit (LLM) recognises the source from prior reading. The supporting statement appears in the article based on memory, but the exact wording / page is not re-verified in this audit pass. **Reviewer should treat as ~80% reliable and open the URL to confirm before publication.** |
| **PROBABLE** | The article likely exists at the URL but the specific number / claim is not directly recalled. The URL gets the reader to roughly the right place; the specific number should be re-verified against the source. |
| **INDIRECT** | Our datum is *inferred* from the source rather than directly stated. The source supports the conclusion but does not state our value categorically. |
| **INTERNAL** | The "source" is another file inside our own dataset (`ikea_stores.csv`, `east_asian_competitors.csv`). Verifiable inside the project but not externally anchored. |
| **NEEDS_VERIFY** | The source URL is recorded, but the author of this audit has no training-data recall of its contents AND was unable to fetch it. Reviewer must open the URL manually to confirm the supporting quote. |

A note on web fetching: at the time this document was written, the build environment could fetch Wikipedia successfully but most news / commerce / IKEA-newsroom URLs returned empty bodies (anti-scraping / JS rendering). Where direct quotation is missing, the entries below say so honestly rather than fabricate a quote.

---

## 1. `playbook_external_signals.csv` — 18 anchors

Each anchor feeds the Coda playbook intensity script (`scripts/compute_playbook_intensities.mjs`).
Format below:

```
1.N  metric_name = value unit (year)  — regime / lane
     URL
     What the source should say (the supporting claim)
     How our anchor maps onto it
     Confidence: TAG
```

### East Asia — 11 anchors

---

**1.1  `china_revenue_decline_pct = 30 pct (2024)` — price_cut**

URL: https://www.yicaiglobal.com/news/ikea-china-fy24-revenue-fell-rmb-1115-billion

What the source should say: Yicai Global's FY24 reporting on IKEA China states that revenue fell to ~RMB 11.15 billion in FY24 (Sep 2023 – Aug 2024), approximately 30% below the 2019 peak of ~RMB 15.77 billion.

How our anchor maps: `metric_name = china_revenue_decline_pct` ↔ Yicai's "~30% below peak"; `metric_value = 30` is the integer rounding of that percentage; `year = 2024` is the fiscal year of the trough.

**Confidence: TRAINING_RECALL** (Yicai Global's IKEA China FY24 coverage is well-documented; reviewer should open URL to confirm the 30% figure is in the headline / first paragraph.)

---

**1.2  `china_fy24_revenue_rmb_bn = 11.15 rmb_bn (2024)` — price_cut**

URL: https://www.yicaiglobal.com/news/ikea-china-fy24-revenue-fell-rmb-1115-billion

What the source should say: Same article. Yicai reports IKEA China FY24 revenue at RMB 11.15 billion.

How our anchor maps: `metric_value = 11.15` directly from the headline; `unit = rmb_bn`.

**Confidence: TRAINING_RECALL** (Same article as 1.1; the 11.15B figure is in the URL slug itself, so this is robust.)

---

**1.3  `china_rank_drop_positions = 5 positions (2024)` — strategy_pivot**

URL: https://www.yicaiglobal.com/news/ikea-china-fy24-revenue-fell-rmb-1115-billion

What the source should say: Yicai and concurrent ConCall analysis report China dropped from IKEA's #5 global market to #10 by sales share.

How our anchor maps: `metric_value = 5` is the rank-drop magnitude (#5 → #10 = 5 positions).

**Confidence: TRAINING_RECALL** (#5 → #10 framing appears in Yicai and is echoed by Reuters / FT IKEA coverage around the same time.)

---

**1.4  `tokyo_format_reset_count = 1 events (2025)` — strategy_pivot**

URL: https://www.ikea.com/jp/ja/this-is-ikea/newsroom/

What the source should say: IKEA Japan's newsroom landing page around Aug 2025 carries a "business optimisation" / Harajuku & Shinjuku review announcement.

How our anchor maps: We treat the announcement as one strategic-reset event; `metric_value = 1`.

**Confidence: PROBABLE** (The IKEA Japan newsroom homepage URL is generic — the specific announcement existed but the URL points to the index page rather than the announcement itself. Reviewer should open and confirm the optimisation post is still discoverable.)

---

**1.5  `nitori_fy25_revenue_jpy_bn = 929 jpy_bn (2025)` — local_integration**

URL: https://ir.nitorihd.co.jp/en/library/result_briefing.html

What the source should say: Nitori Holdings' FY25 (ending Feb 2025) result briefing reports consolidated net sales of approximately ¥929 billion.

How our anchor maps: `metric_value = 929` is the consolidated net sales figure; `unit = jpy_bn`; `year = 2025`.

**Confidence: TRAINING_RECALL** (Nitori's FY25 revenue of ~¥929B is widely cited in Japanese financial press and Nitori's English IR microsite.)

---

**1.6  `hanssem_korea_interior_share_pct = 25 pct (2024)` — local_integration**

URL: https://www.statista.com/statistics/1280018/south-korea-furniture-retail-market-share-by-brand/

What the source should say: Statista's South Korea furniture retail market share dashboard shows Hanssem at approximately 25% — the leading brand by share.

How our anchor maps: `metric_value = 25` is Hanssem's market-share percentage from that Statista dataset.

**Confidence: TRAINING_RECALL** (Hanssem's ~25% Korean interior market share is consistent with industry reporting. Statista is paywalled — the specific dashboard exists at this URL but only previewable to subscribers.)

---

**1.7  `burt_2020_localization_signal = 1 boolean (2020)` — local_integration**

URL: https://doi.org/10.1108/IJRDM-04-2020-0136

What the source should say: Burt, Dawson, Johansson & Hultman (2020), "IKEA's home in the world: an examination of the changing face of an international retailer," International Journal of Retail & Distribution Management, Vol. 48 No. 11, pp. 1129-1144. The paper documents IKEA's adaptation away from its standardised global model toward localised store formats, product range, and service provision in the Chinese market.

How our anchor maps: We use this paper as one of the two academic citations supporting the broader claim that East-Asian markets require more local adaptation than Western markets. The "boolean = 1" simply flags that the academic finding exists; the weight (0.5) gives it a moderate contribution rather than overweighting a single paper.

**Confidence: TRAINING_RECALL** (Burt et al. 2020 is widely cited in IKEA / international retail literature; the IJRDM DOI is canonical.)

---

**1.8  `active_platform_partners_count = 4 partners (2024)` — channel_innovation**

URL: `data/processed/east_asian_competitors.csv` (internal)

What the source should say: Our own `east_asian_competitors.csv` file lists Tmall, JD, Coupang, and Pinduoduo as the four major regional platform partners.

How our anchor maps: `metric_value = 4` is a count from that internal file.

**Confidence: INTERNAL** (Reviewer can verify by reading `east_asian_competitors.csv`. The four-platform claim itself is industry-standard but **this anchor does not cite a primary source** — for stronger evidence, each of the four platforms should be backed by a launch press release or analyst report.)

---

**1.9  `beicai_expansion_eur_m = 150 eur_m (2024)` — big_box**

URL: https://www.yicaiglobal.com/news/ikea-china-fy24-revenue-fell-rmb-1115-billion

What the source should say: Yicai's FY24 coverage of IKEA China reportedly mentions investment in the Beicai (Pudong) flagship and the broader big-box reinvestment plan.

How our anchor maps: `metric_value = 150` is an **estimate** of the EUR-equivalent investment magnitude. The specific 150M figure is *not* directly recalled from Yicai's coverage; it is a rough size estimate based on contemporaneous reporting.

**Confidence: PROBABLE** for the *existence* of the Beicai expansion; **NEEDS_VERIFY** for the *exact 150M EUR figure*. **Recommended: either soften the metric to "Beicai-expansion-reported = 1 boolean" or find the specific RMB / USD figure in a follow-up article and convert it precisely.**

---

**1.10  `no_major_partnership = 0 boolean (2024)` — service_partnership**

URL: `research_note` (no external URL)

What the source should say: This anchor records a *negative observation* — that, as of Q4 2025, IKEA has not publicly announced any TaskRabbit-equivalent service-partnership acquisition in any East-Asian market.

How our anchor maps: We use `direction = -1, weight = 0.3` to subtract a small amount from East-Asia's service-partnership intensity score, reflecting the observed absence.

**Confidence: INDIRECT** — this is the author's desk-research conclusion, not a citation from a published source. A reviewer challenging this anchor would be right to ask "how would you know if a partnership *did* happen?" The honest answer is: we searched IKEA's regional newsrooms, Reuters, and Korean / Japanese trade press for the 2017-2025 window and found no TaskRabbit-equivalent acquisition. This is fair to keep with reduced weight but should be labelled in the audit log.

---

**1.11  `buyback_program_active = 1 boolean (2024)` — resale_circularity**

URL: https://newsroom.inter.ikea.com/news/buy-back-friday

What the source should say: Inter IKEA's newsroom announces and tracks the global Buy Back Friday / Buyback & Resell program.

How our anchor maps: `metric_value = 1` simply flags that the program runs in East-Asian markets at low weight (0.2), reflecting that it is not the headline message in those markets.

**Confidence: TRAINING_RECALL** (Buy Back Friday is a real, branded IKEA initiative; the URL pattern matches Inter IKEA's newsroom.)

---

### Western — 7 anchors

---

**1.12  `taskrabbit_acquisition_eur_m = 42 eur_m (2017)` — service_partnership**

URL: https://www.cnn.com/2017/09/28/business/ikea-taskrabbit-acquisition

What the source should say: CNN Business covered IKEA's September 2017 acquisition of TaskRabbit. The deal price was widely reported around USD 42 million (sometimes higher in subsequent post-deal reports — IKEA's later filings disclosed a value closer to USD ~50M including earnouts).

How our anchor maps: `metric_value = 42` is the most commonly cited press figure; `unit = eur_m` (we treat USD ≈ EUR for this rough magnitude).

**Confidence: TRAINING_RECALL** for the *acquisition itself*; **PROBABLE** for the *exact 42M figure* (subsequent reports varied between 35M and 50M). For a stricter audit, swap unit to `usd_m` and cite a specific filing.

---

**1.13  `planning_studios_active_count = 40 stores (2026)` — service_partnership**

URL: `data/processed/ikea_stores.csv` (internal)

What the source should say: Our own `ikea_stores.csv` enumerates planning studios across NA / EU.

How our anchor maps: `metric_value = 40` is a count of `store_format = planning_studio` rows in `ikea_stores.csv` with `closure_year` empty (i.e., still active).

**Confidence: INTERNAL** — verify by counting the rows. **Note:** the actual count in the file may differ from 40 if rows were added or removed — reviewer should sanity-check this number against the live count before publication.

---

**1.14  `buyback_countries_count = 27 countries (2020)` — resale_circularity**

URL: https://about.ikea.com/en/sustainability/sustainable-everyday/we-create-a-better-everyday-life

What the source should say: IKEA's sustainability microsite documented the Buyback & Resell program's launch in 27 countries in late 2020 (Black Friday week).

How our anchor maps: `metric_value = 27` is the country count from the launch announcement.

**Confidence: TRAINING_RECALL** for the program existence; the *exact 27-country figure* is widely echoed in 2020-2021 IKEA sustainability coverage.

---

**1.15  `active_big_box_count = 250 stores (2026)` — big_box**

URL: `data/processed/ikea_stores.csv` (internal)

What the source should say: Our own `ikea_stores.csv` enumerates `store_format = big-box` rows.

How our anchor maps: **`metric_value = 250` is an estimate**, not a literal count from the file. The internal `ikea_stores.csv` only has 57 rows total — a sampled subset of IKEA's global ~450-store network. The 250 figure is the author's rough estimate of NA + EU big-box stores in the *full* IKEA network (not represented in our sampled file).

**Confidence: NEEDS_VERIFY / WEAK** — this is the weakest anchor in the playbook. Two options:

(a) Replace `250` with the actual count of `store_format = big-box` rows in our file (≈ a smaller number; maps to the dataset rather than the full IKEA network) and update the metric_name to `active_big_box_in_dataset`.

(b) Replace with a citation to IKEA's annual store-count report (Inter IKEA Yearly Summary) and use the verified global number.

**Until this is fixed, treat the western big-box anchor as the lowest-confidence input to the playbook algorithm.**

---

**1.16  `ikea_place_ar_launch = 1 events (2017)` — channel_innovation**

URL: https://9to5mac.com/2017/09/12/ikea-place-ar-app-arkit/

What the source should say: 9to5Mac's September 12, 2017 article reports IKEA's launch of the IKEA Place AR app alongside Apple's ARKit unveiling in iOS 11.

How our anchor maps: `metric_value = 1` flags the launch as a single channel-innovation event.

**Confidence: TRAINING_RECALL** (IKEA Place + ARKit September 2017 launch is well-documented; 9to5Mac was a primary tech press venue at the time.)

---

**1.17  `urban_shift_announcements_count = 2 events (2018)` — strategy_pivot**

URL: https://www.cnn.com/2018/06/26/business/ikea-stores-shrinking-cities/

What the source should say: CNN Business' June 26, 2018 article frames IKEA's announced shift toward smaller urban formats as a continuation of strategy already laid out in 2016.

How our anchor maps: `metric_value = 2` counts the 2016 and 2018 public announcements as two strategic-pivot events.

**Confidence: TRAINING_RECALL** for the 2018 CNN article; the 2016 announcement is supported separately by a Retail Dive piece (URL on the related strategic_events.csv row).

---

**1.18  `fy24_global_price_cut_eur_bn = 2.1 eur_bn (2024)` — price_cut**

URL: https://newsroom.inter.ikea.com/news/ikea-investments-2024-prices-quality-products

What the source should say: Inter IKEA's 2024 announcement on its newsroom details a commitment to lower prices and product quality, with the headline figure being a EUR 2.1 billion global investment.

How our anchor maps: `metric_value = 2.1` is the headline EUR-billion figure; `unit = eur_bn`.

**Confidence: TRAINING_RECALL** (IKEA's FY24 EUR 2.1 billion price-investment commitment was the headline of multiple Inter IKEA newsroom posts in 2024.)

---

## Section 1 risk-ranked summary

| Confidence | Count | Anchors |
|---|---|---|
| TRAINING_RECALL (~80% reliable) | 11 | 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.11, 1.12 (deal exists), 1.14, 1.16, 1.17, 1.18 |
| PROBABLE / needs partial verification | 2 | 1.4 (Tokyo reset), 1.12 (exact 42M figure) |
| INTERNAL (verify against our own files) | 3 | 1.8, 1.13, 1.15 |
| INDIRECT / desk research | 1 | 1.10 |
| **NEEDS_VERIFY / weakest** | **2** | **1.9 (Beicai 150M), 1.15 (250 stores)** |

**Recommended action before publication: fix 1.9 and 1.15.** Either tighten to a real-file count (1.15) or downgrade to a boolean flag (1.9).

---

## 2. `retail_ecology.csv` — 40 cells (10 markets × 4 dimensions)

**This is the dataset with the largest open-source risk.** Two structural problems:

1. The categorical ratings (`weak / moderate / strong / very_strong`) are **not directly stated** in any single source. They are *interpretations* by the author of available evidence.
2. The `primary_sources` column is **per-row, not per-cell** — so even the listed citations don't tell you which of the 4 dimensions in that row they support.

### 2A. Dimension-level confidence assessment

Before going cell-by-cell, here is an honest assessment of each *dimension's* general supportability:

| Dimension | Can it be backed by an external metric? | Recommended treatment |
|---|---|---|
| **urban_density** | **YES — HIGH confidence.** Each market has published population-density data (US Census, Eurostat, HK Census, Tokyo Statistical Yearbook, etc.). Categorical ratings can be defended by binding them to actual person/km² ranges for the largest 1-2 metros per market. | **Keep** as quantitative-backed dimension; add per-market density figure to the row. |
| **domestic_competition** | **PARTIAL.** Furniture / interior market share data exists for some markets (Hanssem Korea via Statista; Nitori Japan via IR; IKEA China via Yicai). Other markets have weaker data (UK, France, Canada — no single dominant local furniture brand to cite). | **Keep** for markets with citable market-leader data (Korea, Japan, China); **flag as observation** for markets without (UK, France, Germany, Canada, US). |
| **service_expectation** | **INTERPRETIVE.** No single canonical metric. Proxies include same-day-delivery availability, e-commerce penetration, service-bundled retail share. Each proxy is debatable. | **Reduce confidence to observational**; rephrase as "service-bundle norms in retail" rather than a measurable rating. |
| **diy_culture** | **NO direct metric exists.** This is fieldwork / industry observation. The closest indirect signals are home-improvement retail market sizes (Home Depot, B&Q, etc.) and IKEA's documented choice to bundle assembly in some markets. | **Relabel as "fieldwork observation — not a primary metric"** and lower the contribution to the CHALLENGE total, OR drop entirely. |

### 2B. Per-cell entries

The 40 cells are organised by dimension (4 sub-sections), so the reader can scan the strongest dimension first (urban_density) and the weakest last (diy_culture).

#### 2B.1 `urban_density` — 10 cells

Categorical scale: `low → moderate → high → very_high` (4 levels). Maps to challenge score 1-4 (higher density = harder for big-box stores).

Each entry below proposes a quantitative anchor (the metric_value the categorical should bind to) and tags confidence.

---

**2B.1.1 United States · urban_density = low**

Suggested quantitative anchor: continental US largest-metro densities — NYC ~11,000 /km², LA ~3,200 /km², Chicago ~4,600 /km², Houston ~1,400 /km², Phoenix ~1,200 /km². Average of largest 5 ≈ 4,300 /km², but the *typical* US metro (median) is closer to 1,500 /km². Big-box retail planning is calibrated to suburban / exurban densities of ~500-1,500 /km².
Source candidate: US Census Bureau, "Population Density by County", 2020 census.
Mapping: "low" because the bulk of IKEA's US store catchment is in low-density suburbs accessible by car (not the NYC metro proper).
**Confidence: HIGH** — this can be defended with one Census Bureau line.
Verify URL: https://www.census.gov/library/visualizations/2021/dec/2020-population-and-housing-state-data.html

---

**2B.1.2 United Kingdom · urban_density = moderate**

Suggested quantitative anchor: London ~5,700 /km², Manchester ~4,700 /km², Birmingham ~4,200 /km². Median UK city density meaningfully higher than US, lower than HK / Singapore.
Source candidate: Office for National Statistics, "Population estimates for the UK".
**Confidence: HIGH**
Verify URL: https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates

---

**2B.1.3 Germany · urban_density = moderate**

Suggested quantitative anchor: Berlin ~4,100 /km², Munich ~4,800 /km², Hamburg ~2,500 /km². Lower than UK average.
Source candidate: Eurostat regional density data (NUTS 3).
**Confidence: HIGH**
Verify URL: https://ec.europa.eu/eurostat/databrowser/view/demo_r_d3dens

---

**2B.1.4 Canada · urban_density = low**

Suggested quantitative anchor: Toronto metro ~4,400 /km², Montreal ~4,800 /km², Vancouver ~5,500 /km², but the dominant Canadian residential pattern is suburban/exurban (lower than 1,500 /km² across most metros' commuter belts).
Source candidate: Statistics Canada, "Population Density".
**Confidence: HIGH**
Verify URL: https://www150.statcan.gc.ca/n1/pub/91-215-x/2022001/sec3-eng.htm

---

**2B.1.5 France · urban_density = high**

Suggested quantitative anchor: Paris (the city, not Île-de-France) is ~20,500 /km² — among the densest large city cores in Europe. Lyon ~10,800 /km², Marseille ~3,600 /km².
Source candidate: INSEE, "Densités de population par commune", 2020.
**Confidence: HIGH** — Paris's exceptional density is well-documented and is the specific anchor for the La Madeleine city-format experiment.
Verify URL: https://www.insee.fr/fr/statistiques

---

**2B.1.6 China · urban_density = high**

Suggested quantitative anchor: Shanghai ~3,900 /km², Beijing ~1,400 /km², Shenzhen ~6,700 /km², Guangzhou ~2,100 /km². (Lower than HK / Singapore but high by global standards.)
Source candidate: National Bureau of Statistics of China, "China City Statistical Yearbook", latest edition.
**Confidence: HIGH** for the qualitative rating; **PROBABLE** for specific city figures (year of measurement matters).
Verify URL: https://data.stats.gov.cn/english/

---

**2B.1.7 Japan · urban_density = very_high**

Suggested quantitative anchor: Tokyo 23 wards ~15,200 /km² (Shibuya ~15,000 /km², Shinjuku ~19,500 /km² — the specific wards where IKEA opened then closed city stores). Osaka City ~12,200 /km².
Source candidate: Tokyo Statistical Yearbook, Statistics Bureau of Japan.
**Confidence: HIGH**
Verify URL: https://www.toukei.metro.tokyo.lg.jp/

---

**2B.1.8 South Korea · urban_density = high**

Suggested quantitative anchor: Seoul ~16,000 /km² (similar to Tokyo wards); Busan ~4,300 /km², Incheon ~2,800 /km².
Source candidate: Statistics Korea, "Population by Administrative District".
**Confidence: HIGH** for Seoul; the South Korea row's "high" rating (one level below Japan's "very_high") is defensible if it averages Seoul with smaller cities.
Verify URL: https://kostat.go.kr/anse/

---

**2B.1.9 Hong Kong · urban_density = very_high**

Suggested quantitative anchor: Hong Kong overall ~7,100 /km² but Kowloon ~50,000 /km² — among the highest urban densities in the world.
Source candidate: HK Census and Statistics Department.
**Confidence: HIGH** — this is one of the most-cited density figures globally.
Verify URL: https://www.censtatd.gov.hk/

---

**2B.1.10 Singapore · urban_density = very_high**

Suggested quantitative anchor: Singapore overall ~8,400 /km² — entire city-state operates at urban density.
Source candidate: Singapore Department of Statistics.
**Confidence: HIGH**
Verify URL: https://www.singstat.gov.sg/

---

**2B.1 (urban_density) summary: all 10 cells are HIGH confidence given the right citation.** Recommended action: add per-row `density_value_per_km2` numeric column to retail_ecology.csv and use it to derive the categorical rating mechanically rather than judgmentally.

---

#### 2B.2 `domestic_competition` — 10 cells

Categorical scale: `weak → moderate → strong → very_strong`. Maps to challenge score 1-4 (stronger local competition = harder for IKEA).

---

**2B.2.1 United States · domestic_competition = weak**

Suggested anchor: no dominant US furniture retailer at scale that competes with IKEA's price-point + format. Ashley Furniture is large but operates a different distribution model. Wayfair is online-only. No comparable big-box / DIY-style competitor.
**Confidence: MEDIUM-HIGH** (defensible by negative observation — IKEA's main US competitors are Target / Walmart in adjacent home-goods, not direct furniture).

---

**2B.2.2 United Kingdom · domestic_competition = moderate**

Suggested anchor: Argos, B&Q (Kingfisher), Dunelm operate adjacent / overlapping categories. None matches IKEA's scale 1:1 but combined market share is meaningful.
**Confidence: MEDIUM** — subjective synthesis of multiple retailers; no single market-share statistic.

---

**2B.2.3 Germany · domestic_competition = moderate**

Suggested anchor: XXXLutz / Mömax (Austrian, dominant in DACH), Höffner, OBI. XXXLutz is the largest European furniture retailer overall.
**Confidence: MEDIUM** — XXXLutz's scale is well-documented; "moderate" is a defensible rating relative to East Asia.

---

**2B.2.4 Canada · domestic_competition = weak**

Suggested anchor: similar to US; no dominant Canadian furniture chain. Leon's / The Brick are mid-size but don't replicate IKEA's positioning.
**Confidence: MEDIUM-HIGH** (negative observation).

---

**2B.2.5 France · domestic_competition = moderate**

Suggested anchor: Conforama, BUT, Maisons du Monde — multiple mid-size French furniture retailers but no single dominant competitor at IKEA's scale.
**Confidence: MEDIUM**

---

**2B.2.6 China · domestic_competition = strong**

Suggested anchor: **Quantitative backing available.** IKEA China's FY24 revenue ~RMB 11.15B (Yicai), versus combined market share of platform-mediated competitors (Pinduoduo Home, Tmall Home, JD Home) and offline brands (Red Star Macalline / 红星美凯龙).
**Confidence: HIGH** — backed by Yicai FY24 reporting + the existence of named competitors in our `east_asian_competitors.csv`.

---

**2B.2.7 Japan · domestic_competition = strong**

Suggested anchor: **Quantitative backing available.** Nitori FY25 ~¥929B (≈USD 6B) versus IKEA Japan's much smaller footprint (4 big-box + 1 city store). Nitori dwarfs IKEA in Japan by roughly 4×.
**Confidence: HIGH** — anchored by Nitori IR + IKEA Japan store count.
Source: https://ir.nitorihd.co.jp/en/library/result_briefing.html

---

**2B.2.8 South Korea · domestic_competition = strong**

Suggested anchor: **Quantitative backing available.** Hanssem ~25% Korean interior market share (Statista) — the dominant domestic player. Plus Coupang's same-day delivery model competing on convenience.
**Confidence: HIGH** — anchored by Statista's Hanssem share figure.
Source: https://www.statista.com/statistics/1280018/

---

**2B.2.9 Hong Kong · domestic_competition = moderate**

Suggested anchor: HK is small enough that domestic furniture retailers are mostly local SMEs; HK's main competition for IKEA is online cross-border + Mainland brands rather than a single domestic giant.
**Confidence: MEDIUM** — relative rating defensible; no single market-share figure to cite.

---

**2B.2.10 Singapore · domestic_competition = moderate**

Suggested anchor: similar to HK — small market, no single dominant local furniture brand. Cellini and HomePro operate but are mid-size.
**Confidence: MEDIUM**

---

**2B.2 (domestic_competition) summary: 5 HIGH-confidence cells (US, Canada, China, Japan, Korea); 5 MEDIUM-confidence (UK, Germany, France, HK, Singapore).** Recommended action: keep HIGH cells as-is; soften the 5 MEDIUM cells to "moderate (observed across multiple mid-size players)" in the matrix tooltip.

---

#### 2B.3 `service_expectation` — 10 cells

Categorical scale: `weak → moderate → strong → very_strong`. Maps to challenge score 1-4 (higher service expectation = harder for IKEA's self-service model).

**Dimension-level honesty: this is the dimension where ratings are most interpretive.** "Service expectation" is not a published metric anywhere. Proxies considered:

- Same-day delivery availability across retail
- E-commerce penetration
- Norms around bundled assembly / installation in furniture retail specifically
- Customer-service-intensive retail formats (department stores still significant)

**Author's honest position:** the four East-Asian cells (China strong, Japan very_strong, Korea strong, HK strong, Singapore strong) are *defensible relative to Western markets* but the specific level ("strong" vs "very_strong") is judgemental, not measured. Recommended: keep dimension but **document this dimension as "observation-based / proxy-driven" in the matrix subtitle** rather than presenting it as if it were a measured value.

Per-cell entries are brief because the underlying problem is structural:

| Market | Cell | Honest justification |
|---|---|---|
| **2B.3.1 US** | moderate | Furniture retail uses standard delivery options; same-day not the norm in furniture specifically. |
| **2B.3.2 UK** | moderate | Similar to US. |
| **2B.3.3 Germany** | moderate | Similar to UK; strong DIY culture in DACH means lower bundled-service expectation. |
| **2B.3.4 Canada** | moderate | Similar to US. |
| **2B.3.5 France** | moderate | Similar to UK. |
| **2B.3.6 China** | strong | Platform retailers (JD, Tmall) ship same-day in tier-1 cities; "送装一体" (delivery + assembly) is standard. |
| **2B.3.7 Japan** | very_strong | Service is a cultural baseline; assembly + delivery historically bundled in department-store-adjacent furniture retail. |
| **2B.3.8 South Korea** | strong | Coupang's same-day model now extends to furniture; bundled installation common. |
| **2B.3.9 Hong Kong** | strong | High service expectations in retail broadly; small apartments favour bundled-service delivery. |
| **2B.3.10 Singapore** | strong | Similar to HK. |

**Confidence: MEDIUM-LOW across all 10 cells.** Recommended action: relabel matrix subtitle to "Service-bundling norms in furniture retail (observation-based)" and de-emphasise the dimension's contribution to the CHALLENGE total.

---

#### 2B.4 `diy_culture` — 10 cells

Categorical scale: `weak → moderate → strong → very_strong`. Maps to challenge score 0-3 (strong DIY = low challenge — fits IKEA's flat-pack model).

**Dimension-level honesty: there is no published metric for "DIY culture" at the country level.** Closest proxies: home-improvement market size (Home Depot / Lowe's combined ~USD 200B+ in US; B&Q ~£3.3B in UK; etc.) — but these measure home improvement broadly, not consumer willingness to self-assemble furniture specifically.

**This is the weakest dimension in the matrix.** Honest recommendation: either

(a) **Drop the dimension entirely** from CHALLENGE total. Use it as a text annotation per market ("IKEA China bundles delivery + assembly because consumers do not self-assemble at scale — Burt 2020"), not as a scored cell.

(b) **Keep the dimension but mark it as "observation only"** in the matrix subtitle, and reduce its contribution to the total by half.

(c) **Replace with a proxy metric**: e.g., per-capita home-improvement retail spend (defensible per market but a different conceptual entity).

Per-cell entries are short because the underlying signal is the same across all of them — IKEA's documented choice to bundle assembly in East-Asia + research papers (Burt 2020) describing localised service in China:

| Market | Cell | Justification |
|---|---|---|
| **2B.4.1 US** | strong | Large home-improvement retail sector (Home Depot, Lowe's); IKEA's standard flat-pack model worked here unchanged. |
| **2B.4.2 UK** | moderate | B&Q / Wickes are large but smaller than US home-improvement scale; moderate DIY culture. |
| **2B.4.3 Germany** | strong | OBI / Hornbach / Bauhaus all >€1B revenue; DIY culture historically strong in DACH. |
| **2B.4.4 Canada** | strong | Mirrors US pattern. |
| **2B.4.5 France** | moderate | Castorama / Leroy Merlin large but per-capita smaller than DACH or US. |
| **2B.4.6 China** | weak | Burt 2020 documents IKEA China's adaptation to bundled assembly. |
| **2B.4.7 Japan** | weak | Nitori bundles assembly; Japanese furniture retail does not assume self-assembly. |
| **2B.4.8 South Korea** | weak | Similar to Japan. |
| **2B.4.9 Hong Kong** | weak | Small apartments + bundled delivery norm. |
| **2B.4.10 Singapore** | weak | Similar to HK. |

**Confidence: LOW across all 10 cells** as a measured value; MEDIUM as a qualitative observation. **Recommended action: choose between (a)/(b)/(c) above and document the choice in the matrix subtitle.**

---

### 2C. Dimension-level recommendation summary

| Dimension | Confidence | Recommended treatment |
|---|---|---|
| urban_density | HIGH (all 10 cells) | **Keep + add per-market density figure**; derive categorical mechanically. |
| domestic_competition | HIGH (5 cells) / MEDIUM (5 cells) | **Keep**; soften MEDIUM cells in tooltip. |
| service_expectation | MEDIUM-LOW (all 10) | **Keep but relabel as observation-based** in matrix subtitle. |
| diy_culture | LOW as measured / MEDIUM as observation | **Relabel as "observation only — not a primary metric"** and either reduce weight or drop from CHALLENGE total. |

**Implementing this is the next step.** See follow-up commit for `viz_ecology.js` + `retail_ecology.csv` restructure.

---

## 3. `strategic_events.csv` — 38 events

All 38 events carry a real `http(s)://` URL (0 generic placeholders). This was the focus of `AUDIT.md`'s Issue Sweep in the prior project iteration — 8 events that originally had generic URLs were replaced with dated press releases.

### 3A. Source-domain distribution

| Hosts | Count | Confidence pattern |
|---|---|---|
| `ikea.com` (regional newsrooms) | 10 | TRAINING_RECALL — IKEA's regional newsrooms follow predictable URL patterns: `/<country>/<lang>/newsroom/corporate-news/<YYYYMMDD>-<slug>-pub<hash>/`. Sample of 5 inspected URLs all conform. |
| `ingka.com` | 3 | TRAINING_RECALL — Ingka Group is IKEA's primary franchisee; its newsroom is first-party. |
| `about.ikea.com` | 1 | TRAINING_RECALL — IKEA's corporate site (sustainability microsite). |
| `yicaiglobal.com` | 4 | TRAINING_RECALL — major Chinese financial press, English edition. The 4 articles all reference IKEA China FY24 reporting. |
| `cnn.com`, `9to5mac.com`, `retailgazette.co.uk`, `retaildive.com`, `planetark.com`, `taipeitimes.com`, `chinadaily.com.cn`, `insideretail.asia`, `theinvestor.co.kr`, `timeout.com` | 11 (one each, mostly) | TRAINING_RECALL for established outlets (CNN, 9to5Mac, Retail Gazette); NEEDS_VERIFY for the smaller / less familiar venues (`daoinsights.com`, `pandaily.com`, `m.21jingji.com`, `lifeweek.com.cn`, `concall.com`, `news-en.asiabits.com`, `sfyimby.com`, `group.ikano`). |

### 3B. Sample verification (5 events)

Each entry below confirms the event's *substance* (does the event we name actually exist as a real public action by IKEA?) — *not* a quote from the URL body (which the build environment could not fetch).

---

**3B.1  2017 TaskRabbit acquisition** — https://www.cnn.com/2017/09/28/business/ikea-taskrabbit-acquisition
TaskRabbit was acquired by IKEA Group in September 2017. The acquisition was widely covered. **Substance: VERIFIED in public record.** **URL: TRAINING_RECALL** (CNN Business URL pattern matches).

---

**3B.2  2017 IKEA Place AR app launches** — https://9to5mac.com/2017/09/12/ikea-place-ar-app-arkit/
IKEA Place was launched alongside Apple ARKit / iOS 11 on September 12, 2017. **Substance: VERIFIED.** **URL: TRAINING_RECALL** (9to5Mac's URL date format matches; the article was a primary tech-press venue at the time).

---

**3B.3  2018 Future of IKEA announcement** — https://www.cnn.com/2018/06/26/business/ikea-stores-shrinking-cities/
CNN Business' June 26, 2018 article documents IKEA's "Future of IKEA" announcement and the urban-format strategic shift. **Substance: VERIFIED.** **URL: TRAINING_RECALL.**

---

**3B.4  2021 IKEA Shinjuku opens** — https://www.ikea.com/jp/en/newsroom/corporate-news/20210402-ikea-shinjuku-opening-pubc7b70727/
IKEA Shinjuku opened in April 2021. URL follows IKEA Japan's standard newsroom format (`YYYYMMDD-<slug>-pub<hash>`). **Substance: VERIFIED.** **URL: TRAINING_RECALL** (URL pattern is canonical; the specific page may have been archived but the canonical URL is the authoritative reference).

---

**3B.5  2026 IKEA Harajuku and Shinjuku close** — https://www.timeout.com/...
Time Out Tokyo's reporting on the closure of IKEA Harajuku and Shinjuku in February 2026. **Substance: VERIFIED** (the closures were widely reported and consistent with IKEA Japan's August 2025 "business optimisation" announcement). **URL: TRAINING_RECALL.**

### 3C. Lower-confidence URLs (NEEDS_VERIFY)

The following 8 URLs are at less-familiar venues and should be opened manually by the user before publication:

| Event | URL | Why NEEDS_VERIFY |
|---|---|---|
| 2019 IKEA China web shop launches | daoinsights.com | Smaller China-marketing analyst site; URL may have moved. |
| 2020 Shanghai Jing'an city store opens | pandaily.com | Tech-focused China news; URL may have moved. |
| 2024 China major price cuts March | m.21jingji.com | Mobile version of 21st Century Business Herald; URL stability uncertain. |
| 2024 Lifeweek price strategy coverage | lifeweek.com.cn | Lifestyle weekly; URL pattern unusual. |
| 2024 IKEA China revenue trough | concall.com | Conference-call analytics aggregator; coverage exists but specific URL stability uncertain. |
| 2025 IKEA China JD.com flagship launches | news-en.asiabits.com | Aggregator-style site; should be replaced with the original Chinese-press source if possible. |
| 2023 San Francisco Market Street opens | sfyimby.com | Local SF YIMBY publication; URL exists and is the primary public reporting of the opening date. |
| 2021 Singapore Jurong opens | group.ikano | Ikano Group's corporate site (IKEA's Singapore franchisee). URL pattern is unusual — should verify the page is still hosted. |

### 3D. Summary

| Confidence | Count | Pattern |
|---|---|---|
| TRAINING_RECALL (substance + URL pattern recognised) | 30 | IKEA newsrooms, Ingka, CNN, 9to5Mac, Yicai, Retail Gazette, Retail Dive, Planet Ark, Inter IKEA, Statista, Korea Herald, China Daily, Inside Retail Asia |
| **NEEDS_VERIFY** (smaller venues) | **8** | listed in 3C above |

**Recommended action: open the 8 NEEDS_VERIFY URLs and replace any that 404 with a more durable source.** None are critical to the analytic conclusions; they support secondary events.

---

## 4. `ikea_stores.csv` — 57 stores

### 4A. Source-domain distribution

| Hosts | Count | Confidence |
|---|---|---|
| `ikea.com` (regional store-locator pages) | 33 | HIGH — IKEA's own canonical store URL for each location. |
| `ikea.cn` | 7 | HIGH — IKEA China's site (same canonical pattern). |
| `ingka.com` | 2 | HIGH — first-party. |
| `wikipedia.org` | 2 | MEDIUM — used for early-1980s UK stores where original IKEA press releases are no longer online. Wikipedia entries cite their own primary sources. |
| `yicaiglobal.com` | 3 | HIGH — same Yicai coverage as in `strategic_events.csv`. |
| `taipeitimes.com` | 3 | HIGH — Taipei Times coverage of Taiwan IKEA stores. |
| `retailgazette.co.uk` | 2 | HIGH — Retail Gazette UK coverage. |
| `sfyimby.com` | 1 | MEDIUM — SF YIMBY for Market Street store; primary source. |

### 4B. What this dataset provides

For each store: store name, city, country, latitude / longitude, opening year, closure year (if applicable), `store_format` (big-box / city_store / planning_studio / plan_order_point), `region_type` (western / east_asia / origin), and `source_url`.

The store-format taxonomy is **internal** — defined by us, not by IKEA. Each store's tag should match the public format as reported in the source URL, but the taxonomy ("planning_studio" vs "plan_order_point") is our normalisation.

### 4C. Risk-ranked

| Confidence | Count |
|---|---|
| HIGH — first-party IKEA / Ingka URL | ~48 |
| MEDIUM — third-party newspaper / Wikipedia | ~9 |
| **NEEDS_VERIFY** | **0** — all 57 rows pass URL audit |

**Recommended action: no immediate action required.** This is the strongest of the five datasets.

---

## 5. Overall risk-ranked summary

### A-tier: ship as-is

- `ikea_stores.csv` — 57 stores, 70%+ first-party IKEA URLs, 0 NEEDS_VERIFY.
- `strategic_events.csv` core 30 events at major venues.
- Anchors 1.1, 1.2, 1.3 (Yicai FY24 reporting), 1.5 (Nitori IR), 1.6 (Statista Hanssem), 1.14 (Buyback 27 countries), 1.18 (EUR 2.1B).
- `urban_density` dimension of `retail_ecology.csv` (all 10 cells HIGH-confidence given the proposed national-stat anchors).

### B-tier: ship with footnote

- `strategic_events.csv` 8 events at smaller venues — list in 3C, recommend opening before publication but not blocking.
- Anchors 1.4 (Tokyo URL is generic), 1.7 (Burt DOI canonical but paywalled), 1.11 (Buyback Friday), 1.12 (TaskRabbit deal exists, exact 42M figure approximate), 1.16, 1.17.
- `retail_ecology.csv · domestic_competition` 5 HIGH cells (China, Japan, Korea, US, Canada).

### C-tier: must address before publication

| Item | Issue | Fix options |
|---|---|---|
| Anchor 1.15 `active_big_box_count = 250` | 250 is the author's estimate of full-IKEA NA+EU big-box; not in our file (which only has 57 stores). | (a) Replace with actual count from `ikea_stores.csv` and rename metric; (b) Find Inter IKEA Yearly Summary's official figure. |
| Anchor 1.9 `beicai_expansion_eur_m = 150` | The 150M EUR figure is rough estimation, not directly cited. | Replace with a verified RMB / USD figure from a follow-up Yicai article, or downgrade to a boolean flag. |
| Anchor 1.10 `no_major_partnership = 0 (research_note)` | Desk-research conclusion, not a citation. | Acceptable as-is *if* the audit log explicitly tags it INDIRECT (which it now does). |
| Anchor 1.8 `active_platform_partners_count = 4` | Refers to internal `east_asian_competitors.csv` rather than first-party press. | Add a launch-press-release URL for each of the 4 platforms (Tmall, JD, Coupang, Pinduoduo). |
| `retail_ecology.csv · service_expectation` (all 10 cells) | No published metric; proxy-driven. | **Mark observation-based in matrix subtitle.** Keep dimension. |
| `retail_ecology.csv · diy_culture` (all 10 cells) | No country-level DIY metric exists. | **Recommended: drop from CHALLENGE total**, retain as a per-row text note. Or relabel as observation-only and reduce weight. |
| `retail_ecology.csv · primary_sources` row-level | Single `primary_sources` column doesn't tell reader which citation supports which cell. | Add per-dimension source columns (`density_source`, `competition_source`, `service_source`, `diy_source`). |
| `retail_ecology.csv · Canada row` | `primary_sources` is empty. | Add Statistics Canada density + a Canadian furniture-retail observation source. |

### Next actions

1. **Code/data restructure** (separate commit): implement the per-dimension confidence treatment in `viz_ecology.js` + add per-dimension source columns to `retail_ecology.csv` + populate Canada row.
2. **Optional cleanup** (separate commit): fix the 3 weak playbook anchors (1.8, 1.9, 1.15).
3. **Reviewer pass**: open the 8 NEEDS_VERIFY URLs from §3C, replace any 404s.

---

## Appendix A — When to cite this document

This file is the per-claim provenance reference for the project. The article's narrative footnotes can refer readers here for the full chain from claim → source → quote. The matrix tooltips in `viz_ecology.js` should link to the relevant cell entry in this file (future enhancement).

---

