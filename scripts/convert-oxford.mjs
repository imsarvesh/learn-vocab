import fs from 'node:fs';

const INPUT =
  '/Users/sarvesh/.cursor/projects/Users-sarvesh-Desktop-learn-vocab/agent-tools/b2357f1a-a02b-4021-b72b-c24335a7a988.txt';
const OUTPUT = '/Users/sarvesh/Desktop/learn-vocab/oxford-5000-words.csv';

function parseCsv(text) {
  const rows = [];
  let fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
      if (ch === '\r') i++;
      fields.push(cur);
      rows.push(fields);
      fields = [];
      cur = '';
    } else if (ch === '\r') {
      fields.push(cur);
      rows.push(fields);
      fields = [];
      cur = '';
    } else cur += ch;
  }
  if (cur.length || fields.length) {
    fields.push(cur);
    rows.push(fields);
  }
  return rows;
}

function cleanClue(s) {
  return String(s).trim().replace(/\s+/g, ' ');
}

function shortenClue(s, max = 180) {
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max * 0.5) cut = cut.slice(0, lastSpace);
  return cut.trim() + '...';
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function isValidWord(w) {
  return /^[A-Za-z][A-Za-z'-]*$/.test(w);
}

const text = fs.readFileSync(INPUT, 'utf8');
const rows = parseCsv(text);
const header = rows[0].map((h) => h.trim().toLowerCase());
const wordIdx = header.indexOf('word');
const defIdx = header.indexOf('definition');

const seen = new Set();
const out = ['word,clue'];

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.every((c) => !String(c).trim())) continue;
  const wordRaw = (row[wordIdx] ?? '').trim();
  const clue = cleanClue(row[defIdx] ?? '');
  if (!wordRaw || !clue) continue;
  if (/\s/.test(wordRaw)) continue;
  if (!isValidWord(wordRaw)) continue;
  const key = wordRaw.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  out.push(`${csvEscape(wordRaw)},${csvEscape(shortenClue(clue))}`);
}

fs.writeFileSync(OUTPUT, out.join('\n') + '\n', 'utf8');
console.log(JSON.stringify({ path: OUTPUT, lines: out.length, rows: out.length - 1, first5: out.slice(1, 6) }, null, 2));
