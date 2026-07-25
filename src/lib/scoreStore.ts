import type { LeaderboardEntry, ScoreStore } from "../types";
import {
  getLeaderboardRaw,
  setLeaderboardRaw,
} from "./storage";

function readEntries(storage?: Storage): LeaderboardEntry[] {
  const raw = getLeaderboardRaw(storage);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeEntries(entries: LeaderboardEntry[], storage?: Storage): void {
  setLeaderboardRaw(JSON.stringify(entries), storage);
}

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function findEntry(
  entries: LeaderboardEntry[],
  nickname: string,
): LeaderboardEntry | undefined {
  const key = nickname.trim().toLowerCase();
  return entries.find((e) => e.nickname.toLowerCase() === key);
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-`;
}

export function createLocalScoreStore(storage?: Storage): ScoreStore {
  return {
    getLeaderboard() {
      return [...readEntries(storage)].sort(
        (a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname),
      );
    },

    getPoints(nickname: string) {
      return findEntry(readEntries(storage), nickname)?.totalPoints ?? 0;
    },

    getDailyPoints(nickname: string) {
      return { ...(findEntry(readEntries(storage), nickname)?.dailyPoints ?? {}) };
    },

    getMonthTotal(nickname: string, year: number, month: number) {
      const daily = findEntry(readEntries(storage), nickname)?.dailyPoints ?? {};
      const prefix = monthPrefix(year, month);
      let total = 0;
      for (const [key, value] of Object.entries(daily)) {
        if (key.startsWith(prefix)) total += value;
      }
      return total;
    },

    addPoints(nickname: string, points: number) {
      if (points <= 0) return;
      const trimmed = nickname.trim();
      if (!trimmed) return;

      const entries = readEntries(storage);
      const key = trimmed.toLowerCase();
      const index = entries.findIndex((e) => e.nickname.toLowerCase() === key);
      const day = localDateKey();

      if (index === -1) {
        entries.push({
          nickname: trimmed,
          totalPoints: points,
          dailyPoints: { [day]: points },
        });
      } else {
        const prevDaily = entries[index].dailyPoints ?? {};
        entries[index] = {
          nickname: entries[index].nickname,
          totalPoints: entries[index].totalPoints + points,
          dailyPoints: {
            ...prevDaily,
            [day]: (prevDaily[day] ?? 0) + points,
          },
        };
      }

      writeEntries(entries, storage);
    },

    resetPoints(nickname: string) {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      const entries = readEntries(storage).filter(
        (e) => e.nickname.toLowerCase() !== key,
      );
      writeEntries(entries, storage);
    },
  };
}
