/*
 * audit_data.mjs
 *
 * Programmatic data audit script for the Two IKEAs project.
 * Reads every CSV in data/processed/ and runs 10 checks
 * (empty cells, duplicates, date ranges, cross-table joins,
 * taxonomy consistency with viz code, etc.).
 *
 * Usage:
 *   node scripts/audit_data.mjs > data/AUDIT_SCAN.md
 *
 * Re-run after any data edit. Compare the output against the
 * narrative in data/AUDIT.md to spot drift.
 */
import fs from 'fs';
import path from 'path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');

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

function parse(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.length > 0);
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cols = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => row[h] = (cols[i] || '').trim());
    return row;
  });
  return { headers, rows };
}

function load(name) {
  const p = path.join(root, 'data', 'processed', name + '.csv');
  return parse(fs.readFileSync(p, 'utf8'));
}

const datasets = {
  stores: load('ikea_stores'),
  housing: load('housing_pressure'),
  events: load('strategic_events'),
  competitors: load('east_asian_competitors'),
  ecology: load('retail_ecology'),
  playbook: load('playbook_priorities'),
};

const out = [];
const log = s => out.push(s);

log('# Programmatic Data Audit Scan');
log('');
log('_Generated_: ' + new Date().toISOString());
log('');

// ============ §1 Overview ============
log('## §1 Dataset overview');
log('');
log('| Dataset | Rows | Columns | Empty cells |');
log('|---|---|---|---|');
for (const [name, ds] of Object.entries(datasets)) {
  const emptyCount = ds.rows.reduce((acc, r) => acc + Object.values(r).filter(v => v === '').length, 0);
  log(`| ${name} | ${ds.rows.length} | ${ds.headers.length} | ${emptyCount} |`);
}

// ============ §2 Per-column null distribution ============
log('');
log('## §2 Empty-cell distribution per column');
for (const [name, ds] of Object.entries(datasets)) {
  log('');
  log(`### ${name}`);
  log('');
  log('| Column | Filled | Empty | % filled |');
  log('|---|---|---|---|');
  ds.headers.forEach(h => {
    const filled = ds.rows.filter(r => r[h] !== '').length;
    const empty = ds.rows.length - filled;
    const pct = ((filled / ds.rows.length) * 100).toFixed(0);
    log(`| ${h} | ${filled} | ${empty} | ${pct}% |`);
  });
}

// ============ §3 Duplicate detection ============
log('');
log('## §3 Duplicate detection');
log('');
for (const [name, ds] of Object.entries(datasets)) {
  const seen = new Map();
  const dupes = [];
  ds.rows.forEach((r, i) => {
    const key = ds.headers.slice(1).map(h => r[h]).join('|');
    if (seen.has(key)) dupes.push({ i, prev: seen.get(key), key: key.slice(0, 80) });
    else seen.set(key, i);
  });
  log(`- **${name}**: ${dupes.length === 0 ? '0 duplicates' : dupes.length + ' duplicates'}`);
}

// ============ §4 Date range sanity ============
log('');
log('## §4 Date range sanity');
log('');
const yrCheck = (label, vals) => {
  const nums = vals.map(v => parseInt(v)).filter(v => !isNaN(v));
  if (nums.length === 0) { log(`- **${label}**: no values`); return; }
  log(`- **${label}**: ${nums.length} non-null values, range ${Math.min(...nums)} → ${Math.max(...nums)}`);
};
yrCheck('stores.opening_year', datasets.stores.rows.map(r => r.opening_year));
yrCheck('stores.closure_year', datasets.stores.rows.map(r => r.closure_year));
yrCheck('events.event_year', datasets.events.rows.map(r => r.event_year));
yrCheck('housing.year', datasets.housing.rows.map(r => r.year));

// ============ §5 Source URL coverage ============
log('');
log('## §5 Source URL coverage');
log('');
for (const [name, ds] of Object.entries(datasets)) {
  const urlCol = ds.headers.find(h => h === 'source_url');
  if (!urlCol) { log(`- **${name}**: no source_url column`); continue; }
  const withUrl = ds.rows.filter(r => r[urlCol] && r[urlCol].length > 5).length;
  log(`- **${name}**: ${withUrl}/${ds.rows.length} rows have source_url`);
}

// ============ §6 Cross-table city match ============
log('');
log('## §6 Cross-table city match (housing × stores)');
log('');
const aliases = { 'new york city': 'new york', 'washington dc': 'washington' };
const storeCities = new Set(datasets.stores.rows.map(r => r.city.toLowerCase()));
log('| Housing city | Has IKEA store row? |');
log('|---|---|');
datasets.housing.rows.forEach(r => {
  const c = r.city.toLowerCase();
  const hit = storeCities.has(c) || storeCities.has(aliases[c]);
  log(`| ${r.city} | ${hit ? '✅' : '❌ NO MATCH'} |`);
});

// ============ §7 Taxonomy check ============
log('');
log('## §7 response_type taxonomy in events vs viz3 lanes');
log('');
const usedTypes = new Set(datasets.events.rows.map(r => r.response_type));
const vizLanes = ['urban_format', 'service_partnership', 'resale_circularity', 'channel_innovation', 'strategy_pivot', 'price_cut', 'closure', 'store_expansion'];
log('Lanes defined in viz3: `' + vizLanes.join('`, `') + '`');
log('');
log('Types found in events.csv: `' + [...usedTypes].join('`, `') + '`');
log('');
const notInLanes = [...usedTypes].filter(t => !vizLanes.includes(t));
const notInData = vizLanes.filter(t => !usedTypes.has(t));
log(`- Types in data but **not** in viz lanes: ${notInLanes.length > 0 ? '`' + notInLanes.join('`, `') + '`' : 'none'}`);
log(`- Viz lanes with **zero** events: ${notInData.length > 0 ? '`' + notInData.join('`, `') + '`' : 'none'}`);

// ============ §8 Playbook flips ============
log('');
log('## §8 Playbook priority intensities');
log('');
log('| Priority | West | East | Flip (\\|W-E\\|) |');
log('|---|---|---|---|');
datasets.playbook.rows.forEach(r => {
  const flip = Math.abs(parseInt(r.west_intensity) - parseInt(r.east_intensity));
  log(`| ${r.priority_label} | ${r.west_intensity} | ${r.east_intensity} | ${flip} |`);
});

// ============ §9 Coordinates ============
log('');
log('## §9 Store coordinate plausibility');
log('');
const oob = datasets.stores.rows.filter(r => {
  const la = parseFloat(r.latitude), lo = parseFloat(r.longitude);
  return isNaN(la) || isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180;
});
const noCoords = datasets.stores.rows.filter(r => r.latitude === '' || r.longitude === '').length;
log(`- ${oob.length} stores have invalid lat/lon (out of bounds)`);
log(`- ${noCoords} stores missing coordinates entirely`);

// ============ §10 Region distribution ============
log('');
log('## §10 Region/regime distribution');
log('');
const dist = (label, vals) => {
  const counts = {};
  vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
  log(`- **${label}**: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
};
dist('stores.region_type', datasets.stores.rows.map(r => r.region_type));
dist('housing.region_type', datasets.housing.rows.map(r => r.region_type));
dist('events.regime_type', datasets.events.rows.map(r => r.regime_type));
dist('ecology.region_type', datasets.ecology.rows.map(r => r.region_type));

process.stdout.write(out.join('\n') + '\n');
