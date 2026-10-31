"use client";

import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

type Doc = { source_file: string; doc_type: string; chunks: number };

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("notes");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [listError, setListError] = useState("");

  async function loadDocs() {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (!res.ok) throw new Error(`Could not load files (${res.status})`);
      const data = await res.json();
      setDocs(data.documents);
      setListError("");
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("doc_type", docType);
      const res = await fetch(`${API_BASE}/store-document`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setStatus(`Stored ${data.total_chunks} chunks from ${data.source_file}`);
      await loadDocs();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function remove(doc: Doc) {
    if (!window.confirm(`Delete "${doc.source_file}"? This cannot be undone.`)) return;
    try {
      const params = new URLSearchParams({ source_file: doc.source_file, doc_type: doc.doc_type });
      const res = await fetch(`${API_BASE}/documents?${params.toString()}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await loadDocs();
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const card = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 24,
  };

  function renderGroup(title: string, items: Doc[]) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "#64748b", marginBottom: 8 }}>{title}</h3>
        {items.map((d) => (
          <div
            key={`${d.doc_type}-${d.source_file}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <p style={{ color: "#0f172a", fontWeight: 500 }}>{d.source_file}</p>
              <p style={{ color: "#64748b", fontSize: 13 }}>{d.chunks} chunks</p>
            </div>
            <button
              onClick={() => remove(d)}
              style={{
                padding: "6px 12px",
                background: "#ffffff",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    );
  }

  const notes = docs.filter((d) => d.doc_type === "notes");
  const papers = docs.filter((d) => d.doc_type === "past_paper");

  return (
    <main style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 26, marginBottom: 8, color: "#0f172a" }}>Upload Notes</h1>
      <p style={{ marginBottom: 24, color: "#64748b" }}>
        Upload lecture notes, slides or past papers. They will be used for study plans, quizzes and questions.
      </p>

      <div style={{ ...card, marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 16, color: "#0f172a", fontWeight: 500 }}>
          Document type
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            style={{
              display: "block",
              marginTop: 6,
              padding: 8,
              width: "100%",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              background: "#ffffff",
            }}
          >
            <option value="notes">Notes</option>
            <option value="past_paper">Past paper</option>
          </select>
        </label>

        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#0f172a", fontWeight: 500, marginBottom: 6 }}>
            File (PDF, PPTX, DOCX or TXT)
          </p>
          <input
            type="file"
            accept=".pdf,.pptx,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: "block" }}
          />
        </div>

        <button
          onClick={upload}
          disabled={!file || loading}
          style={{
            padding: "10px 18px",
            background: !file || loading ? "#a5b4fc" : "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            cursor: !file || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Uploading..." : "Upload & Store"}
        </button>

        {status && (
          <p
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "#eef2ff",
              color: "#3730a3",
              borderRadius: 8,
            }}
          >
            {status}
          </p>
        )}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 18, color: "#0f172a", marginBottom: 16 }}>Uploaded materials</h2>

        {listError && (
          <p style={{ padding: "10px 12px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 12 }}>
            {listError}
          </p>
        )}

        {docs.length === 0 && !listError && (
          <p style={{ color: "#64748b" }}>No files uploaded yet.</p>
        )}

        {renderGroup("Notes", notes)}
        {renderGroup("Past papers", papers)}
      </div>
    </main>
  );
}