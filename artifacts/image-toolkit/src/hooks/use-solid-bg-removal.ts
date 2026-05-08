import { useState, useCallback } from 'react';
import { useImageStore } from './use-image-store';
import { useToast } from './use-toast';
import { ImageItem } from '../lib/types';
import { removeSolidBackground, RemoveSolidBgOptions } from '../lib/remove-solid-bg';

export function useSolidBgRemoval() {
  const { items, updateItem } = useImageStore();
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const removeSolidBg = useCallback(
    async (item: ImageItem, opts: RemoveSolidBgOptions) => {
      updateItem(item.id, { solidBgStatus: 'processing' });

      try {
        const blob = await removeSolidBackground(item.file, opts);
        const url = URL.createObjectURL(blob);

        const current = useImageStore.getState().items.find((i) => i.id === item.id);
        if (current?.solidBgRemovedUrl) {
          URL.revokeObjectURL(current.solidBgRemovedUrl);
        }

        updateItem(item.id, {
          solidBgStatus: 'done',
          solidBgRemovedBlob: blob,
          solidBgRemovedUrl: url,
        });
      } catch (error) {
        console.error('Solid BG removal failed:', error);
        updateItem(item.id, { solidBgStatus: 'error' });
        toast({
          title: 'Background Removal Failed',
          description: `Could not process "${item.file.name}". Please try again.`,
          variant: 'destructive',
        });
      }
    },
    [updateItem, toast]
  );

  const removeAllSolidBg = useCallback(
    async (opts: RemoveSolidBgOptions) => {
      setIsRemoving(true);
      let successCount = 0;

      for (const item of items) {
        await removeSolidBg(item, opts);
        const updated = useImageStore.getState().items.find((i) => i.id === item.id);
        if (updated?.solidBgStatus === 'done') successCount++;
      }

      setIsRemoving(false);
      toast({
        title: 'Solid Background Removal Complete',
        description: `Processed ${successCount} of ${items.length} images.`,
      });
    },
    [items, removeSolidBg, toast]
  );

  return { removeSolidBg, removeAllSolidBg, isRemoving };
}
