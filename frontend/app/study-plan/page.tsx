"use client";

import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type StudyPlan = {
  topic: string;
  summary: string;
  key_points: string[];
  study_steps: string[];
};

export default function StudyPlanPage() {
  const [topic, setTopic] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function build() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch(`${API_BASE}/study-plan?topic=${encodeURIComponent(topic.trim())}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Server error ${res.status}`);
      }
      setPlan(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: "#0f172a" }}>Study Plan</h1>
      <p style={{ marginBottom: 24, color: "#64748b" }}>
        Enter a topic from your uploaded notes to get a summary and study steps.
      </p>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") build();
            }}
            placeholder="e.g. Basics of Threat & Attack"
            style={{
              flex: 1,
              padding: 10,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
          />
          <button
            onClick={build}
            disabled={loading || !topic.trim()}
            style={{
              padding: "10px 18px",
              background: loading || !topic.trim() ? "#a5b4fc" : "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Building..." : "Build study plan"}
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            padding: "10px 12px",
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      {plan && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 12, color: "#4f46e5" }}>{plan.topic}</h2>
          <p style={{ marginBottom: 20, color: "#0f172a", lineHeight: 1.6 }}>{plan.summary}</p>

          <h3 style={{ fontSize: 16, marginBottom: 8, color: "#0f172a" }}>Key points</h3>
          <ul style={{ marginBottom: 20, paddingLeft: 20, color: "#334155", lineHeight: 1.6 }}>
            {plan.key_points.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{p}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: 16, marginBottom: 8, color: "#0f172a" }}>Study steps</h3>
          <ol style={{ paddingLeft: 20, color: "#334155", lineHeight: 1.6 }}>
            {plan.study_steps.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </main>
  );
}