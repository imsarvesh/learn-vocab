import type { WordEntry } from "../types";

export function pointsForAttempt(
  attempt: number,
  usedHint = false,
): number {
  let base = 0;
  if (attempt === 1) base = 10;
  else if (attempt === 2) base = 5;
  else if (attempt === 3) base = 2;

  if (usedHint) return Math.min(base, 5);
  return base;
}

export function formatSpellingHint(word: string): string {
  if (!word) return "";

  const groups: string[] = [];
  let current: string[] = [];
  let revealed = false;

  const flush = () => {
    if (current.length > 0) {
      groups.push(current.join(" "));
      current = [];
    }
  };

  for (const ch of word) {
    if (/\s/.test(ch)) {
      flush();
      continue;
    }
    if (!revealed) {
      current.push(ch);
      revealed = true;
    } else {
      current.push("_");
    }
  }
  flush();
  return groups.join("   ");
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isCorrect(answer: string, word: string): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(word);
}

export function scrambleWord(
  word: string,
  random: () => number = Math.random,
): string {
  const chars = [...word];
  if (chars.length <= 1) return word;

  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const scrambled = chars.join("");
    if (scrambled.toLowerCase() !== word.toLowerCase()) {
      return scrambled;
    }
  }

  return chars.reverse().join("");
}

export function pickRound(
  words: WordEntry[],
  size = 10,
  random: () => number = Math.random,
): WordEntry[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(size, copy.length));
}
