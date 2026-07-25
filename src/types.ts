export type WordEntry = { word: string; clue: string };

export type WordList = { id: string; name: string; words: WordEntry[] };

export type LeaderboardEntry = {
  nickname: string;
  totalPoints: number;
  dailyPoints?: Record<string, number>;
};

export type PracticeMode = "meaning" | "scramble";

export type AppView =
  | "welcome"
  | "home"
  | "practice"
  | "import"
  | "leaderboard"
  | "daily-points"
  | "settings";

export type ScoreStore = {
  getLeaderboard: () => LeaderboardEntry[];
  addPoints: (nickname: string, points: number) => void;
  getPoints: (nickname: string) => number;
  getDailyPoints: (nickname: string) => Record<string, number>;
  getMonthTotal: (nickname: string, year: number, month: number) => number;
  resetPoints: (nickname: string) => void;
};
