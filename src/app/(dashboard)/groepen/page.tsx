"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Activity, AlertTriangle, MessageCircleWarning } from "lucide-react";
import ColorPicker from "@/components/ui/ColorPicker";
import NotesModal from "@/components/domain/NotesModal";
import RestorativeTalkModal from "@/components/domain/RestorativeTalkModal";

interface Group {
  id: string;
  name: string;
  color: string;

  notes: Array<{ id: string; content: string; createdAt: string }>;
  youths: Array<{ id: string; firstName: string; lastName: string }>;
  _count: {
    mutations: number;
    indications: number;
    restrictions: number;
  };
  restorativeTalks?: Array<{ id: string; youthName: string; createdBy: string; reason: string }>;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; name: string } | null>(null);
  const [restorativeModalGroup, setRestorativeModalGroup] = useState<Group | null>(null);

  useEffect(() => {
    fetchGroups();

    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchGroups, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Fetch restorative talk counts for each group
        const groupsWithTalks = await Promise.all(
          data.map(async (group: Group) => {
            try {
              const talksRes = await fetch(`/api/restorative-talks?groupId=${group.id}&includeArchived=false`);
              const talks = await talksRes.json();
              const pendingTalks = Array.isArray(talks) ? talks.filter((t: any) => t.status === 'PENDING') : [];
              return { ...group, restorativeTalks: pendingTalks };
            } catch (err) {
              console.error(`Failed to fetch talks for group ${group.id}`, err);
              return { ...group, restorativeTalks: [] };
            }
          })
        );
        setGroups(groupsWithTalks);
      } else {
        console.error("API returned non-array for groups:", data);
        setGroups([]);
      }
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (groupId: string, newColor: string) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, color: newColor } : g
    ));
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 font-serif">
            <Users className="text-teylingereind-royal" size={32} />
            Groepen
          </h1>
          <p className="text-gray-500 text-lg mt-1">
            Beheer groepen, kleuren en notities
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      {Array.isArray(groups) && groups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="p-6">
                {/* Header with Color Picker */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Link href={`/groepen/${group.id}`} className="hover:opacity-80 transition-opacity">
                      <h2 className="text-xl font-bold text-gray-800 font-serif hover:text-blue-600 cursor-pointer">{group.name}</h2>
                      {/* Status Text */}
                      <div className="mt-2">
                        {(() => {
                          const statusText = (() => {
                            switch (group.color?.toUpperCase()) {
                              case 'ROOD': return 'Leiden (Veel sturing, weinig ondersteuning)';
                              case 'ORANJE': return 'Begeleiden (Gemiddelde sturing, gemiddelde ondersteuning)';
                              case 'GEEL': return 'Steunen (Weinig sturing, veel ondersteuning)';
                              case 'GROEN': return 'Delegeren (Weinig sturing, weinig ondersteuning)';
                              default: return '';
                            }
                          })();

                          if (!statusText) return null;

                          const colorClasses = (() => {
                            switch (group.color?.toUpperCase()) {
                              case 'ROOD': return 'bg-red-100 text-red-800 border-red-200';
                              case 'ORANJE': return 'bg-orange-100 text-orange-800 border-orange-200';
                              case 'GEEL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                              case 'GROEN': return 'bg-green-100 text-green-800 border-green-200';
                              default: return 'bg-gray-100 text-gray-800 border-gray-200';
                            }
                          })();

                          return (
                            <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${colorClasses}`}>
                              {statusText}
                            </span>
                          );
                        })()}
                      </div>
                    </Link>
                  </div>
                  <ColorPicker
                    currentColor={group.color}
                    groupId={group.id}
                    groupName={group.name}
                    onColorChange={(newColor) => handleColorChange(group.id, newColor)}
                  />
                </div>

                {/* Youths List - REMOVED FOR PRIVACY */}
                {/* Youth names are hidden from the main view as per privacy requirements */}

                {/* Restorative Talk Flag */}
                <div className="mb-4">
                  {group.restorativeTalks && group.restorativeTalks.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-teylingereind-orange uppercase tracking-wider flex items-center gap-1">
                        <MessageCircleWarning size={14} />
                        Herstelgesprekken ({group.restorativeTalks.length})
                      </h3>
                      {group.restorativeTalks.map(talk => (
                        <div key={talk.id} className="bg-orange-50 border border-orange-100 p-2 rounded-lg text-sm">
                          <div className="font-bold text-gray-800 flex justify-between">
                            <span>{talk.youthName}</span>
                            <span className="text-xs font-normal text-gray-500">o.l.v. {talk.createdBy || "Onbekend"}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5 truncate">{talk.reason}</div>
                        </div>
                      ))}
                      <button
                        onClick={() => setRestorativeModalGroup(group)}
                        className="w-full text-center text-xs text-teylingereind-orange hover:underline mt-1"
                      >
                        Beheren
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRestorativeModalGroup(group)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent transition-all"
                    >
                      <MessageCircleWarning size={18} />
                      Geen Herstelgesprekken
                    </button>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <Link href="/sportmutaties" className="text-center p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer group/stat">
                    <div className="flex justify-center text-red-500 mb-1 group-hover/stat:scale-110 transition-transform">
                      <Activity size={16} />
                    </div>
                    <div className="text-lg font-bold text-gray-700">{group._count.mutations}</div>
                    <div className="text-xs text-gray-500 font-medium group-hover/stat:text-red-600">Mutaties</div>
                  </Link>
                  <Link href="/sportindicaties" className="text-center p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer group/stat">
                    <div className="flex justify-center text-purple-500 mb-1 group-hover/stat:scale-110 transition-transform">
                      <Activity size={16} />
                    </div>
                    <div className="text-lg font-bold text-gray-700">{group._count.indications}</div>
                    <div className="text-xs text-gray-500 font-medium group-hover/stat:text-purple-600">Indicaties</div>
                  </Link>
                  <Link href="/incidenten" className="text-center p-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer group/stat">
                    <div className="flex justify-center text-orange-500 mb-1 group-hover/stat:scale-110 transition-transform">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="text-lg font-bold text-gray-700">{group._count.restrictions || 0}</div>
                    <div className="text-xs text-gray-500 font-medium group-hover/stat:text-orange-600">Beperkingen</div>
                  </Link>
                </div>

                {/* Notes Preview - Clickable */}
                <div
                  onClick={() => setSelectedGroup({ id: group.id, name: group.name })}
                  className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 min-h-[80px] cursor-pointer hover:bg-yellow-100 hover:border-yellow-200 transition-all hover:shadow-sm group"
                  title="Klik om notities te beheren"
                >
                  <h3 className="text-xs font-bold text-yellow-800 mb-1 uppercase tracking-wide flex items-center justify-between">
                    Notities
                    <span className="text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs normal-case font-normal">
                      Klik om te beheren
                    </span>
                  </h3>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {group.notes && group.notes.length > 0 ? (
                      group.notes[0].content
                    ) : (
                      <span className="italic text-gray-400">Klik om notitie toe te voegen...</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Geen groepen gevonden</p>
        </div>
      )}

      {/* Notes Modal */}
      <NotesModal
        isOpen={selectedGroup !== null}
        onClose={() => {
          setSelectedGroup(null);
          fetchGroups(); // Refresh to show updated notes
        }}
        groupId={selectedGroup?.id || ""}
        groupName={selectedGroup?.name || ""}
      />

      {/* Restorative Talk Modal */}
      {restorativeModalGroup && (
        <RestorativeTalkModal
          isOpen={!!restorativeModalGroup}
          onClose={() => {
            setRestorativeModalGroup(null);
            fetchGroups(); // Refresh to update counts
          }}
          groupId={restorativeModalGroup.id}
          groupName={restorativeModalGroup.name}
        />
      )}
    </div>
  );
}
