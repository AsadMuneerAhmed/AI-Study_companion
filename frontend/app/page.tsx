"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Doc = { source_file: string; doc_type: string; chunks: number };

const CARDS = [
  {
    href: "/upload",
    title: "Upload Notes",
    description: "Add your lecture notes, slides or past papers.",
  },
  {
    href: "/study-plan",
    title: "Study Plan",
    description: "Build a study plan for any topic from your notes.",
  },
  {
    href: "/ask",
    title: "Ask Your Notes",
    description: "Search, summarize, quiz yourself, or practice past paper questions.",
  },
];

export default function Dashboard() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/documents`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load stats (${res.status})`);
        return res.json();
      })
      .then((data) => setDocs(data.documents))
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoaded(true));
  }, []);

  const notesFiles = docs.filter((d) => d.doc_type === "notes").length;
  const paperFiles = docs.filter((d) => d.doc_type === "past_paper").length;
  const totalChunks = docs.reduce((sum, d) => sum + d.chunks, 0);

  const stats = [
    { label: "Notes uploaded", value: notesFiles },
    { label: "Past papers", value: paperFiles },
    { label: "Total chunks", value: totalChunks },
  ];

  return (
    <main style={{ padding: 32, maxWidth: 960 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, color: "#0f172a" }}>Dashboard</h1>
      <p style={{ marginBottom: 24, color: "#64748b" }}>
        Pick what you want to do with your notes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 500, color: "#0f172a" }}>
              {loaded ? s.value : "..."}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ padding: "10px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: "block",
              padding: 20,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#0f172a",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 8, color: "#4f46e5" }}>{card.title}</h2>
            <p style={{ color: "#64748b", lineHeight: 1.5 }}>{card.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}