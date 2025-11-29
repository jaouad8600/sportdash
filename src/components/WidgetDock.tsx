"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OverdrachtTile from "./OverdrachtTile";
import DailyRapportTile from "./DailyRapportTile";

export default function WidgetDock({ onlyOn = "/admin" }: { onlyOn?: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true); // open by default
  const [tab, setTab] = useState<"overdracht" | "rapport">("overdracht");

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  if (onlyOn && pathname !== onlyOn) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50 }}>
      {/* Toggle knop */}
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}
      >
        <button
          className="btn"
          onClick={() => setOpen((o) => !o)}
          aria-label="WidgetDock aan/uit"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 999,
            padding: "8px 10px",
            background: "#fff",
            boxShadow: "0 4px 16px rgba(2,6,23,.08)",
            cursor: "pointer",
          }}
        >
          {open ? "Dock verbergen" : "Dock tonen"}
        </button>
      </div>

      {/* Paneel */}
      {open && (
        <div
          style={{
            width: 380,
            maxWidth: "calc(100vw - 24px)",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 12px 32px rgba(2,6,23,.18)",
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 8,
              borderBottom: "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            <button
              onClick={() => setTab("overdracht")}
              className="wd-tab"
              style={tabStyle(tab === "overdracht")}
            >
              Overdracht
            </button>
            <button
              onClick={() => setTab("rapport")}
              className="wd-tab"
              style={tabStyle(tab === "rapport")}
            >
              Dagrapport
            </button>
            <div style={{ flex: 1 }} />
            <Link
              href="/kalender"
              style={{ fontSize: 12, textDecoration: "none", color: "#2563eb" }}
            >
              Kalender →
            </Link>
          </div>

          <div style={{ padding: 10 }}>
            {tab === "overdracht" && <OverdrachtTile compact />}
            {tab === "rapport" && <DailyRapportTile />}
          </div>
        </div>
      )}
    </div>
  );
}

function tabStyle(active: boolean) {
  return {
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid " + (active ? "#c7d2fe" : "#e5e7eb"),
    background: active ? "#eef2ff" : "#fff",
    color: active ? "#1e40af" : "#111",
    cursor: "pointer",
  } as const;
}
