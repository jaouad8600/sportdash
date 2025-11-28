"use client";
import { useEffect, useState, useMemo } from "react";

export default function GroepenPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/groepen/rode")
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Fout bij laden:", err));
  }, []);

  const groepen = useMemo(() => {
    // Sommige API's sturen { data: [...] }, anderen gewoon [...]
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : data?.groepen?.list
          ? data.groepen.list
          : [];

    return list.map((g: any, i: number) => ({
      id: g.id ?? i,
      naam: g.naam ?? "Onbekend",
    }));
  }, [data]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Groepen</h1>
      {groepen.length > 0 ? (
        <ul className="list-disc pl-6">
          {groepen.map((g) => (
            <li key={g.id}>{g.naam}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Geen groepen gevonden.</p>
      )}
      <pre className="mt-6 text-xs text-gray-400 bg-gray-100 p-2 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
