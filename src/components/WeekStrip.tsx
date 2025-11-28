"use client";
import { useMemo } from "react";

function startOfWeekLocal(d = new Date()) {
  const copy = new Date(d);
  const weekday = (copy.getDay() + 6) % 7; // maandag = 0
  copy.setDate(copy.getDate() - weekday);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function label(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

interface WeekData {
  name: string;
  total: number;
  eb: number;
  vloed: number;
}

export default function WeekStrip({ data }: { data?: WeekData[] }) {
  const days = useMemo(() => {
    const start = startOfWeekLocal(new Date());
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, []);

  return (
    <div className="flex gap-2 text-sm">
      {days.map((d, i) => (
        <div key={i} className="px-2 py-1 rounded border bg-white">
          <span suppressHydrationWarning>{label(d)}</span>
        </div>
      ))}
    </div>
  );
}
