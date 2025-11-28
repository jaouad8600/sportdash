"use client";

import { useEffect, useMemo, useState } from "react";

type Group = { id: string; slug?: string; naam?: string; name?: string; kleur?: string; code?: string };

type Note = {
  id: string;
  groupId: string;
  text: string;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function gid(g: Group) {
  return String(g?.id ?? g?.slug ?? g?.code ?? g?.name ?? g?.naam ?? "").toLowerCase();
}
function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("nl-NL", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso || ""; }
}

export default function GroepenPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch("/api/groepen", { cache: "no-store" });
        const data = await res.json();
        if (abort) return;
        const items: Group[] = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setGroups(items);
      } finally { setLoading(false); }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-zinc-500">Laden…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Groepen</h1>
      <div className="grid gap-5">
        {groups.map((g) => <GroupCard key={gid(g)} group={g} />)}
        {groups.length === 0 && <div className="text-sm text-zinc-500">Geen groepen gevonden.</div>}
      </div>
    </div>
  );
}

function ColorButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border text-sm font-semibold
        ${active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300"}`}
    >
      {label}
    </button>
  );
}

function GroupCard({ group }: { group: Group }) {
  const groupId = useMemo(() => gid(group), [group]);
  const title = String((group?.naam ?? group?.name ?? groupId) || "Onbekend");
  const [kleur, setKleur] = useState<string | undefined>(group?.kleur);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);

  // Notities ophalen
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/aantekeningen?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" });
        const data = await res.json();
        if (abort) return;
        const items: Note[] = (Array.isArray(data?.items) ? data.items : []);
        // Filter leeg/null en sorteer nieuw → oud
        const clean = items
          .filter((n) => n && typeof n.text === "string" && n.text.trim().length > 0 && !n.archived)
          .sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
        setNotes(clean);
      } catch { /* negeren */ }
    })();
    return () => { abort = true; };
  }, [groupId]);

  async function setGroupColor(newColor: "groen" | "geel" | "oranje" | "rood") {
    try {
      setKleur(newColor);
      await fetch(`/api/groepen/${encodeURIComponent(groupId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ kleur: newColor }),
      });
    } catch {
      // rollback bij fout
    }
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch("/api/aantekeningen", {
        method: "POST",
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ groupId, text }),
      });
      const data = await res.json();
      const item: Note = data?.item ?? data; // API kan {item} of notitie zelf teruggeven
      if (item && typeof item.text === "string") {
        setNotes((prev) => [
          { ...item, groupId, text: item.text, archived: !!item.archived },
          ...prev,
        ]);
        setNoteText("");
      }
    } finally { setBusy(false); }
  }

  async function archiveNote(id: string) {
    try {
      await fetch(`/api/aantekeningen/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({ archived: true }),
      });
      setNotes((prev) => prev.filter(n => n.id !== id));
    } catch { /* noop */ }
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">{groupId}</div>
        </div>
        <div className="h-2 w-40 rounded-full overflow-hidden bg-zinc-100">
          <div
            className={{
              groen: "bg-emerald-500",
              geel: "bg-amber-400",
              oranje: "bg-orange-500",
              rood: "bg-red-600",
            }[String(kleur || "").toLowerCase()] || "bg-zinc-300"}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ColorButton active={kleur === "groen"} label="GROEN" onClick={() => setGroupColor("groen")} />
        <ColorButton active={kleur === "geel"} label="GEEL" onClick={() => setGroupColor("geel")} />
        <ColorButton active={kleur === "oranje"} label="ORANJE" onClick={() => setGroupColor("oranje")} />
        <ColorButton active={kleur === "rood"} label="ROOD" onClick={() => setGroupColor("rood")} />
      </div>

      <div className="space-y-2">
        <div className="font-medium">Notities</div>
        <div className="flex gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
            placeholder="Voeg notitie toe…"
            className="flex-1 rounded-md border px-3 py-2 outline-none focus:ring-2 ring-zinc-300"
          />
          <button
            onClick={addNote}
            disabled={busy || noteText.trim().length === 0}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold disabled:opacity-50"
          >
            Toevoegen
          </button>
        </div>

        {/* Lijst met notities direct onder het invoerveld */}
        <div className="mt-2 space-y-2">
          {notes.length === 0 && (
            <div className="text-sm text-zinc-500">Nog geen notities.</div>
          )}
          {notes.map((n) => (
            <div key={n.id} className="flex items-start justify-between rounded-md border border-zinc-200 p-3">
              <div>
                <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                <div className="text-xs text-zinc-500 mt-1">{fmtDate(n.createdAt || n.updatedAt)} — Aangemaakt</div>
              </div>
              <button
                onClick={() => archiveNote(n.id)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                title="Verbergen/archiveren"
              >
                Archiveren
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
