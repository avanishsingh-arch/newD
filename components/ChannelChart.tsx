"use client";

import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, ResponsiveContainer,
  TooltipProps,
} from "recharts";
import type { Ticket, ChannelStats } from "@/lib/types";
import { channelColor, shortChannelName } from "@/lib/utils";
import { formatMinutes } from "@/lib/workingHours";

interface Props { tickets: Ticket[] }

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
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
        {payload[0]?.payload?.channel}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: "var(--text-muted)", display: "flex", gap: 8 }}>
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

export default function ChannelChart({ tickets }: Props) {
  const data: ChannelStats[] = useMemo(() => {
    const map: Record<string, ChannelStats> = {};
    tickets.forEach((t) => {
      if (!map[t.channel]) {
        map[t.channel] = {
          channel:   t.channel,
          shortName: shortChannelName(t.channel),
          tickets:   0,
          total:     0,
          avgResMin: 0,
        };
      }
      map[t.channel].tickets++;
      map[t.channel].total += t.workingResolutionMin;
    });
    return Object.values(map)
      .map((d) => ({
        ...d,
        avgResMin: d.tickets > 0 ? Math.round(d.total / d.tickets) : 0,
      }))
      .sort((a, b) => b.tickets - a.tickets);
  }, [tickets]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="shortName"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          angle={-28}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          tickFormatter={(v) => `${Math.round(v / 60)}h`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--text-muted)" }}
        />
        <Bar yAxisId="left" dataKey="tickets" name="Tickets" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={channelColor(d.channel)} />
          ))}
        </Bar>
        <Bar
          yAxisId="right"
          dataKey="avgResMin"
          name="Avg Resolution"
          fill="#c0c4d6"
          radius={[4, 4, 0, 0]}
          opacity={0.7}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
