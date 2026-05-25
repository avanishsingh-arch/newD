"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { Ticket } from "@/lib/types";
import { formatMinutes, median } from "@/lib/workingHours";
import { isResolved, filterByPeriod, getPeriodKeys, getTicketKey } from "@/lib/utils";
import PeriodToggle, { type Period } from "./PeriodT";

interface DayData {
  date: string;
  tickets: number;
  resolved: number;
  total: number;
  mins: number[];
  medianRes: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: "var(--text-muted)", display: "flex", gap: 8 }}>
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>
            {p.name === "Median Resolution" ? formatMinutes(p.value as number) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ tickets }: { tickets: Ticket[] }) {
  const [period, setPeriod] = useState<Period>("week");

  const data = useMemo(() => {
    const filtered = filterByPeriod(tickets, period);
    const keys = getPeriodKeys(period);
    const map: Record<string, DayData> = {};
    keys.forEach((k) => { map[k] = { date: k, tickets: 0, resolved: 0, total: 0, mins: [], medianRes: 0 }; });

    filtered.forEach((t) => {
      if (!t.createdOn) return;
      const k = getTicketKey(t.createdOn, period);
      if (!map[k]) return;
      map[k].tickets++;
      if (isResolved(t)) {
        map[k].resolved++;
        map[k].total += t.workingResolutionMin;
        if (t.workingResolutionMin > 0) map[k].mins.push(t.workingResolutionMin);
      }
    });

    return Object.values(map).map((d) => ({ ...d, medianRes: median(d.mins) }));
  }, [tickets, period]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: period !== "week" ? 30 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={0}
            angle={period !== "week" ? -30 : 0}
            textAnchor={period !== "week" ? "end" : "middle"}
            height={period !== "week" ? 40 : 20} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickFormatter={(v) => formatMinutes(v as number)} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
          <Line yAxisId="left" type="monotone" dataKey="tickets" name="Created" stroke="#3266ad" strokeWidth={2} dot={period === "week"} activeDot={{ r: 4 }} />
          <Line yAxisId="left" type="monotone" dataKey="resolved" name="Resolved" stroke="#2d9c6b" strokeWidth={2} dot={period === "week"} activeDot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="medianRes" name="Median Resolution" stroke="#e07b39" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
