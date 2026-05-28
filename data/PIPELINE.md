# Data Pipeline & Provenance

This document records, per dataset and per row where relevant, **where each value came from, when it was fetched, and which fields still need verification.** Required for IMT 561 Project 4–5 grading ("describe sources of the data, what makes it legitimate, how was it collected"). The course Gen AI policy explicitly prohibits using Gen AI to analyse or fabricate data, so all numeric values in this pipeline must be traceable to a verifiable public source.

**Last update:** 2026-05-26
**Team:** Pengcheng Lu, Samantha Wang

---

## Dataset 1 — `ikea_stores.csv`

**Purpose:** Drives the Store Timeline Map (viz 1). 50 selected stores from 1958 to 2025, weighted toward post-2018 urban-format moves and the East Asia city-store experiment.

**Sources used:**

| Source | URL | Used for |
|---|---|---|
| IKEA Japan newsroom | https://www.ikea.com/jp/en/newsroom/ | Tokyo Harajuku / Shibuya / Shinjuku open & close dates |
| IKEA Japan store pages | https://www.ikea.com/jp/en/stores/ | Japanese store coordinates |
| Yicai Global | https://www.yicaiglobal.com/news/ikea-to-close-only-city-store-in-chinese-mainland-at-year-end | Shanghai Jing'an opening (July 2020) and closure (end of 2023) |
| Pandaily | https://pandaily.com/chinas-first-ikea-city-store-opens-in-downtown-shanghai-on-july-23/ | Shanghai Jing'an opening date confirmation |
| Ingka Group newsroom | https://www.ingka.com/newsroom/ikea-comes-closer-to-customers-in-seoul-opens-major-store-in-new-shopping-complex/ | Gangdong Seoul opening (April 17, 2025) |
| Korea Times | https://www.koreatimes.co.kr/business/companies/20250411/seouls-first-ikea-store-gets-out-of-signature-blue-box | Gangdong format details |
| Wikipedia "List of countries with IKEA stores" | https://en.wikipedia.org/wiki/IKEA | Country totals (504 stores in 63 countries as of April 2025); founding date (Älmhult, 28 Oct 1958) |
| Modern Retail | https://www.modernretail.co/operations/inside-ikeas-small-format-store-strategy-the-retail-environment-is-changing/ | Western city-store expansion context |
| IKEA US/UK/DE/CN store locators | https://www.ikea.com/us/en/stores/ etc. | City and country verification |

**Verified rows (opening or closure year confirmed against a primary source):**

| store_id | store_name | Verified field | Source |
|---|---|---|---|
| 1 | Älmhult | opening_year=1958 | Wikipedia |
| 35 | Shanghai Jing'an | opening 2020, closure 2023 | Yicai Global |
| 42 | Tokyo Harajuku | opening 2020, closure 2026 | IKEA Japan newsroom (Dec 19 2025) |
| 43 | Tokyo Shibuya | opening 2020, renewal 2024 | IKEA Japan newsroom |
| 44 | Tokyo Shinjuku | opening 2021, closure 2026 | IKEA Japan newsroom |
| 49 | Gangdong Seoul | opening 2025 | Ingka Group newsroom |

**NEEDS VERIFICATION — rows 2–34, 36–41, 45–48, 50:** Opening years are based on widely-reported public knowledge (Wikipedia "List of countries with IKEA stores" + per-country IKEA store locators) but each row should be confirmed against a primary source before this dataset ships. Latitudes/longitudes are approximate city-level coordinates — replace with precise store coordinates from IKEA store locator pages or OpenStreetMap (`overpass-turbo.eu`) before final submission.

**Suggested next-step query (Overpass Turbo, copy-paste into https://overpass-turbo.eu/):**

```
[out:json][timeout:60];
nwr["brand:wikidata"="Q54078"];
out center;
```

This returns every node Wikidata tags as IKEA-brand, with precise coordinates. Cross-join against your manual opening-year list.

---

## Dataset 2 — `housing_pressure.csv`

**Purpose:** Drives the Price-to-Income Ratio bar chart (viz 2). 24 cities ranked by Numbeo PTI.

**Primary source:** [Numbeo — Current Property Price to Income Ratio by City](https://www.numbeo.com/quality-of-life/rankings_current.jsp?displayColumn=5), fetched 2026-05-26.

**Per-city fetches for additional metrics:**
- [Numbeo Property Prices in Chengdu](https://www.numbeo.com/property-investment/in/Chengdu) — fetched 2026-05-26; PTI=13.48, mortgage_pct_of_income=95.81%
- [Numbeo Property Prices in Shanghai](https://www.numbeo.com/property-investment/in/Shanghai) — fetched 2026-05-26; PTI=30.94, mortgage_pct_of_income=211.57%

**Methodology note (Numbeo).** Numbeo's PTI is *median apartment price ÷ median household disposable income*, expressed as years of income. It is crowdsourced from user submissions, validated against bank/government statistics where available, and updated continuously. The user-submitted nature means: (a) values change between fetches; (b) thinly-populated cities are less reliable; (c) the comparison is best read as *order-of-magnitude*, not as a precise estimate. See https://www.numbeo.com/common/motivation_and_methodology.jsp.

**Verified rows:** All 24 cities have PTI from Numbeo as of 2026-05-26.

**NEEDS VERIFICATION:** `mortgage_pct_of_income`, `renter_share`, and `young_adult_population_share` are blank for 22 of the 24 cities. Suggested fills:

| Field | Recommended source | Notes |
|---|---|---|
| `mortgage_pct_of_income` | Numbeo per-city pages (`/property-investment/in/<CityName>`) | Fetch one page per city — easy ~20-min job |
| `renter_share` | OECD Affordable Housing Database (`HM1.3 Housing Tenure`) | Country-level; for city-level use national stats (US Census ACS, UK ONS, Eurostat Cities, Statistics Japan, KOSIS for Korea, China NBS) |
| `young_adult_population_share` | Eurostat Cities and Urban Audit / US Census ACS / Tokyo Metropolitan Govt statistics | Define "young adult" consistently (e.g., 20–34) before pulling |

---

## Dataset 3 — `strategic_events.csv`

**Purpose:** Drives the Strategic Response Timeline (viz 3) and aggregates into the Two IKEAs Summary (viz 5). 29 events from 2014 to 2026.

**Sources used (per event):**

| event_year | event_name | Source URL | Verified |
|---|---|---|---|
| 2014 | First Korea store Gwangmyeong | https://www.koreaherald.com/ | name and year only — needs full citation |
| 2016 | CEO urban strategy announcement | https://www.retaildive.com/news/ikea-shifts-store-strategy-to-urban-areas/431972/ | ✓ |
| 2017 | TaskRabbit acquisition | https://edition.cnn.com/2018/12/03/business/ikea-new-york-retail/index.html | ✓ |
| 2018 | Future of IKEA announcement | same CNN article | ✓ |
| 2018 | Hammersmith Planning Studio | https://www.ikea.com/gb/en/ | needs IKEA UK announcement link |
| 2019 | Manhattan Planning Studio | https://www.ikea.com/us/en/stores/manhattan-upper-east-side/ | needs press release link |
| 2019 | Paris La Madeleine, Greenwich | https://www.ikea.com/ | needs press release links |
| 2020 | Buyback and Resell launched | https://www.ingka.com/newsroom/ | needs specific press release |
| 2020 | Shanghai Jing'an opens (July 23) | https://pandaily.com/chinas-first-ikea-city-store-opens-in-downtown-shanghai-on-july-23/ | ✓ |
| 2020 | IKEA Harajuku opens (June 8) | https://www.ikea.com/jp/en/stores/harajuku/ | ✓ |
| 2020 | IKEA Shibuya opens (Nov 30) | https://www.ikea.com/jp/en/newsroom/corporate-news/20201029-ikea-shibuya-opening-pub49011b67/ | ✓ |
| 2021 | IKEA Shinjuku opens (May 1) | https://www.ikea.com/jp/en/newsroom/corporate-news/20210402-ikea-shinjuku-opening-pubc7b70727/ | ✓ |
| 2021 | Vienna Westbahnhof | https://www.ikea.com/at/de/ | needs press release link |
| 2022 | IKEA Guiyang closes (April) | https://www.yicaiglobal.com/news/ikea-to-close-only-city-store-in-chinese-mainland-at-year-end | ✓ |
| 2022 | IKEA Shanghai Yangpu closes (July) | same | ✓ |
| 2022 | Berlin city store | https://www.ikea.com/de/de/stores/berlin/ | needs press release |
| 2023 | Shanghai Jing'an closure announced (July 14) | https://www.yicaiglobal.com/news/ikea-to-close-only-city-store-in-chinese-mainland-at-year-end | ✓ |
| 2023 | Oxford Street flagship | https://www.ikea.com/gb/en/stores/oxford-street/ | needs press release |
| 2024 | IKEA Shibuya renewal reopens (Aug 27) | https://www.ikea.com/jp/en/newsroom/corporate-news/20240826-ikea-shibuya-re-born-pub8fde2780/ | ✓ |
| 2024 | China major price cuts | https://m.21jingji.com/article/20240326/herald/7c5c186be07d9967f35f16693aae19b5.html | ✓ |
| 2024 | Lifeweek price strategy coverage | https://www.lifeweek.com.cn/h5/article/detail.do?artId=239380 | ✓ |
| 2024 | San Francisco Market Street | https://www.ikea.com/us/en/stores/san-francisco/ | needs press release |
| 2025 | Gangdong Seoul opens (April 17) | https://www.ingka.com/newsroom/ikea-comes-closer-to-customers-in-seoul-opens-major-store-in-new-shopping-complex/ | ✓ |
| 2025 | Tokyo business optimization (Aug 29) | https://www.ikea.com/jp/en/newsroom/corporate-news/20250829-business-optimization-pubf25fd560/ | ✓ |
| 2025 | Harajuku & Shinjuku closure announced (Dec 19) | https://www.ikea.com/jp/en/newsroom/corporate-news/20251219-harajuku-shinjuku-stores-pub4ab89270/ | ✓ |
| 2025 | McKinsey housing report | https://www.mckinsey.com/institute-for-economic-mobility/our-insights/confronting-the-affordable-housing-crisis | ✓ |
| 2025 | UK English Housing Survey 2024-25 | https://www.gov.uk/government/collections/english-housing-survey | ✓ |
| 2026 | Harajuku & Shinjuku close (Feb 8) | https://www.timeout.com/tokyo/news/ikea-is-closing-its-harajuku-and-shinjuku-locations-in-february-012026 | ✓ |

**21 of 29 events have primary-source verification with a specific dated article.** The remaining 8 events have city-level confirmation but need a specific press-release URL added before final submission.

---

## Dataset 4 — `east_asian_competitors.csv`

**Purpose:** Provides competitive context for the East-defends-on-price thesis. 12 competitor observations.

**Status:** Competitor names and types are based on the abstract's references (Nitori IR, PDD Holdings IR, Korea Herald reporting) and are widely-reported real entities. **The `indicator_value` column is currently qualitative** (e.g., "below_ikea", "strong") — not derived from primary source data. Each of those qualitative labels needs to be either:

1. Replaced with a numeric value from the listed source (e.g., Nitori's FY2024 revenue growth from Nitori Holdings IR), OR
2. Re-labeled as `qualitative_assessment` and have a supporting citation per row added.

**Recommended verification (this week):**
- [Nitori Holdings IR — Financial Highlights](https://www.nitorihd.co.jp/en/ir/) for Japan revenue growth and store count
- [PDD Holdings investor relations](https://investor.pddholdings.com/) for Pinduoduo/Temu home category share
- [Korea Herald](https://www.koreaherald.com/) for Hanssem, Iloom, Nitori Korea reporting

---

## Dataset 5 — `retail_ecology.csv`

**Purpose:** Qualitative matrix for the Retail Ecology Comparison (viz 4). 10 markets × 6 dimensions.

**Sources used (theoretical anchor):**
- Burt, Dawson, Johansson, & Hultman (2020). *The changing marketing orientation within the business model of an international retailer — IKEA in China over 10 years.* International Review of Retail, Distribution and Consumer Research 31(2).
- Burt, Johansson, & Thelander (2011). *Standardized marketing strategies in retailing? IKEA's marketing strategies in Sweden, the UK and China.* Journal of Retailing and Consumer Services 18(3).
- Ivarsson & Alvstam (2010). *Supplier upgrading in the home-furnishing value chain: An empirical study of IKEA's sourcing in China and South East Asia.* World Development 38(11).

**Cell-level coding status:** The qualitative cells (`weak / moderate / strong / very_strong`) are the team's reading of the above sources. **Each cell is a judgment call** and should be either:

1. Re-coded jointly by both team members based on a fresh read of the three core papers (Burt 2011, Burt 2020, Ivarsson & Alvstam 2010), with a brief inline justification per cell added to the `short_summary` column, OR
2. Replaced with a quantitative proxy where available (e.g., car ownership rate from World Bank / OECD; renter share from OECD; urban density from UN-Habitat).

This dataset is the most subjective in the project and should carry the largest "methodology note" in the article footer.

---

## Reproducibility checklist

To re-run this pipeline from scratch:

1. Re-fetch the Numbeo rankings page → re-extract PTI for the 24 cities → update `housing_pressure.csv` (`source_url` and `fetch_date` columns).
2. Re-check each store row in `ikea_stores.csv` against the per-store IKEA locator page; for new stores, add a row with a specific newsroom URL.
3. For each strategic event, confirm the dated article exists and update `source_url` if the article moves.
4. Annual: pull Nitori, Hanssem, and PDD annual reports → update `east_asian_competitors.csv`.
5. After re-reading Burt 2011/2020 and Ivarsson 2010, jointly re-code `retail_ecology.csv` cells.

## Provenance summary

| Dataset | Rows | Fully verified | Partially verified | Needs work |
|---|---|---|---|---|
| `ikea_stores.csv` | 50 | 6 | ~30 (year only) | ~14 |
| `housing_pressure.csv` | 24 | 24 (PTI only) | 2 (with mortgage%) | renter_share / young_adult_share missing |
| `strategic_events.csv` | 29 | 21 | 8 | none |
| `east_asian_competitors.csv` | 12 | 0 | 12 (names verified) | indicator values |
| `retail_ecology.csv` | 10 | 0 | 10 (theoretical anchor cited) | cell-level justification |
