import { useState, useCallback } from 'react';
import { useImageStore } from './use-image-store';
import { useToast } from './use-toast';
import { ImageItem } from '../lib/types';

export function useBackgroundRemoval() {
  const { items, updateItem } = useImageStore();
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const removeBackground = useCallback(async (item: ImageItem) => {
    updateItem(item.id, { bgRemovalStatus: 'processing' });

    try {
      const { removeBackground: imglyRemoveBackground } = await import('@imgly/background-removal');

      const blob = await imglyRemoveBackground(item.file, {
        model: 'small',
        output: {
          format: 'image/png',
          quality: 1,
        },
      });

      const url = URL.createObjectURL(blob);

      if (item.bgRemovedUrl) {
        URL.revokeObjectURL(item.bgRemovedUrl);
      }

      updateItem(item.id, {
        bgRemovalStatus: 'done',
        bgRemovedBlob: blob,
        bgRemovedUrl: url,
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      updateItem(item.id, { bgRemovalStatus: 'error' });
      toast({
        title: 'Background Removal Failed',
        description: `Could not process "${item.file.name}". Please try again.`,
        variant: 'destructive',
      });
    }
  }, [updateItem, toast]);

  const removeAllBackgrounds = useCallback(async () => {
    setIsRemoving(true);
    let successCount = 0;

    for (const item of items) {
      if (item.bgRemovalStatus === 'done') {
        successCount++;
        continue;
      }
      await removeBackground(item);
      const updated = useImageStore.getState().items.find(i => i.id === item.id);
      if (updated?.bgRemovalStatus === 'done') successCount++;
    }

    setIsRemoving(false);
    toast({
      title: 'Background Removal Complete',
      description: `Processed ${successCount} of ${items.length} images.`,
    });
  }, [items, removeBackground, toast]);

  return { removeBackground, removeAllBackgrounds, isRemoving };
}
