import { describe, expect, it } from "vitest";
import { buildMonthGrid, formatDateKey, sumMonthPoints } from "./calendar";

describe("calendar", () => {
  it("formats local date keys", () => {
    expect(formatDateKey(new Date(2026, 6, 25))).toBe("2026-07-25");
  });

  it("builds a Sunday-first July 2026 grid with points", () => {
    // July 1, 2026 is Wednesday → 3 leading blanks
    const grid = buildMonthGrid(
      2026,
      7,
      { "2026-07-25": 12, "2026-07-01": 3 },
      "2026-07-25",
    );

    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 3).every((c) => !c.inMonth)).toBe(true);

    const first = grid[3];
    expect(first).toMatchObject({
      dateKey: "2026-07-01",
      day: 1,
      points: 3,
      inMonth: true,
      isToday: false,
    });

    const today = grid.find((c) => c.dateKey === "2026-07-25");
    expect(today).toMatchObject({
      day: 25,
      points: 12,
      inMonth: true,
      isToday: true,
    });
  });

  it("sums month points", () => {
    expect(
      sumMonthPoints(2026, 7, {
        "2026-07-01": 3,
        "2026-07-25": 12,
        "2026-06-30": 99,
      }),
    ).toBe(15);
  });
});
