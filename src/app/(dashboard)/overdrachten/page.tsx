"use client";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  titel: string;
  inhoud?: string;
  groepId?: string;
  createdAt: string;
  updatedAt: string;
};
type Groep = { id: string; naam: string; afdeling: "EB" | "VLOED" };
const BTN =
  "bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1.5";

export default function OverdrachtenPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<Row>>({});

  async function load() {
    const [a, b] = await Promise.all([
      fetch("/api/overdrachten", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/groepen", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setRows(Array.isArray(a) ? a : []);
    setGroepen(Array.isArray(b) ? b : []);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const xs = Array.isArray(rows) ? rows : [];
    if (!q.trim()) return xs;
    const s = q.toLowerCase();
    return xs.filter(
      (r) =>
        (r.titel || "").toLowerCase().includes(s) ||
        (r.inhoud || "").toLowerCase().includes(s),
    );
  }, [rows, q]);

  async function add() {
    if (!form.titel) return alert("Titel verplicht");
    await fetch("/api/overdrachten", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({});
    await load();
  }
  async function save(r: Row) {
    await fetch("/api/overdrachten", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(r),
    });
    await load();
  }
  async function remove(id: string) {
    await fetch("/api/overdrachten", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Overdrachten</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter..."
          className="rounded border px-3 py-1.5"
        />
        <input
          value={form.titel || ""}
          onChange={(e) => setForm((s) => ({ ...s, titel: e.target.value }))}
          placeholder="Nieuwe overdracht"
          className="rounded border px-3 py-1.5"
        />
        <select
          value={form.groepId || ""}
          onChange={(e) =>
            setForm((s) => ({ ...s, groepId: e.target.value || undefined }))
          }
          className="rounded border px-2 py-1.5"
        >
          <option value="">– koppel groep –</option>
          {(Array.isArray(groepen) ? groepen : []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.afdeling} · {g.naam}
            </option>
          ))}
        </select>
        <button onClick={add} className={BTN}>
          Toevoegen
        </button>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left px-3 py-2">Titel</th>
              <th className="text-left px-3 py-2">Inhoud</th>
              <th className="text-left px-3 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(filtered) ? filtered : []).map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">
                  <input
                    value={r.titel}
                    onChange={(e) =>
                      setRows((xs) =>
                        xs.map((x) =>
                          x.id === r.id ? { ...x, titel: e.target.value } : x,
                        ),
                      )
                    }
                    className="rounded border px-2 py-1 w-full"
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    value={r.inhoud || ""}
                    onChange={(e) =>
                      setRows((xs) =>
                        xs.map((x) =>
                          x.id === r.id ? { ...x, inhoud: e.target.value } : x,
                        ),
                      )
                    }
                    className="rounded border px-2 py-1 w-full h-20"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1.5 text-xs"
                      onClick={() => save(r)}
                    >
                      Opslaan
                    </button>
                    <button
                      className="btn btn-primary text-rose-600 text-xs hover:underline"
                      onClick={() => remove(r.id)}
                    >
                      Verwijderen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-zinc-500 py-6">
                  Geen overdrachten.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
