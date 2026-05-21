import type { Ticket } from "./types";

export const CHANNEL_COLORS: Record<string, string> = {
  "WhatsApp Business API Gupshup": "#25D366",
  "WhatsApp":                      "#25D366",
  "Email":                         "#3266ad",
  "Live Chat":                     "#9b4dca",
  "Phone":                         "#e07b39",
  "Instagram":                     "#C13584",
  "Twitter":                       "#1DA1F2",
  "Facebook":                      "#1877F2",
};

export const CHART_COLORS = [
  "#3266ad","#e07b39","#2d9c6b","#9b4dca",
  "#d94f4f","#4ab8c1","#c49a2b","#7a7a7a",
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
