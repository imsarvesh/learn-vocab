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
  const letterIndexes = chars
    .map((ch, i) => (/\s/.test(ch) ? -1 : i))
    .filter((i) => i >= 0);

  if (letterIndexes.length <= 1) return word;

  for (let attempt = 0; attempt < 20; attempt++) {
    const letters = letterIndexes.map((i) => chars[i]!);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [letters[i], letters[j]] = [letters[j]!, letters[i]!];
    }
    const next = [...chars];
    letterIndexes.forEach((index, n) => {
      next[index] = letters[n]!;
    });
    const scrambled = next.join("");
    if (scrambled.toLowerCase() !== word.toLowerCase()) {
      return scrambled;
    }
  }

  const letters = letterIndexes.map((i) => chars[i]!).reverse();
  const next = [...chars];
  letterIndexes.forEach((index, n) => {
    next[index] = letters[n]!;
  });
  return next.join("");
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

export function expectedLetterCount(word: string): number {
  return [...word].filter((ch) => !/\s/.test(ch)).length;
}

export function lettersOnly(value: string): string {
  return [...value].filter((ch) => /[a-zA-Z]/.test(ch)).join("");
}

export function mergeLettersIntoWord(word: string, letters: string): string {
  const chars = lettersOnly(letters);
  let i = 0;
  const parts: string[] = [];
  for (const ch of word) {
    if (/\s/.test(ch)) {
      parts.push(ch);
    } else if (i < chars.length) {
      parts.push(chars[i]!);
      i += 1;
    } else {
      parts.push("");
    }
  }
  while (parts.length && parts[parts.length - 1] === "") parts.pop();
  while (parts.length && /^\s+$/.test(parts[parts.length - 1]!)) parts.pop();
  return parts.join("");
}

export function isLetterAnswerComplete(word: string, letters: string): boolean {
  return lettersOnly(letters).length === expectedLetterCount(word);
}

export function firstLetterOfWord(word: string): string {
  for (const ch of word) {
    if (!/\s/.test(ch)) return ch;
  }
  return "";
}
