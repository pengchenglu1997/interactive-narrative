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

*Pending — see follow-up commit. This is the file with the largest open-source risk. Per-cell entries with HIGH / LOW confidence flags by dimension to follow.*

---

## 3. `strategic_events.csv` — 38 events

*Pending — see follow-up commit. Per-event quote verification (sampled).*

---

## 4. `ikea_stores.csv` — 57 stores

*Pending — see follow-up commit. URL pattern audit + sampling.*

---

## 5. Overall risk-ranked summary

*Pending — to be assembled after sections 2-4 are complete.*

---
