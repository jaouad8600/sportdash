"use client";

import SyncService from "@/components/SyncService";
import { useLiveObject } from "@/lib/live";

type SpConf = {
  siteUrl?: string;
  library?: string;
  folder?: string;
  notes?: string;
};

export default function SharePointPage() {
  const [conf, setConf] = useLiveObject<SpConf>("sharepointConf", {});

  const update = (patch: Partial<SpConf>) =>
    setConf({ ...conf, ...patch });

  return (
    <div className="p-6 space-y-4">
      <SyncService />
      <h1 className="text-2xl font-bold">SharePoint</h1>
      <p className="text-gray-600">
        Bewaar hier alvast je instellingen. Koppeling (Microsoft Graph) kan
        later worden toegevoegd.
      </p>

      <div className="bg-white shadow rounded-2xl p-4 space-y-3 max-w-3xl">
        <div>
          <label className="block text-sm font-medium">Site URL</label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="https://contoso.sharepoint.com/sites/..."
            value={conf.siteUrl ?? ""}
            onChange={(e) => update({ siteUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">
              Document Library
            </label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Documents"
              value={conf.library ?? ""}
              onChange={(e) => update({ library: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Folder (optioneel)
            </label>
            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Sportmutaties"
              value={conf.folder ?? ""}
              onChange={(e) => update({ folder: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Notities</label>
          <textarea
            className="border rounded-lg px-3 py-2 w-full"
            rows={3}
            placeholder="Bijv. Word-bestanden met mutaties staan hier…"
            value={conf.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </div>

        <div className="text-sm text-gray-500">
          <p className="mb-2 font-medium">Plan voor later:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              Microsoft Graph OAuth (server route) om SharePoint te lezen.
            </li>
            <li>
              .docx parser (client/server) die sportmutaties herkent en omzet.
            </li>
            <li>
              Automatisch opslaan via <code>addMutatie</code> zodat alle
              pagina’s live updaten.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
