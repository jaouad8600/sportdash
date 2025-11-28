import { useState, useCallback } from 'react';
import { uploadFile } from '../api/files';
import type { UploadProgress } from '../types/File';
import { useQueryClient } from '@tanstack/react-query';

export const useFileUpload = () => {
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const queryClient = useQueryClient();

    const addFiles = useCallback((files: File[]) => {
        const newUploads = files.map((file) => ({
            fileName: file.name,
            progress: 0,
            status: 'uploading' as const,
        }));

        setUploads((prev) => [...newUploads, ...prev]);

        files.forEach((file) => {
            uploadFile(file, (progress) => {
                setUploads((prev) =>
                    prev.map((u) =>
                        u.fileName === file.name ? { ...u, progress } : u
                    )
                );
            })
                .then(() => {
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.fileName === file.name
                                ? { ...u, status: 'completed', progress: 100 }
                                : u
                        )
                    );
                    queryClient.invalidateQueries({ queryKey: ['files'] });
                })
                .catch((error) => {
                    setUploads((prev) =>
                        prev.map((u) =>
                            u.fileName === file.name
                                ? { ...u, status: 'error', error: error.message }
                                : u
                        )
                    );
                });
        });
    }, [queryClient]);

    const clearCompleted = useCallback(() => {
        setUploads((prev) => prev.filter((u) => u.status !== 'completed'));
    }, []);

    return { uploads, addFiles, clearCompleted };
};
