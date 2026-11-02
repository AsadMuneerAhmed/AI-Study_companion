"use client";

import { useEffect, useState } from "react";

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
  const [done, setDone] = useState<boolean[]>([]);

  const storageKey = (t: string) => `study-progress:${t.toLowerCase()}`;

  useEffect(() => {
    if (!plan) return;
    const saved = localStorage.getItem(storageKey(plan.topic));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === plan.study_steps.length) {
          setDone(parsed);
          return;
        }
      } catch {
        // ignore bad saved data
      }
    }
    setDone(plan.study_steps.map(() => false));
  }, [plan]);

  function toggle(i: number) {
    if (!plan) return;
    const next = done.map((v, idx) => (idx === i ? !v : v));
    setDone(next);
    localStorage.setItem(storageKey(plan.topic), JSON.stringify(next));
  }

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

  const completed = done.filter(Boolean).length;
  const total = plan ? plan.study_steps.length : 0;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const card = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 24,
  };

  return (
    <main style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: "#0f172a" }}>Study Plan</h1>
      <p style={{ marginBottom: 24, color: "#64748b" }}>
        Enter a topic from your uploaded notes to get a summary and study steps.
      </p>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") build();
            }}
            placeholder="e.g. Basics of Threat & Attack"
            style={{ flex: 1, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}
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
        <p style={{ padding: "10px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {plan && (
        <div style={card}>
          <h2 style={{ fontSize: 20, marginBottom: 12, color: "#4f46e5" }}>{plan.topic}</h2>
          <p style={{ marginBottom: 20, color: "#0f172a", lineHeight: 1.6 }}>{plan.summary}</p>

          <h3 style={{ fontSize: 16, marginBottom: 8, color: "#0f172a" }}>Key points</h3>
          <ul style={{ marginBottom: 24, paddingLeft: 20, color: "#334155", lineHeight: 1.6 }}>
            {plan.key_points.map((p, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{p}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: 16, marginBottom: 10, color: "#0f172a" }}>Study progress</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginBottom: 10 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px" }}>
              <p style={{ fontSize: 12, color: "#64748b" }}>Topic</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{plan.topic}</p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px" }}>
              <p style={{ fontSize: 12, color: "#64748b" }}>Steps done</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>
                {completed} of {total}
              </p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px" }}>
              <p style={{ fontSize: 12, color: "#64748b" }}>Progress</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>{percent}%</p>
            </div>
          </div>

          <div style={{ height: 10, background: "#e2e8f0", borderRadius: 999, marginBottom: 16, overflow: "hidden" }}>
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "#4f46e5",
                transition: "width 0.2s",
              }}
            />
          </div>

          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {plan.study_steps.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  marginBottom: 8,
                  background: done[i] ? "#f8fafc" : "#ffffff",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: done[i] ? "#4f46e5" : "#eef2ff",
                    color: done[i] ? "#ffffff" : "#3730a3",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <input
                  type="checkbox"
                  checked={!!done[i]}
                  onChange={() => toggle(i)}
                  style={{ marginTop: 4, width: 16, height: 16, cursor: "pointer" }}
                />
                <span
                  style={{
                    color: done[i] ? "#94a3b8" : "#334155",
                    textDecoration: done[i] ? "line-through" : "none",
                    lineHeight: 1.6,
                  }}
                >
                  {s}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  );
}