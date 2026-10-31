"use client";

import Tabs from "../../components/Tabs";

export default function AskPage() {
  return (
    <main style={{ padding: 32, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Ask Your Notes</h1>
      <Tabs />
    </main>
  );
}