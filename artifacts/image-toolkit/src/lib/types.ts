export interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  processedBlob: Blob | null;
  processedSize: number | null;
  status: 'idle' | 'processing' | 'done' | 'error';
  originalWidth: number;
  originalHeight: number;
  bgRemovalStatus: 'idle' | 'processing' | 'done' | 'error';
  bgRemovedBlob: Blob | null;
  bgRemovedUrl: string | null;
}

export interface ProcessOptions {
  width: number | null;
  height: number | null;
  maintainAspectRatio: boolean;
  quality: number; // 0-100
  format: 'jpg' | 'png' | 'webp';
  removeMetadata: boolean;
}
