"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Search, AlertTriangle, CheckCircle, Edit2, Trash2, Folder, ChevronRight, ChevronDown, Upload, Download, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Material {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantityTotal: number;
  quantityUsable: number;
  quantityBroken: number;
  quantityToOrder: number;
  location: string;
  imageUrl?: string;
  conditionStatus: "GOED" | "LICHT_BESCHADIGD" | "KAPOT" | "TE_VERVANGEN";
}

// Define the folder structure based on the images
const FOLDER_STRUCTURE = {
  "Middelen": {
    "01. Kortverblijf (EB)": [
      "Fitness EB",
      "Sportzaal EB",
      "Dojo",
      "Sportveld EB",
      "Bibliotheek",
      "Chillroom"
    ],
    "02. Langverblijf (Vloed)": [
      "Fitness Vloed",
      "Sportzaal Vloed",
      "Dojo",
      "Sportveld Vloed"
    ]
  }
};

// Flattened locations for the dropdown in the form
const FORM_LOCATIONS = [
  "Fitness EB",
  "Fitness Vloed",
  "Dojo",
  "Sportveld EB",
  "Sportveld Vloed",
  "Sportzaal EB",
  "Sportzaal Vloed",
  "Bibliotheek",
  "Chillroom",
  "Overig"
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [uploading, setUploading] = useState(false);

  // Navigation State
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ "Middelen": true });
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Material>>({
    name: "",
    category: "OVERIG",
    quantityTotal: 1,
    quantityUsable: 1,
    quantityBroken: 0,
    quantityToOrder: 0,
    location: FORM_LOCATIONS[0],
    conditionStatus: "GOED",
    imageUrl: ""
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFolderSelect = (folderName: string, parent: string) => {
    setSelectedLocation(folderName);
  };

  const handleSave = async () => {
    try {
      const url = editingMaterial ? `/api/materials?id=${editingMaterial.id}` : "/api/materials";
      const method = editingMaterial ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      setEditingMaterial(null);
      setFormData({
        name: "", category: "OVERIG", quantityTotal: 1, quantityUsable: 1, quantityBroken: 0, quantityToOrder: 0, location: FORM_LOCATIONS[0], conditionStatus: "GOED", imageUrl: ""
      });
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit materiaal wilt verwijderen?")) return;
    try {
      await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material", error);
    }
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Afbeelding uploaden mislukt");
    } finally {
      setUploading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Naam", "Categorie", "Locatie", "Totaal", "Bruikbaar", "Kapot", "Te Bestellen", "Conditie", "Afbeelding URL"];
    const csvContent = [
      headers.join(","),
      ...materials.map(m => [
        `"${m.name}"`,
        `"${m.category}"`,
        `"${m.location}"`,
        m.quantityTotal,
        m.quantityUsable,
        m.quantityBroken,
        m.quantityToOrder,
        `"${m.conditionStatus}"`,
        `"${m.imageUrl || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `materialen_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation ? m.location === selectedLocation : true;
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0 h-full flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Folder size={18} className="text-teylingereind-blue" />
            Navigatie
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Root: Middelen */}
          <div>
            <button
              onClick={() => toggleFolder("Middelen")}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg text-sm font-medium text-teylingereind-blue"
            >
              {expandedFolders["Middelen"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Middelen
            </button>

            {expandedFolders["Middelen"] && (
              <div className="ml-4 space-y-1 border-l border-gray-200 pl-2 mt-1">
                {Object.entries(FOLDER_STRUCTURE["Middelen"]).map(([subFolder, items]) => (
                  <div key={subFolder}>
                    <button
                      onClick={() => toggleFolder(subFolder)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600"
                    >
                      {expandedFolders[subFolder] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {subFolder}
                    </button>

                    {expandedFolders[subFolder] && (
                      <div className="ml-4 space-y-1 border-l border-gray-200 pl-2 mt-1">
                        {items.map(item => {
                          const isActive = selectedLocation === item;

                          return (
                            <button
                              key={item}
                              onClick={() => handleFolderSelect(item, subFolder)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${isActive
                                ? "bg-teylingereind-royal/10 text-teylingereind-royal font-medium"
                                : "text-gray-500 hover:bg-gray-50 hover:text-teylingereind-blue"
                                }`}
                            >
                              <Folder size={14} className={isActive ? "text-teylingereind-royal" : "text-gray-400"} />
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLocation || "Alle Materialen"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {filteredMaterials.length} items gevonden
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2 transition-colors"
              title="Exporteer naar CSV"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setFormData({ ...formData, location: selectedLocation || FORM_LOCATIONS[0] });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-teylingereind-royal text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nieuw Item</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16">Img</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Naam</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Aantal</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Kapot / Kwijt</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Bestellen</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Conditie</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Locatie</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Geen materialen gevonden in deze map.</p>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      {material.imageUrl ? (
                        <img src={material.imageUrl} alt={material.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{material.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className={material.quantityUsable < material.quantityTotal ? "text-red-600 font-bold" : ""}>
                        {material.quantityUsable}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      {material.quantityTotal}
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">{material.quantityBroken || 0}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{material.quantityToOrder || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${material.conditionStatus === "GOED" ? "bg-green-100 text-green-700" :
                        material.conditionStatus === "LICHT_BESCHADIGD" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                        {material.conditionStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{material.location}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(material)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(material.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                {editingMaterial ? "Materiaal Bewerken" : "Nieuw Materiaal"}
              </h2>
              <div className="space-y-4">
                {/* Image Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-400">
                          {uploading ? (
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                          ) : (
                            <>
                              <Upload size={24} className="mx-auto mb-1" />
                              <span className="text-xs">Upload Foto</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {formData.imageUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, imageUrl: "" }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <input
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bijv. Voetbal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Totaal Aantal</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.quantityTotal}
                      onChange={e => setFormData({ ...formData, quantityTotal: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bruikbaar Aantal</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.quantityUsable}
                      onChange={e => setFormData({ ...formData, quantityUsable: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kapot / Kwijt</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.quantityBroken}
                      onChange={e => setFormData({ ...formData, quantityBroken: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Te Bestellen</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.quantityToOrder}
                      onChange={e => setFormData({ ...formData, quantityToOrder: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  >
                    {FORM_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conditie</label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.conditionStatus}
                    onChange={e => setFormData({ ...formData, conditionStatus: e.target.value as any })}
                  >
                    <option value="GOED">Goed</option>
                    <option value="LICHT_BESCHADIGD">Licht Beschadigd</option>
                    <option value="KAPOT">Kapot</option>
                    <option value="TE_VERVANGEN">Te Vervangen</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Annuleren</button>
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200">Opslaan</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
