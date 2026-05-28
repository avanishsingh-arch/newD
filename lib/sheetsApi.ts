import type { Ticket } from "./types";
import { parseSheetDate } from "./workingHours";

/**
 * Sheet column mapping (0-indexed):
 * 0  → # (ticket id)
 * 1  → Type
 * 2  → Status
 * 3  → Channel
 * 4  → Client
 * 5  → Employee (agent)
 * 6  → Created on       "DD.MM.YYYY HH:MM:SS"
 * 7  → Agent closed on  "DD.MM.YYYY HH:MM:SS"
 * 8  → Initial response time (seconds)
 * 9  → Total response time (seconds)
 * 10 → Average response time (seconds)
 * 11 → Maximum response time (seconds)
 */
function parseRow(r: string[]): Ticket {
  const createdOn  = parseSheetDate(r[6]);
  const closedOn   = parseSheetDate(r[8]);

  const initialSec = parseInt(r[9])  || 0;
  const totalSec   = parseInt(r[10]) || 0;

  return {
    id:                   r[0] || "—",
    type:                 r[1] || "—",
    status:               r[2] || "—",
    channel:              r[3] || "Unknown",
    client:               r[4] || "—",
    agent:                r[5] || "Unknown",
    createdOn,
    closedOn,
    initialResponseTime:  initialSec,
    totalResponseTime:    totalSec,
    avgResponseTime:      0,
    maxResponseTime:      0,
    workingResolutionMin: Math.round(initialSec / 60),
    totalResponseMin:     Math.round(totalSec   / 60),
  };
}

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch("/api/tickets", { cache: "no-store" });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows: string[][] = json.values || [];

  return rows
    .filter((r) => r[0] && r[0].toString().trim() !== "")
    .map(parseRow);
}