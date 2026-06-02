"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import type { CallRow } from "@/lib/callTypes";
import { parseCallRows, filterCallsByRange, aggregateByAgent, callsDailyTrend } from "@/lib/callUtils";
import DateRangePicker, { type DateRange } from "./DateRangePicker";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: 8, color: "var(--text-muted)" }}>
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

// ── Agent table ───────────────────────────────────────────────────────────────
function AgentCallTable({ data }: { data: ReturnType<typeof aggregateByAgent> }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const th: React.CSSProperties = {
    padding: "8px 14px", textAlign: "left", fontWeight: 600, fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.06em",
    color: "var(--text-muted)", borderBottom: "1px solid var(--border)",
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={th}>Agent</th>
            <th style={th}>Total</th>
            <th style={th}>Incoming</th>
            <th style={th}>Incoming Answered</th>
            <th style={th}>Incoming Not Answered</th>
            <th style={th}>Incoming Answer Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a, i) => {
            const ansRate = a.incoming > 0 ? Math.round((a.answered / a.incoming) * 100) : 0;
            const bg    = ansRate >= 80 ? "#e6f4ec" : ansRate >= 50 ? "#fef3e2" : "#fde8e8";
            const color = ansRate >= 80 ? "#2d9c6b" : ansRate >= 50 ? "#c49a2b" : "#d94f4f";
            return (
              <tr key={a.agent} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "#f9f9fb" }}>
                <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8edf8", color: "#3266ad", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {a.agent.slice(0, 2).toUpperCase()}
                    </div>
                    {a.agent}
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", minWidth: 50 }}>
                      <div style={{ width: `${(a.total / max) * 100}%`, height: "100%", background: "#3266ad", borderRadius: 3 }} />
                    </div>
                    <b>{a.total}</b>
                  </div>
                </td>
                <td style={{ padding: "11px 14px", color: "#3266ad", fontWeight: 600 }}>{a.incoming}</td>
                <td style={{ padding: "11px 14px", color: "#9b4dca", fontWeight: 600 }}>{a.outgoing}</td>
                <td style={{ padding: "11px 14px", color: "#2d9c6b", fontWeight: 600 }}>{a.answered}</td>
                <td style={{ padding: "11px 14px", color: "#d94f4f", fontWeight: 600 }}>{a.notAnswered}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{ansRate}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CallsDashboard() {
  const [allCalls,  setAllCalls]  = useState<CallRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [range,     setRange]     = useState<DateRange>({ from: "", to: "" });

  useEffect(() => {
    setRange({
      from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      to:   new Date().toISOString().slice(0, 10),
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/calls");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAllCalls(parseCallRows(json.rows));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => filterCallsByRange(allCalls, range.from, range.to),
    [allCalls, range]
  );

  const agentStats = useMemo(() => aggregateByAgent(filtered), [filtered]);
  const trendData  = useMemo(() => callsDailyTrend(filtered, trendDays), [filtered, trendDays]);

  const totals = useMemo(() => {
    const incoming    = filtered.filter((c) => c.direction === "Incoming");
    const outgoing    = filtered.filter((c) => c.direction === "Outgoing");
    const answered    = incoming.filter((c) => c.status === "ANSWERED");
    const notAnswered = incoming.filter((c) => c.status === "NOANSWER");
    return {
      total:       filtered.length,
      incoming:    incoming.length,
      outgoing:    outgoing.length,
      answered:    answered.length,
      notAnswered: notAnswered.length,
    };
  }, [filtered]);

  const answerRate = totals.incoming > 0
    ? Math.round((totals.answered / totals.incoming) * 100)
    : 0;

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 24px", marginBottom: 20,
  };

  const sectionTitle = (t: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{t}</div>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, color: "var(--text-muted)", fontSize: 15 }}>
      Loading call data…
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "16px 20px", background: "#fde8e8", border: "1px solid #f0c0c0", borderRadius: 12, color: "#a00", fontSize: 14 }}>
      <b>Error:</b> {error}
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <DateRangePicker value={range} onChange={setRange} />
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {([7, 30] as const).map((d) => (
            <button key={d} onClick={() => {
              setTrendDays(d);
              setRange({
                from: new Date(Date.now() - d * 86400000).toISOString().slice(0, 10),
                to:   new Date().toISOString().slice(0, 10),
              });
            }} style={{
              padding: "5px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer",
              border: "1px solid var(--border)", transition: "all 0.15s",
              background: trendDays === d ? "#3266ad" : "transparent",
              color:      trendDays === d ? "#fff"    : "var(--text-muted)",
              fontWeight: trendDays === d ? 600       : 400,
            }}>L{d}</button>
          ))}
        </div>
      </div>

      {/* KPI cards — outgoing stays here only */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Calls"       value={totals.total}       accent="#3266ad" />
        <StatCard label="Incoming"          value={totals.incoming}    accent="#3266ad" />
        <StatCard label="Outgoing"          value={totals.outgoing}    accent="#9b4dca" />
        <StatCard label="Answered"          value={totals.answered}    accent="#2d9c6b" sub={`${answerRate}% of incoming`} />
        <StatCard label="Not Answered"      value={totals.notAnswered} accent="#d94f4f" />
      </div>

      {/* Daily trend — incoming only */}
      <div style={card}>
        {sectionTitle(`Daily call trend — L${trendDays}`)}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={trendDays > 14 ? 2 : 0} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="incoming"    name="Incoming"              stroke="#3266ad" strokeWidth={2} dot={trendDays === 7} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="answered"    name="Incoming Answered"     stroke="#2d9c6b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            <Line type="monotone" dataKey="notAnswered" name="Incoming Not Answered" stroke="#d94f4f" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent bar chart — incoming only */}
      <div style={card}>
        {sectionTitle("Agent wise call breakdown")}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agentStats.slice(0, 15)} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="agent" tick={{ fontSize: 11, fill: "var(--text-muted)" }} angle={-30} textAnchor="end" interval={0} height={60} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="incoming"    name="Incoming"              fill="#3266ad" radius={[3,3,0,0]} />
            <Bar dataKey="answered"    name="Incoming Answered"     fill="#2d9c6b" radius={[3,3,0,0]} />
            <Bar dataKey="notAnswered" name="Incoming Not Answered" fill="#d94f4f" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent table — outgoing stays in table only */}
      <div style={card}>
        {sectionTitle("Agent call details")}
        <AgentCallTable data={agentStats} />
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", paddingBottom: 32 }}>
        Charts show incoming calls only · Outgoing count shown in KPI and table · "Incoming - Call back" treated as Incoming
      </div>
    </div>
  );
}