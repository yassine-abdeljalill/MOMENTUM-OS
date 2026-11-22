export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysToIso(isoDate: string, days: number): string {
  const dt = parseIsoDate(isoDate);
  dt.setDate(dt.getDate() + days);
  return formatIsoDate(dt);
}

export function getWeekDays(
  anchorIsoDate: string,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): string[] {
  const anchor = parseIsoDate(anchorIsoDate);
  const dow = anchor.getDay(); // 0 = Sun, 1 = Mon, ...
  const offset =
    startOfWeek === 'monday'
      ? dow === 0
        ? -6
        : 1 - dow
      : -dow;
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + offset);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(formatIsoDate(d));
  }
  return days;
}

export function getMonthGridCells(
  year: number,
  monthZeroIndexed: number,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): { leadingEmpty: number; dates: string[] } {
  const firstDayDow = new Date(year, monthZeroIndexed, 1).getDay();
  const leadingEmpty =
    startOfWeek === 'monday'
      ? firstDayDow === 0
        ? 6
        : firstDayDow - 1
      : firstDayDow;
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(
      `${year}-${String(monthZeroIndexed + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  return { leadingEmpty, dates };
}

export interface CalendarMonthCell {
  dateStr: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

/**
 * Generates a complete rectangular 5-row or 6-row Apple Calendar month matrix
 * including muted overflow days from adjacent months.
 */
export function getFullMonthMatrix(
  year: number,
  monthZeroIndexed: number,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): CalendarMonthCell[] {
  const { leadingEmpty, dates } = getMonthGridCells(year, monthZeroIndexed, startOfWeek);
  const cells: CalendarMonthCell[] = [];

  if (dates.length === 0) return cells;

  const firstMonthDate = dates[0];
  for (let i = leadingEmpty; i > 0; i--) {
    const dateStr = addDaysToIso(firstMonthDate, -i);
    cells.push({
      dateStr,
      dayNumber: Number(dateStr.split('-')[2]),
      inCurrentMonth: false,
    });
  }

  for (const dateStr of dates) {
    cells.push({
      dateStr,
      dayNumber: Number(dateStr.split('-')[2]),
      inCurrentMonth: true,
    });
  }

  const totalNeeded = Math.ceil(cells.length / 7) * 7;
  const trailingCount = totalNeeded - cells.length;
  const lastMonthDate = dates[dates.length - 1];
  for (let i = 1; i <= trailingCount; i++) {
    const dateStr = addDaysToIso(lastMonthDate, i);
    cells.push({
      dateStr,
      dayNumber: Number(dateStr.split('-')[2]),
      inCurrentMonth: false,
    });
  }

  return cells;
}

export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

export function formatHourSlot(hour: number, timeFormat: '12h' | '24h' = '24h'): string {
  if (timeFormat === '12h') {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12} ${suffix}`;
  }
  return `${String(hour).padStart(2, '0')}:00`;
}

export function formatTimeCompact(
  timeStr: string,
  timeFormat: '12h' | '24h' = '24h'
): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (timeFormat === '24h') {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export interface TimeBlockGeometry {
  topPct: number;
  heightPct: number;
}

/**
 * Computes percentage vertical geometry for a timed calendar block
 * inside a [dayStartHour, dayEndHourExclusive) hourly canvas.
 */
export function getTimeBlockGeometry(
  startTime: string,
  endTime: string,
  dayStartHour: number = 6,
  dayEndHourExclusive: number = 23
): TimeBlockGeometry {
  const windowStartMins = dayStartHour * 60;
  const windowEndMins = dayEndHourExclusive * 60;
  const totalWindowMins = Math.max(60, windowEndMins - windowStartMins);

  const parsedStart = parseTimeToMinutes(startTime);
  const parsedEnd = parseTimeToMinutes(endTime);
  const rawStart = parsedStart ?? windowStartMins;
  const rawEnd = parsedEnd !== null && parsedEnd > rawStart ? parsedEnd : rawStart + 60;

  const clampedStart = Math.max(windowStartMins, Math.min(windowEndMins - 30, rawStart));
  const clampedEnd = Math.max(clampedStart + 30, Math.min(windowEndMins, rawEnd));

  const topPct = ((clampedStart - windowStartMins) / totalWindowMins) * 100;
  const rawHeightPct = ((clampedEnd - clampedStart) / totalWindowMins) * 100;
  const heightPct = Math.max(4.4, Math.min(100 - topPct, rawHeightPct));

  return {
    topPct: Number(topPct.toFixed(3)),
    heightPct: Number(heightPct.toFixed(3)),
  };
}

export function getCurrentTimeLinePercentage(
  now: Date,
  dayStartHour: number = 6,
  dayEndHourExclusive: number = 23
): number | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  const windowStartMins = dayStartHour * 60;
  const windowEndMins = dayEndHourExclusive * 60;
  if (mins < windowStartMins || mins > windowEndMins) return null;
  return Number((((mins - windowStartMins) / (windowEndMins - windowStartMins)) * 100).toFixed(3));
}

export interface PositionedTimeBlock<T> {
  item: T;
  topPct: number;
  heightPct: number;
  lane: number;
  totalLanes: number;
}

/**
 * Arranges overlapping timed calendar blocks into side-by-side horizontal lanes
 * (matching macOS / iPadOS Apple Calendar collision layout).
 */
export function layoutOverlappingBlocks<
  T extends { id: string; startTime: string; endTime: string }
>(
  blocks: T[],
  dayStartHour: number = 6,
  dayEndHourExclusive: number = 23
): PositionedTimeBlock<T>[] {
  if (blocks.length === 0) return [];

  const normalized = blocks
    .map(item => {
      const s = parseTimeToMinutes(item.startTime) ?? dayStartHour * 60;
      const eRaw = parseTimeToMinutes(item.endTime);
      const e = eRaw !== null && eRaw > s ? eRaw : s + 60;
      return { item, startMins: s, endMins: e };
    })
    .sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins);

  const clusters: (typeof normalized)[] = [];
  let currentCluster: typeof normalized = [];
  let clusterEnd = -1;

  for (const entry of normalized) {
    if (currentCluster.length === 0 || entry.startMins < clusterEnd) {
      currentCluster.push(entry);
      clusterEnd = Math.max(clusterEnd, entry.endMins);
    } else {
      clusters.push(currentCluster);
      currentCluster = [entry];
      clusterEnd = entry.endMins;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedTimeBlock<T>[] = [];

  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const assigned: { entry: (typeof normalized)[number]; lane: number }[] = [];

    for (const entry of cluster) {
      let laneIndex = laneEnds.findIndex(endTime => endTime <= entry.startMins);
      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(entry.endMins);
      } else {
        laneEnds[laneIndex] = entry.endMins;
      }
      assigned.push({ entry, lane: laneIndex });
    }

    const totalLanes = Math.max(1, laneEnds.length);
    for (const { entry, lane } of assigned) {
      const geom = getTimeBlockGeometry(
        entry.item.startTime,
        entry.item.endTime,
        dayStartHour,
        dayEndHourExclusive
      );
      results.push({
        item: entry.item,
        topPct: geom.topPct,
        heightPct: geom.heightPct,
        lane,
        totalLanes,
      });
    }
  }

  return results;
}

