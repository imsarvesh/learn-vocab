import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalScoreStore } from "./scoreStore";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("createLocalScoreStore", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("adds points and ranks leaderboard", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0));

    const store = createLocalScoreStore(storage);
    store.addPoints("Sam", 10);
    store.addPoints("Alex", 15);
    store.addPoints("Sam", 5);

    expect(store.getPoints("Sam")).toBe(15);
    expect(store.getLeaderboard()).toEqual([
      {
        nickname: "Alex",
        totalPoints: 15,
        dailyPoints: { "2026-07-25": 15 },
      },
      {
        nickname: "Sam",
        totalPoints: 15,
        dailyPoints: { "2026-07-25": 15 },
      },
    ]);

    vi.useRealTimers();
  });

  it("ignores zero or negative points", () => {
    const store = createLocalScoreStore(storage);
    store.addPoints("Sam", 0);
    store.addPoints("Sam", -5);
    expect(store.getLeaderboard()).toEqual([]);
  });

  it("tracks points on today's date key", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0)); // Jul 25, 2026 local

    const store = createLocalScoreStore(storage);
    store.addPoints("Sam", 10);
    store.addPoints("Sam", 5);

    expect(store.getPoints("Sam")).toBe(15);
    expect(store.getDailyPoints("Sam")).toEqual({ "2026-07-25": 15 });
    expect(store.getMonthTotal("Sam", 2026, 7)).toBe(15);
    expect(store.getMonthTotal("Sam", 2026, 6)).toBe(0);

    vi.useRealTimers();
  });

  it("leaves legacy entries without dailyPoints readable", () => {
    storage.setItem(
      "spellquest:leaderboard",
      JSON.stringify([{ nickname: "Sam", totalPoints: 40 }]),
    );
    const store = createLocalScoreStore(storage);
    expect(store.getPoints("Sam")).toBe(40);
    expect(store.getDailyPoints("Sam")).toEqual({});
    expect(store.getMonthTotal("Sam", 2026, 7)).toBe(0);
  });

  it("resetPoints removes only the matching nickname", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 25, 12, 0, 0));

    const store = createLocalScoreStore(storage);
    store.addPoints("Sam", 10);
    store.addPoints("Alex", 20);
    store.resetPoints("sam");

    expect(store.getPoints("Sam")).toBe(0);
    expect(store.getDailyPoints("Sam")).toEqual({});
    expect(store.getLeaderboard()).toEqual([
      {
        nickname: "Alex",
        totalPoints: 20,
        dailyPoints: { "2026-07-25": 20 },
      },
    ]);

    vi.useRealTimers();
  });

  it("resetPoints is a no-op for unknown nickname", () => {
    const store = createLocalScoreStore(storage);
    store.addPoints("Alex", 5);
    store.resetPoints("Sam");
    expect(store.getPoints("Alex")).toBe(5);
  });
});
