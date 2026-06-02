import type { CallRow } from "./callTypes";

/** Extract agent name before "_" e.g. "Pankaj_rnjp" → "Pankaj" */
export function extractAgentName(raw: string): string {
  if (!raw || raw.trim() === "") return "Unknown";
  const parts = raw.trim().split("_");
  return parts[0].trim();
}

/** Parse date from "DD/MM/YYYY HH:MM:SS" or "YYYY-MM-DD HH:MM:SS" or ISO */
function parseCallDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim();

  // DD-MM-YYYY, HH:MM:SS  ← your format
  const m0 = s.match(/^(\d{2})-(\d{2})-(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m0) return new Date(+m0[3], +m0[2] - 1, +m0[1], +m0[4], +m0[5], +m0[6]);

  // DD/MM/YYYY HH:MM:SS
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1], +m1[4], +m1[5], +m1[6]);

  // YYYY-MM-DD HH:MM:SS
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3], +m2[4], +m2[5], +m2[6]);

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse raw sheet rows into CallRow[] */
export function parseCallRows(rows: Record<string, string>[]): CallRow[] {
  return rows
    .filter((r) => r["Sl No"] || r["Date & Time"])
    .map((r) => {
      const direction = r["Direction"]?.trim();
      const isIncoming = direction === "Incoming" || direction === "Incoming - Call back";
      const isOutgoing = direction === "Outgoing";

      const dirNorm: CallRow["direction"] = isIncoming ? "Incoming" : isOutgoing ? "Outgoing" : "Unknown";

      // Agent name: Source Name for outgoing, Destination Name for incoming
      const rawAgent = isOutgoing ? r["Source Name"] : r["Destination Name"];
      const agentName = extractAgentName(rawAgent ?? "");

      const status = r["Status"]?.trim().toUpperCase();

      return {
        slNo:            r["Sl No"] ?? "",
        dateTime:        parseCallDate(r["Date & Time"] ?? ""),
        source:          r["Source"] ?? "",
        sourceName:      r["Source Name"] ?? "",
        destination:     r["Destination"] ?? "",
        destinationName: r["Destination Name"] ?? "",
        direction:       dirNorm,
        did:             r["DID"] ?? "",
        callType:        r["Call Type"] ?? "",
        department:      r["Department Name"] ?? "",
        campaign:        r["Campaign Name"] ?? "",
        status:          status === "ANSWERED" ? "ANSWERED" : status === "NOANSWER" ? "NOANSWER" : "OTHER",
        callDuration:    parseInt(r["Call Duration"] ?? "0") || 0,
        totalDuration:   parseInt(r["Total Duration"] ?? "0") || 0,
        rating:          r["Rating"] ?? "",
        comment:         r["Comment"] ?? "",
        tag:             r["Tag"] ?? "",
        disconnectedBy:  r["Disconnected By"] ?? "",
        agentName,
      } satisfies CallRow;
    });
}

/** Filter calls by date range */
export function filterCallsByRange(calls: CallRow[], from: string, to: string): CallRow[] {
  if (!from || !to) return calls;
  const f = new Date(from); f.setHours(0, 0, 0, 0);
  const t = new Date(to);   t.setHours(23, 59, 59, 999);
  return calls.filter((c) => c.dateTime && c.dateTime >= f && c.dateTime <= t);
}

/** Aggregate per agent */
export function aggregateByAgent(calls: CallRow[]) {
  const map: Record<string, { agent: string; incoming: number; outgoing: number; answered: number; notAnswered: number }> = {};

  calls.forEach((c) => {
    if (c.direction === "Incoming") {
      const a = c.agentName;
      if (!map[a]) map[a] = { agent: a, incoming: 0, outgoing: 0, answered: 0, notAnswered: 0 };
      map[a].incoming++;
      if (c.status === "ANSWERED") map[a].answered++;
      if (c.status === "NOANSWER") map[a].notAnswered++;
    }
  });

  return Object.values(map)
    .map((a) => ({ ...a, total: a.incoming }))
    .sort((a, b) => b.incoming - a.incoming);
}

/** Daily trend data */
export function callsDailyTrend(calls: CallRow[], days: number) {
  const now   = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    keys.push(d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }));
  }

  const map: Record<string, { date: string; incoming: number; outgoing: number; answered: number; notAnswered: number }> = {};
  keys.forEach((k) => { map[k] = { date: k, incoming: 0, outgoing: 0, answered: 0, notAnswered: 0 }; });

  calls.forEach((c) => {
    if (!c.dateTime) return;
    const key = c.dateTime.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (!map[key]) return;
    if (c.direction === "Incoming") {
      map[key].incoming++;
      if (c.status === "ANSWERED") map[key].answered++;
      if (c.status === "NOANSWER") map[key].notAnswered++;
    }
    if (c.direction === "Outgoing") map[key].outgoing++;
  });

  return Object.values(map);
}