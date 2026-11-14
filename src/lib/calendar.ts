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
