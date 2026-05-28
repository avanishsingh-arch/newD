"use client";
import React from "react";
import type { MetricType } from "@/lib/types";

interface Props {
    value: MetricType;
    onChange: (m: MetricType) => void;
}

export default function MetricToggle({ value, onChange }: Props) {
    const btn = (m: MetricType, label: string) => (
        <button onClick={() => onChange(m)} style={{
            padding: "5px 13px", borderRadius: 7, fontSize: 12, cursor: "pointer",
            border: "1px solid var(--border)", transition: "all 0.15s",
            background: value === m ? "#e07b39" : "transparent",
            color: value === m ? "#fff" : "var(--text-muted)",
            fontWeight: value === m ? 600 : 400,
        }}>{label}</button>
    );
    return (
        <div style={{ display: "flex", gap: 4 }}>
            {btn("initial", "Initial Response")}
            {btn("total", "Total Response")}
        </div>
    );
}