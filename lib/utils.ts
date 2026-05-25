import type { Ticket } from "./types";

export const CHANNEL_COLORS: Record<string, string> = {
  "WhatsApp Business API Gupshup": "#25D366",
  "WhatsApp": "#25D366",
  "Email": "#3266ad",
  "Live Chat": "#9b4dca",
  "Phone": "#e07b39",
  "Instagram": "#C13584",
  "Twitter": "#1DA1F2",
  "Facebook": "#1877F2",
};

export const CHART_COLORS = [
  "#3266ad", "#e07b39", "#2d9c6b", "#9b4dca",
  "#d94f4f", "#4ab8c1", "#c49a2b", "#7a7a7a",
];

export function channelColor(ch: string): string {
  return CHANNEL_COLORS[ch] ?? "#7a7a7a";
}

export function shortChannelName(ch: string): string {
  return ch.replace("WhatsApp Business API Gupshup", "WhatsApp (Gupshup)");
}

/** Returns a Date set to midnight N days ago */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterByDays(tickets: Ticket[], days: number): Ticket[] {
  const cutoff = daysAgo(days);
  return tickets.filter((t) => t.createdOn && t.createdOn >= cutoff);
}

export function isResolved(t: Ticket): boolean {
  const s = (t.status || "").toLowerCase();
  return s.includes("closed") || s.includes("resolved");
}

// ── Period filtering ──────────────────────────────────────────────────────
export type Period = "week" | "month" | "year";

export function filterByPeriod(tickets: Ticket[], period: Period): Ticket[] {
  const now = new Date();
  let cutoff: Date;
  if (period === "week") {
    cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); cutoff.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  } else {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }
  return tickets.filter((t) => t.createdOn && t.createdOn >= cutoff);
}

export function getPeriodKeys(period: Period): string[] {
  const now = new Date();
  const keys: string[] = [];
  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      keys.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
    }
  }
  return keys;
}

export function getTicketKey(date: Date, period: Period): string {
  if (period === "week") return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
