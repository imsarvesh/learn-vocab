import { describe, expect, it } from "vitest";
import { DEFAULT_WORD_LIST } from "../data/defaultWordList";

describe("DEFAULT_WORD_LIST", () => {
  it("ships thousands of starter words with clues", () => {
    expect(DEFAULT_WORD_LIST.id).toBe("default-oxford");
    expect(DEFAULT_WORD_LIST.words.length).toBeGreaterThan(4000);
    expect(DEFAULT_WORD_LIST.words[0]?.word.length).toBeGreaterThan(0);
    expect(DEFAULT_WORD_LIST.words[0]?.clue.length).toBeGreaterThan(0);
  });
});
