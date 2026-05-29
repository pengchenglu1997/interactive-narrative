#!/usr/bin/env node
/* compute_playbook_intensities.mjs
 *
 * Generates data/processed/playbook_priorities.csv from:
 *   1. data/processed/strategic_events.csv         (dated public events)
 *   2. data/processed/ikea_stores.csv               (active store counts)
 *   3. data/processed/playbook_external_signals.csv (auditable bumps)
 *
 * Replaces the hand-coded 1-5 intensities used through v7 with a
 * reproducible, transparent algorithm. Anyone can re-run this script and
 * get the same numbers; reviewers can challenge any specific weight.
 *
 * ALGORITHM
 * =========
 * Step 1 — Per dated event, compute an impact-weighted score.
 *          A small keyword-based weight function (impactWeight) up-weights
 *          financial-commitment events ("EUR 2.1B", "global", "billion"),
 *          strategic M&A ("acquisition"), closures, and down-weights pure
 *          announcements / coverage.
 *
 * Step 2 — Attribute that score to the appropriate (regime, priority_key).
 *          "both" regime events contribute 0.7 to each side (recognizing
 *          they are global moves while still letting each regime carry
 *          its share).
 *
 * Step 3 — Add store-network signals: each currently-open city-format
 *          store adds 0.30 to urban_format (regime is store.region_type);
 *          each open big-box adds 0.10 to big_box.
 *
 * Step 4 — Add documented external signals (playbook_external_signals.csv).
 *          These represent strategic priorities that aren't captured by
 *          dated events alone — e.g., China revenue decline, Burt et al.
 *          documented localization, Nitori scale. Each row carries an
 *          explicit reason and source.
 *
 * Step 5 — Rank each regime's 8 priorities by raw score (highest = rank 1).
 *
 * Step 6 — Map rank → intensity on a 1-5 scale:
 *          rank 1 → 5   (regime's top priority)
 *          rank 2 → 5
 *          rank 3-4 → 4
 *          rank 5 → 3
 *          rank 6-7 → 2
 *          rank 8 → 1
 *
 * Step 7 — Build evidence text from actual event_names for the regime
 *          and external signals so every cell can be traced back to a
 *          dated press release or a cited source.
 *
 * Run:  node scripts/compute_playbook_intensities.mjs
 * Output is written in place to data/processed/playbook_priorities.csv
 * Detailed math log is also printed to stdout.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------- CSV parsing (same routine used in audit_data.mjs) ----------
function splitCSVLine(line) {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
        if (c === '"') { q = !q; continue; }
        if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
        cur += c;
    }
    out.push(cur);
    return out;
}
function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.length);
    const headers = splitCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const cols = splitCSVLine(line);
        const row = {};
        headers.forEach((h, i) => row[h] = (cols[i] || '').trim());
        return row;
    });
}
function loadCSV(rel) {
    return parseCSV(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

// ---------- CSV escape ----------
function csvQuote(s) {
    s = String(s == null ? '' : s);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

// ============================================================
// LANE TAXONOMY
// ============================================================
const LANES = [
    { key: 'urban_format',        label: 'Urban-format city stores' },
    { key: 'service_partnership', label: 'Service partnerships' },
    { key: 'resale_circularity',  label: 'Resale & circularity' },
    { key: 'channel_innovation',  label: 'Channel innovation' },
    { key: 'price_cut',           label: 'Price defense' },
    { key: 'big_box',             label: 'Big-box network' },
    { key: 'local_integration',   label: 'Local design integration' },
    { key: 'strategy_pivot',      label: 'Strategy repositioning' },
];

// strategic_events.csv uses 'store_expansion' for big-box rollouts; map it.
function normalizeLane(responseType) {
    if (responseType === 'store_expansion') return 'big_box';
    return responseType;
}

// ============================================================
// Step 1: impact weight for a dated event
// ============================================================
function impactWeight(ev) {
    const name = (ev.event_name || '').toLowerCase();
    const desc = (ev.short_description || '').toLowerCase();
    const blob = name + ' ' + desc;

    let w = 1.0;
    // Major financial commitment signals
    if (/\beur\s*\d|\brmb\s*\d|\bbillion\b|\b\d+(\.\d+)?b\b/.test(blob)) w *= 1.7;
    // Global / world-scale moves
    else if (/\bglobal\b|world(['']s)?(\s+largest)?|worldwide|27 countries/.test(blob)) w *= 1.4;
    // M&A signals
    else if (/acquisition|acquires|acquired/.test(blob)) w *= 1.4;
    // Flagship / first-of-kind
    else if (/flagship|first(\s+ever)?(\s+\w+)?(\s+(store|opens|opening))/.test(blob)) w *= 1.25;
    // Closures (strategic retreat = important signal)
    else if (/\bclos(es|ed|ure|ing)\b/.test(blob)) w *= 1.15;
    // Pure announcements / coverage / context — discount
    else if (/announce|coverage|report|trough/.test(blob)) w *= 0.65;

    return w;
}

// ============================================================
// MAIN
// ============================================================
const events = loadCSV('data/processed/strategic_events.csv');
const stores = loadCSV('data/processed/ikea_stores.csv');
const signals = loadCSV('data/processed/playbook_external_signals.csv');

const log = [];
function logLine(s) { log.push(s); }

logLine('# Playbook intensity computation log');
logLine('Generated: ' + new Date().toISOString());
logLine('');

// raw[lane][regime] = number
const raw = {};
for (const l of LANES) raw[l.key] = { western: 0, east_asia: 0 };

// Step 1+2: tally dated events
logLine('## Step 1+2 — Dated events');
logLine('');
logLine('| Year | Event | Lane | Regime | Base | Weight | Contribution |');
logLine('|---|---|---|---|---|---|---|');

const eventsByLane = {}; // for evidence text later
for (const l of LANES) eventsByLane[l.key] = { western: [], east_asia: [] };

const CLOSURE_PENALTY = 1.2;   // closure events subtract from urban_format

for (const ev of events) {
    if (ev.response_type === 'context_report' || ev.response_type === 'corporate_report') continue;
    const lane = normalizeLane(ev.response_type);
    const w = impactWeight(ev);
    const regimeRow = ev.regime_type;
    let attributes = [];
    if (regimeRow === 'both') attributes = [['western', 0.7], ['east_asia', 0.7]];
    else if (regimeRow === 'western' || regimeRow === 'east_asia') attributes = [[regimeRow, 1.0]];
    else continue;

    // 'closure' events aren't a lane of their own — they penalize urban_format
    // (a city-store closure is a retreat from the urban-format strategy).
    if (lane === 'closure') {
        for (const [reg, share] of attributes) {
            const contrib = -w * CLOSURE_PENALTY * share;
            raw.urban_format[reg] += contrib;
            eventsByLane.urban_format[reg].push({ year: ev.event_year, name: '✗ ' + ev.event_name, weight: contrib });
            logLine(`| ${ev.event_year} | ${ev.event_name} | (closure→urban_format penalty) | ${reg} | 1.00 | ${w.toFixed(2)}×${share.toFixed(1)}×-${CLOSURE_PENALTY} | ${contrib.toFixed(2)} |`);
        }
        continue;
    }

    if (!raw[lane]) continue;

    for (const [reg, share] of attributes) {
        const contrib = w * share;
        raw[lane][reg] += contrib;
        eventsByLane[lane][reg].push({ year: ev.event_year, name: ev.event_name, weight: contrib });
        logLine(`| ${ev.event_year} | ${ev.event_name} | ${lane} | ${reg} | 1.00 | ${w.toFixed(2)}×${share.toFixed(1)} | +${contrib.toFixed(2)} |`);
    }
}

// Step 3: store-network signals
logLine('');
logLine('## Step 3 — Store-network signals');
logLine('');
let openCity = { western: 0, east_asia: 0 };
let openBig  = { western: 0, east_asia: 0 };
for (const s of stores) {
    if (s.closure_year && s.closure_year !== '') continue;
    const r = s.region_type;
    if (r !== 'western' && r !== 'east_asia') continue;
    if (s.store_format === 'big-box') openBig[r]++;
    else if (['city_store', 'planning_studio', 'plan_order_point'].includes(s.store_format)) openCity[r]++;
}
const CITY_W = 0.30, BIGBOX_W = 0.10;
const cityBumpWest  = openCity.western  * CITY_W;
const cityBumpEast  = openCity.east_asia * CITY_W;
const bbBumpWest    = openBig.western   * BIGBOX_W;
const bbBumpEast    = openBig.east_asia * BIGBOX_W;
raw.urban_format.western  += cityBumpWest;
raw.urban_format.east_asia += cityBumpEast;
raw.big_box.western        += bbBumpWest;
raw.big_box.east_asia      += bbBumpEast;
logLine(`- Western active city-format stores: ${openCity.western} × 0.30 = +${cityBumpWest.toFixed(2)} → urban_format`);
logLine(`- East Asian active city-format stores: ${openCity.east_asia} × 0.30 = +${cityBumpEast.toFixed(2)} → urban_format`);
logLine(`- Western active big-box stores: ${openBig.western} × 0.10 = +${bbBumpWest.toFixed(2)} → big_box`);
logLine(`- East Asian active big-box stores: ${openBig.east_asia} × 0.10 = +${bbBumpEast.toFixed(2)} → big_box`);

// Step 4: external signals
logLine('');
logLine('## Step 4 — External documented signals');
logLine('');
logLine('| Lane | Regime | Bump | Reason | Source |');
logLine('|---|---|---|---|---|');
for (const sig of signals) {
    const w = parseFloat(sig.weight) || 0;
    if (w === 0) continue;
    if (!raw[sig.priority_key]) continue;
    if (sig.regime !== 'western' && sig.regime !== 'east_asia') continue;
    raw[sig.priority_key][sig.regime] += w;
    logLine(`| ${sig.priority_key} | ${sig.regime} | +${w.toFixed(2)} | ${sig.reason} | ${sig.source} |`);
}

// Step 5+6: rank within each regime, map rank → intensity
logLine('');
logLine('## Step 5+6 — Ranking and intensity mapping');
logLine('');
function rankToIntensity(rank) {
    // 1→5, 2→5, 3→4, 4→4, 5→3, 6→2, 7→2, 8→1
    if (rank <= 2) return 5;
    if (rank <= 4) return 4;
    if (rank === 5) return 3;
    if (rank <= 7) return 2;
    return 1;
}

function computeRanksAndIntensities(regime) {
    const arr = LANES.map(l => ({ key: l.key, score: raw[l.key][regime] }));
    arr.sort((a, b) => b.score - a.score);
    const out = {};
    arr.forEach((row, i) => {
        out[row.key] = { rank: i + 1, score: row.score, intensity: rankToIntensity(i + 1) };
    });
    return out;
}
const W = computeRanksAndIntensities('western');
const E = computeRanksAndIntensities('east_asia');

logLine('### Western');
logLine('');
logLine('| Rank | Lane | Raw score | Intensity |');
logLine('|---|---|---|---|');
LANES.map(l => ({ key: l.key, score: W[l.key].score, rank: W[l.key].rank, intensity: W[l.key].intensity }))
    .sort((a, b) => a.rank - b.rank)
    .forEach(r => logLine(`| ${r.rank} | ${r.key} | ${r.score.toFixed(2)} | ${r.intensity}/5 |`));

logLine('');
logLine('### East Asian');
logLine('');
logLine('| Rank | Lane | Raw score | Intensity |');
logLine('|---|---|---|---|');
LANES.map(l => ({ key: l.key, score: E[l.key].score, rank: E[l.key].rank, intensity: E[l.key].intensity }))
    .sort((a, b) => a.rank - b.rank)
    .forEach(r => logLine(`| ${r.rank} | ${r.key} | ${r.score.toFixed(2)} | ${r.intensity}/5 |`));

// Step 7: build evidence text from real event names + external signal reasons
function buildEvidence(laneKey, regime) {
    const evs = eventsByLane[laneKey][regime] || [];
    evs.sort((a, b) => a.year - b.year);
    const parts = evs.map(e => `${e.name} (${e.year})`);
    const sigs = signals.filter(s => s.priority_key === laneKey && s.regime === regime && parseFloat(s.weight) > 0);
    if (sigs.length) parts.push(...sigs.map(s => s.reason));
    if (!parts.length) return 'No dated events in this regime/lane';
    return parts.join('; ');
}

// Write the CSV
const outRows = [];
outRows.push(['priority_key','priority_label','west_intensity','east_intensity','west_evidence','east_evidence'].map(csvQuote).join(','));
LANES.forEach(l => {
    outRows.push([
        l.key,
        l.label,
        W[l.key].intensity,
        E[l.key].intensity,
        buildEvidence(l.key, 'western'),
        buildEvidence(l.key, 'east_asia'),
    ].map(csvQuote).join(','));
});
const outCSV = outRows.join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'data/processed/playbook_priorities.csv'), outCSV);
logLine('');
logLine('Wrote data/processed/playbook_priorities.csv');

// Also dump the math log
fs.writeFileSync(path.join(ROOT, 'data/PLAYBOOK_COMPUTATION.md'), log.join('\n') + '\n');
console.log(log.join('\n'));
console.log('\n✓ Wrote data/processed/playbook_priorities.csv');
console.log('✓ Wrote data/PLAYBOOK_COMPUTATION.md (audit log)');
