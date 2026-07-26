import { describe, expect, it } from "vitest";
import {
  expectedLetterCount,
  firstLetterOfWord,
  formatSpellingHint,
  isCorrect,
  isLetterAnswerComplete,
  lettersOnly,
  mergeLettersIntoWord,
  normalizeAnswer,
  pickRound,
  pointsForAttempt,
  scrambleWord,
} from "./game";

describe("pointsForAttempt", () => {
  it("returns 10, 5, 2, then 0", () => {
    expect(pointsForAttempt(1)).toBe(10);
    expect(pointsForAttempt(2)).toBe(5);
    expect(pointsForAttempt(3)).toBe(2);
    expect(pointsForAttempt(4)).toBe(0);
  });

  it("caps at 5 when a hint was used", () => {
    expect(pointsForAttempt(1, true)).toBe(5);
    expect(pointsForAttempt(2, true)).toBe(5);
    expect(pointsForAttempt(3, true)).toBe(2);
    expect(pointsForAttempt(4, true)).toBe(0);
  });
});

describe("formatSpellingHint", () => {
  it("shows the first letter and blanks for the rest", () => {
    expect(formatSpellingHint("candy")).toBe("c _ _ _ _");
  });

  it("keeps only the first letter across multi-word answers", () => {
    expect(formatSpellingHint("ice cream")).toBe("i _ _   _ _ _ _ _");
  });

  it("returns a single letter unchanged", () => {
    expect(formatSpellingHint("a")).toBe("a");
  });
});

describe("normalizeAnswer / isCorrect", () => {
  it("trims and ignores case", () => {
    expect(normalizeAnswer("  Cat ")).toBe("cat");
    expect(isCorrect(" CAT ", "cat")).toBe(true);
    expect(isCorrect("dog", "cat")).toBe(false);
  });
});

describe("scrambleWord", () => {
  it("returns a different arrangement when possible", () => {
    let n = 0;
    const random = () => {
      const sequence = [0.9, 0.1, 0.8, 0.2, 0.7, 0.3];
      return sequence[n++ % sequence.length];
    };
    const result = scrambleWord("apple", random);
    expect(result.toLowerCase()).not.toBe("apple");
    expect([...result].sort().join("")).toBe([... "apple"].sort().join(""));
  });

  it("returns single-letter words unchanged", () => {
    expect(scrambleWord("a")).toBe("a");
  });

  it("keeps spaces in place for multi-word answers", () => {
    let n = 0;
    const random = () => {
      const sequence = [0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4];
      return sequence[n++ % sequence.length];
    };
    const result = scrambleWord("ice cream", random);
    expect(result.includes(" ")).toBe(true);
    expect(result.indexOf(" ")).toBe("ice cream".indexOf(" "));
    expect([...result].filter((ch) => ch !== " ").sort().join("")).toBe(
      [... "icecream"].sort().join(""),
    );
  });
});

describe("pickRound", () => {
  it("returns up to size words", () => {
    const words = [
      { word: "a", clue: "1" },
      { word: "b", clue: "2" },
      { word: "c", clue: "3" },
    ];
    expect(pickRound(words, 2, () => 0)).toHaveLength(2);
    expect(pickRound(words, 10, () => 0)).toHaveLength(3);
  });
});

describe("letter boxes helpers", () => {
  it("counts letters ignoring spaces", () => {
    expect(expectedLetterCount("candy")).toBe(5);
    expect(expectedLetterCount("ice cream")).toBe(8);
  });

  it("strips non-letters", () => {
    expect(lettersOnly("C-a!n 2dy")).toBe("Candy");
  });

  it("merges letters back into the word shape", () => {
    expect(mergeLettersIntoWord("ice cream", "icecream")).toBe("ice cream");
    expect(mergeLettersIntoWord("candy", "can")).toBe("can");
  });

  it("detects completion", () => {
    expect(isLetterAnswerComplete("candy", "candy")).toBe(true);
    expect(isLetterAnswerComplete("candy", "cand")).toBe(false);
    expect(isLetterAnswerComplete("ice cream", "icecream")).toBe(true);
  });

  it("returns first letter for hint prefill", () => {
    expect(firstLetterOfWord("candy")).toBe("c");
    expect(firstLetterOfWord(" ice")).toBe("i");
  });
});
