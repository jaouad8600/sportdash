"use client";

import { useEffect, useMemo, useState } from "react";

type Kleur = "GREEN" | "YELLOW" | "ORANGE" | "RED";
type Note = { id: string; tekst: string; auteur?: string; createdAt: string };
type Groep = {
  id: string;
  naam: string;
  afdeling?: "EB" | "VLOED";
  kleur: Kleur;
  notities: Note[];
};

const KLEUR_LABEL: Record<Kleur, string> = {
  GREEN: "Groen",
  YELLOW: "Geel",
  ORANGE: "Oranje",
  RED: "Rood",
};
const KLEUR_BG: Record<Kleur, string> = {
  GREEN: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  YELLOW: "bg-amber-100 text-amber-800 ring-amber-200",
  ORANGE: "bg-orange-100 text-orange-800 ring-orange-200",
  RED: "bg-rose-100 text-rose-800 ring-rose-200",
};

export default function GroepenPage() {
  const [loading, setLoading] = useState(true);
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/groepen", { cache: "no-store" });
    const data = await r.json();
    setGroepen(Array.isArray(data) ? data : []);
    setLoading(false);
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
        (g.afdeling ?? "").toLowerCase().includes(s),
    );
  }, [groepen, q]);

  const eb = useMemo(
    () => filtered.filter((g) => g.afdeling === "EB"),
    [filtered],
  );
  const vloed = useMemo(
    () => filtered.filter((g) => g.afdeling === "VLOED"),
    [filtered],
  );
  const overige = useMemo(
    () => filtered.filter((g) => !g.afdeling),
    [filtered],
  );

  async function setKleur(g: Groep, kleur: Kleur) {
    const prev = [...groepen];
    setGroepen((gs) => gs.map((x) => (x.id === g.id ? { ...x, kleur } : x)));
    const res = await fetch("/api/groepen", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: g.id, kleur }),
    });
    if (!res.ok) {
      // rollback
      setGroepen(prev);
      const err = await res.json().catch(() => ({}));
      alert("Opslaan mislukt: " + (err?.error ?? res.statusText));
    }
  }

  async function addNote(g: Groep, tekst: string, auteur?: string) {
    const res = await fetch(`/api/groepen/${g.id}/notities`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tekst, auteur }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Notitie toevoegen mislukt: " + (err?.error ?? res.statusText));
      return;
    }
    const note: Note = await res.json();
    setGroepen((gs) =>
      gs.map((x) =>
        x.id === g.id ? { ...x, notities: [note, ...x.notities] } : x,
      ),
    );
  }

  async function delNote(g: Groep, note: Note) {
    const res = await fetch(`/api/groepen/${g.id}/notities/${note.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Notitie verwijderen mislukt: " + (err?.error ?? res.statusText));
      return;
    }
    setGroepen((gs) =>
      gs.map((x) =>
        x.id === g.id
          ? { ...x, notities: x.notities.filter((n) => n.id !== note.id) }
          : x,
      ),
    );
  }

  function Sectie({ titel, items }: { titel: string; items: Groep[] }) {
    if (!items.length) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{titel}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((g) => (
            <article
              key={g.id}
              className="rounded-xl border bg-white shadow-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold truncate">{g.naam}</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${KLEUR_BG[g.kleur]}`}
                >
                  <span className="block w-2 h-2 rounded-full bg-current/60"></span>
                  {KLEUR_LABEL[g.kleur]}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["GREEN", "YELLOW", "ORANGE", "RED"] as Kleur[]).map((k) => (
                  <button
                    className="btn btn-primary btn"
                    key={k}
                    onClick={() => setKleur(g, k)}
                    className={`text-xs px-2 py-1 rounded-md ring-1 transition ${
                      g.kleur === k
                        ? KLEUR_BG[k]
                        : "bg-zinc-50 text-zinc-700 ring-zinc-200 hover:bg-zinc-100"
                    }`}
                    title={`Zet kleur op ${KLEUR_LABEL[k]}`}
                  >
                    {KLEUR_LABEL[k]}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500">
                  Notitie toevoegen
                </label>
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const tekst = String(fd.get("tekst") || "").trim();
                    const auteur =
                      String(fd.get("auteur") || "").trim() || undefined;
                    if (!tekst) return;
                    (e.currentTarget as HTMLFormElement).reset();
                    await addNote(g, tekst, auteur);
                  }}
                >
                  <input
                    name="tekst"
                    placeholder="Notitie..."
                    className="flex-1 rounded-md border px-2 py-1 text-sm"
                  />
                  <input
                    name="auteur"
                    placeholder="Naam"
                    className="w-36 rounded-md border px-2 py-1 text-sm"
                  />
                  <button className="btn btn-primary rounded-md bg-black text-white px-3 py-1 text-sm btn">
                    Toevoegen
                  </button>
                </form>

                {g.notities.length > 0 ? (
                  <ul className="divide-y text-sm">
                    {g.notities.map((n) => (
                      <li
                        key={n.id}
                        className="py-2 flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="text-zinc-800">{n.tekst}</div>
                          <div className="text-xs text-zinc-500">
                            {n.auteur ?? "onbekend"} •{" "}
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn"
                          onClick={() => delNote(g, n)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Verwijderen
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500">
                    Nog geen notities.
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Groepen</h1>
          <p className="text-sm text-zinc-500">
            Kleurstatus en notities per groep. Slaat automatisch op.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op naam of afdeling…"
          className="rounded-md border px-3 py-2 text-sm w-64 max-w-full"
        />
      </div>

      {loading ? (
        <div className="text-sm text-zinc-500">Laden…</div>
      ) : (
        <div className="space-y-8">
          <Sectie titel="Afdeling EB" items={eb} />
          <Sectie titel="Afdeling Vloed" items={vloed} />
          <Sectie titel="Overige" items={overige} />
        </div>
      )}
    </div>
  );
}
