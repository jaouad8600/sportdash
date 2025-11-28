"use client";
import { useState } from "react";

export default function FilterBar({
  placeholder,
  onChange,
}: {
  placeholder: string;
  onChange: (q: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          onChange(val.toLowerCase());
        }}
        className="flex-1 border border-green-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button
        className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
        onClick={() => {
          setQuery("");
          onChange("");
        }}
      >
        Wissen
      </button>
    </div>
  );
}
