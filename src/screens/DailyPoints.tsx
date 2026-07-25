import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  formatDateKey,
  sumMonthPoints,
} from "../lib/calendar";

type DailyPointsProps = {
  nickname: string;
  totalPoints: number;
  dailyPoints: Record<string, number>;
  onBack: () => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyPoints({
  nickname,
  totalPoints,
  dailyPoints,
  onBack,
}: DailyPointsProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const todayKey = formatDateKey(now);

  const cells = useMemo(
    () => buildMonthGrid(year, month, dailyPoints, todayKey),
    [year, month, dailyPoints, todayKey],
  );
  const monthTotal = useMemo(
    () => sumMonthPoints(year, month, dailyPoints),
    [year, month, dailyPoints],
  );

  const label = new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function goPrev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <section className="panel daily-points">
      <p className="brand">Spell Quest</p>
      <header className="home-header">
        <div>
          <p className="eyebrow">Points by day</p>
          <h1>{nickname}</h1>
        </div>
        <div className="points-chip" aria-label={`${totalPoints} points`}>
          <span>{totalPoints}</span>
          <small>lifetime</small>
        </div>
      </header>
      <p className="lede">Points you earn from today onward show up here.</p>

      <div className="month-nav">
        <button
          type="button"
          className="btn ghost"
          onClick={goPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="month-label">{label}</p>
        <button
          type="button"
          className="btn ghost"
          onClick={goNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="cal-weekdays" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid" role="grid" aria-label={`Calendar for ${label}`}>
        {cells.map((cell, index) => (
          <div
            key={cell.dateKey ?? `pad-${index}`}
            role="gridcell"
            aria-label={
              cell.inMonth
                ? cell.points > 0
                  ? `${cell.day}, ${cell.points} points`
                  : `${cell.day}, no points`
                : undefined
            }
            className={[
              "cal-cell",
              cell.inMonth ? undefined : "muted",
              cell.isToday ? "today" : undefined,
              cell.points > 0 ? "has-points" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {cell.inMonth ? (
              <>
                <span className="cal-day">{cell.day}</span>
                <span className={cell.points > 0 ? "cal-pts" : "cal-pts empty"}>
                  {cell.points > 0 ? `${cell.points} pts` : "—"}
                </span>
              </>
            ) : null}
          </div>
        ))}
      </div>

      <p className="month-total">This month: {monthTotal} points</p>

      <button type="button" className="btn secondary" onClick={onBack}>
        Back home
      </button>
    </section>
  );
}
