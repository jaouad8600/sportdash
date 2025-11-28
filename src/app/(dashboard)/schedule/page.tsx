"use client";
import { useMemo, useState } from "react";
import { addDays, format, startOfWeek, isWithinInterval } from "date-fns";
import { nl } from "date-fns/locale";
import { CalEvent, GROUPS, loadEvents, upsertEvents } from "@/lib/clientStore";
type Draft = {
  dayIndex: number;
  start: string;
  end: string;
  group: string;
  title: string;
};
const toDate = (base: Date, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m ?? 0, 0, 0);
  return d;
};
const tide = (hhmm: string) =>
  Number(hhmm.split(":")[0] || "0") < 16 ? "eb" : "vloed";
const dl = (name: string, data: string, type: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
};
const icsDate = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;

export default function SchedulePage() {
  const [anchor, setAnchor] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  const header = `${format(days[0], "d MMMM", { locale: nl })} – ${format(days[6], "d MMMM yyyy", { locale: nl })}`;
  const [draft, setDraft] = useState<Draft>({
    dayIndex: 0,
    start: "16:00",
    end: "16:45",
    group: "Algemeen",
    title: "Sportmoment",
  });
  const [pending, setPending] = useState<Draft[]>([]);
  const [all, setAll] = useState(() => loadEvents());
  const range = { start: days[0], end: addDays(days[6], 1) };
  const weekEvents = useMemo(
    () => all.filter((e) => isWithinInterval(e.start, range)),
    [all, anchor],
  );

  const addBlock = () => setPending((p) => [...p, draft]);
  const autofill = () =>
    setPending(days.map((_, i) => ({ ...draft, dayIndex: i })));
  const clearPending = () => setPending([]);
  const saveAll = () => {
    const news: CalEvent[] = pending.map((b) => {
      const d = days[b.dayIndex];
      const s = toDate(d, b.start),
        e = toDate(d, b.end);
      return {
        id: crypto.randomUUID(),
        title: b.title || "Sportmoment",
        start: s,
        end: e,
        tide: tide(b.start),
        group: b.group || "Algemeen",
      };
    });
    upsertEvents(news);
    setAll(loadEvents());
    setPending([]);
    alert(`Opgeslagen: ${news.length} blok(ken).`);
  };
  const exportICS = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//sportdash//schedule//NL",
    ];
    for (const ev of weekEvents) {
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + ev.id);
      lines.push("DTSTART:" + icsDate(ev.start));
      lines.push("DTEND:" + icsDate(ev.end));
      lines.push("SUMMARY:" + ev.title + " (" + ev.group + ")");
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    dl("week.ics", lines.join("\r\n"), "text/calendar");
  };

  return (
    <div className="grid gap-3">
      <h1 className="text-xl font-bold">Schedule</h1>
      <div className="text-sm text-zinc-600">{header}</div>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary px-3 py-2 rounded-xl border"
          onClick={() => setAnchor(addDays(anchor, -7))}
        >
          ← Vorige
        </button>
        <button
          className="btn btn-primary px-3 py-2 rounded-xl border"
          onClick={() =>
            setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))
          }
        >
          Vandaag
        </button>
        <button
          className="btn btn-primary px-3 py-2 rounded-xl border"
          onClick={() => setAnchor(addDays(anchor, 7))}
        >
          Volgende →
        </button>
        <div className="grow"></div>
        <button onClick={autofill} className="btn btn-primary px-3 py-2 rounded-xl border">
          Auto-vul
        </button>
        <button onClick={saveAll} className="btn btn-primary px-3 py-2 rounded-xl border">
          Opslaan
        </button>
        <button
          onClick={clearPending}
          className="btn btn-primary px-3 py-2 rounded-xl border"
        >
          Leeg
        </button>
        <button onClick={exportICS} className="btn btn-primary px-3 py-2 rounded-xl border">
          Exporteer ICS (week)
        </button>
      </div>
      <div className="border rounded-2xl p-3 grid grid-cols-1 md:grid-cols-5 gap-3 bg-white">
        <div>
          <div className="text-xs opacity-70 mb-1">Dag</div>
          <select
            value={draft.dayIndex}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dayIndex: Number(e.target.value) }))
            }
            className="px-2 py-2 rounded-xl border w-full"
          >
            {days.map((d, i) => (
              <option key={i} value={i}>
                {format(d, "EEE", { locale: nl })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Start</div>
          <input
            type="time"
            value={draft.start}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Eind</div>
          <input
            type="time"
            value={draft.end}
            onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Groep</div>
          <select
            value={draft.group}
            onChange={(e) => setDraft((d) => ({ ...d, group: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
          >
            {[
              "Algemeen",
              "Poel",
              "Lier",
              "Zijl",
              "Nes",
              "Vliet",
              "Gaag",
              "Kust",
              "Golf",
              "Zift",
              "Lei",
              "Kade",
              "Kreek",
              "Duin",
              "Rak",
              "Bron",
              "Dijk",
              "Burcht",
              "Balk",
            ].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Titel</div>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="px-2 py-2 rounded-xl border w-full"
            placeholder="Sportmoment"
          />
        </div>
        <div className="md:col-span-5">
          <button
            onClick={addBlock}
            className="btn btn-primary px-3 py-2 rounded-xl border"
          >
            + Voeg blok toe
          </button>
          {pending.length > 0 && (
            <span className="ml-3 text-sm opacity-70">
              {pending.length} blok(ken) klaar om op te slaan
            </span>
          )}
        </div>
      </div>
      <div className="border rounded-2xl overflow-hidden bg-white">
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
          <div className="bg-zinc-50 border-r px-2 py-2 text-xs text-zinc-500">
            Tijd
          </div>
          {days.map((d, i) => (
            <div
              key={i}
              className="bg-zinc-50 border-r px-3 py-2 text-sm font-medium"
            >
              {format(d, "EEE d", { locale: nl })}
            </div>
          ))}
          <div className="flex flex-col">
            {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
              <div key={h} className="h-12 border-t px-2 text-xs text-zinc-500">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((d, idx) => {
            const dayEvents = weekEvents.filter(
              (e) => e.start.toDateString() === d.toDateString(),
            );
            return (
              <div key={idx} className="flex flex-col border-l relative">
                {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
                  <div key={h} className="h-12 border-t" />
                ))}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="absolute left-2 right-2 rounded-xl border bg-white shadow-sm px-2 py-1 text-xs"
                    style={{
                      top:
                        (((ev.start.getHours() - 8) * 60 +
                          ev.start.getMinutes()) /
                          60) *
                        48,
                      height: Math.max(
                        24,
                        ((ev.end.getTime() - ev.start.getTime()) / 60000 / 60) *
                        48,
                      ),
                    }}
                  >
                    <div className="font-semibold">{ev.title}</div>
                    <div className="opacity-70">
                      {format(ev.start, "HH:mm", { locale: nl })}–
                      {format(ev.end, "HH:mm", { locale: nl })} • {ev.group}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
