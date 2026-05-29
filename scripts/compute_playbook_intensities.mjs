#!/usr/bin/env node
/* compute_playbook_intensities.mjs  (v2)
 *
 * Generates data/processed/playbook_priorities.csv from quantitative anchors.
 *
 * WHAT CHANGED vs v1 (the "count references with bonus weights" version):
 *   - Every input now carries a real metric_value with explicit unit and year.
 *   - Dated events get a magnitude parsed from their text (EUR/RMB/USD/JPY
 *     billions, %, etc.) instead of a keyword multiplier.
 *   - All contributions are time-decayed (τ = 6y, so 2026 = 1.00,
 *     2020 ≈ 0.37, 2014 ≈ 0.14): recent strategy weighs more than history.
 *   - Lane intensities come from min-max normalization WITHIN regime,
 *     so magnitude differences matter (not just rank order).
 *   - Every cell is traceable to either a parsed-magnitude event or an
 *     anchored metric row with a source URL.
 *
 * INPUTS
 *   data/processed/strategic_events.csv          (dated public events)
 *   data/processed/ikea_stores.csv                (active store counts)
 *   data/processed/playbook_external_signals.csv  (quantitative anchors)
 *
 * OUTPUTS
 *   data/processed/playbook_priorities.csv        (the 8 lanes × 2 regimes)
 *   data/PLAYBOOK_COMPUTATION.md                  (per-row audit log)
 *
 * Run:  node scripts/compute_playbook_intensities.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------- CSV ----------
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
function loadCSV(rel) { return parseCSV(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
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
function normalizeLane(t) { return t === 'store_expansion' ? 'big_box' : t; }

// ============================================================
// TIME DECAY  τ = 6 years
// ============================================================
const ANCHOR_YEAR = 2026;
const TAU = 6;
function timeDecay(year) {
    const y = parseInt(year, 10);
    if (!isFinite(y)) return 0.3;
    return Math.exp((y - ANCHOR_YEAR) / TAU);
}

// ============================================================
// MAGNITUDE EXTRACTION  — parse a USD-equivalent billions figure
// from event_name / short_description.  Returns 0 if nothing
// parseable; a small EVENT_BASELINE is added later so undated
// magnitudes still count.
// ============================================================
const FX_TO_USD_BN = {
    eur:  1.10,
    usd:  1.00,
    rmb:  0.14,
    cny:  0.14,
    jpy:  0.0067,    // ¥100B ≈ $670M
    krw:  0.00075,
    sgd:  0.74,
    gbp:  1.27,
};

function parseEventMagnitudeUSDBn(ev) {
    const txt = ((ev.event_name || '') + ' ' + (ev.short_description || '')).toLowerCase();

    // 1) explicit currency + billion
    const reCur = /(eur|usd|rmb|cny|jpy|krw|sgd|gbp|\$|¥|₩|€|£)\s*(\d+(?:\.\d+)?)\s*(b\b|bn|billion)/g;
    let mag = 0; let m;
    while ((m = reCur.exec(txt)) !== null) {
        let cur = m[1];
        if (cur === '$') cur = 'usd';
        else if (cur === '¥') cur = 'jpy';
        else if (cur === '€') cur = 'eur';
        else if (cur === '£') cur = 'gbp';
        else if (cur === '₩') cur = 'krw';
        const val = parseFloat(m[2]);
        const usd = val * (FX_TO_USD_BN[cur] || 1.0);
        mag += usd;
    }
    if (mag > 0) return mag;

    // 2) bare "X billion"  (default USD)
    m = txt.match(/(\d+(?:\.\d+)?)\s*billion/);
    if (m) return parseFloat(m[1]);

    // 3) percent revenue / share change → 0.05 USD-bn per percent
    m = txt.match(/(\d+(?:\.\d+)?)\s*%/);
    if (m) return parseFloat(m[1]) * 0.05;

    return 0;
}

// ============================================================
// METRIC-UNIT SCALING for external anchor rows.
// Each unit → scalar that puts metric onto the same log-scaled
// axis as USD-bn so anchors and events can be summed.
// ============================================================
const UNIT_SCALE = {
    pct:           0.05,
    rmb_bn:        FX_TO_USD_BN.rmb,
    jpy_bn:        FX_TO_USD_BN.jpy,
    eur_bn:        FX_TO_USD_BN.eur,
    usd_bn:        1,
    eur_m:         FX_TO_USD_BN.eur / 1000,
    countries:     0.10,
    stores:        0.04,
    partners:      0.20,
    positions:     0.30,
    events:        0.50,
    boolean:       1.00,
    year_anchor:   0.50,
};

function scaleAnchor(row) {
    const v = parseFloat(String(row.metric_value).replace(/[^\d.\-]/g, '')) || 0;
    const unit = (row.unit || '').toLowerCase();
    const scale = UNIT_SCALE[unit] != null ? UNIT_SCALE[unit] : 1;
    return Math.log1p(Math.abs(v) * scale);
}

// ============================================================
// MAIN
// ============================================================
const events  = loadCSV('data/processed/strategic_events.csv');
const stores  = loadCSV('data/processed/ikea_stores.csv');
const anchors = loadCSV('data/processed/playbook_external_signals.csv');

const raw = {};
for (const l of LANES) raw[l.key] = { western: 0, east_asia: 0 };
const evidence = {};
for (const l of LANES) evidence[l.key] = { western: [], east_asia: [] };

const log = [];
function logLine(s) { log.push(s); }

logLine('# Playbook intensity computation log (v2)');
logLine('Generated: ' + new Date().toISOString());
logLine('Anchor year = ' + ANCHOR_YEAR + ', τ = ' + TAU + ' years');
logLine('');

// ---------- Step 1: dated events ----------
logLine('## Step 1 — Dated events  (magnitude × time_decay)');
logLine('');
logLine('| Year | Event | Lane | Regime | USD-bn parsed | Decay | Contribution |');
logLine('|---|---|---|---|---|---|---|');

const EVENT_BASELINE = 0.1;     // undated-magnitude events still register
const CLOSURE_PENALTY = 1.2;

for (const ev of events) {
    if (ev.response_type === 'context_report' || ev.response_type === 'corporate_report') continue;
    const lane = normalizeLane(ev.response_type);
    const decay = timeDecay(ev.event_year);
    const mag = parseEventMagnitudeUSDBn(ev) + EVENT_BASELINE;
    const magScaled = Math.log1p(mag);
    const base = magScaled * decay;

    let attrs;
    if (ev.regime_type === 'both') attrs = [['western', 0.7], ['east_asia', 0.7]];
    else if (ev.regime_type === 'western' || ev.regime_type === 'east_asia') attrs = [[ev.regime_type, 1.0]];
    else continue;

    if (lane === 'closure') {
        for (const [reg, share] of attrs) {
            const c = -base * CLOSURE_PENALTY * share;
            raw.urban_format[reg] += c;
            evidence.urban_format[reg].push({ year: ev.event_year, name: '✗ ' + ev.event_name, c });
            logLine(`| ${ev.event_year} | ${ev.event_name} | closure → −urban_format | ${reg} | ${mag.toFixed(2)} | ${decay.toFixed(2)} | ${c.toFixed(2)} |`);
        }
        continue;
    }
    if (!raw[lane]) continue;
    for (const [reg, share] of attrs) {
        const c = base * share;
        raw[lane][reg] += c;
        evidence[lane][reg].push({ year: ev.event_year, name: ev.event_name, c });
        logLine(`| ${ev.event_year} | ${ev.event_name} | ${lane} | ${reg} | ${mag.toFixed(2)} | ${decay.toFixed(2)} | +${c.toFixed(2)} |`);
    }
}

// ---------- Step 2: store-network anchors (live in 2026) ----------
logLine('');
logLine('## Step 2 — Active store-network signal (live count, decay = 1.00)');
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
const CITY_UNIT = 0.18, BB_UNIT = 0.06;
const bumpUF_W = Math.log1p(openCity.western)   * CITY_UNIT;
const bumpUF_E = Math.log1p(openCity.east_asia) * CITY_UNIT;
const bumpBB_W = Math.log1p(openBig.western)    * BB_UNIT;
const bumpBB_E = Math.log1p(openBig.east_asia)  * BB_UNIT;
raw.urban_format.western   += bumpUF_W;
raw.urban_format.east_asia += bumpUF_E;
raw.big_box.western        += bumpBB_W;
raw.big_box.east_asia      += bumpBB_E;
logLine(`- urban_format ← active city-stores: West ${openCity.western} → +${bumpUF_W.toFixed(2)}, East ${openCity.east_asia} → +${bumpUF_E.toFixed(2)}`);
logLine(`- big_box       ← active big-box: West ${openBig.western} → +${bumpBB_W.toFixed(2)}, East ${openBig.east_asia} → +${bumpBB_E.toFixed(2)}`);

// ---------- Step 3: quantitative external anchors ----------
logLine('');
logLine('## Step 3 — Quantitative external anchors  (metric × scale × time_decay)');
logLine('');
logLine('| Lane | Regime | Metric | Value | Unit | Year | dir × w | Scaled | Decay | Contribution |');
logLine('|---|---|---|---|---|---|---|---|---|---|');
for (const a of anchors) {
    if (!raw[a.priority_key]) continue;
    if (a.regime !== 'western' && a.regime !== 'east_asia') continue;
    const dir = parseFloat(a.direction) || 1;
    const w   = parseFloat(a.weight)    || 1;
    const decay = timeDecay(a.year);
    const scaled = scaleAnchor(a);
    const c = dir * w * scaled * decay;
    raw[a.priority_key][a.regime] += c;
    evidence[a.priority_key][a.regime].push({ year: a.year, name: a.reason, c });
    logLine(`| ${a.priority_key} | ${a.regime} | ${a.metric_name} | ${a.metric_value} | ${a.unit} | ${a.year} | ${dir > 0 ? '+' : '−'}${w} | ${scaled.toFixed(2)} | ${decay.toFixed(2)} | ${c >= 0 ? '+' : ''}${c.toFixed(2)} |`);
}

// ---------- Step 4: min-max normalization within regime → intensity 1..5 ----------
logLine('');
logLine('## Step 4 — Min-max within regime → intensity 1..5');
logLine('');

function computeIntensities(regime) {
    const scores = LANES.map(l => raw[l.key][regime]);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min || 1;
    const out = {};
    LANES.forEach(l => {
        const s = raw[l.key][regime];
        const norm = (s - min) / range;       // 0..1
        const intensity = Math.max(1, Math.min(5, Math.round(1 + 4 * norm)));
        const rank = scores.filter(x => x > s).length + 1;
        out[l.key] = { rank, score: s, norm, intensity };
    });
    return out;
}
const W = computeIntensities('western');
const E = computeIntensities('east_asia');

function dumpRegime(label, R) {
    logLine('### ' + label);
    logLine('');
    logLine('| Rank | Lane | Raw score | norm | Intensity |');
    logLine('|---|---|---|---|---|');
    LANES.map(l => ({ key: l.key, ...R[l.key] }))
        .sort((a, b) => a.rank - b.rank)
        .forEach(r => logLine(`| ${r.rank} | ${r.key} | ${r.score.toFixed(2)} | ${r.norm.toFixed(2)} | ${r.intensity}/5 |`));
    logLine('');
}
dumpRegime('Western',    W);
dumpRegime('East Asian', E);

// ---------- Step 5: write CSV ----------
function buildEvidence(laneKey, regime) {
    const evs = evidence[laneKey][regime] || [];
    if (!evs.length) return 'No quantitative anchors in this regime/lane';
    evs.sort((a, b) => (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0));
    return evs.map(e => e.year ? `${e.name} (${e.year})` : e.name).join('; ');
}

const outRows = [
    ['priority_key','priority_label','west_intensity','east_intensity','west_evidence','east_evidence']
        .map(csvQuote).join(',')
];
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
fs.writeFileSync(path.join(ROOT, 'data/processed/playbook_priorities.csv'), outRows.join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'data/PLAYBOOK_COMPUTATION.md'), log.join('\n') + '\n');
console.log(log.join('\n'));
console.log('\n✓ Wrote data/processed/playbook_priorities.csv');
console.log('✓ Wrote data/PLAYBOOK_COMPUTATION.md (audit log)');
