"use client";


import { useEffect, useMemo, useState } from "react";
import { isSameDay, isSameWeek, startOfWeek, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import ClientOnly from "@/components/ClientOnly";
import WeekStrip from "../../../components/WeekStrip";
import { loadEvents, loadRestrictions } from "@/lib/clientStore";
import { countOpenSportmutaties } from "@/lib/clientStore";

type DagGroup = {
  group: string;
  sfeer?: string;
  timeouts?: string[];
  incidenten?: string[];
  sancties?: string[];
};
type DagOverdracht = { groups?: DagGroup[] };
type SportBlock = {
  group: string;
  bijzonderheden?: string;
  sportmoment?: string;
};
type SportRapport = { blocks: SportBlock[] };
type Severity = "danger" | "warning" | "info";
type AlertItem = {
  id: string;
  severity: Severity;
  title: string;
  desc?: string;
  group?: string;
};

const cls = {
  danger: { left: "border-l-4 border-l-danger", text: "text-danger-fg" },
  warning: { left: "border-l-4 border-l-warning", text: "text-warning-fg" },
  info: { left: "border-l-4 border-l-info", text: "text-info-fg" },
};
const h = (s: string) =>
  String([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0));
const mk = (sev: Severity, t: string, d?: string, g?: string): AlertItem => ({
  id: h([sev, t, d, g].filter(Boolean).join("|")),
  severity: sev,
  title: t,
  desc: d,
  group: g,
});

function extractAlerts(): AlertItem[] {
  let dag: DagOverdracht | undefined, sport: SportRapport | undefined;
  try {
    const d = localStorage.getItem("overdracht-last-json");
    if (d) dag = JSON.parse(d);
  } catch { }
  try {
    const s = localStorage.getItem("overdracht-sport-last-json");
    if (s) sport = JSON.parse(s);
  } catch { }
  const out: AlertItem[] = [];
  for (const g of dag?.groups || []) {
    const group = g.group;
    const red = /alarm|vechtpartij|fysiek|bloedneus|dreig/i;
    if (
      red.test(g.sfeer || "") ||
      (g.incidenten || []).some((l) => red.test(l))
    )
      out.push(
        mk(
          "danger",
          "Alarm/incident gemeld",
          (g.sfeer || "").slice(0, 220),
          group,
        ),
      );
    for (const l of g.incidenten || [])
      out.push(mk("danger", `Incident (${group})`, l, group));
    for (const l of g.sancties || [])
      out.push(mk("warning", `Sanctie (${group})`, l, group));
    for (const l of g.timeouts || [])
      out.push(mk("info", `Time-out (${group})`, l, group));
  }
  try {
    const restrictions = loadRestrictions().filter((r) => r.active);
    for (const r of restrictions) {
      out.push(
        mk(
          "info",
          `Indicatie actief (${r.group})`,
          `${r.label}${r.note ? ": " + r.note : ""}`,
          r.group,
        ),
      );
    }
  } catch { }
  const m = new Map(out.map((a) => [a.id, a]));
  return [...m.values()].slice(0, 12);
}

export default function Admin() {
  // Hooks in vaste volgorde
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [kSportMut, setKSportMut] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Events na mount (client)
  useEffect(() => {
    if (!mounted) return;
    const read = () => setEvents(loadEvents());
    read();
    const onFocus = () => read();
    const id = setInterval(read, 10000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      setKSportMut(countOpenSportmutaties());
    } catch { }
  }, [mounted, events]);

  useEffect(() => {
    if (!mounted) return;
    try {
      setDismissed(
        JSON.parse(localStorage.getItem("dashboard-dismissed-alerts") || "[]"),
      );
    } catch { }
    setAlerts(extractAlerts());
  }, [mounted]);
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        "dashboard-dismissed-alerts",
        JSON.stringify(dismissed),
      );
    } catch { }
  }, [mounted, dismissed]);

  // KPI’s
  const today = new Date();
  const wStart = startOfWeek(today, { weekStartsOn: 1, locale: nl });
  const week = events.filter((e: any) =>
    isSameWeek(new Date(e.start), today, { weekStartsOn: 1, locale: nl }),
  );
  const kToday = events.filter((e: any) =>
    isSameDay(new Date(e.start), today),
  ).length;
  const kWeek = week.length;
  const kEb = week.filter((e: any) => e.tide === "eb").length;
  const kVloed = week.filter((e: any) => e.tide === "vloed").length;

  // Weekdata voor WeekStrip (totaal/eb/vloed per dag)
  const weekStrip = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(wStart, i);
        const dayEvents = week.filter((e: any) =>
          isSameDay(new Date(e.start), d),
        );
        const eb = dayEvents.filter((e: any) => e.tide === "eb").length;
        const vloed = dayEvents.filter((e: any) => e.tide === "vloed").length;
        return {
          name: d.toLocaleDateString("nl-NL", { weekday: "short" }),
          total: dayEvents.length,
          eb,
          vloed,
        };
      }),
    [wStart, week],
  );

  const visible = useMemo(
    () => alerts.filter((a) => !dismissed.includes(a.id)),
    [alerts, dismissed],
  );

  return (
    <div className="grid gap-4">
      {/* KPI's */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border rounded-2xl p-3 bg-white">
          <div className="text-zinc-500 text-sm">Vandaag</div>
          <div className="text-3xl font-bold text-brand-700">
            <ClientOnly>{kToday}</ClientOnly>
          </div>
        </div>
        <div className="border rounded-2xl p-3 bg-white">
          <div className="text-zinc-500 text-sm">Deze week</div>
          <div className="text-3xl font-bold text-brand-700">
            <ClientOnly>{kWeek}</ClientOnly>
          </div>
        </div>
        <div className="border rounded-2xl p-3 bg-white">
          <div className="text-zinc-500 text-sm">Eb (week)</div>
          <div className="text-3xl font-bold text-brand-700">
            <ClientOnly>{kEb}</ClientOnly>
          </div>
        </div>
        <div className="border rounded-2xl p-3 bg-white">
          <div className="text-zinc-500 text-sm">Vloed (week)</div>
          <div className="text-3xl font-bold text-brand-700">
            <ClientOnly>{kVloed}</ClientOnly>
          </div>
        </div>
        <div className="border rounded-2xl p-3 bg-white">
          <div className="text-zinc-500 text-sm">Actieve sportmutaties</div>
          <div className="text-3xl font-bold text-brand-700">
            <ClientOnly>{kSportMut}</ClientOnly>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border bg-white">
        <div className="p-4 font-semibold">Meldingen</div>
        <div className="p-4 grid gap-3">
          {mounted && visible.length > 0 ? (
            visible.map((a) => {
              const s = cls[a.severity];
              return (
                <div key={a.id} className={`rounded-xl border ${s.left}`}>
                  <div className="p-3 grid gap-1">
                    <div className={`font-semibold ${s.text}`}>
                      {a.group ? `${a.group} • ` : ""}
                      {a.title}
                    </div>
                    {a.desc && (
                      <div className="opacity-80 whitespace-pre-wrap">
                        {a.desc}
                      </div>
                    )}
                    <div className="text-right">
                      <button
                        className="btn btn-primary px-2 py-1 rounded-lg border"
                        onClick={() => setDismissed((d) => [...d, a.id])}
                      >
                        Sluiten
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm opacity-80">
              {mounted ? "Geen nieuwe meldingen." : "Laden…"}
            </div>
          )}
        </div>
      </div>

      {/* Week-strook i.p.v. grafiek */}
      <div className="rounded-2xl border bg-white">
        <div className="p-4 font-semibold">Weekoverzicht (Eb/Vloed)</div>
        <div className="px-3 pb-4">
          <WeekStrip data={weekStrip} />
        </div>
      </div>
    </div>
  );
}
