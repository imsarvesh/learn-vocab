import { useMemo, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import {
  formatSpellingHint,
  isCorrect,
  pickRound,
  pointsForAttempt,
  scrambleWord,
} from "../lib/game";
import { canSpeak, speakWord } from "../lib/speech";
import type { PracticeMode, WordEntry } from "../types";

type PracticeProps = {
  mode: PracticeMode;
  words: WordEntry[];
  nickname: string;
  totalPoints: number;
  onEarnPoints: (points: number) => void;
  onExit: () => void;
};

type Phase = "answering" | "feedback" | "summary";

function SpeakerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 9v6h3.5L12 19V5L7.5 9H4z"
        fill="currentColor"
      />
      <path
        d="M15.5 8.5a4.5 4.5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17.5 5.5a8 8 0 0 1 0 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Practice({
  mode,
  words,
  nickname,
  totalPoints,
  onEarnPoints,
  onExit,
}: PracticeProps) {
  const round = useMemo(() => pickRound(words, 10), [words]);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [message, setMessage] = useState("");
  const [earnedThisWord, setEarnedThisWord] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [scrambleMap] = useState(() =>
    Object.fromEntries(round.map((w) => [w.word, scrambleWord(w.word)])),
  );

  const current = round[index];
  const finished = phase === "summary";

  function finishWord(points: number, feedback: string) {
    if (points > 0) {
      onEarnPoints(points);
      setSessionPoints((value) => value + points);
    }
    setEarnedThisWord(points);
    setMessage(feedback);
    setPhase("feedback");
  }

  function goNext() {
    if (index + 1 >= round.length) {
      setPhase("summary");
      return;
    }
    setIndex((value) => value + 1);
    setAttempt(1);
    setAnswer("");
    setMessage("");
    setEarnedThisWord(0);
    setHintUsed(false);
    setPhase("answering");
  }

  function checkAnswer() {
    if (!current || phase !== "answering") return;

    if (isCorrect(answer, current.word)) {
      const points = pointsForAttempt(attempt, hintUsed);
      const hintNote = hintUsed ? " (hint used)" : "";
      finishWord(points, `Nice! +${points} points${hintNote}`);
      return;
    }

    if (attempt >= 3) {
      finishWord(0, `The spelling is “${current.word}”.`);
      return;
    }

    setAttempt((value) => value + 1);
    setMessage("Not quite — try again!");
    setAnswer("");
  }

  if (!current && !finished) {
    return (
      <section className="panel">
        <p>No words in this round.</p>
        <button type="button" className="btn secondary" onClick={onExit}>
          Back
        </button>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="panel practice">
        <BrandMark />
        <h1>Round complete!</h1>
        <p className="lede">
          {nickname} earned <strong>{sessionPoints}</strong> points this round.
        </p>
        <p className="banner success">Lifetime total: {totalPoints} points</p>
        <button type="button" className="btn primary" onClick={onExit}>
          Back home
        </button>
      </section>
    );
  }

  return (
    <section className="panel practice">
      <header className="practice-top">
        <div>
          <BrandMark compact />
          <p className="meta">
            {nickname} · {totalPoints} pts · Word {index + 1}/{round.length}
          </p>
        </div>
        <button type="button" className="linkish" onClick={onExit}>
          Exit
        </button>
      </header>

      <p className="mode-tag">
        {mode === "meaning" ? "Meaning → Spell" : "Letter Scramble"}
      </p>

      <div className="prompt-card">
        {mode === "meaning" ? (
          <>
            <p className="label">Clue</p>
            <p className="prompt-text">{current.clue}</p>
          </>
        ) : (
          <>
            <p className="label">Unscramble</p>
            <p className="prompt-text scramble" aria-label="scrambled letters">
              {scrambleMap[current.word]}
            </p>
            {current.clue && (
              <p className="hint-clue">Hint: {current.clue}</p>
            )}
          </>
        )}
        {hintUsed && (
          <div className="hint-row">
            <p className="spelling-hint" aria-live="polite">
              Spelling hint: {formatSpellingHint(current.word)}
            </p>
            {canSpeak() && (
              <button
                type="button"
                className="speak-btn"
                aria-label={`Hear “${current.word}”`}
                title="Hear the word"
                onClick={() => speakWord(current.word)}
              >
                <SpeakerIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {phase === "answering" ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            checkAnswer();
          }}
        >
          <label className="field">
            <span>Type the spelling (try {attempt} of 3)</span>
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="Type here"
            />
          </label>
          {message && (
            <div className="feedback-row">
              <p className="banner warn">{message}</p>
              {attempt >= 3 && canSpeak() && (
                <button
                  type="button"
                  className="speak-btn"
                  aria-label={`Hear “${current.word}”`}
                  title="Hear the word"
                  onClick={() => speakWord(current.word)}
                >
                  <SpeakerIcon />
                </button>
              )}
            </div>
          )}
          <div className="row">
            <button
              type="button"
              className="btn ghost"
              disabled={hintUsed}
              onClick={() => setHintUsed(true)}
            >
              {hintUsed ? "Hint shown" : "Show hint"}
            </button>
            <button type="submit" className="btn primary" disabled={!answer.trim()}>
              Check
            </button>
          </div>
        </form>
      ) : (
        <div className="stack">
          <div className="feedback-row">
            <p
              className={`banner ${earnedThisWord > 0 ? "success" : "warn"}`}
            >
              {message}
            </p>
            {earnedThisWord === 0 && canSpeak() && (
              <button
                type="button"
                className="speak-btn"
                aria-label={`Hear “${current.word}”`}
                title="Hear the word"
                onClick={() => speakWord(current.word)}
              >
                <SpeakerIcon />
              </button>
            )}
          </div>
          <button type="button" className="btn primary" onClick={goNext}>
            {index + 1 >= round.length ? "See results" : "Next word"}
          </button>
        </div>
      )}
    </section>
  );
}
