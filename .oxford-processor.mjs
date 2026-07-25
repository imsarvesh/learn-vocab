import fs from 'node:fs';

const INPUT = '/Users/sarvesh/.cursor/projects/Users-sarvesh-Desktop-learn-vocab/agent-tools/1dd37216-f9eb-47b4-b09d-349220beb4ca.txt';
const OUTPUT = '/Users/sarvesh/Desktop/learn-vocab/oxford-5000-words.csv';

const SENSITIVE = new Set([
  'abortion','abort','pornography','porn','prostitute','prostitution','rape','rapist',
  'incest','nude','naked','orgasm','penis','vagina','semen','sperm','masturbate',
  'masturbation','erotic','sexual','sex','sexy','homosexual','lesbian','gay','whore',
  'slut','cocaine','heroin','marijuana','cannabis','suicide',
]);

function parseCsv(text) {
  const rows = [];
  let fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(cur); cur = ''; }
    else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
      if (ch === '\r') i++;
      fields.push(cur); rows.push(fields); fields = []; cur = '';
    } else if (ch === '\r') { fields.push(cur); rows.push(fields); fields = []; cur = ''; }
    else cur += ch;
  }
  if (cur.length || fields.length) { fields.push(cur); rows.push(fields); }
  return rows;
}

function cleanClue(s) {
  let t = String(s).trim().replace(/\s+/g, ' ');
  while ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1).trim();
  return t.replace(/^"+|"+$/g, '').trim();
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const text = fs.readFileSync(INPUT, 'utf8');
const rows = parseCsv(text);
const header = rows[0].map(h => h.trim().toLowerCase());
const wordIdx = header.indexOf('word');
const defIdx = header.indexOf('definition');
const seen = new Set();
const out = ['word,clue'];

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.every(c => !String(c).trim())) continue;
  const wordRaw = (row[wordIdx] ?? '').trim();
  const clue = cleanClue(row[defIdx] ?? '');
  if (!wordRaw || !clue) continue;
  if (/\s/.test(wordRaw)) continue;
  const key = wordRaw.toLowerCase();
  if (SENSITIVE.has(key)) continue;
  if (seen.has(key)) continue;
  seen.add(key);
  out.push(`${csvEscape(wordRaw)},${csvEscape(clue)}`);
}

fs.writeFileSync(OUTPUT, out.join('\n') + '\n', 'utf8');
console.log(JSON.stringify({ rows: out.length - 1, bytes: fs.statSync(OUTPUT).size, first5: out.slice(1,6), last2: out.slice(-2) }));
