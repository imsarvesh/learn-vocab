/**
 * Build Spell Quest import CSV from Oxford word lists.
 * Prefers local data/ copies; falls back to Cursor agent-tools mirrors.
 *
 * Usage: node scripts/build-oxford-csv.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const home = process.env.HOME || "";
const agentTools = path.join(
  home,
  ".cursor/projects/Users-sarvesh-Desktop-learn-vocab/agent-tools",
);

const sources = [
  path.join(root, "data/oxford_5000_source.csv"),
  path.join(root, "data/oxford_3000.csv"),
  path.join(root, "data/oxford_5000_exclusive.csv"),
  path.join(agentTools, "1dd37216-f9eb-47b4-b09d-349220beb4ca.txt"), // 5000 (may be truncated)
  path.join(agentTools, "00466d25-bfda-4055-8127-4f6883e94a75.txt"), // 3000
  path.join(agentTools, "a4477d23-3215-4c8d-85dd-bc53e38482de.txt"), // exclusive
];

const skipWords = new Set(["abortion"]);

function csvEscape(value) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = false;
      } else current += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      cells.push(current);
      current = "";
    } else current += ch;
  }
  cells.push(current);
  return cells;
}

function ingest(filePath, seen, rows) {
  if (!fs.existsSync(filePath)) return 0;
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return 0;

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const wordIdx = header.indexOf("word");
  const defIdx = header.indexOf("definition");
  if (wordIdx === -1 || defIdx === -1) {
    console.warn("Skip (no word/definition):", filePath);
    return 0;
  }

  let added = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const word = (cells[wordIdx] ?? "").trim();
    let clue = (cells[defIdx] ?? "").trim().replace(/\s+/g, " ");
    // Drop truncated clues that end mid-word without punctuation
    if (clue.length < 8) continue;
    if (!word || !clue) continue;
    if (/\s/.test(word)) continue;
    const key = word.toLowerCase();
    if (seen.has(key) || skipWords.has(key)) continue;
    seen.add(key);
    rows.push(`${csvEscape(word)},${csvEscape(clue)}`);
    added++;
  }
  console.log(`+${added} from ${path.basename(filePath)}`);
  return added;
}

const seen = new Set();
const rows = ["word,clue"];
let used = 0;
for (const src of sources) {
  used += ingest(src, seen, rows);
}

if (used === 0) {
  console.error("No source files found.");
  process.exit(1);
}

const outPath = path.join(root, "oxford-5000-words.csv");
fs.writeFileSync(outPath, rows.join("\n") + "\n", "utf8");
console.log(`Wrote ${rows.length - 1} words → ${outPath}`);
console.log("--- head ---");
console.log(rows.slice(0, 5).join("\n"));
console.log("--- tail ---");
console.log(rows.slice(-3).join("\n"));
