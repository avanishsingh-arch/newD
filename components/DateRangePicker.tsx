"use client";
import React from "react";

export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;
}

interface Props {
    value: DateRange;
    onChange: (r: DateRange) => void;
}

const INP: React.CSSProperties = {
    padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)",
    fontSize: 12, background: "var(--bg-card)", color: "var(--text-primary)",
    outline: "none", cursor: "pointer",
};

export default function DateRangePicker({ value, onChange }: Props) {
    const preset = (days: number) => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);
        onChange({
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        });
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <input type="date" style={INP} value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>→</span>
            <input type="date" style={INP} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
            <div style={{ display: "flex", gap: 3 }}>
                {[7, 14, 30].map((d) => (
                    <button key={d} onClick={() => preset(d)} style={{
                        padding: "4px 9px", borderRadius: 6, fontSize: 11,
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--text-muted)", cursor: "pointer",
                    }}>L{d}</button>
                ))}
            </div>
        </div>
    );
}