"use client";

import { useEffect, useMemo, useState } from "react";

type Kleur = "GREEN" | "YELLOW" | "ORANGE" | "RED";
type Note = { id: string; tekst: string; auteur?: string; createdAt: string };
type Groep = { id: string; naam: string; kleur: Kleur; notities: Note[] };

const KLEUREN: { value: Kleur; label: string; bg: string; text: string }[] = [
  {
    value: "GREEN",
    label: "Groen",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  {
    value: "YELLOW",
    label: "Geel",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
  },
  {
    value: "ORANGE",
    label: "Oranje",
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  { value: "RED", label: "Rood", bg: "bg-rose-100", text: "text-rose-700" },
];

export default function GroepenPage() {
  const [loading, setLoading] = useState(false);
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/groepen", { cache: "no-store" });
      const j = await r.json();
      setGroepen(Array.isArray(j?.data) ? (j.data as Groep[]) : []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groepen;
    return groepen.filter(
      (g) =>
        g.naam.toLowerCase().includes(s) ||
        g.notities.some((n) => n.tekst.toLowerCase().includes(s)),
    );
  }, [groepen, q]);

  async function setKleur(id: string, kleur: Kleur) {
    const prev = groepen.slice();
    setGroepen(groepen.map((g) => (g.id === id ? { ...g, kleur } : g)));
    const r = await fetch(`/api/groepen/${id}/kleur`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kleur }),
    });
    if (!r.ok) {
      // rollback
      setGroepen(prev);
    }
  }

  async function addNote(id: string, tekst: string, auteur?: string) {
    const r = await fetch(`/api/groepen/${id}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tekst, auteur }),
    });
    if (r.ok) {
      const j = await r.json();
      setGroepen((gs) =>
        gs.map((g) =>
          g.id === id ? { ...g, notities: [j.data, ...g.notities] } : g,
        ),
      );
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groepen</h1>
          <p className="text-sm text-zinc-500">
            Kleurstatus en notities per groep.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Filter op naam of notities…"
            className="border rounded-md px-3 py-2 text-sm w-72"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={load}
            className="btn btn-primary rounded-md border px-3 py-2 text-sm bg-white hover:bg-zinc-50 btn"
          >
            Vernieuwen
          </button>
        </div>
      </div>

      {loading && <div className="text-zinc-500 text-sm">Laden…</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((g) => {
          const meta = KLEUREN.find((k) => k.value === g.kleur)!;
          return (
            <div
              key={g.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{g.naam}</div>
                <span
                  className={`text-xs px-2 py-1 rounded-md ${meta.bg} ${meta.text}`}
                >
                  {meta.label}
                </span>
              </div>

              <div className="mt-3">
                <label className="text-xs text-zinc-500">Kleur wijzigen</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {KLEUREN.map((k) => (
                    <button
                      className="btn btn-primary btn"
                      key={k.value}
                      onClick={() => setKleur(g.id, k.value)}
                      className={`text-xs px-2 py-1 rounded-md border ${k.bg} ${k.text} ${g.kleur === k.value ? "ring-2 ring-offset-2 ring-black/20" : ""}`}
                      title={k.label}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <details className="group">
                  <summary className="cursor-pointer select-none text-sm text-zinc-700 group-open:mb-2">
                    Notities ({g.notities.length})
                  </summary>
                  <ul className="space-y-2">
                    {g.notities.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-md bg-zinc-50 p-2 text-xs text-zinc-700"
                      >
                        <div>{n.tekst}</div>
                        <div className="mt-1 text-[11px] text-zinc-500">
                          {n.auteur ? `— ${n.auteur} · ` : "— "}
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <AddNoteForm onAdd={(t, a) => addNote(g.id, t, a)} />
                </details>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-zinc-500">Geen groepen gevonden.</div>
      )}
    </div>
  );
}

function AddNoteForm({
  onAdd,
}: {
  onAdd: (tekst: string, auteur?: string) => void;
}) {
  const [tekst, setTekst] = useState("");
  const [auteur, setAuteur] = useState("");
  const disabled = !tekst.trim();
  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) {
          onAdd(tekst.trim(), auteur.trim() || undefined);
          setTekst("");
          setAuteur("");
        }
      }}
    >
      <input
        className="border rounded-md px-2 py-1 text-xs"
        placeholder="Nieuwe notitie…"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
      />
      <div className="flex gap-2">
        <input
          className="border rounded-md px-2 py-1 text-xs"
          placeholder="Auteur (optioneel)"
          value={auteur}
          onChange={(e) => setAuteur(e.target.value)}
        />
        <button
          disabled={disabled}
          className="btn btn-primary rounded-md bg-black text-white px-3 py-1 text-xs disabled:opacity-40 btn"
        >
          Toevoegen
        </button>
      </div>
    </form>
  );
}
