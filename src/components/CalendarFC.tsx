"use client";
import "@/styles/vendor/fullcalendar-common.css";
import "@/styles/fullcalendar.css";

import { useMemo, useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import nlLocale from "@fullcalendar/core/locales/nl";
// import { loadColorMap, deriveGroupStatus } from "@/lib/sportmutatie"; // Functions don't exist

// Stub functions TODO: implement properly or remove if not needed
const loadColorMap = () => ({
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
});

const deriveGroupStatus = (mutaties: any[], group: string) => {
  // TODO: Implement proper logic or remove
  return null;
};

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function CalendarFC() {
  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, interactionPlugin],
    [],
  );
  const [events, setEvents] = useState<any[]>([]);
  const [mutaties, setMutaties] = useState<any[]>([]);
  const [colors, setColors] = useState(loadColorMap());

  useEffect(() => {
    setEvents(loadLS<any[]>("events", []));
    setMutaties(loadLS<any[]>("sportmutaties", []));
    setColors(loadColorMap());
  }, []);

  const eventContent = useCallback(
    (arg: any) => {
      const title = arg.event.title || "";
      const m = title.match(/^([^–-]+)\s*[–-]/); // deel vóór '-' = groepsnaam
      const group = m ? m[1].trim() : "";

      const status = deriveGroupStatus(mutaties, group); // kan null zijn
      const dotColor = status ? (colors as any)[status] : "#2563eb";

      const el = document.createElement("div");
      el.innerHTML = `<span class="evt-dot" style="background:${dotColor}"></span>${title}`;
      return { domNodes: [el] };
    },
    [mutaties, colors],
  );

  return (
    <FullCalendar
      plugins={plugins}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={events}
      locales={[nlLocale]}
      locale="nl"
      height="auto"
      eventContent={eventContent}
      selectable={true}
      editable={false}
    />
  );
}
