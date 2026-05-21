"use client";

import React from "react";
import ToggleBtn from "./ToggleBtn";

interface Props {
  days:         number;
  onDaysChange: (d: number) => void;
  onRefresh:    () => void;
  lastRefresh:  Date | null;
  usingDemo:    boolean;
}

export default function Header({ days, onDaysChange, onRefresh, lastRefresh, usingDemo }: Props) {
  return (
    <header
      style={{
        background: "#1a1d2e",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div>
        <div
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          CS Ticket Resolution
        </div>
        <div style={{ color: "#8b93b0", fontSize: 11, marginTop: 3 }}>
          Working hours: 10:00 AM – 10:00 PM &nbsp;·&nbsp;
          {usingDemo && (
            <span style={{ color: "#e07b39" }}>
              Demo mode — configure NEXT_PUBLIC_SHEET_ID & NEXT_PUBLIC_GOOGLE_API_KEY in .env.local
            </span>
          )}
          {!usingDemo && lastRefresh && (
            <span>Updated {lastRefresh.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "rgba(255,255,255,0.07)",
            padding: "3px 4px",
            borderRadius: 10,
          }}
        >
          <ToggleBtn active={days === 7}  onClick={() => onDaysChange(7)}>L7</ToggleBtn>
          <ToggleBtn active={days === 30} onClick={() => onDaysChange(30)}>L30</ToggleBtn>
        </div>
        <button
          onClick={onRefresh}
          style={{
            marginLeft: 4,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid #3a3f5a",
            background: "transparent",
            color: "#8b93b0",
            fontSize: 13,
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "#8b93b0")}
        >
          ↻ Refresh
        </button>
      </div>
    </header>
  );
}
