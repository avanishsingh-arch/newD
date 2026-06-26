"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, TooltipProps,
} from "recharts";
import {
  parseEmailRows, filterEmailsByRange, emailTrendData, fmtMin,
  type EmailRow, type EmailPeriod,
} from "@/lib/emailUtils";
import DateRangePicker, { type DateRange } from "./DateRangePicker";

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

// ── Tooltip ───────────────────────────────────────────────────────────────────
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
            {p.name === "Avg IRT" ? fmtMin(p.value as number) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
};

// ── Period toggle ─────────────────────────────────────────────────────────────
function PeriodBtn({ value, current, onChange, label }: { value: EmailPeriod; current: EmailPeriod; onChange: (p: EmailPeriod) => void; label: string }) {
  return (
    <button onClick={() => onChange(value)} style={{
      padding: "5px 13px", borderRadius: 7, fontSize: 12, cursor: "pointer",
      border: "1px solid var(--border)", transition: "all 0.15s",
      background: current === value ? "#3266ad" : "transparent",
      color:      current === value ? "#fff"    : "var(--text-muted)",
      fontWeight: current === value ? 600       : 400,
    }}>{label}</button>
  );
}

// ── Email table ───────────────────────────────────────────────────────────────
function EmailTable({ emails }: { emails: EmailRow[] }) {
  const th: React.CSSProperties = {
    padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.05em",
    color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
  };
  return (
    <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <tr>
            <th style={th}>Subject</th>
            <th style={th}>Sender</th>
            <th style={th}>Received At</th>
            <th style={th}>First Reply At</th>
            <th style={th}>IRT</th>
            <th style={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {emails.slice(0, 100).map((e, i) => {
            const isPending = e.status === "Pending";
            return (
              <tr key={e.threadId} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "#f9f9fb" }}>
                <td style={{ padding: "8px 12px", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-primary)", fontWeight: 500 }} title={e.subject}>
                  {e.subject || "—"}
                </td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{e.senderEmail}</td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 11 }}>
                  {e.receivedAt ? e.receivedAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 11 }}>
                  {e.firstReplyAt ? e.firstReplyAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600, color: e.irtMinutes ? "#3266ad" : "var(--text-muted)" }}>
                  {fmtMin(e.irtMinutes)}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{
                    padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: isPending ? "#fef3e2" : "#e6f4ec",
                    color:      isPending ? "#c49a2b" : "#2d9c6b",
                  }}>{e.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {emails.length > 100 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 12px" }}>
          Showing first 100 of {emails.length} emails
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EmailDashboard() {
  const [allEmails, setAllEmails] = useState<EmailRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [period,    setPeriod]    = useState<EmailPeriod>("week");
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
      const res  = await fetch("/api/email");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAllEmails(parseEmailRows(json.rows || []));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => filterEmailsByRange(allEmails, range.from, range.to),
    [allEmails, range]
  );

  const trendData = useMemo(() => emailTrendData(allEmails, period), [allEmails, period]);

  const totals = useMemo(() => {
    const replied  = filtered.filter((e) => e.status === "Replied");
    const pending  = filtered.filter((e) => e.status === "Pending");
    const irtVals  = replied.filter((e) => e.irtMinutes != null).map((e) => e.irtMinutes!);
    const avgIRT   = irtVals.length > 0 ? Math.round(irtVals.reduce((a, b) => a + b, 0) / irtVals.length) : null;
    return {
      total:   filtered.length,
      replied: replied.length,
      pending: pending.length,
      avgIRT,
      replyRate: filtered.length > 0 ? Math.round((replied.length / filtered.length) * 100) : 0,
    };
  }, [filtered]);

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 24px", marginBottom: 20,
  };

  const sec = (t: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{t}</div>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, color: "var(--text-muted)", fontSize: 15 }}>
      Loading email data…
    </div>
  );

  if (error) return (
    <div style={{ margin: 24, padding: "16px 20px", background: "#fde8e8", border: "1px solid #f0c0c0", borderRadius: 12, color: "#a00", fontSize: 14 }}>
      <b>Error:</b> {error}
      <div style={{ marginTop: 6, fontSize: 12 }}>Make sure the Email tab exists in your sheet and EMAIL_SHEET_RANGE is set correctly.</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Top controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, alignItems: "center" }}>
        <DateRangePicker value={range} onChange={setRange} />
        <button onClick={load} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Emails"   value={totals.total}              accent="#3266ad" />
        {/* <StatCard label="Replied"        value={totals.replied}            accent="#2d9c6b" sub={`${totals.replyRate}% reply rate`} /> */}
        {/* <StatCard label="Pending"        value={totals.pending}            accent="#e07b39" /> */}
        <StatCard label="Avg IRT"        value={fmtMin(totals.avgIRT)}     accent="#9b4dca" sub="working hours only" />
      </div>

      {/* Period toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <PeriodBtn value="week"  current={period} onChange={setPeriod} label="Last 7 Days" />
        <PeriodBtn value="month" current={period} onChange={setPeriod} label="Monthly"     />
        <PeriodBtn value="year"  current={period} onChange={setPeriod} label="Yearly"      />
      </div>

      {/* Email count trend */}
      {/* <div style={card}>
        {sec(`Email volume — ${period === "week" ? "Last 7 days" : period === "month" ? "Monthly" : "Yearly"}`)}
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trendData} margin={{ top: 4, right: 24, left: 0, bottom: period !== "week" ? 30 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={0}
              angle={period !== "week" ? -30 : 0}
              textAnchor={period !== "week" ? "end" : "middle"}
              height={period !== "week" ? 40 : 20} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="total"   name="Total"   fill="#3266ad" radius={[4,4,0,0]} />
            <Bar dataKey="replied" name="Replied" fill="#2d9c6b" radius={[4,4,0,0]} />
            <Bar dataKey="pending" name="Pending" fill="#e07b39" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> */}

      {/* Avg IRT trend */}
      <div style={card}>
        {sec(`Average IRT trend — working hours (10am–10pm)`)}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData} margin={{ top: 4, right: 24, left: 0, bottom: period !== "week" ? 30 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={0}
              angle={period !== "week" ? -30 : 0}
              textAnchor={period !== "week" ? "end" : "middle"}
              height={period !== "week" ? 40 : 20} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => fmtMin(v as number)} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="avgIRT" name="Avg IRT" stroke="#9b4dca" strokeWidth={2.5} dot={period === "week"} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Email table */}
      {/* <div style={card}>
        {sec(`Email details — ${filtered.length} emails in selected range`)}
        <EmailTable emails={filtered} />
      </div> */}

      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", paddingBottom: 32 }}>
        IRT = Initial Response Time · Calculated using working hours only (10am–10pm) · Emails from @faithapp.in and @soulsensei.in excluded
      </div>
    </div>
  );
}