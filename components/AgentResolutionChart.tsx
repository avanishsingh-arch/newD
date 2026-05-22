"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { Ticket } from "@/lib/types";
import { formatMinutes } from "@/lib/workingHours";
import { isResolved, CHART_COLORS } from "@/lib/utils";

interface Props { tickets: Ticket[] }

type ViewMode = "single" | "compare";
type Period   = "week" | "month" | "year";

function getKey(date: Date, period: Period): string {
  if (period === "week")  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (period === "month") return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function getPeriodKeys(period: Period): string[] {
  const now = new Date();
  const keys: string[] = [];
  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      keys.push(getKey(d, period));
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(getKey(d, period));
    }
  }
  return keys;
}

function buildAgentData(tickets: Ticket[], agents: string[], period: Period) {
  const keys = getPeriodKeys(period);

  // map[key][agent] = { total, count }
  const map: Record<string, Record<string, { total: number; count: number }>> = {};
  keys.forEach((k) => {
    map[k] = {};
    agents.forEach((a) => { map[k][a] = { total: 0, count: 0 }; });
  });

  tickets.forEach((t) => {
    if (!t.createdOn || !isResolved(t)) return;
    if (!agents.includes(t.agent)) return;
    const k = getKey(t.createdOn, period);
    if (!map[k]) return;
    map[k][t.agent].total += t.workingResolutionMin;
    map[k][t.agent].count++;
  });

  return keys.map((k) => {
    const row: Record<string, string | number> = { date: k };
    agents.forEach((a) => {
      const { total, count } = map[k][a];
      row[a] = count > 0 ? Math.round(total / count) : 0;
    });
    return row;
  });
}

const TAB: React.CSSProperties = {
  padding: "5px 14px", borderRadius: 7, border: "1px solid var(--border)",
  fontSize: 12, cursor: "pointer", transition: "all 0.15s",
};

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
        <div key={p.name} style={{ display: "flex", gap: 8, color: "var(--text-muted)" }}>
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>{formatMinutes(p.value as number)}</b>
        </div>
      ))}
    </div>
  );
};

export default function AgentResolutionChart({ tickets }: Props) {
  const allAgents = useMemo(() => {
    const s = new Set<string>();
    tickets.forEach((t) => { if (t.agent && t.agent !== "Unknown") s.add(t.agent); });
    return Array.from(s).sort();
  }, [tickets]);

  const [mode,          setMode]          = useState<ViewMode>("single");
  const [period,        setPeriod]        = useState<Period>("week");
  const [selectedAgent, setSelectedAgent] = useState<string>(() => allAgents[0] || "");
  const [checkedAgents, setCheckedAgents] = useState<Set<string>>(() => new Set(allAgents.slice(0, 2)));

  // Keep selectedAgent valid if allAgents changes
  const safeAgent = allAgents.includes(selectedAgent) ? selectedAgent : (allAgents[0] || "");

  const activeAgents = mode === "single" ? [safeAgent] : Array.from(checkedAgents);

  const data = useMemo(
    () => buildAgentData(tickets, activeAgents.filter(Boolean), period),
    [tickets, activeAgents, period]
  );

  const toggleAgent = (agent: string) => {
    setCheckedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) { if (next.size > 1) next.delete(agent); }
      else next.add(agent);
      return next;
    });
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "flex-start" }}>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, background: "#f0f2f8", padding: "3px 4px", borderRadius: 9 }}>
          {(["single", "compare"] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              ...TAB,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#1a1d2e" : "var(--text-muted)",
              fontWeight: mode === m ? 600 : 400,
              border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {m === "single" ? "Single Agent" : "Compare Agents"}
            </button>
          ))}
        </div>

        {/* Period toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              ...TAB,
              background: period === p ? "#3266ad" : "transparent",
              color: period === p ? "#fff" : "var(--text-muted)",
              fontWeight: period === p ? 600 : 400,
            }}>
              {p === "week" ? "7 Days" : p === "month" ? "12 Months" : "Year"}
            </button>
          ))}
        </div>

        {/* Single agent dropdown */}
        {mode === "single" && (
          <select
            value={safeAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            style={{
              padding: "5px 32px 5px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7080' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            {allAgents.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
      </div>

      {/* Compare mode — checkboxes */}
      {mode === "compare" && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16,
          padding: "12px 16px", background: "#f7f8fc",
          border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", width: "100%", marginBottom: 4 }}>
            Select agents to compare:
          </span>
          {allAgents.map((agent, i) => {
            const checked = checkedAgents.has(agent);
            const color   = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <label key={agent} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 20,
                border: `1px solid ${checked ? color : "var(--border)"}`,
                background: checked ? `${color}18` : "var(--bg-card)",
                cursor: "pointer", fontSize: 12, fontWeight: checked ? 600 : 400,
                color: checked ? color : "var(--text-muted)",
                transition: "all 0.15s", userSelect: "none",
              }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAgent(agent)}
                  style={{ display: "none" }}
                />
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: checked ? color : "var(--border)", flexShrink: 0,
                }} />
                {agent}
              </label>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {activeAgents.filter(Boolean).length === 0 ? (
        <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Select at least one agent
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: period === "year" ? 30 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              angle={period === "year" ? -30 : 0} textAnchor={period === "year" ? "end" : "middle"}
              height={period === "year" ? 40 : 20} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatMinutes(v as number)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
            {activeAgents.filter(Boolean).map((agent, i) => (
              <Line
                key={agent}
                type="monotone"
                dataKey={agent}
                name={agent}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={period === "week"}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
        Y-axis shows average working-hours resolution time per {period === "week" ? "day" : "month"}.
        Only resolved tickets are counted.
      </div>
    </div>
  );
}