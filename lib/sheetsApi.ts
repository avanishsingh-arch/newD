import type { Ticket } from "./types";
import { parseSheetDate, workingMinutesBetween } from "./workingHours";

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
 * 8  → Initial response time
 * 9  → Total response time
 * 10 → Average response time
 * 11 → Maximum response time
 */
function parseRow(r: string[]): Ticket {
  const createdOn = parseSheetDate(r[6]);
  const closedOn  = parseSheetDate(r[7]);
  return {
    id:                   r[0] || "—",
    type:                 r[1] || "—",
    status:               r[2] || "—",
    channel:              r[3] || "Unknown",
    client:               r[4] || "—",
    agent:                r[5] || "Unknown",
    createdOn,
    closedOn,
    initialResponseTime:  parseInt(r[8])  || 0,
    totalResponseTime:    parseInt(r[9])  || 0,
    avgResponseTime:      parseInt(r[10]) || 0,
    maxResponseTime:      parseInt(r[11]) || 0,
    workingResolutionMin: workingMinutesBetween(createdOn, closedOn),
  };
}

/**
 * Fetches tickets from our internal API route (/api/tickets),
 * which authenticates server-side using GOOGLE_CREDENTIALS_JSON.
 */
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
