'use client';

import React, { useState } from 'react';
import { useFiles } from '@/hooks/useSportData';
import { File as FileIcon, Upload, Trash2, Edit2, Download, MoreVertical, X, Check, Grid, List, Share2, FileText, Image as ImageIcon, Search, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'all', label: 'Alle Bestanden' },
  { id: 'image', label: 'Afbeeldingen' },
  { id: 'document', label: 'Documenten' },
];

export default function FileManagerPage() {
  const { data: files, isLoading, uploadFile, deleteFile, renameFile } = useFiles();
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await handleUpload(droppedFiles[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await uploadFile.mutateAsync(formData);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload mislukt');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit bestand wilt verwijderen?')) {
      try {
        await deleteFile.mutateAsync(id);
        setActiveMenu(null);
      } catch (error) {
        console.error('Delete failed', error);
      }
    }
  };

  const startEditing = (file: any) => {
    setEditingId(file.id);
    setEditName(file.name);
    setActiveMenu(null);
  };

  const saveRename = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await renameFile.mutateAsync({ id: editingId, name: editName });
      setEditingId(null);
    } catch (error) {
      console.error('Rename failed', error);
    }
  };

  const handleShare = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    alert('Link gekopieerd naar klembord!');
    setActiveMenu(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <FileIcon className="w-8 h-8 text-blue-500" />;
  };

  const filteredFiles = files?.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'image'
        ? file.type.startsWith('image/')
        : !file.type.startsWith('image/'); // Assume everything else is document for now
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl" onClick={() => setActiveMenu(null)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
            Bestanden
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Beheer documenten, afbeeldingen en andere bestanden.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 font-medium"
          >
            <Upload size={18} className="mr-2" />
            Uploaden
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Zoeken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-8 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-800/50'
          }`}
      >
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Upload size={32} />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">Sleep bestanden hierheen</p>
          <p className="text-sm mt-1">of klik op de upload knop om te bladeren</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Bestanden laden...</p>
        </div>
      ) : filteredFiles?.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <FileIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Geen bestanden gevonden.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles?.map((file) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={file.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative cursor-pointer" onClick={() => file.type.startsWith('image/') && setPreviewFile(file)}>
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(file.type)
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.type.startsWith('image/')) {
                            setPreviewFile(file);
                          } else {
                            window.open(file.url, '_blank');
                          }
                        }}
                        className="p-2 bg-white/90 rounded-full text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                        title="Bekijken"
                      >
                        <Eye size={18} />
                      </button>
                      <a
                        href={file.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/90 rounded-full text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                        title="Downloaden"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === file.id ? null : file.id);
                        }}
                        className="p-2 bg-white/90 rounded-full text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3">
                    {editingId === file.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && saveRename()}
                        />
                        <button onClick={saveRename} className="text-green-600 hover:text-green-700">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatSize(file.size)} • {format(new Date(file.createdAt), 'dd MMM', { locale: nl })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Context Menu */}
                  <AnimatePresence>
                    {activeMenu === file.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-2 top-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-1">
                          <button
                            onClick={() => startEditing(file)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                          >
                            <Edit2 size={14} /> Naam wijzigen
                          </button>
                          <button
                            onClick={() => handleShare(file.url)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
                          >
                            <Share2 size={14} /> Link kopiëren
                          </button>
                          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Verwijderen
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Naam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grootte</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles?.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                            {file.type.startsWith('image/') ? (
                              <img src={file.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              getFileIcon(file.type)
                            )}
                          </div>
                          {editingId === file.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                                autoFocus
                              />
                              <button onClick={saveRename} className="text-green-600 hover:text-green-700">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-700">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {file.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(file.createdAt), 'dd-MM-yyyy HH:mm', { locale: nl })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Downloaden"
                          >
                            <Download size={18} />
                          </a>
                          <button
                            onClick={() => startEditing(file)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Hernoemen"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-5xl max-h-[90vh] w-full bg-transparent flex flex-col items-center"
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X size={32} />
              </button>
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-white text-center">
                <h3 className="text-xl font-bold">{previewFile.name}</h3>
                <p className="text-gray-400 text-sm">{formatSize(files?.find(f => f.url === previewFile.url)?.size || 0)}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
