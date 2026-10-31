"use client";

import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const PROMPTS: Record<string, (t: string) => string> = {
  search: (t) => `Search my notes for ${t}`,
  summary: (t) => `Summarize the ${t} topic`,
  quiz: (t) => `Make a quiz on the ${t} topic`,
  past_paper: (t) => `Give me past paper questions on the ${t} topic`,
};

const card = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 24,
};

export default function AgentPanel({ mode, placeholder }: { mode: string; placeholder: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  async function ask() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const request = PROMPTS[mode](text.trim());
      const params = new URLSearchParams({ request });
      const res = await fetch(`${API_BASE}/agent?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            placeholder={placeholder}
            style={{ flex: 1, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}
          />
          <button
            onClick={ask}
            disabled={loading || !text.trim()}
            style={{
              padding: "10px 18px",
              background: loading || !text.trim() ? "#a5b4fc" : "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              cursor: loading || !text.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Go"}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ padding: "10px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>
          {error}
        </p>
      )}
      {data && <AgentResult data={data} />}
    </div>
  );
}

function AgentResult({ data }: { data: any }) {
  const { intent, topic, answer, results } = data;
  const heading = { fontSize: 18, color: "#4f46e5", marginBottom: 12 };
  const sub = { fontSize: 15, color: "#0f172a", marginTop: 16, marginBottom: 8 };
  const text = { color: "#334155", lineHeight: 1.6 };

  if (intent === "search" && results) {
    return (
      <div style={card}>
        <h3 style={heading}>Search results for: {topic}</h3>
        {results.length === 0 && <p style={text}>Nothing found.</p>}
        <ol style={{ paddingLeft: 20 }}>
          {results.map((r: string, i: number) => (
            <li key={i} style={{ ...text, marginBottom: 10 }}>{r}</li>
          ))}
        </ol>
      </div>
    );
  }

  if (typeof answer === "string") {
       return (
         <div style={card}>
           <p style={text}>{answer}</p>
           {data.follow_up && (
             <p style={{ ...text, marginTop: 12, color: "#4f46e5", fontWeight: 500 }}>
               {data.follow_up}
             </p>
           )}
         </div>
       );
  }

  if (intent === "summary") {
    return (
      <div style={card}>
        <h3 style={heading}>Summary: {answer.topic}</h3>
        <p style={text}>{answer.summary}</p>
        <h4 style={sub}>Key points</h4>
        <ul style={{ paddingLeft: 20 }}>
          {answer.key_points.map((p: string, i: number) => (
            <li key={i} style={{ ...text, marginBottom: 6 }}>{p}</li>
          ))}
        </ul>
        <h4 style={sub}>Study steps</h4>
        <ol style={{ paddingLeft: 20 }}>
          {answer.study_steps.map((s: string, i: number) => (
            <li key={i} style={{ ...text, marginBottom: 6 }}>{s}</li>
          ))}
        </ol>
      </div>
    );
  }

  if (intent === "quiz") {
    return (
      <div style={card}>
        <h3 style={heading}>Quiz: {answer.topic}</h3>
        {answer.error && <p style={text}>{answer.error}</p>}
        {answer.questions.map((q: any, i: number) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <p style={{ color: "#0f172a", fontWeight: 600, marginBottom: 6 }}>
              {i + 1}. {q.question}
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 6 }}>
              {q.options.map((o: string, j: number) => (
                <li key={j} style={{ ...text, marginBottom: 4 }}>{o}</li>
              ))}
            </ul>
            <p style={{ color: "#4f46e5", fontSize: 14 }}>Answer: {q.answer}</p>
          </div>
        ))}
      </div>
    );
  }

  if (intent === "past_paper") {
    return (
      <div style={card}>
        <h3 style={heading}>Past paper questions: {answer.topic}</h3>
        {answer.error && <p style={text}>{answer.error}</p>}
        <ol style={{ paddingLeft: 20 }}>
          {answer.questions.map((q: any, i: number) => (
            <li key={i} style={{ ...text, marginBottom: 10 }}>
              {q.question} <span style={{ color: "#4f46e5", fontSize: 13 }}>({q.type})</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div style={card}>
      <pre style={{ whiteSpace: "pre-wrap", color: "#334155" }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}