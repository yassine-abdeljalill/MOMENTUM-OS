import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToIso,
  formatHourSlot,
  formatTimeCompact,
  getCurrentTimeLinePercentage,
  getFullMonthMatrix,
  getMonthGridCells,
  getTimeBlockGeometry,
  getWeekDays,
  layoutOverlappingBlocks,
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

  it('builds a complete 7-column rectangular month matrix with overflow days', () => {
    const matrix = getFullMonthMatrix(2026, 10, 'monday'); // Nov 2026 starts on Sunday
    assert.equal(matrix.length % 7, 0);
    assert.equal(matrix.length, 42);
    assert.equal(matrix[0].dateStr, '2026-10-26');
    assert.equal(matrix[0].inCurrentMonth, false);
    assert.equal(matrix[6].dateStr, '2026-11-01');
    assert.equal(matrix[6].inCurrentMonth, true);
    assert.equal(matrix[35].dateStr, '2026-11-30');
    assert.equal(matrix[35].inCurrentMonth, true);
    assert.equal(matrix[41].dateStr, '2026-12-06');
    assert.equal(matrix[41].inCurrentMonth, false);
  });

  it('parses valid HH:mm time strings and formats hour labels', () => {
    assert.equal(parseTimeToMinutes('09:30'), 570);
    assert.equal(parseTimeToMinutes('invalid'), null);
    assert.equal(formatHourSlot(14, '24h'), '14:00');
    assert.equal(formatHourSlot(14, '12h'), '2 PM');
    assert.equal(formatHourSlot(0, '12h'), '12 AM');
    assert.equal(formatTimeCompact('09:00', '12h'), '9 AM');
    assert.equal(formatTimeCompact('09:30', '12h'), '9:30 AM');
    assert.equal(formatTimeCompact('09:30', '24h'), '09:30');
  });

  it('computes accurate time block percentages and current time line indicator', () => {
    const block = getTimeBlockGeometry('09:00', '11:00', 6, 23); // 17-hour span; 09:00 is +3h (3/17), dur 2h (2/17)
    assert.ok(Math.abs(block.topPct - (3 / 17) * 100) < 0.05);
    assert.ok(Math.abs(block.heightPct - (2 / 17) * 100) < 0.05);

    const noon = new Date(2026, 10, 22, 14, 30, 0); // 8.5h after 06:00 -> 50%
    const linePct = getCurrentTimeLinePercentage(noon, 6, 23);
    assert.ok(linePct !== null && Math.abs(linePct - 50) < 0.05);

    const earlyMorning = new Date(2026, 10, 22, 4, 0, 0);
    assert.equal(getCurrentTimeLinePercentage(earlyMorning, 6, 23), null);
  });

  it('lays out overlapping schedule blocks into side-by-side lanes without collision', () => {
    const arranged = layoutOverlappingBlocks([
      { id: 'a', startTime: '09:00', endTime: '11:00' },
      { id: 'b', startTime: '09:00', endTime: '10:00' },
      { id: 'c', startTime: '10:00', endTime: '10:45' },
      { id: 'd', startTime: '14:00', endTime: '15:00' },
    ]);
    assert.equal(arranged.length, 4);

    const a = arranged.find(x => x.item.id === 'a')!;
    const b = arranged.find(x => x.item.id === 'b')!;
    const c = arranged.find(x => x.item.id === 'c')!;
    const d = arranged.find(x => x.item.id === 'd')!;

    assert.equal(a.totalLanes, 2);
    assert.equal(b.totalLanes, 2);
    assert.notEqual(a.lane, b.lane);
    // 'c' starts at 10:00 when 'b' ends, so it reuses lane 1 cleanly
    assert.equal(c.lane, b.lane);
    assert.equal(c.totalLanes, 2);
    // 'd' is in its own isolated cluster -> full single lane
    assert.equal(d.lane, 0);
    assert.equal(d.totalLanes, 1);
  });
});
