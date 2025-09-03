'use client';
import { useState } from 'react';

export default function NewReportPage() {
  const [form, setForm] = useState({
    groupId: '',
    createdById: '',
    date: '',
    warmingUp: '',
    sportActivity: '',
    bijzonderheden: '',
    groepssfeer: '',
    interventies: '',
    incidenten: '',
    afsprakenVoorMorgen: '',
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    alert('Rapport opgeslagen');
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-2 max-w-xl">
      <input
        required
        placeholder="Groep ID"
        value={form.groupId}
        onChange={update('groupId')}
        className="border p-2"
      />
      <input
        required
        placeholder="Medewerker ID"
        value={form.createdById}
        onChange={update('createdById')}
        className="border p-2"
      />
      <input
        type="date"
        required
        value={form.date}
        onChange={update('date')}
        className="border p-2"
      />
      <textarea
        placeholder="Warming-up"
        value={form.warmingUp}
        onChange={update('warmingUp')}
        className="border p-2"
      />
      <textarea
        placeholder="Sportactiviteit"
        value={form.sportActivity}
        onChange={update('sportActivity')}
        className="border p-2"
      />
      <textarea
        placeholder="Bijzonderheden"
        value={form.bijzonderheden}
        onChange={update('bijzonderheden')}
        className="border p-2"
      />
      <textarea
        placeholder="Groepssfeer"
        value={form.groepssfeer}
        onChange={update('groepssfeer')}
        className="border p-2"
      />
      <textarea
        placeholder="Interventies"
        value={form.interventies}
        onChange={update('interventies')}
        className="border p-2"
      />
      <textarea
        placeholder="Incidenten"
        value={form.incidenten}
        onChange={update('incidenten')}
        className="border p-2"
      />
      <textarea
        placeholder="Afspraken voor morgen"
        value={form.afsprakenVoorMorgen}
        onChange={update('afsprakenVoorMorgen')}
        className="border p-2"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 mt-2">
        Opslaan
      </button>
    </form>
  );
}
