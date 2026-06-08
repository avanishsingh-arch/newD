"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps, Cell,
} from "recharts";

const CHART_COLORS = [
  "#3266ad","#2d9c6b","#e07b39","#9b4dca",
  "#d94f4f","#4ab8c1","#c49a2b","#7a7a7a",
];

interface PivotRow {
  agent:          string;
  totalQueries:   number;
  medianInitial:  number;
  avgInitial:     number;
  medianTotal:    number;
  totalResRatio:  number; // col F
  totalFRRatio:   number; // col G
}

function parseRows(rows: Record<string, string>[]): PivotRow[] {
  return rows
    .filter((r) => {
      const name = (r["Employee"] || r["employee"] || Object.values(r)[0] || "").trim();
      return name && name.toLowerCase() !== "grand total" && name !== "";
    })
    .map((r) => {
      const name = (r["Employee"] || r["employee"] || Object.values(r)[0] || "").trim();
      const vals = Object.values(r);
      return {
        agent:         name,
        totalQueries:  parseFloat(vals[1]) || 0,
        medianInitial: parseFloat(vals[2]) || 0,
        avgInitial:    parseFloat(vals[3]) || 0,
        medianTotal:   parseFloat(vals[4]) || 0,
        totalResRatio: parseFloat(vals[5]) || 0,
        totalFRRatio:  parseFloat(vals[6]) || 0,
      };
    });
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: 8, color: "var(--text-muted)" }}>
          <span style={{ color: p.color as string }}>●</span>
          <span>{p.name}:</span>
          <b style={{ color: "var(--text-primary)" }}>
            {typeof p.value === "number" && p.value < 10 ? p.value.toFixed(2) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

const sectionTitle = (t: string) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{t}</div>
);

type ActiveMetric = "queries" | "resRatio" | "frRatio";

export default function PivotDashboard() {
  const [rows,     setRows]     = useState<PivotRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [metric,   setMetric]   = useState<ActiveMetric>("queries");
  const [selected, setSelected] = useState<string | null>(null); // null = all agents

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/pivot");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const parsed = parseRows(json.rows || []);
      setRows(parsed);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Grand totals
  const totals = useMemo(() => ({
    totalQueries:  rows.reduce((s, r) => s + r.totalQueries, 0),
    avgResRatio:   rows.length > 0 ? rows.reduce((s, r) => s + r.totalResRatio, 0) / rows.length : 0,
    avgFRRatio:    rows.length > 0 ? rows.reduce((s, r) => s + r.totalFRRatio,  0) / rows.length : 0,
  }), [rows]);

  // Chart data — all agents or selected agent only
  const chartData = useMemo(() => {
    const data = selected ? rows.filter((r) => r.agent === selected) : rows;
    return data.map((r) => ({
      agent:       r.agent,
      "Total Queries":                 r.totalQueries,
      "Total Response / Total Queries": r.totalResRatio,
      "Total FR / Total Queries":       r.totalFRRatio,
    }));
  }, [rows, selected]);

  const metricKey: Record<ActiveMetric, string> = {
    queries:  "Total Queries",
    resRatio: "Total Response / Total Queries",
    frRatio:  "Total FR / Total Queries",
  };

  const metricColor: Record<ActiveMetric, string> = {
    queries:  "#3266ad",
    resRatio: "#e07b39",
    frRatio:  "#2d9c6b",
  };

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 24px", marginBottom: 20,
  };

  const metricBtn = (m: ActiveMetric, label: string) => (
    <button key={m} onClick={() => setMetric(m)} style={{
      padding: "5px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer",
      border: "1px solid var(--border)", transition: "all 0.15s",
      background: metric === m ? metricColor[m] : "transparent",
      color:      metric === m ? "#fff"         : "var(--text-muted)",
      fontWeight: metric === m ? 600            : 400,
    }}>{label}</button>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, color: "var(--text-muted)", fontSize: 15 }}>
      Loading pivot data…
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "16px 20px", background: "#fde8e8", border: "1px solid #f0c0c0", borderRadius: 12, color: "#a00", fontSize: 14 }}>
      <b>Error:</b> {error}
      <div style={{ marginTop: 6, fontSize: 12 }}>Check that the sheet tab is named exactly "Pivot table 1" or set PIVOT_SHEET_RANGE in .env.local</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Agents"              value={rows.length}                          accent="#3266ad" />
        <StatCard label="Total Queries"             value={totals.totalQueries.toLocaleString()} accent="#2d9c6b" />
        <StatCard label="Avg Resolution time per query"   value={totals.avgResRatio.toFixed(2)}        accent="#e07b39" sub="col F average across agents" />
        <StatCard label="Avg IR time per query"    value={totals.avgFRRatio.toFixed(2)}         accent="#9b4dca" sub="col G average across agents" />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center" }}>
        {/* Metric toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          {metricBtn("queries",  "Total Queries")}
          {metricBtn("resRatio", "Resolution time per query")}
          {metricBtn("frRatio",  "IR time per query")}
        </div>

        {/* Agent selector */}
        <select
          value={selected ?? ""}
          onChange={(e) => setSelected(e.target.value || null)}
          style={{
            marginLeft: "auto", padding: "5px 32px 5px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "#fff",
            color: "var(--text-primary)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7080' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
          }}
        >
          <option value="">All Agents</option>
          {rows.map((r) => <option key={r.agent} value={r.agent}>{r.agent}</option>)}
        </select>
      </div>

      {/* Main bar chart */}
      <div style={card}>
        {sectionTitle(`Agent comparison — ${metricKey[metric]}`)}
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="agent" tick={{ fontSize: 11, fill: "var(--text-muted)" }} angle={-25} textAnchor="end" interval={0} height={60} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Bar dataKey={metricKey[metric]} name={metricKey[metric]} radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Combined chart — F and G together */}
      <div style={card}>
        {sectionTitle("Total Response / Queries vs Total FR / Queries — all agents")}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="agent" tick={{ fontSize: 11, fill: "var(--text-muted)" }} angle={-25} textAnchor="end" interval={0} height={60} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Total Response / Total Queries" name="Resolution time per query" fill="#e07b39" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Total FR / Total Queries"       name="IR time per query"  fill="#2d9c6b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent details table */}
      <div style={card}>
        {sectionTitle("Agent details")}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Agent","Total Queries","Median Initial RT","Avg Initial RT","Median Total RT","Resolution time per query","IR time per query"].map((h) => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.agent} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "#f9f9fb", cursor: "pointer" }}
                  onClick={() => setSelected(selected === r.agent ? null : r.agent)}>
                  <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: selected === r.agent ? "#eef2ff" : "#e8edf8", color: "#3266ad", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, border: selected === r.agent ? "2px solid #3266ad" : "none" }}>
                        {r.agent.slice(0, 2).toUpperCase()}
                      </div>
                      {r.agent}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 700 }}>{r.totalQueries.toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace" }}>{r.medianInitial}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace" }}>{r.avgInitial}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace" }}>{r.medianTotal}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.totalResRatio <= 0.3 ? "#e6f4ec" : r.totalResRatio <= 0.6 ? "#fef3e2" : "#fde8e8", color: r.totalResRatio <= 0.3 ? "#2d9c6b" : r.totalResRatio <= 0.6 ? "#c49a2b" : "#d94f4f" }}>
                      {r.totalResRatio.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.totalFRRatio <= 0.3 ? "#e6f4ec" : r.totalFRRatio <= 0.6 ? "#fef3e2" : "#fde8e8", color: r.totalFRRatio <= 0.3 ? "#2d9c6b" : r.totalFRRatio <= 0.6 ? "#c49a2b" : "#d94f4f" }}>
                      {r.totalFRRatio.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Click a row to filter charts to that agent</div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", paddingBottom: 32 }}>
        Data from Pivot table 1 sheet · RT = Response Time · FR = First Response
      </div>
    </div>
  );
}