"use client";
import { useEffect, useState } from "react";

type Row = {
  id?: string;
  date: string;
  tijd?: string;
  titel: string;
  locatie?: string;
  afdeling?: "EB" | "VLOED";
};
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PlanningPage() {
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Row | undefined>();

  async function load(d: string) {
    const r = await fetch(`/api/planning?date=${d}`, { cache: "no-store" });
    const j = await r.json().catch(() => []);
    setRows(Array.isArray(j) ? j : []);
  }
  useEffect(() => {
    load(date);
  }, [date]);

  function filtered() {
    return (rows || []).filter(
      (r) =>
        !q.trim() ||
        (r.titel || "").toLowerCase().includes(q.toLowerCase()) ||
        (r.locatie || "").toLowerCase().includes(q.toLowerCase()),
    );
  }

  async function save() {
    if (!sel) return;
    const base = {
      date: sel.date,
      tijd: sel.tijd || "",
      titel: sel.titel || "",
      locatie: sel.locatie || "",
      afdeling: sel.afdeling,
    };
    if (!sel.id) {
      const r = await fetch("/api/planning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(base),
      });
      if (!r.ok) {
        alert("Fout bij toevoegen");
        return;
      }
    } else {
      const r = await fetch(`/api/planning/${sel.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(base),
      });
      if (!r.ok) {
        alert("Fout bij opslaan");
        return;
      }
    }
    setSel(undefined);
    load(date);
  }
  async function remove(id?: string) {
    if (!id) return;
    await fetch(`/api/planning/${id}`, { method: "DELETE" });
    load(date);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dagplanning</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            className="btn btn-primary bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded"
            onClick={() => setSel({ date, titel: "", afdeling: "EB" })}
          >
            + Item
          </button>
        </div>
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
              <th className="text-left px-3 py-2">Tijd</th>
              <th className="text-left px-3 py-2">Titel</th>
              <th className="text-left px-3 py-2">Locatie</th>
              <th className="text-left px-3 py-2">Afdeling</th>
              <th className="text-right px-3 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered().map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">{r.tijd || "--:--"}</td>
                <td className="px-3 py-2">{r.titel}</td>
                <td className="px-3 py-2">{r.locatie || "-"}</td>
                <td className="px-3 py-2">{r.afdeling || "-"}</td>
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
            {filtered().length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-gray-500" colSpan={5}>
                  Geen items
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
              {sel.id ? "Bewerken" : "Nieuw item"}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Datum</div>
                <input
                  type="date"
                  value={sel.date}
                  onChange={(e) => setSel({ ...sel, date: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Tijd</div>
                <input
                  value={sel.tijd || ""}
                  onChange={(e) => setSel({ ...sel, tijd: e.target.value })}
                  placeholder="14:00"
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Titel</div>
                <input
                  value={sel.titel || ""}
                  onChange={(e) => setSel({ ...sel, titel: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Locatie</div>
                <input
                  value={sel.locatie || ""}
                  onChange={(e) => setSel({ ...sel, locatie: e.target.value })}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Afdeling</div>
                <select
                  value={sel.afdeling || "EB"}
                  onChange={(e) =>
                    setSel({ ...sel, afdeling: e.target.value as any })
                  }
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="EB">EB</option>
                  <option value="VLOED">VLOED</option>
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
