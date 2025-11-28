"use client";

import { useEffect, useMemo, useState } from "react";

type Group = { id: string; slug?: string; naam?: string; name?: string; kleur?: string; code?: string };

type Note = {
  id: string;
  groupId: string;
  text: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("nl-NL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "";
  }
}

function gid(g: Group) {
  return String(g?.id ?? g?.slug ?? g?.code ?? g?.name ?? g?.naam ?? "").toLowerCase();
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
      } finally {
        setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-zinc-500">Laden…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Groepen</h1>
      <div className="grid gap-5">
        {groups.map((g) => <GroupCard key={gid(g)} group={g} />)}
        {groups.length === 0 && (
          <div className="text-sm text-zinc-500">Geen groepen gevonden.</div>
        )}
      </div>
    </div>
  );
}

function ColorButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md border text-sm font-semibold
        ${active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300"}`}
    >
      {label}
    </button>
  );
}

function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: "green" | "violet" | "zinc" }) {
  const tones: Record<string, string> = {
    green: "bg-green-50 text-green-700 ring-green-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    zinc: "bg-zinc-50 text-zinc-700 ring-zinc-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function GroupCard({ group }: { group: Group }) {
  const groupId = useMemo(() => gid(group), [group]);
  const title = String((group?.naam ?? group?.name ?? groupId) || "Onbekend");
  const [kleur, setKleur] = useState<string | undefined>(group?.kleur);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [mutOpen, setMutOpen] = useState<number>(0);
  const [indOpen, setIndOpen] = useState<number>(0);

  // Notities ophalen
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/aantekeningen?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" });
        const data = await res.json();
        if (abort) return;
        const items: Note[] = Array.isArray(data?.items) ? data.items : [];
        // Alleen tonen wat daadwerkelijk tekst heeft, newest first
        const clean = items
          .filter((n: any) => n && typeof n.text === "string" && n.text.trim().length > 0 && !n.archived)
          .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
        setNotes(clean);
      } catch {/* ignore */ }
    })();
    return () => { abort = true; };
  }, [groupId]);

  // kleine extra: open mutaties/indicaties tellen
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [mRes, iRes] = await Promise.allSettled([
          fetch(`/api/mutaties?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" }),
          fetch(`/api/indicaties?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store" }),
        ]);
        if (!abort && mRes.status === "fulfilled") {
          const d = await mRes.value.json();
          const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
          setMutOpen(items.filter((x: any) => String(x?.status || "open").toLowerCase() === "open").length);
        }
        if (!abort && iRes.status === "fulfilled") {
          const d = await iRes.value.json();
          const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
          setIndOpen(items.filter((x: any) => {
            const s = String(x?.status || "open").toLowerCase();
            return s === "open" || s === "in behandeling" || s === "in-behandeling";
          }).length);
        }
      } catch {/* ignore */ }
    })();
    return () => { abort = true; };
  }, [groupId]);

  async function saveColor(newKleur: string) {
    setKleur(newKleur);
    try {
      await fetch(`/api/groepen/${encodeURIComponent(groupId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kleur: newKleur }),
        cache: "no-store",
      });
    } catch {/* ignore */ }
  }

  async function addNote() {
    const txt = noteText.trim();
    if (!txt) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/aantekeningen`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        // API verwacht { item } — fallback werkt ook als server plain body accepteert
        body: JSON.stringify({ item: { groupId, text: txt } }),
      });
      const data = await res.json().catch(() => null);
      const item: Note | null =
        (data && (data.item as Note)) ||
        (Array.isArray(data?.items) ? (data.items[0] as Note) : null) ||
        (data as Note);
      if (item && item.text) {
        setNotes(prev => [
          {
            ...item,
            groupId: item.groupId || groupId,
            text: item.text,
            archived: !!item.archived,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        setNoteText("");
      }
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !busy) {
      e.preventDefault();
      addNote();
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="green">open mutaties: {mutOpen}</Badge>
            <Badge tone="violet">open indicaties: {indOpen}</Badge>
          </div>
        </div>
        {/* eenvoudige kleurstatus balk rechtsboven */}
        <div className="h-2 w-40 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className={{
              groen: "bg-green-600",
              geel: "bg-yellow-500",
              oranje: "bg-orange-500",
              rood: "bg-red-600",
            }[String(kleur || "").toLowerCase()] || "bg-zinc-300"}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium text-zinc-700 mb-2">Kleurstatus</div>
        <div className="flex flex-wrap gap-2">
          <ColorButton active={kleur === "groen"} label="GROEN" onClick={() => saveColor("groen")} />
          <ColorButton active={kleur === "geel"} label="GEEL" onClick={() => saveColor("geel")} />
          <ColorButton active={kleur === "oranje"} label="ORANJE" onClick={() => saveColor("oranje")} />
          <ColorButton active={kleur === "rood"} label="ROOD" onClick={() => saveColor("rood")} />
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium text-zinc-700 mb-2">Notities</div>
        <div className="flex items-stretch gap-3">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Voeg notitie toe…"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Nieuwe notitie"
          />
          <button
            onClick={addNote}
            disabled={busy || noteText.trim().length === 0}
            className={`px-5 py-3 rounded-lg text-sm font-semibold text-white ${busy || noteText.trim().length === 0 ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            Toevoegen
          </button>
        </div>

        {/* DIRECT tonen: nieuwste bovenaan */}
        <div className="mt-4 space-y-2">
          {notes.map(n => (
            <div key={n.id || n.createdAt} className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="text-sm text-zinc-900 whitespace-pre-wrap">{n.text}</div>
              <div className="mt-1 text-xs text-zinc-500">{fmtDate(n.updatedAt || n.createdAt)} — Aangemaakt</div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-xs text-zinc-500">Nog geen notities.</div>
          )}
        </div>
      </div>
    </div>
  );
}
