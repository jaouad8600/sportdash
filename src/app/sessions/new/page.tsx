'use client';
import { useState, FormEvent } from 'react';

export default function NewSession() {
  const [form, setForm] = useState({
    groupId: '',
    date: '',
    headcount: 0,
    warmup: '',
    activity: '',
  });

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, headcount: Number(form.headcount) }),
    });
    window.location.href = '/';
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Nieuwe sessie</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="groupId" value={form.groupId} onChange={handleChange} placeholder="Group ID" className="border p-2 w-full" />
        <input type="datetime-local" name="date" value={form.date} onChange={handleChange} className="border p-2 w-full" />
        <input name="headcount" value={form.headcount} onChange={handleChange} placeholder="Headcount" className="border p-2 w-full" />
        <input name="warmup" value={form.warmup} onChange={handleChange} placeholder="Warmup" className="border p-2 w-full" />
        <input name="activity" value={form.activity} onChange={handleChange} placeholder="Activiteit" className="border p-2 w-full" />
        <button type="submit" className="bg-green-500 text-white px-4 py-2">Opslaan</button>
      </form>
    </div>
  );
}
