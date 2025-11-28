"use client";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id?: string;
  titel?: string;
  omschrijving?: string;
  status?: "open" | "afgehandeld";
  groepId?: string;
  datum?: string;
};
type Groep = { id: string; naam: string; afdeling: "EB" | "VLOED" };

export default function MutatiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [groepen, setGroepen] = useState<Groep[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Row | undefined>();

  async function load() {
    const [rm, rg] = await Promise.all([
      fetch("/api/mutaties", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/groepen", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setRows(Array.isArray(rm) ? rm : []);
    setGroepen(Array.isArray(rg) ? rg : []);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return (rows || []).filter(
      (r) =>
        !q.trim() ||
        (r.titel || "").toLowerCase().includes(q.toLowerCase()) ||
        (r.omschrijving || "").toLowerCase().includes(q.toLowerCase()),
    );
  }, [rows, q]);

  async function save() {
    if (!sel) return;
    const base = {
      titel: sel.titel || "",
      omschrijving: sel.omschrijving || "",
      status: sel.status || "open",
      groepId: sel.groepId || "",
      datum: sel.datum || new Date().toISOString(),
    };
    if (!sel.id) {
      const r = await fetch("/api/mutaties", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(base),
      });
      if (!r.ok) {
        alert("Fout bij toevoegen");
        return;
      }
    } else {
      // demo: POST opnieuw (PATCH route niet gemaakt voor eenvoud)
      const r = await fetch("/api/mutaties", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...base, id: sel.id }),
      });
      if (!r.ok) {
        alert("Fout bij opslaan");
        return;
      }
    }
    setSel(undefined);
    load();
  }

  function remove(id?: string) {
    if (!id) return;
    setRows((rows || []).filter((x) => x.id !== id));
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sportmutaties</h1>
        <button
          className="btn btn-primary bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded"
          onClick={() => setSel({ status: "open" })}
        >
          + Nieuwe mutatie
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter…"
        className="border rounded px-2 py-1 w-full"
      />

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Titel</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Groep</th>
              <th className="text-right px-3 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">
                  <button
                    className="btn btn-primary text-left text-blue-700 hover:underline"
                    onClick={() => setSel(r)}
                  >
                    {r.titel}
                  </button>
                </td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">
                  {groepen.find((g) => g.id === r.groepId)?.naam || "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn btn-primary text-blue-600 hover:underline"
                      onClick={() => setSel(r)}
                    >
                      Bewerken
                    </button>
                    <button
                      className="btn btn-primary text-rose-600 hover:underline"
                      onClick={() => remove(r.id)}
                    >
                      Verwijderen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!filtered || filtered.length === 0) && (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={4}>
                  Geen resultaten
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow max-w-xl w-full p-4 space-y-3">
            <div className="text-lg font-semibold">
              {sel.id ? "Mutatie bewerken" : "Nieuwe mutatie"}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Titel</div>
                <input
                  value={sel.titel || ""}
                  onChange={(e) => setSel({ ...sel, titel: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Omschrijving</div>
                <textarea
                  value={sel.omschrijving || ""}
                  onChange={(e) =>
                    setSel({ ...sel, omschrijving: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                  rows={3}
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <select
                  value={sel.status || "open"}
                  onChange={(e) =>
                    setSel({ ...sel, status: e.target.value as any })
                  }
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="open">open</option>
                  <option value="afgehandeld">afgehandeld</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Groep</div>
                <select
                  value={sel.groepId || ""}
                  onChange={(e) => setSel({ ...sel, groepId: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                >
                  {(Array.isArray(groepen) ? groepen : []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.afdeling} · {g.naam}
                    </option>
                  ))}
                  {(!groepen || (groepen || []).length === 0) && (
                    <option value="">(geen groepen)</option>
                  )}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-primary px-3 py-1.5 rounded border"
                onClick={() => setSel(undefined)}
              >
                Annuleren
              </button>
              <button
                onClick={save}
                className="btn btn-primary px-3 py-1.5 rounded bg-green-600 text-white"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
