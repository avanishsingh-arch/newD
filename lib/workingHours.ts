/**
 * Utility functions for response time formatting and statistics.
 * Resolution time is taken directly from the "Initial response time"
 * column in the sheet (seconds), converted to minutes.
 */

/**
 * Parse a date string in the format "DD.MM.YYYY HH:MM:SS"
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
    parseInt(hh || "0"),
    parseInt(mi || "0"),
    parseInt(ss || "0")
  );
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format minutes into a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45m"
 */
export function formatMinutes(min: number | null | undefined): string {
  if (min == null || isNaN(min)) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Compute the median of an array of numbers.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
