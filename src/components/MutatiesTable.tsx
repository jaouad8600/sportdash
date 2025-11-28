"use client";

import { useEffect, useMemo, useState } from "react";
import TableFilter from "@/components/TableFilter";
import { toArray } from "@/lib/toArray";

type Mutatie = {
  id: string;
  titel?: string;
  title?: string;
  status?: string;
  datum?: string; // ISO date
  date?: string;
  omschrijving?: string;
  note?: string;
  [key: string]: any;
};

export default function MutatiesTable() {
  const [rows, setRows] = useState<Mutatie[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sportmutaties?activeOnly=true", { cache: "no-store" });
        const json = res.ok ? await res.json().catch(() => []) : [];
        if (active) setRows(toArray(json));
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = toArray<Mutatie>(rows);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) => {
      const name = r.youth ? `${r.youth.firstName} ${r.youth.lastName}` : (r.youthName || "");
      const group = r.group?.name || "";
      const searchStr = `${name} ${group} ${r.reason || ""} ${r.reasonType || ""}`.toLowerCase();
      return searchStr.includes(term);
    });
  }, [rows, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Mutaties</h3>
        <TableFilter value={q} onChange={setQ} placeholder="Zoek op naam, groep of reden..." />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-700">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium">Naam (Groep)</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Datum</th>
              <th className="px-3 py-2 text-left font-medium">Reden</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  Laden…
                </td>
              </tr>
            ) : toArray(filtered).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  Geen resultaten.
                </td>
              </tr>
            ) : (
              toArray(filtered).map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">
                    {r.youth ? (
                      <span>
                        {r.youth.firstName} {r.youth.lastName}
                        <span className="text-gray-400 font-normal ml-1">({r.group?.name || "?"})</span>
                      </span>
                    ) : (
                      <span>
                        {r.youthName || "Onbekend"}
                        {r.group?.name && <span className="text-gray-400 font-normal ml-1">({r.group.name})</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {r.reasonType || "Overig"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {r.startDate ? new Date(r.startDate).toLocaleDateString('nl-NL') : "-"}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {r.reason || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
