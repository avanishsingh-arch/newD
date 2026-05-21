/**
 * Working hours: 10:00 AM – 10:00 PM (22:00) daily.
 * This module computes resolution time excluding non-working hours.
 */

export const WORK_START_HOUR = 10; // 10:00 AM
export const WORK_END_HOUR   = 22; // 10:00 PM

/**
 * Parse a date string in the format "DD.MM.YYYY HH:MM:SS"
 * as used by the Google Sheet export.
 */
export function parseSheetDate(str: string | undefined | null): Date | null {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  const [datePart, timePart] = trimmed.split(" ");
  if (!datePart) return null;
  const [dd, mm, yyyy] = datePart.split(".");
  const [hh, mi, ss] = (timePart || "00:00:00").split(":");
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh   || "0"),
    parseInt(mi   || "0"),
    parseInt(ss   || "0")
  );
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute working minutes between two Date objects.
 * Only minutes within the WORK_START_HOUR–WORK_END_HOUR window count.
 * Non-working hours, nights, and weekends are all excluded.
 *
 * Note: weekends ARE currently included in working hours per the
 * client spec (agents work 7 days). Remove the weekend check below
 * if needed.
 */
export function workingMinutesBetween(
  start: Date | null,
  end:   Date | null
): number {
  if (!start || !end || end <= start) return 0;

  let total   = 0;
  let cursor  = new Date(start);

  // Move cursor into working window if it starts before work hours
  const ensureWorkStart = (d: Date) => {
    const h = d.getHours() * 60 + d.getMinutes();
    const workStartMin = WORK_START_HOUR * 60;
    if (h < workStartMin) {
      d.setHours(WORK_START_HOUR, 0, 0, 0);
    }
    return d;
  };

  ensureWorkStart(cursor);

  while (cursor < end) {
    const dayStart = new Date(cursor);
    dayStart.setHours(WORK_START_HOUR, 0, 0, 0);

    const dayEnd = new Date(cursor);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    const segStart = cursor < dayStart ? dayStart : cursor;
    const segEnd   = end   < dayEnd   ? end       : dayEnd;

    if (segStart < segEnd && segStart < dayEnd && segEnd > dayStart) {
      total += (segEnd.getTime() - segStart.getTime()) / 60000;
    }

    // Advance to next day at WORK_START_HOUR
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(WORK_START_HOUR, 0, 0, 0);
  }

  return Math.round(total);
}

/**
 * Format minutes into a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45m", 0 → "0m"
 */
export function formatMinutes(min: number | null | undefined): string {
  if (min == null || isNaN(min)) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
