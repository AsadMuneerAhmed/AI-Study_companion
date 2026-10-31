"use client";

import { useState } from "react";
import AgentPanel from "./AgentPanel";

const TABS = [
  { key: "search", label: "Search", placeholder: "e.g. structures" },
  { key: "summary", label: "Summary", placeholder: "e.g. information security" },
  { key: "quiz", label: "Quiz", placeholder: "e.g. information security" },
  { key: "past_paper", label: "Past Papers", placeholder: "e.g. information security" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Tabs() {
  const [active, setActive] = useState<TabKey>("search");
  const current = TABS.find((t) => t.key === active)!;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                color: isActive ? "#4f46e5" : "#64748b",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <AgentPanel key={active} mode={active} placeholder={current.placeholder} />
    </div>
  );
}