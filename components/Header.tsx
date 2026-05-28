"use client";

import React from "react";

interface Props {
  onRefresh: () => void;
  lastRefresh: Date | null;
}

export default function Header({ onRefresh, lastRefresh }: Props) {
  return (
    <header style={{
      background: "#1a1d2e", padding: "18px 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12, position: "sticky", top: 0, zIndex: 100,
    }}>
      <div>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
          CS Ticket Resolution
        </div>
        <div style={{ color: "#8b93b0", fontSize: 11, marginTop: 3 }}>
          Response time based on Initial Response Time column &nbsp;·&nbsp;
          {lastRefresh && <span>Updated {lastRefresh.toLocaleTimeString()}</span>}
        </div>
      </div>
      <button onClick={onRefresh} style={{
        padding: "6px 16px", borderRadius: 8, border: "1px solid #3a3f5a",
        background: "transparent", color: "#8b93b0", fontSize: 13, cursor: "pointer",
      }}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = "#fff")}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "#8b93b0")}
      >
        ↻ Refresh
      </button>
    </header>
  );
}