import { afterEach, describe, expect, it, vi } from "vitest";
import { canSpeak, speakWord } from "./speech";

describe("speakWord", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing when speechSynthesis is missing", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    expect(canSpeak()).toBe(false);
    expect(() => speakWord("candy")).not.toThrow();
  });

  it("cancels prior speech and speaks the word", () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { cancel, speak });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text: string;
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    );

    expect(canSpeak()).toBe(true);
    speakWord("candy");

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    const utterance = speak.mock.calls[0][0] as { text: string; rate: number };
    expect(utterance.text).toBe("candy");
    expect(utterance.rate).toBe(0.9);
  });
});
