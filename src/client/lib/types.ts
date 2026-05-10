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
  // AI background removal
  bgRemovalStatus: 'idle' | 'processing' | 'done' | 'error';
  bgRemovedBlob: Blob | null;
  bgRemovedUrl: string | null;
  // Solid color background removal
  solidBgStatus: 'idle' | 'processing' | 'done' | 'error';
  solidBgRemovedBlob: Blob | null;
  solidBgRemovedUrl: string | null;
}

export interface ProcessOptions {
  width: number | null;
  height: number | null;
  maintainAspectRatio: boolean;
  quality: number; // 0-100
  format: 'jpg' | 'png' | 'webp';
  removeMetadata: boolean;
}
