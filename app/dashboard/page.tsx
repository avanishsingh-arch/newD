"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Ticket } from "@/lib/types";
import { fetchTickets } from "@/lib/sheetsApi";
import { generateDemoData } from "@/lib/demoData";
import { filterByDays, isResolved } from "@/lib/utils";
import { formatMinutes } from "@/lib/workingHours";

import Header      from "@/components/Header";
import StatCard    from "@/components/StatCard";
import SectionTitle from "@/components/SectionTitle";
import ChannelChart from "@/components/ChannelChart";
import TrendChart   from "@/components/TrendChart";
import AgentTable   from "@/components/AgentTable";

export default function DashboardPage() {
  const [allTickets,   setAllTickets]   = useState<Ticket[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [trendDays,    setTrendDays]    = useState<7 | 30>(7);
  const [lastRefresh,  setLastRefresh]  = useState<Date | null>(null);
  const [usingDemo,    setUsingDemo]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets();
      setAllTickets(data);
      setUsingDemo(false);
      setLastRefresh(new Date());
    } catch (e) {
      const msg = (e as Error).message;
      // If env vars aren't configured, fall back to demo data silently
      if (msg.includes("not set") || msg.includes("SHEET_ID") || msg.includes("CREDENTIALS")) {
        setAllTickets(generateDemoData(220));
        setUsingDemo(true);
        setLastRefresh(new Date());
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => filterByDays(allTickets, trendDays),
    [allTickets, trendDays]
  );

  const stats = useMemo(() => {
    const resolved = filtered.filter(isResolved);
    const avgRes =
      resolved.length > 0
        ? Math.round(
            resolved.reduce((s, t) => s + t.workingResolutionMin, 0) /
            resolved.length
          )
        : null;
    const open = filtered.filter((t) => !isResolved(t)).length;
    return {
      total:   filtered.length,
      resolved: resolved.length,
      open,
      avgRes,
      resRate: filtered.length > 0
        ? Math.round((resolved.length / filtered.length) * 100)
        : 0,
    };
  }, [filtered]);

  return (
    <div
      style={{
        "--bg":         "#f5f6fa",
        "--bg-card":    "#ffffff",
        "--bg-row-alt": "#f9f9fb",
        "--border":     "#e5e7ef",
        "--text-primary": "#1a1d2e",
        "--text-muted":   "#6b7080",
      } as React.CSSProperties}
    >
      <Header
        days={trendDays}
        onDaysChange={(d) => setTrendDays(d as 7 | 30)}
        onRefresh={load}
        lastRefresh={lastRefresh}
        usingDemo={usingDemo}
      />

      <main
        style={{
          padding: "28px 32px",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
              color: "var(--text-muted)",
              fontSize: 15,
              gap: 10,
            }}
          >
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
              ⟳
            </span>
            Loading ticket data…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: "20px 24px",
              background: "#fde8e8",
              border: "1px solid #f0c0c0",
              borderRadius: 12,
              color: "#a00",
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            <b>Failed to load data:</b> {error}
            <div style={{ marginTop: 8, fontSize: 12, color: "#c55" }}>
              Check NEXT_PUBLIC_SHEET_ID and NEXT_PUBLIC_GOOGLE_API_KEY in .env.local.
              Make sure the sheet is publicly readable or your API key has access.
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── KPI row ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <StatCard
                label={`Total Tickets (L${trendDays})`}
                value={stats.total}
                accent="#3266ad"
              />
              <StatCard
                label="Resolved"
                value={stats.resolved}
                sub={`${stats.resRate}% resolution rate`}
                accent="#2d9c6b"
              />
              <StatCard
                label="Open / Pending"
                value={stats.open}
                accent="#e07b39"
              />
              <StatCard
                label="Avg Resolution Time"
                value={stats.avgRes != null ? formatMinutes(stats.avgRes) : "—"}
                sub="working hours only"
                accent="#9b4dca"
              />
            </div>

            {/* ── Channel chart ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 20,
              }}
            >
              <SectionTitle>Channel breakdown — L{trendDays}</SectionTitle>
              <ChannelChart tickets={filtered} />
            </div>

            {/* ── Trend chart ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 20,
              }}
            >
              <SectionTitle>Daily trend — L{trendDays}</SectionTitle>
              <TrendChart tickets={allTickets} days={trendDays} />
            </div>

            {/* ── Agent table ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 20,
              }}
            >
              <SectionTitle>Agent performance — L{trendDays} · click headers to sort</SectionTitle>
              <AgentTable tickets={filtered} />
            </div>

            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: 8,
                paddingBottom: 32,
              }}
            >
              Resolution time counts only working hours (10:00 AM – 10:00 PM daily). Non-working hours excluded.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
