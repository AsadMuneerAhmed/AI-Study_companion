"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload Notes" },
  { href: "/study-plan", label: "Study Plan" },
  { href: "/ask", label: "Ask Your Notes" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        padding: 24,
        background: "#0f172a",
        color: "#ffffff",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28, color: "#ffffff" }}>
        Study Companion
      </h2>
      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                textDecoration: "none",
                color: isActive ? "#ffffff" : "#cbd5e1",
                background: isActive ? "#4f46e5" : "transparent",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}