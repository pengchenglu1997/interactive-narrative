# Playbook intensity computation log (v2)
Generated: 2026-06-01T04:11:16.647Z
Anchor year = 2026, τ = 6 years

## Step 1 — Dated events  (magnitude × time_decay)

| Year | Event | Lane | Regime | USD-bn parsed | Decay | Contribution |
|---|---|---|---|---|---|---|
| 2014 | Gwangmyeong Korea store opens | big_box | east_asia | 0.10 | 0.14 | +0.01 |
| 2016 | CEO urban strategy announcement | strategy_pivot | western | 0.10 | 0.19 | +0.01 |
| 2016 | CEO urban strategy announcement | strategy_pivot | east_asia | 0.10 | 0.19 | +0.01 |
| 2017 | TaskRabbit acquisition | service_partnership | western | 0.10 | 0.22 | +0.02 |
| 2017 | IKEA Place AR app launches | channel_innovation | western | 0.10 | 0.22 | +0.02 |
| 2017 | IKEA Japan online shop launches | channel_innovation | east_asia | 0.10 | 0.22 | +0.02 |
| 2018 | Tottenham Court Road planning studio opens | urban_format | western | 0.10 | 0.26 | +0.03 |
| 2018 | Future of IKEA announcement | strategy_pivot | western | 0.10 | 0.26 | +0.03 |
| 2018 | IKEA Korea e-commerce launches | channel_innovation | east_asia | 0.10 | 0.26 | +0.03 |
| 2019 | Manhattan Planning Studio opens | urban_format | western | 0.10 | 0.31 | +0.03 |
| 2019 | Paris La Madeleine opens | urban_format | western | 0.10 | 0.31 | +0.03 |
| 2019 | Greenwich sustainability flagship opens | urban_format | western | 4.62 | 0.31 | +0.54 |
| 2019 | IKEA China web shop launches | channel_innovation | east_asia | 0.10 | 0.31 | +0.03 |
| 2020 | IKEA China Tmall flagship launches | channel_innovation | east_asia | 0.10 | 0.37 | +0.04 |
| 2020 | Shanghai Jing'an city store opens | urban_format | east_asia | 0.10 | 0.37 | +0.04 |
| 2020 | IKEA Harajuku opens | urban_format | east_asia | 0.10 | 0.37 | +0.04 |
| 2020 | IKEA Shibuya opens | urban_format | east_asia | 0.10 | 0.37 | +0.04 |
| 2020 | Buyback and Resell launched | resale_circularity | western | 0.10 | 0.37 | +0.02 |
| 2020 | Buyback and Resell launched | resale_circularity | east_asia | 0.10 | 0.37 | +0.02 |
| 2021 | IKEA Shinjuku opens | urban_format | east_asia | 0.10 | 0.43 | +0.04 |
| 2021 | Vienna Westbahnhof car-free store opens | urban_format | western | 0.10 | 0.43 | +0.04 |
| 2021 | Taipei Neihu opens replacing Dunbei | urban_format | east_asia | 0.10 | 0.43 | +0.04 |
| 2021 | Singapore Jurong opens | urban_format | east_asia | 0.10 | 0.43 | +0.04 |
| 2022 | IKEA Guiyang closes | closure → −urban_format | east_asia | 0.10 | 0.51 | -0.06 |
| 2022 | IKEA Shanghai Yangpu closes | closure → −urban_format | east_asia | 0.10 | 0.51 | -0.06 |
| 2022 | Hammersmith London opens | urban_format | western | 0.10 | 0.51 | +0.05 |
| 2023 | Shanghai Jing'an closure announced | closure → −urban_format | east_asia | 0.10 | 0.61 | -0.07 |
| 2023 | San Francisco Market Street opens | urban_format | western | 0.10 | 0.61 | +0.06 |
| 2024 | IKEA Shibuya renewal reopens | urban_format | east_asia | 0.10 | 0.72 | +0.07 |
| 2024 | IKEA global price cuts EUR 2.1B | price_cut | western | 48.28 | 0.72 | +1.95 |
| 2024 | IKEA global price cuts EUR 2.1B | price_cut | east_asia | 48.28 | 0.72 | +1.95 |
| 2024 | China major price cuts March | price_cut | east_asia | 0.10 | 0.72 | +0.07 |
| 2024 | Lifeweek price strategy coverage | price_cut | east_asia | 1.60 | 0.72 | +0.68 |
| 2024 | IKEA China revenue trough | strategy_pivot | east_asia | 1.66 | 0.72 | +0.70 |
| 2025 | Gangdong Seoul opens | urban_format | east_asia | 0.10 | 0.85 | +0.08 |
| 2025 | Oxford Street London flagship opens | urban_format | western | 0.10 | 0.85 | +0.08 |
| 2025 | IKEA China JD.com flagship launches | channel_innovation | east_asia | 0.10 | 0.85 | +0.08 |
| 2025 | IKEA China RMB 6.3B reinvestment | strategy_pivot | east_asia | 1.86 | 0.85 | +0.89 |
| 2025 | Tokyo business optimization announcement | strategy_pivot | east_asia | 0.10 | 0.85 | +0.08 |
| 2025 | Harajuku and Shinjuku closure announced | closure → −urban_format | east_asia | 0.10 | 0.85 | -0.10 |
| 2026 | IKEA Harajuku and Shinjuku close | closure → −urban_format | east_asia | 0.10 | 1.00 | -0.11 |

## Step 2 — Active store-network signal (live count, decay = 1.00)

- urban_format ← active city-stores: West 9 → +0.41, East 3 → +0.25
- big_box       ← active big-box: West 16 → +0.17, East 20 → +0.18

## Step 3 — Quantitative external anchors  (metric × scale × time_decay)

| Lane | Regime | Metric | Value | Unit | Year | dir × w | Scaled | Decay | Contribution |
|---|---|---|---|---|---|---|---|---|---|
| price_cut | east_asia | china_revenue_decline_pct | 30 | pct | 2024 | +1 | 0.92 | 0.72 | +0.66 |
| price_cut | east_asia | china_fy24_revenue_rmb_bn | 11.15 | rmb_bn | 2024 | +0.6 | 0.94 | 0.72 | +0.40 |
| strategy_pivot | east_asia | china_rank_drop_positions | 5 | positions | 2024 | +1.2 | 0.92 | 0.72 | +0.79 |
| strategy_pivot | east_asia | tokyo_format_reset_count | 1 | events | 2025 | +0.6 | 0.41 | 0.85 | +0.21 |
| local_integration | east_asia | nitori_fy25_revenue_jpy_bn | 929 | jpy_bn | 2025 | +1 | 1.98 | 0.85 | +1.67 |
| local_integration | east_asia | hanssem_korea_interior_share_pct | 25 | pct | 2024 | +0.6 | 0.81 | 0.72 | +0.35 |
| local_integration | east_asia | burt_2020_localization_signal | 1 | boolean | 2020 | +0.5 | 0.69 | 0.37 | +0.13 |
| big_box | east_asia | beicai_reinvestment_announced | 1 | boolean | 2024 | +0.4 | 0.69 | 0.72 | +0.20 |
| service_partnership | east_asia | no_major_partnership | 0 | boolean | 2024 | −0.3 | 0.00 | 0.72 | +0.00 |
| resale_circularity | east_asia | buyback_program_active | 1 | boolean | 2024 | +0.2 | 0.69 | 0.72 | +0.10 |
| service_partnership | western | taskrabbit_acquisition_eur_m | 42 | eur_m | 2017 | +1.5 | 0.05 | 0.22 | +0.02 |
| service_partnership | western | active_city_format_in_dataset_count | 9 | stores | 2026 | +0.7 | 0.31 | 1.00 | +0.22 |
| resale_circularity | western | buyback_countries_count | 27 | countries | 2020 | +1.2 | 1.31 | 0.37 | +0.58 |
| big_box | western | active_big_box_in_dataset_count | 16 | stores | 2026 | +1.5 | 0.49 | 1.00 | +0.74 |
| channel_innovation | western | ikea_place_ar_launch | 1 | events | 2017 | +0.6 | 0.41 | 0.22 | +0.05 |
| strategy_pivot | western | urban_shift_announcements_count | 2 | events | 2018 | +0.4 | 0.69 | 0.26 | +0.07 |
| price_cut | western | fy24_global_price_cut_eur_bn | 2.1 | eur_bn | 2024 | +2 | 1.20 | 0.72 | +1.72 |

## Step 4 — Min-max within regime → intensity 1..5

### Western

| Rank | Lane | Raw score | norm | Intensity |
|---|---|---|---|---|
| 1 | price_cut | 3.67 | 1.00 | 5/5 |
| 2 | urban_format | 1.27 | 0.34 | 2/5 |
| 3 | big_box | 0.91 | 0.25 | 2/5 |
| 4 | resale_circularity | 0.60 | 0.16 | 2/5 |
| 5 | service_partnership | 0.25 | 0.07 | 1/5 |
| 6 | strategy_pivot | 0.11 | 0.03 | 1/5 |
| 7 | channel_innovation | 0.08 | 0.02 | 1/5 |
| 8 | local_integration | 0.00 | 0.00 | 1/5 |

### East Asian

| Rank | Lane | Raw score | norm | Intensity |
|---|---|---|---|---|
| 1 | price_cut | 3.77 | 1.00 | 5/5 |
| 2 | strategy_pivot | 2.68 | 0.71 | 4/5 |
| 3 | local_integration | 2.15 | 0.57 | 3/5 |
| 4 | big_box | 0.39 | 0.10 | 1/5 |
| 5 | urban_format | 0.23 | 0.06 | 1/5 |
| 6 | channel_innovation | 0.19 | 0.05 | 1/5 |
| 7 | resale_circularity | 0.12 | 0.03 | 1/5 |
| 8 | service_partnership | 0.00 | 0.00 | 1/5 |

