import type { WordList } from "../types";
import { DEFAULT_WORD_LIST } from "../data/defaultWordList";

const KEYS = {
  nickname: "spellquest:nickname",
  wordList: "spellquest:wordList",
  leaderboard: "spellquest:leaderboard",
} as const;

function getStorage(storage?: Storage): Storage {
  return storage ?? localStorage;
}

export function getNickname(storage?: Storage): string | null {
  return getStorage(storage).getItem(KEYS.nickname);
}

export function setNickname(nickname: string, storage?: Storage): void {
  getStorage(storage).setItem(KEYS.nickname, nickname.trim());
}

export function getStoredWordList(storage?: Storage): WordList | null {
  const raw = getStorage(storage).getItem(KEYS.wordList);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw) as WordList;
    if (!list?.words?.length) return null;
    return list;
  } catch {
    return null;
  }
}

/** Custom list from storage, or the built-in Oxford starter list. */
export function getWordList(storage?: Storage): WordList {
  return getStoredWordList(storage) ?? DEFAULT_WORD_LIST;
}

/**
 * Returns the stored list, or seeds and returns the built-in CSV list
 * when nothing is saved yet (or the saved list is empty/invalid).
 */
export function ensureWordList(storage?: Storage): WordList {
  const stored = getStoredWordList(storage);
  if (stored) return stored;

  if (DEFAULT_WORD_LIST.words.length > 0) {
    setWordList(DEFAULT_WORD_LIST, storage);
  }
  return DEFAULT_WORD_LIST;
}

export function setWordList(list: WordList, storage?: Storage): void {
  getStorage(storage).setItem(KEYS.wordList, JSON.stringify(list));
}

/** Restore the built-in Oxford starter CSV list. */
export function resetToDefaultWordList(storage?: Storage): WordList {
  setWordList(DEFAULT_WORD_LIST, storage);
  return DEFAULT_WORD_LIST;
}

export function clearWordList(storage?: Storage): void {
  getStorage(storage).removeItem(KEYS.wordList);
}

export function getLeaderboardRaw(storage?: Storage): string | null {
  return getStorage(storage).getItem(KEYS.leaderboard);
}

export function setLeaderboardRaw(value: string, storage?: Storage): void {
  getStorage(storage).setItem(KEYS.leaderboard, value);
}

export { KEYS as STORAGE_KEYS };
