import { useEffect, useRef } from "react";
import {
  expectedLetterCount,
  isLetterAnswerComplete,
  lettersOnly,
} from "../lib/game";

type LetterBoxesProps = {
  word: string;
  value: string;
  onChange: (letters: string) => void;
  onComplete: () => void;
  disabled?: boolean;
};

export function LetterBoxes({
  word,
  value,
  onChange,
  onComplete,
  disabled = false,
}: LetterBoxesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const letters = lettersOnly(value).toUpperCase();
  const max = expectedLetterCount(word);
  const completedRef = useRef(false);

  useEffect(() => {
    if (isLetterAnswerComplete(word, letters)) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    } else {
      completedRef.current = false;
    }
  }, [word, letters, onComplete]);

  function focusInput() {
    inputRef.current?.focus();
  }

  let letterIndex = 0;
  const boxes = [...word].map((ch, i) => {
    if (/\s/.test(ch)) {
      return <span key={`g-${i}`} className="letter-gap" aria-hidden="true" />;
    }
    const idx = letterIndex;
    letterIndex += 1;
    const filled = letters[idx] ?? "";
    const active = idx === letters.length && letters.length < max;
    return (
      <span
        key={`l-${i}`}
        className={`letter-box${active ? " active" : ""}${filled ? " filled" : ""}`}
        onClick={focusInput}
      >
        {filled}
      </span>
    );
  });

  return (
    <div className="letter-boxes" onClick={focusInput}>
      <input
        ref={inputRef}
        className="letter-boxes-input"
        aria-label="Spelling answer"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        disabled={disabled}
        value={letters}
        maxLength={max}
        onChange={(event) => {
          onChange(lettersOnly(event.target.value).toUpperCase().slice(0, max));
        }}
      />
      <div className="letter-boxes-row" aria-hidden="true">
        {boxes}
      </div>
    </div>
  );
}
