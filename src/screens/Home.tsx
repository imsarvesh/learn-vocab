import { BrandMark } from "../components/BrandMark";

type HomeProps = {
  nickname: string;
  points: number;
  hasWords: boolean;
  wordCount: number;
  listName: string;
  onPractice: () => void;
  onLeaderboard: () => void;
  onDailyPoints: () => void;
  onSettings: () => void;
  onChangeName: () => void;
};

export function Home({
  nickname,
  points,
  hasWords,
  wordCount,
  listName,
  onPractice,
  onLeaderboard,
  onDailyPoints,
  onSettings,
  onChangeName,
}: HomeProps) {
  return (
    <section className="panel home">
      <BrandMark />
      <header className="home-header">
        <div>
          <p className="eyebrow">Playing as</p>
          <h1>{nickname}</h1>
        </div>
        <div className="points-chip" aria-label={`${points} points`}>
          <span>{points}</span>
          <small>points</small>
        </div>
      </header>

      <p className="lede">
        {hasWords
          ? `${wordCount.toLocaleString()} words ready (${listName}). Unscramble letters to practice spelling.`
          : "Open Settings to import a word list and start practicing."}
      </p>

      <div className="action-grid">
        <button
          type="button"
          className="btn primary"
          disabled={!hasWords}
          onClick={onPractice}
        >
          Letter Scramble
        </button>
        <button type="button" className="btn secondary" onClick={onLeaderboard}>
          Leaderboard
        </button>
        <button type="button" className="btn secondary" onClick={onDailyPoints}>
          Points by day
        </button>
        <button type="button" className="btn secondary" onClick={onSettings}>
          Settings
        </button>
      </div>

      <button type="button" className="linkish" onClick={onChangeName}>
        Change nickname
      </button>
    </section>
  );
}
