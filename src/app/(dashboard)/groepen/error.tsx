"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Er ging iets mis</h2>
        <p className="text-zinc-600 mt-1">
          {error.message || "Onbekende fout"}
        </p>
        <button
          className="btn btn-primary mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          onClick={() => reset()}
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
}
