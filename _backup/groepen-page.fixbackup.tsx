"use client";
import { useEffect, useState, useMemo } from "react";

export default function GroepenPage() {
  const [rode, setRode] = useState<any>(null);

  useEffect(() => {
    fetch("/api/groepen/rode")
      .then((r) => r.json())
      .then((data) => setRode(data))
      .catch((err) => console.error("Fout bij laden:", err));
  }, []);

  const rodeNamen = useMemo(() => {
    if (Array.isArray(rode?.data)) {
      return rode.data.map((g: any) => g.naam);
    }
    return [];
  }, [rode]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Groepen</h1>
      {rodeNamen.length > 0 ? (
        <ul className="list-disc pl-6">
          {rodeNamen.map((naam, i) => (
            <li key={i}>{naam}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">
          Geen groepen gevonden of verkeerde data.
        </p>
      )}
    </div>
  );
}
