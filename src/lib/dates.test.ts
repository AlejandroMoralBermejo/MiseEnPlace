import { describe, expect, it } from 'vitest';
import { formatDateKey, getMonthDays, getVisibleRange, getWeekDays, shiftMonth } from './dates';

describe('formatDateKey', () => {
  it('keeps the local day at local midnight', () => {
    expect(formatDateKey(new Date(2026, 9, 15))).toBe('2026-10-15');
  });

  it('pads month and day', () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('getWeekDays', () => {
  it('runs from Monday to Sunday', () => {
    const keys = getWeekDays(new Date(2026, 9, 30)).map(formatDateKey);
    expect(keys[0]).toBe('2026-10-26');
    expect(keys[6]).toBe('2026-11-01');
  });

  it('keeps a Sunday in the week that just ended', () => {
    expect(formatDateKey(getWeekDays(new Date(2026, 10, 1))[0])).toBe('2026-10-26');
  });
});

describe('getMonthDays', () => {
  it('pads leading blanks for a Monday-first grid', () => {
    const days = getMonthDays(new Date(2026, 9, 15));
    expect(days.slice(0, 3)).toEqual([null, null, null]);
    expect(formatDateKey(days[3] as Date)).toBe('2026-10-01');
  });

  it('pads six blanks when the month starts on Sunday', () => {
    const days = getMonthDays(new Date(2026, 10, 15));
    expect(days.filter((d) => d === null)).toHaveLength(6);
  });
});

describe('getVisibleRange', () => {
  it('covers the whole month, including its last day', () => {
    expect(getVisibleRange(new Date(2026, 9, 15), 'month')).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
  });

  it('covers the Monday-to-Sunday week', () => {
    expect(getVisibleRange(new Date(2026, 9, 30), 'week')).toEqual({
      start: '2026-10-26',
      end: '2026-11-01',
    });
  });
});

describe('shiftMonth', () => {
  it('does not skip February from January 31', () => {
    expect(formatDateKey(shiftMonth(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
  });

  it('crosses the year backwards', () => {
    expect(formatDateKey(shiftMonth(new Date(2026, 0, 15), -1))).toBe('2025-12-15');
  });
});
