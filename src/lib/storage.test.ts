import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_WORD_LIST } from "../data/defaultWordList";
import {
  STORAGE_KEYS,
  clearWordList,
  ensureWordList,
  getWordList,
  resetToDefaultWordList,
  setWordList,
} from "./storage";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("clearWordList", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("removes custom list so getWordList returns default", () => {
    setWordList(
      {
        id: "custom",
        name: "My list",
        words: [{ word: "cat", clue: "pet" }],
      },
      storage,
    );
    expect(getWordList(storage).name).toBe("My list");

    clearWordList(storage);

    expect(storage.getItem(STORAGE_KEYS.wordList)).toBeNull();
    expect(getWordList(storage)).toEqual(DEFAULT_WORD_LIST);
  });
});

describe("ensureWordList", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("seeds the Oxford CSV list when nothing is stored", () => {
    const list = ensureWordList(storage);
    expect(list.words.length).toBeGreaterThan(4000);
    expect(list.name).toBe("Starter words");
    expect(storage.getItem(STORAGE_KEYS.wordList)).not.toBeNull();
    expect(getWordList(storage).words.length).toBe(list.words.length);
  });

  it("keeps an existing custom list", () => {
    setWordList(
      {
        id: "custom",
        name: "My list",
        words: [{ word: "cat", clue: "pet" }],
      },
      storage,
    );
    expect(ensureWordList(storage).name).toBe("My list");
  });
});

describe("resetToDefaultWordList", () => {
  it("writes the starter CSV list into storage", () => {
    const storage = createMemoryStorage();
    setWordList(
      {
        id: "custom",
        name: "My list",
        words: [{ word: "cat", clue: "pet" }],
      },
      storage,
    );
    const list = resetToDefaultWordList(storage);
    expect(list).toEqual(DEFAULT_WORD_LIST);
    expect(getWordList(storage).name).toBe("Starter words");
    expect(getWordList(storage).words.length).toBeGreaterThan(4000);
  });
});
