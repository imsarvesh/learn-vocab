import oxfordCsv from "../../oxford-5000-words.csv?raw";
import { parseWordCsv } from "../lib/csv";
import type { WordList } from "../types";

const parsed = parseWordCsv(oxfordCsv);

if (!parsed.ok || parsed.words.length === 0) {
  console.error(
    "Failed to load default word CSV (oxford-5000-words.csv)",
    parsed.ok ? "empty word list" : parsed.error,
  );
}

export const DEFAULT_WORD_LIST: WordList = {
  id: "default-oxford",
  name: "Starter words",
  words: parsed.ok ? parsed.words : [],
};
