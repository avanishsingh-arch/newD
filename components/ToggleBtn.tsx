import React from "react";

interface ToggleBtnProps {
  active:   boolean;
  onClick:  () => void;
  children: React.ReactNode;
}

export default function ToggleBtn({ active, onClick, children }: ToggleBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 18px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: active ? "#3266ad" : "transparent",
        color:      active ? "#fff"    : "var(--text-primary)",
        fontWeight: active ? 600       : 400,
        fontSize:   13,
        cursor:     "pointer",
        transition: "all 0.15s ease",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </button>
  );
}
