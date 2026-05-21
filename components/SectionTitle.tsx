import React from "react";

export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: "0 0 16px",
      }}
    >
      {children}
    </h2>
  );
}
