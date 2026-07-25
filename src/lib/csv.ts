import type { WordEntry } from "../types";

export type ParseResult =
  | { ok: true; words: WordEntry[] }
  | { ok: false; error: string };

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseWordCsv(text: string): ParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { ok: false, error: "CSV is empty. Add a header row: word,clue" };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const wordIndex = headers.indexOf("word");
  const clueIndex =
    headers.indexOf("clue") !== -1
      ? headers.indexOf("clue")
      : headers.indexOf("definition");

  if (wordIndex === -1 || clueIndex === -1) {
    return {
      ok: false,
      error:
        'CSV must include a "word" column and a "clue" or "definition" column.',
    };
  }

  const words: WordEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const word = (cells[wordIndex] ?? "").trim();
    const clue = (cells[clueIndex] ?? "").trim();
    if (!word) continue;
    words.push({ word, clue: clue || word });
  }

  if (words.length === 0) {
    return {
      ok: false,
      error: "No valid words found. Each row needs a word.",
    };
  }

  return { ok: true, words };
}
