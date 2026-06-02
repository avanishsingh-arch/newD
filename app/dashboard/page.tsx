"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Ticket } from "@/lib/types";
import { fetchTickets } from "@/lib/sheetsApi";

import Header               from "@/components/Header";
import SectionTitle         from "@/components/SectionTitle";
import ChannelChart         from "@/components/ChannelChart";
import TrendChart           from "@/components/TrendChart";
import AgentTable           from "@/components/AgentTable";
import AgentResolutionChart from "@/components/AgentResolutionChart";
import CallsDashboard       from "@/components/CallsDashboard";

type Tab = "tickets" | "calls";

export default function DashboardPage() {
  const [allTickets,  setAllTickets]  = useState<Ticket[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab,   setActiveTab]   = useState<Tab>("tickets");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets();
      setAllTickets(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const card: React.CSSProperties = {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 24px", marginBottom: 20,
  };

  return (
    <div style={{
      "--bg": "#f5f6fa", "--bg-card": "#ffffff", "--bg-row-alt": "#f9f9fb",
      "--border": "#e5e7ef", "--text-primary": "#1a1d2e", "--text-muted": "#6b7080",
    } as React.CSSProperties}>

      <Header onRefresh={load} lastRefresh={lastRefresh} />

      {/* Tab bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 32px", display: "flex", gap: 0 }}>
        {([
          { key: "tickets", label: "🎫 Ticket Resolution" },
          { key: "calls",   label: "📞 Call Analytics" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: "14px 20px", fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400,
            color: activeTab === t.key ? "#3266ad" : "var(--text-muted)",
            background: "transparent", border: "none", cursor: "pointer",
            borderBottom: activeTab === t.key ? "2px solid #3266ad" : "2px solid transparent",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Calls tab */}
      {activeTab === "calls" && <CallsDashboard />}

      {/* Tickets tab */}
      {activeTab === "tickets" && (
        <main style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, color: "var(--text-muted)", fontSize: 15, gap: 10 }}>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
              Loading ticket data…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "20px 24px", background: "#fde8e8", border: "1px solid #f0c0c0", borderRadius: 12, color: "#a00", fontSize: 14, marginBottom: 24 }}>
              <b>Failed to load data:</b> {error}
              <div style={{ marginTop: 8, fontSize: 12, color: "#c55" }}>
                Check SHEET_ID and GOOGLE_CREDENTIALS_JSON in Vercel environment variables.
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={card}>
                <SectionTitle>Channel breakdown</SectionTitle>
                <ChannelChart tickets={allTickets} />
              </div>

              <div style={card}>
                <SectionTitle>Ticket trend</SectionTitle>
                <TrendChart tickets={allTickets} />
              </div>

              <div style={card}>
                <SectionTitle>Agent resolution time</SectionTitle>
                <AgentResolutionChart tickets={allTickets} />
              </div>

              <div style={card}>
                <SectionTitle>Agent performance · click headers to sort</SectionTitle>
                <AgentTable tickets={allTickets} />
              </div>

              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8, paddingBottom: 32 }}>
                Response time based on Initial / Total Response Time columns (seconds → minutes).
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}