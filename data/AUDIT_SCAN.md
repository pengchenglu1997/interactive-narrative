# Programmatic Data Audit Scan

_Generated_: 2026-05-28T04:58:50.481Z

## §1 Dataset overview

| Dataset | Rows | Columns | Empty cells |
|---|---|---|---|
| stores | 57 | 12 | 72 |
| housing | 24 | 11 | 80 |
| events | 38 | 8 | 0 |
| competitors | 12 | 8 | 0 |
| ecology | 10 | 10 | 0 |
| playbook | 8 | 6 | 0 |

## §2 Empty-cell distribution per column

### stores

| Column | Filled | Empty | % filled |
|---|---|---|---|
| store_id | 57 | 0 | 100% |
| store_name | 57 | 0 | 100% |
| country | 57 | 0 | 100% |
| city | 57 | 0 | 100% |
| latitude | 57 | 0 | 100% |
| longitude | 57 | 0 | 100% |
| opening_year | 57 | 0 | 100% |
| closure_year | 7 | 50 | 12% |
| store_format | 57 | 0 | 100% |
| region_type | 57 | 0 | 100% |
| source_url | 57 | 0 | 100% |
| notes | 35 | 22 | 61% |

### housing

| Column | Filled | Empty | % filled |
|---|---|---|---|
| city | 24 | 0 | 100% |
| country | 24 | 0 | 100% |
| region_type | 24 | 0 | 100% |
| price_to_income_ratio | 24 | 0 | 100% |
| mortgage_pct_of_income | 2 | 22 | 8% |
| renter_share | 4 | 20 | 17% |
| young_adult_population_share | 0 | 24 | 0% |
| year | 24 | 0 | 100% |
| source_url | 24 | 0 | 100% |
| fetch_date | 24 | 0 | 100% |
| notes | 10 | 14 | 42% |

### events

| Column | Filled | Empty | % filled |
|---|---|---|---|
| event_year | 38 | 0 | 100% |
| event_name | 38 | 0 | 100% |
| market | 38 | 0 | 100% |
| country_or_region | 38 | 0 | 100% |
| response_type | 38 | 0 | 100% |
| regime_type | 38 | 0 | 100% |
| short_description | 38 | 0 | 100% |
| source_url | 38 | 0 | 100% |

### competitors

| Column | Filled | Empty | % filled |
|---|---|---|---|
| market | 12 | 0 | 100% |
| competitor_name | 12 | 0 | 100% |
| competitor_type | 12 | 0 | 100% |
| year | 12 | 0 | 100% |
| indicator_type | 12 | 0 | 100% |
| indicator_value | 12 | 0 | 100% |
| short_description | 12 | 0 | 100% |
| source_url | 12 | 0 | 100% |

### ecology

| Column | Filled | Empty | % filled |
|---|---|---|---|
| market | 10 | 0 | 100% |
| region_type | 10 | 0 | 100% |
| diy_culture | 10 | 0 | 100% |
| car_dependence | 10 | 0 | 100% |
| urban_density | 10 | 0 | 100% |
| service_expectation | 10 | 0 | 100% |
| local_manufacturing | 10 | 0 | 100% |
| domestic_competition | 10 | 0 | 100% |
| short_summary | 10 | 0 | 100% |
| primary_sources | 10 | 0 | 100% |

### playbook

| Column | Filled | Empty | % filled |
|---|---|---|---|
| priority_key | 8 | 0 | 100% |
| priority_label | 8 | 0 | 100% |
| west_intensity | 8 | 0 | 100% |
| east_intensity | 8 | 0 | 100% |
| west_evidence | 8 | 0 | 100% |
| east_evidence | 8 | 0 | 100% |

## §3 Duplicate detection

- **stores**: 0 duplicates
- **housing**: 0 duplicates
- **events**: 0 duplicates
- **competitors**: 0 duplicates
- **ecology**: 0 duplicates
- **playbook**: 0 duplicates

## §4 Date range sanity

- **stores.opening_year**: 57 non-null values, range 1958 → 2025
- **stores.closure_year**: 7 non-null values, range 2021 → 2026
- **events.event_year**: 38 non-null values, range 2014 → 2026
- **housing.year**: 24 non-null values, range 2026 → 2026

## §5 Source URL coverage

- **stores**: 57/57 rows have source_url
- **housing**: 24/24 rows have source_url
- **events**: 38/38 rows have source_url
- **competitors**: 12/12 rows have source_url
- **ecology**: no source_url column
- **playbook**: no source_url column

## §6 Cross-table city match (housing × stores)

| Housing city | Has IKEA store row? |
|---|---|
| New York City | ✅ |
| Los Angeles | ✅ |
| San Francisco | ✅ |
| Chicago | ✅ |
| Washington DC | ✅ |
| London | ✅ |
| Manchester | ✅ |
| Berlin | ✅ |
| Munich | ✅ |
| Hamburg | ✅ |
| Vienna | ✅ |
| Paris | ✅ |
| Toronto | ✅ |
| Vancouver | ✅ |
| Beijing | ✅ |
| Shanghai | ✅ |
| Shenzhen | ✅ |
| Guangzhou | ✅ |
| Chengdu | ✅ |
| Hong Kong | ✅ |
| Tokyo | ✅ |
| Seoul | ✅ |
| Taipei | ✅ |
| Singapore | ✅ |

## §7 response_type taxonomy in events vs viz3 lanes

Lanes defined in viz3: `urban_format`, `service_partnership`, `resale_circularity`, `channel_innovation`, `strategy_pivot`, `price_cut`, `closure`, `store_expansion`

Types found in events.csv: `store_expansion`, `strategy_pivot`, `service_partnership`, `channel_innovation`, `urban_format`, `resale_circularity`, `closure`, `price_cut`

- Types in data but **not** in viz lanes: none
- Viz lanes with **zero** events: none

## §8 Playbook priority intensities

| Priority | West | East | Flip (\|W-E\|) |
|---|---|---|---|
| Urban-format city stores | 5 | 2 | 3 |
| Service partnerships (assembly/planning) | 5 | 3 | 2 |
| Resale & circularity (Buyback & Resell) | 4 | 2 | 2 |
| Channel innovation (e-commerce/platforms) | 3 | 5 | 2 |
| Price defense | 3 | 5 | 2 |
| Big-box network | 3 | 4 | 1 |
| Local design & sourcing integration | 2 | 4 | 2 |
| Formal strategy repositioning | 4 | 3 | 1 |

## §9 Store coordinate plausibility

- 0 stores have invalid lat/lon (out of bounds)
- 0 stores missing coordinates entirely

## §10 Region/regime distribution

- **stores.region_type**: origin=1, western=26, east_asia=29, other=1
- **housing.region_type**: western=14, east_asia=10
- **events.regime_type**: east_asia=24, both=3, western=11
- **ecology.region_type**: western=5, east_asia=5
