"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { Ticket, ChannelStats } from "@/lib/types";
import { channelColor, shortChannelName, filterByPeriod } from "@/lib/utils";
import { formatMinutes, median } from "@/lib/workingHours";
import PeriodToggle, { type Period } from "./PeriodT";
import MetricToggle from "./MetricToggle";
import DateRangePicker, { type DateRange } from "./DateRangePicker";
import type { MetricType } from "@/lib/types";
import { filterByDateRange } from "@/lib/utils";

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>{payload[0]?.payload?.channel}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: "var(--text-muted)", display: "flex", gap: 8 }}>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>
            {p.name === "Median Resolution" ? formatMinutes(p.value as number) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

export default function ChannelChart({ tickets }: { tickets: Ticket[] }) {
  const [period, setPeriod] = useState<Period>("week");
  const [metric, setMetric] = useState<MetricType>("initial");
  const [range, setRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  const filtered = useMemo(() => filterByDateRange(filterByPeriod(tickets, period), range), [tickets, period, range]);


  const data: ChannelStats[] = useMemo(() => {
    const map: Record<string, ChannelStats> = {};
    const mins: Record<string, number[]> = {};

    filtered.forEach((t) => {
      if (!map[t.channel]) {
        map[t.channel] = { channel: t.channel, shortName: shortChannelName(t.channel), tickets: 0, total: 0, avgResMin: 0 };
        mins[t.channel] = [];
      }
      map[t.channel].tickets++;
      const val = metric === "initial" ? t.workingResolutionMin : t.totalResponseMin;
      map[t.channel].total += val;
      if (val > 0) mins[t.channel].push(val);
    });

    return Object.values(map)
      .map((d) => ({ ...d, avgResMin: median(mins[d.channel] ?? []) }))
      .sort((a, b) => b.tickets - a.tickets);
  }, [filtered]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <PeriodToggle value={period} onChange={setPeriod} />
        <MetricToggle value={metric} onChange={setMetric} />
        <DateRangePicker value={range} onChange={setRange} />
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="shortName"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            angle={-45}
            textAnchor="end"
            interval={0}
            height={80}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            tickFormatter={(v) => formatMinutes(v as number)} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: "var(--text-muted)" }} />
          <Bar yAxisId="left" dataKey="tickets" name="Tickets" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={channelColor(d.channel)} />)}
          </Bar>
          <Bar yAxisId="right" dataKey="avgResMin" name="Median Resolution" radius={[4, 4, 0, 0]} opacity={0.5}>
            {data.map((d, i) => <Cell key={i} fill={channelColor(d.channel)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}