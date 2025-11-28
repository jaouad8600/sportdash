"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Archive, Mail, CheckCircle } from 'lucide-react';
import { GroupReport } from './ReportingApp';

interface Props {
    reports: GroupReport[];
    onBack: () => void;
    onReset: () => void;
}

export default function ReportPreview({ reports, onBack, onReset }: Props) {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'mailing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Generate text
        const lines = reports.map(r => {
            return `Groep: ${r.groupName} (${r.youthCount}- jongeren, ${r.glCount} GL)\n\nWarming-up: ${r.warmingUp}\nSportmoment: ${r.sportMoment}\nBijzonderheden: ${r.particularities}`;
        });
        setText(lines.join('\n\n'));
    }, [reports]);

    const handleSave = async (archive = false) => {
        setStatus('saving');
        try {
            const res = await fetch('/api/reports/daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date(),
                    content: text,
                    archive
                })
            });

            if (!res.ok) throw new Error('Failed to save');

            setStatus('success');
            setMessage(archive ? 'Rapportage gearchiveerd!' : 'Rapportage opgeslagen!');
            setTimeout(() => {
                if (archive) onReset();
                else setStatus('idle');
            }, 2000);
        } catch (err) {
            setStatus('error');
            setMessage('Er ging iets mis bij het opslaan.');
        }
    };

    const handleMail = async () => {
        setStatus('mailing');
        try {
            const res = await fetch('/api/reports/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'teamleider@example.com', // Should be configurable
                    subject: `Sportrapportage ${new Date().toLocaleDateString('nl-NL')}`,
                    text: text
                })
            });

            if (!res.ok) throw new Error('Failed to mail');

            setStatus('success');
            setMessage('E-mail verzonden!');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            setStatus('error');
            setMessage('Kon e-mail niet verzenden.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={18} className="mr-1" /> Terug
                </button>
                {status === 'success' && (
                    <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle size={18} className="mr-1" /> {message}
                    </span>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voorbeeld Rapportage</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl font-mono text-sm h-[400px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => handleSave(false)}
                    disabled={status !== 'idle'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    Opslaan
                </button>
                <button
                    onClick={() => handleSave(true)}
                    disabled={status !== 'idle'}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                    <Archive size={18} />
                    Archiveren
                </button>
                <button
                    onClick={handleMail}
                    disabled={status !== 'idle'}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 ml-auto"
                >
                    <Mail size={18} />
                    Mailen
                </button>
            </div>
        </div>
    );
}
