"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingFull, setCreatingFull] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
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

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (res.ok) {
        await fetchBackups();
      } else {
        alert("Backup maken mislukt");
      }
    } catch (error) {
      console.error("Error creating backup", error);
      alert("Er is een fout opgetreden");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFullBackup = async () => {
    setCreatingFull(true);
    try {
      const res = await fetch("/api/backups/full", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(`✅ Volledige backup succesvol aangemaakt!\n\nBestand: ${data.filename}\nGrootte: ${data.sizeMB} MB`);
        await fetchBackups();
      } else {
        alert(`❌ Volledige backup mislukt\n\n${data.details || data.error}`);
      }
    } catch (error) {
      console.error("Error creating full backup", error);
      alert("❌ Er is een fout opgetreden bij het maken van de volledige backup");
    } finally {
      setCreatingFull(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Weet je zeker dat je ${filename} wilt verwijderen?`)) return;

    try {
      const res = await fetch(`/api/backup/${filename}`, { method: "DELETE" });
      if (res.ok) {
        fetchBackups();
      } else {
        alert("Verwijderen mislukt");
      }
    } catch (error) {
      console.error("Error deleting backup", error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Systeem Backups</h1>
          <p className="text-gray-500">Beheer database backups en snapshots.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleCreateBackup}
            disabled={creating || creatingFull}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            {creating ? "Bezig..." : "Database Backup"}
          </Button>
          <Button
            onClick={handleCreateFullBackup}
            disabled={creating || creatingFull}
            className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/20"
          >
            {creatingFull ? "Bezig met volledige backup..." : "🗂️ Volledige Backup (Project + Database)"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-700">Bestandsnaam</th>
                <th className="px-6 py-4 font-medium text-gray-700">Datum</th>
                <th className="px-6 py-4 font-medium text-gray-700">Grootte</th>
                <th className="px-6 py-4 font-medium text-gray-700 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Laden...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Geen backups gevonden. Maak er een aan!
                  </td>
                </tr>
              ) : (
                backups.map((file) => (
                  <tr key={file.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {file.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(file.createdAt), "d MMMM yyyy HH:mm", { locale: nl })}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono">
                      {formatSize(file.size)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <a
                        href={`/api/backup/${file.name}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                        download
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Verwijder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
        <h3 className="font-semibold mb-1">Docker & Hosting Info</h3>
        <p>
          Dit project is nu geconfigureerd voor Docker. Gebruik de meegeleverde <code>Dockerfile</code> en <code>docker-compose.yml</code> om de applicatie te hosten.
          De database wordt opgeslagen in een volume zodat deze behouden blijft bij herstarts.
        </p>
      </div>
    </div>
  );
}
