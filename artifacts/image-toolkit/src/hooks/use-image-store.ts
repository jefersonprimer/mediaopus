import { create } from 'zustand';
import { ImageItem } from '../lib/types';
import { arrayMove } from '@dnd-kit/sortable';

interface ImageStore {
  items: ImageItem[];
  addItems: (files: File[]) => Promise<void>;
  removeItem: (id: string) => void;
  clearItems: () => void;
  reorderItems: (activeId: string, overId: string) => void;
  updateItem: (id: string, updates: Partial<ImageItem>) => void;
  getProcessedItems: () => { blob: Blob; name: string }[];
  getBgRemovedItems: () => { blob: Blob; name: string }[];
}

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
};

export const useImageStore = create<ImageStore>((set, get) => ({
  items: [],
  addItems: async (files: File[]) => {
    const newItemsP = files.map(async (file) => {
      const { width, height } = await getImageDimensions(file);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        originalSize: file.size,
        processedBlob: null,
        processedSize: null,
        status: 'idle' as const,
        originalWidth: width,
        originalHeight: height,
        bgRemovalStatus: 'idle' as const,
        bgRemovedBlob: null,
        bgRemovedUrl: null,
      };
    });
    const newItems = await Promise.all(newItemsP);
    set((state) => ({ items: [...state.items, ...newItems] }));
  },
  removeItem: (id: string) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.bgRemovedUrl) URL.revokeObjectURL(item.bgRemovedUrl);
      }
      return { items: state.items.filter((i) => i.id !== id) };
    }),
  clearItems: () =>
    set((state) => {
      state.items.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.bgRemovedUrl) URL.revokeObjectURL(item.bgRemovedUrl);
      });
      return { items: [] };
    }),
  reorderItems: (activeId: string, overId: string) =>
    set((state) => {
      const oldIndex = state.items.findIndex((i) => i.id === activeId);
      const newIndex = state.items.findIndex((i) => i.id === overId);
      return { items: arrayMove(state.items, oldIndex, newIndex) };
    }),
  updateItem: (id: string, updates: Partial<ImageItem>) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
  getProcessedItems: () => {
    const { items } = get();
    return items
      .filter((i) => i.status === 'done' && i.processedBlob)
      .map((i) => {
        const ext = i.processedBlob!.type.split('/')[1] || 'jpg';
        const nameWithoutExt = i.file.name.replace(/\.[^/.]+$/, '');
        return {
          blob: i.processedBlob!,
          name: `${nameWithoutExt}-processed.${ext === 'jpeg' ? 'jpg' : ext}`,
        };
      });
  },
  getBgRemovedItems: () => {
    const { items } = get();
    return items
      .filter((i) => i.bgRemovalStatus === 'done' && i.bgRemovedBlob)
      .map((i) => {
        const nameWithoutExt = i.file.name.replace(/\.[^/.]+$/, '');
        return {
          blob: i.bgRemovedBlob!,
          name: `${nameWithoutExt}-no-bg.png`,
        };
      });
  },
}));
