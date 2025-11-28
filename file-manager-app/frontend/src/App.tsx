import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilesQuery, useUploadMutation, useDeleteMutation, useRenameMutation } from './hooks/useFiles';
import { UploadArea } from './components/UploadArea';
import { UploadList } from './components/UploadList';
import { FileTable } from './components/FileTable';
import type { UploadStatus } from './types/file';
import { getDownloadUrl } from './api/files';
import { FolderOpen } from 'lucide-react';

const queryClient = new QueryClient();

function FileManager() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState('dateUploaded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const { data, isLoading, error } = useFilesQuery(page, pageSize, sortField, sortOrder);
  const uploadMutation = useUploadMutation();
  const deleteMutation = useDeleteMutation();
  const renameMutation = useRenameMutation();

  const handleFilesSelected = (files: File[]) => {
    files.forEach((file) => {
      const uploadId = Math.random().toString(36).substr(2, 9);
      const newUpload: UploadStatus = {
        id: uploadId,
        file,
        progress: 0,
        status: 'PENDING',
      };

      setUploads((prev) => [newUpload, ...prev]);

      uploadMutation.mutate(
        {
          file,
          onProgress: (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, status: 'UPLOADING', progress }
                  : u
              )
            );
          },
        },
        {
          onSuccess: () => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, status: 'COMPLETED', progress: 100 }
                  : u
              )
            );
            // Remove completed upload after 3 seconds
            setTimeout(() => {
              setUploads((prev) => prev.filter((u) => u.id !== uploadId));
            }, 3000);
          },
          onError: (err) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadId
                  ? { ...u, status: 'ERROR', error: err.message }
                  : u
              )
            );
          },
        }
      );
    });
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownload = (id: string) => {
    const url = getDownloadUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FolderOpen size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">File Manager</h1>
          </div>
          <div className="text-sm text-gray-500">
            {data?.totalFilesCount || 0} files
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>
              <UploadArea onFilesSelected={handleFilesSelected} />
            </section>

            <UploadList uploads={uploads} />
          </div>

          {/* Right Column: File List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Files</h2>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                Error loading files. Is the backend server running?
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <FileTable
                files={data?.files || []}
                totalCount={data?.totalFilesCount || 0}
                page={page}
                pageSize={pageSize}
                sortField={sortField}
                sortOrder={sortOrder}
                onPageChange={setPage}
                onSortChange={handleSortChange}
                onDelete={(ids) => deleteMutation.mutate(ids)}
                onRename={(id, newName) => renameMutation.mutate({ id, newName })}
                onDownload={handleDownload}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileManager />
    </QueryClientProvider>
  );
}
