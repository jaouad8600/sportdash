"use client";

import { useMemo, useState } from "react";
import {
  loadEvents,
  saveEvents,
  makeEvent,
  type Tide,
} from "@/lib/clientStore";

/**
 * Tijden en duur (45 min)
 */
const TIMES = [
  { hour: 16, minute: 45 }, // slot 0
  { hour: 17, minute: 45 }, // slot 1
  { hour: 18, minute: 45 }, // slot 2
  { hour: 19, minute: 45 }, // slot 3
];
const DURATION_MIN = 45;

/**
 * WEEK TEMPLATE (0=ma, ... 4=vr)
 * - EB: Poel ALTIJD slot 0 (16:45)
 * - VLOED:
 *    ma: Kust (17:45), Nes (18:45), Gaag (19:45)
 *    di–vr: Kade (17:45), Kreek (18:45), Open (19:45)
 * Zet null als je een slot leeg wilt laten.
 */
const WEEK_TEMPLATE: Record<
  number,
  { eb: (string | null)[]; vloed: (string | null)[] }
> = {
  0: {
    // maandag
    eb: ["Poel", null, null, null],
    vloed: [null, "Kust", "Nes", "Gaag"],
  },
  1: {
    // dinsdag
    eb: ["Poel", null, null, null],
    vloed: [null, "Kade", "Kreek", "Open"],
  },
  2: {
    // woensdag
    eb: ["Poel", null, null, null],
    vloed: [null, "Kade", "Kreek", "Open"],
  },
  3: {
    // donderdag
    eb: ["Poel", null, null, null],
    vloed: [null, "Kade", "Kreek", "Open"],
  },
  4: {
    // vrijdag
    eb: ["Poel", null, null, null],
    vloed: [null, "Kade", "Kreek", "Open"],
  },
};

function monday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const day = x.getDay() || 7; // zo=0 -> 7
  if (day !== 1) x.setDate(x.getDate() - (day - 1));
  return x;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function atTime(base: Date, h: number, m: number) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function withinSameWeek(a: Date, b: Date) {
  const ma = monday(a),
    mb = monday(b);
  return (
    ma.getFullYear() === mb.getFullYear() &&
    ma.getMonth() === mb.getMonth() &&
    ma.getDate() === mb.getDate()
  );
}

export default function SeedPage() {
  const [info, setInfo] = useState<string>("");

  const weekMon = useMemo(() => monday(new Date()), []);
  const weekLabel = useMemo(() => {
    const fri = addDays(weekMon, 4);
    const fmt = (d: Date) =>
      d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit" });
    return `${fmt(weekMon)} t/m ${fmt(fri)}`;
  }, [weekMon]);

  function seedByTemplate(tide: Tide) {
    const current = loadEvents();

    // 1) Verwijder bestaande events in deze week voor dit tide
    const filtered = current.filter(
      (e) => !(withinSameWeek(new Date(e.start), weekMon) && e.tide === tide),
    );

    // 2) Voeg toe volgens template
    const toAdd: ReturnType<typeof makeEvent>[] = [];
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      // ma..vr
      const base = addDays(weekMon, dayIdx);
      const groups = WEEK_TEMPLATE[dayIdx][tide]; // array van 4 slots
      groups.forEach((group, slotIdx) => {
        if (!group) return;
        const { hour, minute } = TIMES[slotIdx];
        const start = atTime(base, hour, minute);
        const end = new Date(start.getTime() + DURATION_MIN * 60000);
        toAdd.push(
          makeEvent({
            title: `Sportmoment • ${group}`,
            start,
            end,
            tide,
            group,
          }),
        );
      });
    }

    saveEvents([...filtered, ...toAdd]);
    setInfo(
      `Gezaaid: ${tide.toUpperCase()} — ${toAdd.length} momenten (${weekLabel}). /admin toont het overzicht.`,
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Seed weekkalender (vast patroon)</h1>

      <div className="rounded-2xl border bg-white p-4 grid gap-3">
        <div className="text-sm opacity-80">
          Week: <b>{weekLabel}</b> (maandag t/m vrijdag)
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <div className="font-semibold mb-2">EB (Poel altijd)</div>
            <ul className="text-sm grid gap-1">
              <li>
                <b>Ma–Vr</b>: 16:45 Poel
              </li>
            </ul>
          </div>

          <div className="rounded-xl border p-3">
            <div className="font-semibold mb-2">Vloed</div>
            <ul className="text-sm grid gap-1">
              <li>
                <b>Ma</b>: 17:45 Kust • 18:45 Nes • 19:45 Gaag
              </li>
              <li>
                <b>Di–Vr</b>: 17:45 Kade • 18:45 Kreek • 19:45 Open
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-8 flex-wrap">
          <button
            className="btn btn-primary px-3 py-2 rounded-xl border hover:bg-zinc-50"
            onClick={() => seedByTemplate("eb")}
          >
            Seed EB (ma–vr)
          </button>
          <button
            className="btn btn-primary px-3 py-2 rounded-xl border hover:bg-zinc-50"
            onClick={() => seedByTemplate("vloed")}
          >
            Seed Vloed (ma–vr)
          </button>
        </div>

        {info && (
          <div className="text-sm p-3 rounded-lg border bg-zinc-50">{info}</div>
        )}

        <div className="text-xs opacity-70">
          Her-seeden is veilig: bestaande momenten van díe week en díe tide
          worden eerst verwijderd. Poel staat nooit in Vloed.
        </div>
      </div>
    </div>
  );
}
