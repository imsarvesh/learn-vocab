import { BrandMark } from "../components/BrandMark";
import type { LeaderboardEntry } from "../types";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  currentNickname: string;
  onBack: () => void;
};

export function Leaderboard({
  entries,
  currentNickname,
  onBack,
}: LeaderboardProps) {
  return (
    <section className="panel leaderboard">
      <BrandMark />
      <h1>Leaderboard</h1>
      <p className="lede">Top spellers on this device.</p>

      {entries.length === 0 ? (
        <p className="banner">No scores yet. Finish a round to appear here.</p>
      ) : (
        <ol className="rank-list">
          {entries.map((entry, index) => {
            const isYou =
              entry.nickname.toLowerCase() === currentNickname.toLowerCase();
            return (
              <li key={entry.nickname} className={isYou ? "you" : undefined}>
                <span className="rank">#{index + 1}</span>
                <span className="name">
                  {entry.nickname}
                  {isYou ? " (you)" : ""}
                </span>
                <span className="score">{entry.totalPoints}</span>
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" className="btn secondary" onClick={onBack}>
        Back home
      </button>
    </section>
  );
}
