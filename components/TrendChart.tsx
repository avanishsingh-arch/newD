"use client";

import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { Ticket, DailyStats } from "@/lib/types";
import { formatMinutes } from "@/lib/workingHours";
import { isResolved } from "@/lib/utils";

interface Props {
  tickets: Ticket[];
  days:    number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ color: "var(--text-muted)", display: "flex", gap: 8 }}
        >
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>
            {p.name === "Avg Resolution"
              ? formatMinutes(p.value as number)
              : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ tickets, days }: Props) {
  const data: DailyStats[] = useMemo(() => {
    const map: Record<string, DailyStats> = {};
    const now = new Date();

    // Pre-fill all days so there are no gaps
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[key] = { date: key, tickets: 0, resolved: 0, total: 0, avgRes: 0 };
    }

    tickets.forEach((t) => {
      if (!t.createdOn) return;
      const key = t.createdOn.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      if (!map[key]) return;
      map[key].tickets++;
      if (isResolved(t)) {
        map[key].resolved++;
        map[key].total += t.workingResolutionMin;
      }
    });

    return Object.values(map).map((d) => ({
      ...d,
      avgRes: d.resolved > 0 ? Math.round(d.total / d.resolved) : 0,
    }));
  }, [tickets, days]);

  const showDots = days <= 7;

  return (
    <ResponsiveContainer width="100%" height={270}>
      <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          interval={days > 14 ? 2 : 0}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          tickFormatter={(v) => formatMinutes(v as number)}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="tickets"
          name="Created"
          stroke="#3266ad"
          strokeWidth={2}
          dot={showDots}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke="#2d9c6b"
          strokeWidth={2}
          dot={showDots}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgRes"
          name="Avg Resolution"
          stroke="#e07b39"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
