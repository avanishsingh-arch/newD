export interface EmailRow {
  threadId:     string;
  subject:      string;
  sender:       string;
  senderEmail:  string;
  receivedAt:   Date | null;
  firstReplyAt: Date | null;
  irtMinutes:   number | null;
  date:         string;
  status:       "Replied" | "Pending";
}

/** Parse DD/MM/YYYY or similar date strings */
function parseEmailDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim();

  // DD/MM/YYYY HH:MM:SS or DD/MM/YYYY
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1], +(m1[4]||0), +(m1[5]||0), +(m1[6]||0));

  // ISO or other
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse raw sheet rows into EmailRow[] */
export function parseEmailRows(rows: Record<string, string>[]): EmailRow[] {
  return rows
    .filter((r) => r["Thread ID"] && r["Thread ID"].trim() !== "")
    .map((r) => ({
      threadId:     r["Thread ID"]    ?? "",
      subject:      r["Subject"]      ?? "",
      sender:       r["Sender"]       ?? "",
      senderEmail:  r["Sender Email"] ?? "",
      receivedAt:   parseEmailDate(r["Received At"]    ?? ""),
      firstReplyAt: parseEmailDate(r["First Reply At"] ?? ""),
      irtMinutes:   r["IRT (minutes)"] ? parseFloat(r["IRT (minutes)"]) : null,
      date:         r["Date"]         ?? "",
      status:       r["Status"] === "Replied" ? "Replied" : "Pending",
    }));
}

/** Filter by date range */
export function filterEmailsByRange(emails: EmailRow[], from: string, to: string): EmailRow[] {
  if (!from || !to) return emails;
  const f = new Date(from); f.setHours(0, 0, 0, 0);
  const t = new Date(to);   t.setHours(23, 59, 59, 999);
  return emails.filter((e) => e.receivedAt && e.receivedAt >= f && e.receivedAt <= t);
}

export type EmailPeriod = "week" | "month" | "year";

function getKey(date: Date, period: EmailPeriod): string {
  if (period === "week") {
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  if (period === "month") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  }
  // year → group by year only
  return String(date.getFullYear());
}

function getPeriodKeys(period: EmailPeriod): string[] {
  const now  = new Date();
  const keys: string[] = [];
  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      keys.push(getKey(d, period));
    }
  } else if (period === "month") {
    // last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(getKey(d, period));
    }
  } else {
    // last 5 years
    for (let i = 4; i >= 0; i--) {
      keys.push(String(now.getFullYear() - i));
    }
  }
  return keys;
}

export interface EmailTrendPoint {
  date:        string;
  total:       number;
  replied:     number;
  pending:     number;
  avgIRT:      number;
  irtValues:   number[];
}

/** Compute trend data grouped by period */
export function emailTrendData(emails: EmailRow[], period: EmailPeriod): EmailTrendPoint[] {
  const keys = getPeriodKeys(period);
  const map: Record<string, EmailTrendPoint> = {};
  keys.forEach((k) => { map[k] = { date: k, total: 0, replied: 0, pending: 0, avgIRT: 0, irtValues: [] }; });

  emails.forEach((e) => {
    if (!e.receivedAt) return;
    const k = getKey(e.receivedAt, period);
    if (!map[k]) return;
    map[k].total++;
    if (e.status === "Replied") {
      map[k].replied++;
      if (e.irtMinutes != null && e.irtMinutes > 0) map[k].irtValues.push(e.irtMinutes);
    } else {
      map[k].pending++;
    }
  });

  return Object.values(map).map((d) => ({
    ...d,
    avgIRT: d.irtValues.length > 0
      ? Math.round(d.irtValues.reduce((a, b) => a + b, 0) / d.irtValues.length)
      : 0,
  }));
}

/** Format minutes → human readable */
export function fmtMin(min: number | null | undefined): string {
  if (min == null || isNaN(min) || min === 0) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}