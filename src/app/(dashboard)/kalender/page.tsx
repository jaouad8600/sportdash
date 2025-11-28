"use client";

import { useState } from "react";
import SportScheduleTable from "@/components/SportScheduleTable";

type LocationFilter = "ALL" | "EB" | "VLOED";

export default function KalenderPage() {
  const [activeTab, setActiveTab] = useState<LocationFilter>("ALL");

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "ALL"
                ? "bg-teylingereind-blue text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            📅 Volledig Rooster
          </button>
          <button
            onClick={() => setActiveTab("EB")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "EB"
                ? "bg-teylingereind-royal text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            🏛️ EB (Oudbouw)
          </button>
          <button
            onClick={() => setActiveTab("VLOED")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === "VLOED"
                ? "bg-teylingereind-orange text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            🌊 Vloed (Nieuwbouw)
          </button>
        </div>
      </div>

      {/* Schedule Table with Filter */}
      <SportScheduleTable locationFilter={activeTab} />
    </div>
  );
}
