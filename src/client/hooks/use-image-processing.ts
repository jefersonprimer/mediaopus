import { useState, useCallback } from 'react';
import Pica from 'pica';
import { ImageItem, ProcessOptions } from '../lib/types';
import { useImageStore } from './use-image-store';
import { useToast } from './use-toast';

const pica = new Pica();

const shouldFallbackToCanvasResize = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('Pica: cannot use getImageData on canvas') ||
    error.message.toLowerCase().includes('getimagedata')
  );
};

export function useImageProcessing() {
  const { items, updateItem } = useImageStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processImage = async (item: ImageItem, opts: ProcessOptions): Promise<Blob> => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loadPromise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image for processing'));
    });
    img.src = item.previewUrl;
    await loadPromise;

    let w = opts.width || img.naturalWidth;
    let h = opts.height || img.naturalHeight;

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.naturalWidth;
    srcCanvas.height = img.naturalHeight;
    srcCanvas.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0);

    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = w;
    dstCanvas.height = h;

    if (w !== img.naturalWidth || h !== img.naturalHeight) {
      try {
        await pica.resize(srcCanvas, dstCanvas, {
          unsharpAmount: 80,
          unsharpRadius: 0.6,
          unsharpThreshold: 2
        });
      } catch (error) {
        if (!shouldFallbackToCanvasResize(error)) {
          throw error;
        }
        const ctx = dstCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get destination canvas context');
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(srcCanvas, 0, 0, w, h);
      }
    } else {
      dstCanvas.getContext('2d')!.drawImage(srcCanvas, 0, 0);
    }

    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return new Promise((resolve, reject) => {
      dstCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeMap[opts.format],
        opts.quality / 100
      );
    });
  };

  const processAll = useCallback(async (opts: ProcessOptions) => {
    setIsProcessing(true);
    let successCount = 0;
    
    for (const item of items) {
      updateItem(item.id, { status: 'processing' });
      try {
        const blob = await processImage(item, opts);
        updateItem(item.id, {
          status: 'done',
          processedBlob: blob,
          processedSize: blob.size,
        });
        successCount++;
      } catch (error) {
        console.error('Error processing image:', error);
        updateItem(item.id, { status: 'error' });
      }
    }
    
    setIsProcessing(false);
    toast({
      title: "Processing Complete",
      description: `Successfully processed ${successCount} of ${items.length} images.`,
    });
  }, [items, updateItem, toast]);

  return { processAll, isProcessing };
}
