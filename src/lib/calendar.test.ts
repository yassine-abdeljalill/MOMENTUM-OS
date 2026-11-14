import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToIso,
  formatHourSlot,
  getMonthGridCells,
  getWeekDays,
  parseTimeToMinutes,
} from './calendar.ts';

describe('calendar helpers', () => {
  it('computes Monday-first week days correctly across month boundaries', () => {
    const week = getWeekDays('2026-11-01', 'monday'); // Sunday Nov 1, 2026
    assert.equal(week.length, 7);
    assert.equal(week[0], '2026-10-26');
    assert.equal(week[6], '2026-11-01');
  });

  it('computes Sunday-first week days correctly', () => {
    const week = getWeekDays('2026-11-14', 'sunday'); // Saturday Nov 14, 2026
    assert.equal(week[0], '2026-11-08');
    assert.equal(week[6], '2026-11-14');
  });

  it('shifts ISO dates reliably', () => {
    assert.equal(addDaysToIso('2026-11-14', 7), '2026-11-21');
    assert.equal(addDaysToIso('2026-11-01', -1), '2026-10-31');
  });

  it('computes month grid leading offset and dates', () => {
    const nov2026 = getMonthGridCells(2026, 10, 'monday'); // Nov 1 2026 is Sunday
    assert.equal(nov2026.leadingEmpty, 6);
    assert.equal(nov2026.dates.length, 30);
    assert.equal(nov2026.dates[0], '2026-11-01');
    assert.equal(nov2026.dates[29], '2026-11-30');
  });

  it('parses valid HH:mm time strings and formats hour labels', () => {
    assert.equal(parseTimeToMinutes('09:30'), 570);
    assert.equal(parseTimeToMinutes('invalid'), null);
    assert.equal(formatHourSlot(14, '24h'), '14:00');
    assert.equal(formatHourSlot(14, '12h'), '2 PM');
    assert.equal(formatHourSlot(0, '12h'), '12 AM');
  });
});
