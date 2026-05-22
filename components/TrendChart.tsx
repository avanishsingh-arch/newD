"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { Ticket } from "@/lib/types";
import { formatMinutes } from "@/lib/workingHours";
import { isResolved } from "@/lib/utils";

interface Props {
  tickets: Ticket[];
}

type Period = "week" | "month" | "year";

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 14px", fontSize: 13,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: "var(--text-muted)", display: "flex", gap: 8 }}>
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>
            {p.name === "Avg Resolution" ? formatMinutes(p.value as number) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

function buildData(tickets: Ticket[], period: Period) {
  const now = new Date();
  const map: Record<string, { date: string; tickets: number; resolved: number; total: number; avgRes: number }> = {};

  if (period === "week") {
    // Last 7 days, one entry per day
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[key] = { date: key, tickets: 0, resolved: 0, total: 0, avgRes: 0 };
    }
    tickets.forEach((t) => {
      if (!t.createdOn) return;
      const diffDays = Math.floor((now.getTime() - t.createdOn.getTime()) / 86400000);
      if (diffDays > 6) return;
      const key = t.createdOn.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!map[key]) return;
      map[key].tickets++;
      if (isResolved(t)) { map[key].resolved++; map[key].total += t.workingResolutionMin; }
    });

  } else if (period === "month") {
    // Last 12 months, one entry per month
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      map[key] = { date: key, tickets: 0, resolved: 0, total: 0, avgRes: 0 };
    }
    tickets.forEach((t) => {
      if (!t.createdOn) return;
      const key = t.createdOn.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map[key]) return;
      map[key].tickets++;
      if (isResolved(t)) { map[key].resolved++; map[key].total += t.workingResolutionMin; }
    });

  } else {
    // Last 12 months grouped by month label (same as month view but labelled differently)
    // Show current year broken by month
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      map[key] = { date: key, tickets: 0, resolved: 0, total: 0, avgRes: 0 };
    }
    tickets.forEach((t) => {
      if (!t.createdOn) return;
      const key = t.createdOn.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!map[key]) return;
      map[key].tickets++;
      if (isResolved(t)) { map[key].resolved++; map[key].total += t.workingResolutionMin; }
    });
  }

  return Object.values(map).map((d) => ({
    ...d,
    avgRes: d.resolved > 0 ? Math.round(d.total / d.resolved) : 0,
  }));
}

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "5px 14px",
  borderRadius: 7,
  border: "1px solid var(--border)",
  background: active ? "#3266ad" : "transparent",
  color: active ? "#fff" : "var(--text-muted)",
  fontWeight: active ? 600 : 400,
  fontSize: 12,
  cursor: "pointer",
  transition: "all 0.15s",
});

export default function TrendChart({ tickets }: Props) {
  const [period, setPeriod] = useState<Period>("week");

  const data = useMemo(() => buildData(tickets, period), [tickets, period]);
  const showDots = period === "week";

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button key={p} style={TAB_STYLE(period === p)} onClick={() => setPeriod(p)}>
            {p === "week" ? "Last 7 Days" : p === "month" ? "Monthly (12mo)" : "Yearly View"}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={0}
            angle={period === "year" ? -30 : 0} textAnchor={period === "year" ? "end" : "middle"}
            height={period === "year" ? 40 : 20} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickFormatter={(v) => formatMinutes(v as number)} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Line yAxisId="left" type="monotone" dataKey="tickets" name="Created"
            stroke="#3266ad" strokeWidth={2} dot={showDots} activeDot={{ r: 4 }} />
          <Line yAxisId="left" type="monotone" dataKey="resolved" name="Resolved"
            stroke="#2d9c6b" strokeWidth={2} dot={showDots} activeDot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="avgRes" name="Avg Resolution"
            stroke="#e07b39" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}