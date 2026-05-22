"use client";

import React from "react";

export type Period = "week" | "month" | "year";

interface Props {
  value:    Period;
  onChange: (p: Period) => void;
}

const LABELS: Record<Period, string> = {
  week:  "Last 7 Days",
  month: "Monthly",
  year:  "Yearly",
};

export default function PeriodT({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["week", "month", "year"] as Period[]).map((p) => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: "5px 13px", borderRadius: 7, fontSize: 12, cursor: "pointer",
          border: "1px solid var(--border)", transition: "all 0.15s",
          background: value === p ? "#3266ad" : "transparent",
          color:      value === p ? "#fff"    : "var(--text-muted)",
          fontWeight: value === p ? 600       : 400,
        }}>
          {LABELS[p]}
        </button>
      ))}
    </div>
  );
}