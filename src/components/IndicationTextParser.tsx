'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { ParsedIndicatie, ParsedIndicationResponse } from '@/types/indication';

interface IndicationTextParserProps {
    onParsed?: (data: ParsedIndicatie) => void;
}

export default function IndicationTextParser({ onParsed }: IndicationTextParserProps) {
    const [pasteText, setPasteText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedIndicationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!pasteText.trim()) {
            setError('Plak eerst tekst in het veld');
            return;
        }

        setIsParsing(true);
        setError(null);
        setParsedData(null);

        try {
            const response = await fetch('/api/indicaties/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: pasteText }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.details || errorData.error || 'Parse failed');
            }

            const parsed: ParsedIndicationResponse = await response.json();
            setParsedData(parsed);

            // Call callback if provided
            if (onParsed) {
                onParsed(parsed);
            }
        } catch (err) {
            console.error('Parse error details:', err);
            setError(err instanceof Error ? err.message : 'Fout bij analyseren van tekst');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Text Input Section */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Plak hier de tekst van "Aanmelding geïndiceerde activiteiten"
                </label>

                <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-64 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none resize-none text-sm font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={`Plak hier de volledige tekst, bijvoorbeeld:

Aanmelding geïndiceerde activiteiten
Naam jongere: Pablo de Jeger
Leefgroep: Nes
...`}
                />

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {pasteText.length} karakters
                    </span>

                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isParsing || !pasteText.trim()}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                        {isParsing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyseren...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Analyseer Tekst
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900 dark:text-red-100 text-sm">Analyseer fout</p>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Parsed Data Preview */}
            {parsedData && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-green-100 dark:bg-green-900/40 px-5 py-4 border-b border-green-200 dark:border-green-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div>
                                <h3 className="font-bold text-green-900 dark:text-green-100 text-base">Tekst succesvol geanalyseerd!</h3>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                    Controleer onderstaande velden en pas aan indien nodig
                                </p>
                            </div>
                        </div>
                        {parsedData.confidence && (
                            <div className="px-3 py-1 bg-green-200 dark:bg-green-800 rounded-full">
                                <span className="text-xs font-semibold text-green-900 dark:text-green-100">
                                    {Math.round(parsedData.confidence * 100)}% betrouwbaarheid
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Warning if present */}
                    {parsedData.warning && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-5 py-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ {parsedData.warning}</p>
                        </div>
                    )}

                    {/* Parsed Fields */}
                    <div className="p-6 space-y-4 bg-white dark:bg-gray-900/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Naam Jongere
                                </label>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.naamJongere || '-'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Leefgroep
                                </label>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.leefgroep || '-'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Indicatie Activiteit
                            </label>
                            <div className="flex gap-2">
                                {parsedData.indicatieActiviteit.length > 0 ? (
                                    parsedData.indicatieActiviteit.map((activity) => (
                                        <span
                                            key={activity}
                                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold border border-purple-200 dark:border-purple-800"
                                        >
                                            {activity}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Geen activiteit geselecteerd</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Indicatie van - tot
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.indicatieVanTot || '-'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Afgegeven door
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.indicatieAfgegevenDoor || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Terugkoppeling aan
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.terugkoppelingAan || '-'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Kan gecombineerd worden?
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                    {parsedData.kanCombinerenMetGroepsgenoot === null
                                        ? '-'
                                        : parsedData.kanCombinerenMetGroepsgenoot
                                            ? '✓ Ja'
                                            : '✗ Nee'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Advies/suggestie inhoud activiteit
                            </label>
                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                {parsedData.adviesInhoudActiviteit || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Onderbouwing Indicering
                            </label>
                            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {parsedData.onderbouwingIndicering || '-'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Bejegeningstips
                            </label>
                            <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {parsedData.bejegeningstips || '-'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Leerdoelen
                            </label>
                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                {parsedData.leerdoelen || 'N.v.t.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
