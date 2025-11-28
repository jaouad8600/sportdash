"use client";
import { useMemo, useState } from "react";
import {
  addVisit,
  loadVisits,
  saveVisits,
  Visit,
  GROUPS,
} from "@/lib/clientStore";

function toICSDate(d: string, t?: string) {
  // YYYYMMDDTHHMMSS (floating time, geen TZ gedoe)
  const hhmm = (t || "09:00").split(":");
  const HH = hhmm[0] || "09",
    MM = hhmm[1] || "00";
  return (
    d.replace(/-/g, "") + "T" + HH.padStart(2, "0") + MM.padStart(2, "0") + "00"
  );
}
function download(name: string, data: string, type: string) {
  const blob = new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export default function Bezoek() {
  const [list, setList] = useState<Visit[]>(() => loadVisits());
  const [f, setF] = useState<Visit>({
    id: "",
    title: "Bibliotheek",
    group: "Algemeen",
    kind: "Bibliotheek",
    date: new Date().toISOString().slice(0, 10),
    start: "13:00",
    end: "14:00",
    status: "gepland",
    note: "",
  } as Visit);
  function add() {
    if (!f.title.trim()) return;
    const v = { ...f };
    delete (v as any).id;
    addVisit(v);
    setList(loadVisits());
  }
  function toggle(id: string) {
    const next = list.map((v) =>
      v.id === id
        ? {
          ...v,
          status: (v.status === "gepland"
            ? "afgerond"
            : v.status === "afgerond"
              ? "geannuleerd"
              : "gepland") as Visit["status"],
        }
        : v,
    );
    saveVisits(next);
    setList(next);
  }
  function remove(id: string) {
    const next = list.filter((v) => v.id !== id);
    saveVisits(next);
    setList(next);
  }

  const csv = useMemo(() => {
    const rows = [
      ["title", "group", "kind", "date", "start", "end", "status", "note"],
      ...list.map((v) => [
        v.title,
        v.group,
        v.kind,
        v.date,
        v.start || "",
        v.end || "",
        v.status,
        v.note || "",
      ]),
    ];
    return rows
      .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }, [list]);

  const ics = useMemo(() => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//sportdash//bezoek//NL",
    ];
    for (const v of list) {
      if (v.status === "geannuleerd") continue;
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + v.id);
      lines.push("DTSTART:" + toICSDate(v.date, v.start));
      lines.push("DTEND:" + toICSDate(v.date, v.end || v.start));
      lines.push("SUMMARY:" + v.title + " (" + v.group + ")");
      if (v.note) lines.push("DESCRIPTION:" + v.note.replace(/\n/g, "\\n"));
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }, [list]);

  return (
    <div className="grid gap-3">
      <h1 className="text-xl font-bold">Bezoek / Bibliotheek</h1>

      <div className="grid md:grid-cols-6 gap-2 p-3 rounded-2xl border bg-white">
        <div className="md:col-span-2">
          <div className="text-xs opacity-70 mb-1">Titel</div>
          <input
            value={f.title}
            onChange={(e) => setF((v) => ({ ...v, title: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Groep</div>
          <select
            value={f.group}
            onChange={(e) => setF((v) => ({ ...v, group: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Soort</div>
          <select
            value={f.kind}
            onChange={(e) =>
              setF((v) => ({ ...v, kind: e.target.value as any }))
            }
            className="px-2 py-2 rounded-xl border w-full"
          >
            <option>Bibliotheek</option>
            <option>Bezoek</option>
            <option>Overig</option>
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Datum</div>
          <input
            type="date"
            value={f.date}
            onChange={(e) => setF((v) => ({ ...v, date: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Start</div>
          <input
            type="time"
            value={f.start}
            onChange={(e) => setF((v) => ({ ...v, start: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Eind</div>
          <input
            type="time"
            value={f.end}
            onChange={(e) => setF((v) => ({ ...v, end: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div className="md:col-span-6">
          <div className="text-xs opacity-70 mb-1">Notitie</div>
          <input
            value={f.note}
            onChange={(e) => setF((v) => ({ ...v, note: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div className="md:col-span-6 flex gap-2">
          <button onClick={add} className="btn btn-primary px-3 py-2 rounded-xl border btn">
            Toevoegen
          </button>
          <button
            className="btn btn-primary px-3 py-2 rounded-xl border"
            onClick={() => download("bezoek.csv", csv, "text/csv")}
          >
            Exporteer CSV
          </button>
          <button
            className="btn btn-primary px-3 py-2 rounded-xl border"
            onClick={() => download("bezoek.ics", ics, "text/calendar")}
          >
            Exporteer ICS
          </button>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Datum</th>
              <th className="text-left p-2">Tijd</th>
              <th className="text-left p-2">Titel</th>
              <th className="text-left p-2">Groep</th>
              <th className="text-left p-2">Soort</th>
              <th className="text-left p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.date}</td>
                <td className="p-2">
                  {v.start || "—"}
                  {v.end ? `–${v.end}` : ""}
                </td>
                <td className="p-2">{v.title}</td>
                <td className="p-2">{v.group}</td>
                <td className="p-2">{v.kind}</td>
                <td className="p-2">
                  <span
                    className={
                      "badge " +
                      (v.status === "geannuleerd"
                        ? "badge-danger"
                        : v.status === "gepland"
                          ? "badge-warning"
                          : "badge-ok")
                    }
                  >
                    {v.status}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <button
                    className="btn btn-primary px-2 py-1 rounded-lg border mr-2"
                    onClick={() => toggle(v.id)}
                  >
                    Toggle
                  </button>
                  <button
                    className="btn btn-primary px-2 py-1 rounded-lg border"
                    onClick={() => remove(v.id)}
                  >
                    Verwijder
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="p-3 text-sm opacity-70" colSpan={7}>
                  Nog geen items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
