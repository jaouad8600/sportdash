"use client";

// Legacy component - uses non-existent store functions
// TODO: Reimplement using Prisma/API routes or remove if not needed

export default function Groepen() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Groepen</h1>
      <p className="text-gray-500">
        Dit component is verouderd en moet opnieuw geïmplementeerd worden met Prisma.
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Zie /groepen voor de nieuwe groepen pagina.
      </p>
    </div>
  );
}
