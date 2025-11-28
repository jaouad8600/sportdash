'use client';
import React, { useEffect, useState } from 'react';

type Item = { id?: string; naam: string; aantal: number | string; categorie?: string; locatie?: string; opmerking?: string; updatedAt?: string };

export default function InventarisPage() {
  const empty: Item = { naam: '', aantal: 0, categorie: '', locatie: '', opmerking: '' };
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch('/api/inventaris', { cache: 'no-store' });
      const j = await r.json();
      setItems(Array.isArray(j?.items) ? j.items : []);
    } catch (e: any) { setErr(e.message || 'Kon inventaris niet laden'); }
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/inventaris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, aantal: Number(form.aantal || 0) }) });
    setForm(empty);
    setSaving(false);
    await load();
  }
  async function del(id: string) {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/inventaris/${id}`, { method: 'DELETE' });
    await load();
  }
  function edit(it: Item) { setForm({ ...it }); }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inventaris</h1>

      <form onSubmit={save} className="grid md:grid-cols-5 gap-3 items-end">
        <input value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} placeholder="Naam" className="border rounded-xl p-2" />
        <input type="number" value={form.aantal} onChange={e => setForm(f => ({ ...f, aantal: e.target.value }))} placeholder="Aantal" className="border rounded-xl p-2" />
        <input value={form.categorie || ''} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))} placeholder="Categorie" className="border rounded-xl p-2" />
        <input value={form.locatie || ''} onChange={e => setForm(f => ({ ...f, locatie: e.target.value }))} placeholder="Locatie" className="border rounded-xl p-2" />
        <button disabled={saving} className="btn btn-primary px-3 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90">{form.id ? 'Bijwerken' : 'Toevoegen'}</button>
        <div className="md:col-span-5">
          <input value={form.opmerking || ''} onChange={e => setForm(f => ({ ...f, opmerking: e.target.value }))} placeholder="Opmerking" className="border rounded-xl p-2 w-full" />
        </div>
      </form>

      {err && <div className="text-red-600">{err}</div>}

      <div className="overflow-auto border rounded-2xl">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Naam</th>
              <th className="text-right p-3 border-b">Aantal</th>
              <th className="text-left p-3 border-b">Categorie</th>
              <th className="text-left p-3 border-b">Locatie</th>
              <th className="text-left p-3 border-b">Opmerking</th>
              <th className="text-left p-3 border-b">Laatst bijgewerkt</th>
              <th className="p-3 border-b">Acties</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-3 border-b font-medium">{it.naam}</td>
                <td className="p-3 border-b text-right">{it.aantal}</td>
                <td className="p-3 border-b">{it.categorie || '—'}</td>
                <td className="p-3 border-b">{it.locatie || '—'}</td>
                <td className="p-3 border-b">{it.opmerking || '—'}</td>
                <td className="p-3 border-b text-sm text-gray-500">{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : '—'}</td>
                <td className="p-3 border-b space-x-2">
                  <button onClick={() => edit(it)} className="px-3 py-1 rounded-xl bg-gray-200 hover:bg-gray-300">Bewerken</button>
                  <button onClick={() => del(String(it.id))} className="px-3 py-1 rounded-xl bg-red-600 text-white hover:opacity-90">Verwijderen</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={7}>Nog geen items.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
