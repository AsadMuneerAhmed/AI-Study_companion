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
  const [runId, setRunId] = useState(0);

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
      setRunId((r) => r + 1);
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
      {data && <AgentResult key={runId} data={data} />}
    </div>
  );
}

function AgentResult({ data }: { data: any }) {
  const { intent, topic, answer, results } = data;
  const heading = { fontSize: 18, color: "#4f46e5", marginBottom: 12 };
  const sub = { fontSize: 15, color: "#0f172a", marginTop: 16, marginBottom: 8 };
  const text = { color: "#334155", lineHeight: 1.6 };

    if (intent === "search") {
    return (
      <div style={card}>
        <h3 style={heading}>Search results for: {topic}</h3>
        {results.length === 0 && <p style={text}>Nothing found.</p>}
        {results.map((r: any, i: number) => (
          <SearchItem key={i} item={r} query={topic} />
        ))}
      </div>
    );
  }
  if (typeof answer === "string") {
    return (
      <div style={card}>
        <p style={text}>{answer}</p>
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
    return <QuizView topic={answer.topic} questions={answer.questions ?? []} error={answer.error} />;
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

function QuizView({ topic, questions, error }: { topic: string; questions: any[]; error?: string }) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [missing, setMissing] = useState(false);

  const heading = { fontSize: 18, color: "#4f46e5", marginBottom: 12 };
  const text = { color: "#334155", lineHeight: 1.6 };

  if (error) {
    return (
      <div style={card}>
        <p style={text}>{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={card}>
        <p style={text}>No questions were generated. Please try again.</p>
      </div>
    );
  }

  const correctIndexOf = (q: any) =>
    q.options.findIndex((o: string) => o.trim() === String(q.answer).trim());

  const score = questions.filter((q, i) => picked[i] !== null && picked[i] === correctIndexOf(q)).length;

  function choose(qi: number, oi: number) {
    if (submitted) return;
    setMissing(false);
    setPicked(picked.map((v, i) => (i === qi ? oi : v)));
  }

  function check() {
    if (picked.some((v) => v === null)) {
      setMissing(true);
      return;
    }
    setSubmitted(true);
  }

  function retry() {
    setPicked(questions.map(() => null));
    setSubmitted(false);
    setMissing(false);
  }

  function optionStyle(qi: number, oi: number, correctIdx: number) {
    const isPicked = picked[qi] === oi;
    let border = "1px solid #e2e8f0";
    let background = "#ffffff";
    let color = "#334155";

    if (!submitted && isPicked) {
      border = "1px solid #4f46e5";
      background = "#eef2ff";
      color = "#3730a3";
    }
    if (submitted && oi === correctIdx) {
      border = "1px solid #10b981";
      background = "#ecfdf5";
      color = "#065f46";
    }
    if (submitted && isPicked && oi !== correctIdx) {
      border = "1px solid #f87171";
      background = "#fef2f2";
      color = "#b91c1c";
    }

    return {
      display: "block",
      width: "100%",
      textAlign: "left" as const,
      padding: "10px 12px",
      marginBottom: 8,
      border,
      borderRadius: 8,
      background,
      color,
      cursor: submitted ? "default" : "pointer",
    };
  }

  return (
    <div style={card}>
      <h3 style={heading}>Quiz: {topic}</h3>

      {questions.map((q, qi) => {
        const correctIdx = correctIndexOf(q);
        return (
          <div key={qi} style={{ marginBottom: 24 }}>
            <p style={{ color: "#0f172a", fontWeight: 600, marginBottom: 10 }}>
              {qi + 1}. {q.question}
            </p>
            {q.options.map((o: string, oi: number) => (
              <button key={oi} onClick={() => choose(qi, oi)} style={optionStyle(qi, oi, correctIdx)}>
                {o}
              </button>
            ))}
            {submitted && (
              <p style={{ fontSize: 14, color: picked[qi] === correctIdx ? "#065f46" : "#b91c1c" }}>
                {picked[qi] === correctIdx
                  ? "Correct."
                  : correctIdx >= 0
                  ? `Incorrect. The correct answer is: ${q.answer}`
                  : "Incorrect."}
              </p>
            )}
          </div>
        );
      })}

      {missing && (
        <p style={{ fontSize: 14, color: "#b91c1c", marginBottom: 12 }}>
          Answer all questions first.
        </p>
      )}

      {!submitted ? (
        <button
          onClick={check}
          style={{
            padding: "10px 18px",
            background: "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Check answers
        </button>
      ) : (
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
            You got {score} of {questions.length} correct.
          </p>
          <button
            onClick={retry}
            style={{
              padding: "10px 18px",
              background: "#ffffff",
              color: "#4f46e5",
              border: "1px solid #4f46e5",
              borderRadius: 8,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function highlight(text: string, query: string) {
  const words = query
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return text;
  const re = new RegExp(`(${words.join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{ background: "#fef08a", color: "#0f172a", padding: "0 2px", borderRadius: 3 }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function SearchItem({ item, query }: { item: any; query: string }) {
  const [open, setOpen] = useState(false);
  const long = item.text.length > 260;
  const shown = !open && long ? item.text.slice(0, 260) + "..." : item.text;

  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 12,
            padding: "2px 10px",
            borderRadius: 999,
            background: "#f1f5f9",
            color: "#334155",
            border: "1px solid #e2e8f0",
          }}
        >
          {item.source_file}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: "#eef2ff",
            color: "#3730a3",
          }}
        >
          {item.doc_type}
        </span>
      </div>
      <p style={{ color: "#334155", lineHeight: 1.6 }}>{highlight(shown, query)}</p>
      {long && (
        <button
          onClick={() => setOpen(!open)}
          style={{
            marginTop: 4,
            background: "none",
            border: "none",
            color: "#4f46e5",
            cursor: "pointer",
            padding: 0,
            fontSize: 13,
          }}
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}