"use client";

import React, { useMemo, useState } from "react";
import type { Ticket, AgentStats } from "@/lib/types";
import { formatMinutes, median } from "@/lib/workingHours";
import { isResolved, filterByPeriod } from "@/lib/utils";
import PeriodToggle, { type Period } from "./PeriodT";

type SortKey = "total" | "resolved" | "resRate" | "avgRes";

export default function AgentTable({ tickets }: { tickets: Ticket[] }) {
  const [period, setPeriod] = useState<Period>("week");
  const [sortBy, setSortBy] = useState<SortKey>("total");

  const filtered = useMemo(() => filterByPeriod(tickets, period), [tickets, period]);

  const agents: AgentStats[] = useMemo(() => {
    const map: Record<string, AgentStats> = {};
    const mins: Record<string, number[]> = {};

    filtered.forEach((t) => {
      if (!map[t.agent]) {
        map[t.agent] = { agent: t.agent, total: 0, resolved: 0, sumRes: 0, avgRes: null };
        mins[t.agent] = [];
      }
      map[t.agent].total++;
      if (isResolved(t)) {
        map[t.agent].resolved++;
        map[t.agent].sumRes += t.workingResolutionMin;
        if (t.workingResolutionMin > 0) mins[t.agent].push(t.workingResolutionMin);
      }
    });

    return Object.values(map).map((a) => ({
      ...a,
      avgRes: mins[a.agent]?.length > 0 ? median(mins[a.agent]) : null,
    }));
  }, [filtered]);

  const sorted = useMemo(() => [...agents].sort((a, b) => {
    switch (sortBy) {
      case "total": return b.total - a.total;
      case "resolved": return b.resolved - a.resolved;
      case "resRate": return (b.resolved / b.total) - (a.resolved / a.total);
      case "avgRes": return (a.avgRes ?? Infinity) - (b.avgRes ?? Infinity);
      default: return 0;
    }
  }), [agents, sortBy]);

  const maxTickets = Math.max(...agents.map((a) => a.total), 1);

  const th = (key: SortKey): React.CSSProperties => ({
    padding: "8px 14px", textAlign: "left", fontWeight: 600, fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
    cursor: "pointer", userSelect: "none", borderBottom: "1px solid var(--border)",
    color: sortBy === key ? "var(--text-primary)" : "var(--text-muted)",
    background: sortBy === key ? "#f0f4ff" : "transparent",
  });

  const badge = (rate: number) => {
    const bg = rate >= 0.8 ? "#e6f4ec" : rate >= 0.5 ? "#fef3e2" : "#fde8e8";
    const color = rate >= 0.8 ? "#2d9c6b" : rate >= 0.5 ? "#c49a2b" : "#d94f4f";
    return (
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>
        {Math.round(rate * 100)}%
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th("total"), cursor: "default" }}>Agent</th>
              <th style={th("total")} onClick={() => setSortBy("total")}>Tickets {sortBy === "total" ? "↓" : ""}</th>
              <th style={th("resolved")} onClick={() => setSortBy("resolved")}>Resolved {sortBy === "resolved" ? "↓" : ""}</th>
              <th style={th("resRate")} onClick={() => setSortBy("resRate")}>Res. Rate {sortBy === "resRate" ? "↓" : ""}</th>
              <th style={th("avgRes")} onClick={() => setSortBy("avgRes")}>Median Resolution {sortBy === "avgRes" ? "↑" : ""}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={a.agent} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--bg-row-alt)" }}>
                <td style={{ padding: "11px 14px", fontWeight: 500, color: "var(--text-primary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8edf8", color: "#3266ad", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {a.agent.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    {a.agent}
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                      <div style={{ width: `${(a.total / maxTickets) * 100}%`, height: "100%", background: "#3266ad", borderRadius: 3 }} />
                    </div>
                    <span style={{ minWidth: 28, textAlign: "right", fontWeight: 700 }}>{a.total}</span>
                  </div>
                </td>
                <td style={{ padding: "11px 14px", color: "#2d9c6b", fontWeight: 700 }}>{a.resolved}</td>
                <td style={{ padding: "11px 14px" }}>{badge(a.resolved / a.total)}</td>
                <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 500 }}>
                  {a.avgRes != null ? formatMinutes(a.avgRes) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
