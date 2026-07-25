export type CalendarCell = {
  dateKey: string | null;
  day: number | null;
  points: number;
  inMonth: boolean;
  isToday: boolean;
};

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumMonthPoints(
  year: number,
  month: number,
  dailyPoints: Record<string, number>,
): number {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  let total = 0;
  for (const [key, value] of Object.entries(dailyPoints)) {
    if (key.startsWith(prefix)) total += value;
  }
  return total;
}

export function buildMonthGrid(
  year: number,
  month: number,
  dailyPoints: Record<string, number>,
  todayKey: string,
): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = first.getDay(); // 0 = Sunday

  const cells: CalendarCell[] = [];

  for (let i = 0; i < leading; i++) {
    cells.push({
      dateKey: null,
      day: null,
      points: 0,
      inMonth: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      dateKey,
      day,
      points: dailyPoints[dateKey] ?? 0,
      inMonth: true,
      isToday: dateKey === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      dateKey: null,
      day: null,
      points: 0,
      inMonth: false,
      isToday: false,
    });
  }

  return cells;
}
