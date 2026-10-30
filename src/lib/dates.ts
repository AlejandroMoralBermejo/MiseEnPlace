export type ViewMode = 'week' | 'month';

// Built from local parts: toISOString() converts to UTC and returns the previous day in Spain.
export function formatDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getWeekDays(date: Date): Date[] {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return Array.from(
    { length: 7 },
    (_, i) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday + i)
  );
}

export function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const blanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: total }, (_, i) => new Date(year, month, i + 1)),
  ];
}

export function getVisibleRange(date: Date, mode: ViewMode): { start: string; end: string } {
  if (mode === 'week') {
    const days = getWeekDays(date);
    return { start: formatDateKey(days[0]), end: formatDateKey(days[6]) };
  }
  return {
    start: formatDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: formatDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

// Clamps to the target month's last day: setMonth() would turn Jan 31 + 1 into March.
export function shiftMonth(date: Date, delta: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + delta;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}
