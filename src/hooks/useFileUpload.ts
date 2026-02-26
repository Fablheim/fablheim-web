import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
}

export function useFileUpload() {
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const uploadBattleMap = useMutation({
    mutationFn: async ({
      file,
      campaignId,
    }: {
      file: File;
      campaignId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaignId', campaignId);

      const response = await api.post<UploadResult>(
        '/files/battle-map',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress({
                loaded: e.loaded,
                total: e.total,
                percentage: Math.round((e.loaded * 100) / e.total),
              });
            }
          },
        },
      );

      setProgress(null);
      return response.data;
    },
  });

  const uploadPortrait = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<UploadResult>(
        '/files/portrait',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress({
                loaded: e.loaded,
                total: e.total,
                percentage: Math.round((e.loaded * 100) / e.total),
              });
            }
          },
        },
      );

      setProgress(null);
      return response.data;
    },
  });

  return { uploadBattleMap, uploadPortrait, progress };
}
