"use client";

import React, { useState, useEffect } from "react";
import { Download, HardDrive, RefreshCw, Server, FileArchive, RotateCcw, Clock, Settings, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({ schedule: "manual", cron: "" });

  useEffect(() => {
    fetchBackups();
    fetchSchedule();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backups");
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error("Failed to fetch backups", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/backups/schedule");
      if (res.ok) setSchedule(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backups", { method: "POST" });
      if (res.ok) {
        await fetchBackups();
        alert("Backup succesvol aangemaakt!");
      } else {
        const err = await res.json();
        alert(`Fout bij maken backup: ${err.details || "Onbekende fout"}`);
      }
    } catch (error) {
      console.error("Error creating backup", error);
      alert("Er is een fout opgetreden.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`WEET JE HET ZEKER?\n\nDit zal de huidige database OVERSCHRIJVEN met de versie uit '${filename}'.\n\nAlle gegevens die na deze backup zijn gemaakt gaan verloren.`)) {
      return;
    }

    setRestoring(filename);
    try {
      const res = await fetch("/api/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        alert("Database succesvol hersteld! Herstart indien nodig de server.");
      } else {
        const err = await res.json();
        alert(`Herstel mislukt: ${err.details}`);
      }
    } catch (error) {
      alert("Fout tijdens herstel.");
    } finally {
      setRestoring(null);
    }
  };

  const saveSchedule = async (newSchedule: string) => {
    const config = { schedule: newSchedule, cron: newSchedule === "daily" ? "0 3 * * *" : "" };
    setSchedule(config);
    await fetch("/api/backups/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Back-up Center</h1>
          <p className="text-gray-500 mt-1">Geavanceerd systeembeheer en herstel</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Opslaggebruik</div>
          <div className="text-xl font-bold text-gray-900">
            {(backups.reduce((acc, b) => acc + b.size, 0) / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Backups List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Server size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Systeem Backups</h2>
                  <p className="text-sm text-gray-500">{backups.length} archieven beschikbaar</p>
                </div>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {creating ? <RefreshCw className="animate-spin" size={18} /> : <HardDrive size={18} />}
                {creating ? "Bezig..." : "Nu Backuppen"}
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Laden...</div>
              ) : backups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Geen backups gevonden.</div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.name} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FileArchive size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{backup.name}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(backup.createdAt), "d MMM yyyy HH:mm")} • {(backup.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(backup.name)}
                        disabled={!!restoring}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        title="Herstel Database"
                      >
                        {restoring === backup.name ? <RefreshCw className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                        <span className="hidden group-hover:inline">Herstel</span>
                      </button>
                      <div className="h-4 w-px bg-gray-200 mx-1"></div>
                      <a
                        href={`/api/backups/download?file=${backup.name}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Downloaden"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Settings & Schedule */}
        <div className="space-y-6">
          {/* Schedule Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-purple-500" />
              Schema & Frequentie
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="schedule"
                  checked={schedule.schedule === "manual"}
                  onChange={() => saveSchedule("manual")}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm text-gray-900">Handmatig</div>
                  <div className="text-xs text-gray-500">Alleen op aanvraag</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="schedule"
                  checked={schedule.schedule === "daily"}
                  onChange={() => saveSchedule("daily")}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-sm text-gray-900">Dagelijks (03:00)</div>
                  <div className="text-xs text-gray-500">Elke nacht een volledige backup</div>
                </div>
              </label>
            </div>
          </div>

          {/* Warning Card */}
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-6">
            <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              Let op
            </h3>
            <p className="text-sm text-orange-700 leading-relaxed">
              Het herstellen van een backup overschrijft de huidige database. Zorg dat je altijd een recente backup hebt voordat je een oude versie terugzet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
