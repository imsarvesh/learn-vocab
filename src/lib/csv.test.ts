import { describe, expect, it } from "vitest";
import { parseWordCsv } from "./csv";

describe("parseWordCsv", () => {
  it("parses a valid CSV", () => {
    const result = parseWordCsv("word,clue\ncat,a small pet\ndog,a loyal pet\n");
    expect(result).toEqual({
      ok: true,
      words: [
        { word: "cat", clue: "a small pet" },
        { word: "dog", clue: "a loyal pet" },
      ],
    });
  });

  it("rejects missing header columns", () => {
    const result = parseWordCsv("spelling,meaning\ncat,a pet\n");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/word/i);
    }
  });

  it("accepts definition as the clue column", () => {
    const result = parseWordCsv(
      "word,definition\ncat,a small pet\ndog,a loyal pet\n",
    );
    expect(result).toEqual({
      ok: true,
      words: [
        { word: "cat", clue: "a small pet" },
        { word: "dog", clue: "a loyal pet" },
      ],
    });
  });

  it("rejects empty input", () => {
    const result = parseWordCsv("   ");
    expect(result.ok).toBe(false);
  });

  it("skips blank rows and rows without a word", () => {
    const result = parseWordCsv("word,clue\ncat,pet\n\n,missing\nbird,flies\n");
    expect(result).toEqual({
      ok: true,
      words: [
        { word: "cat", clue: "pet" },
        { word: "bird", clue: "flies" },
      ],
    });
  });

  it("rejects header-only CSV", () => {
    const result = parseWordCsv("word,clue\n");
    expect(result.ok).toBe(false);
  });

  it("handles quoted commas", () => {
    const result = parseWordCsv(
      'word,clue\n"ice cream","cold, sweet dessert"\n',
    );
    expect(result).toEqual({
      ok: true,
      words: [{ word: "ice cream", clue: "cold, sweet dessert" }],
    });
  });
});
