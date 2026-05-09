import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageCard } from './ImageCard';
import { ImageItem } from '../lib/types';
import { useImageStore } from '../hooks/use-image-store';
import { useBackgroundRemoval } from '../hooks/use-background-removal';
import { useSolidBgRemoval } from '../hooks/use-solid-bg-removal';
import { useSolidBgOpts } from '../hooks/use-solid-bg-opts';

interface ImageGridProps {
  items: ImageItem[];
  enableBgTools?: boolean;
}

export function ImageGrid({ items, enableBgTools = true }: ImageGridProps) {
  const { reorderItems, removeItem } = useImageStore();
  const { removeBackground } = useBackgroundRemoval();
  const { removeSolidBg } = useSolidBgRemoval();
  const { opts: solidBgOpts } = useSolidBgOpts();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderItems(active.id as string, over.id as string);
    }
  };

  const handleDownload = (item: ImageItem) => {
    if (!item.processedBlob) return;
    const url = URL.createObjectURL(item.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = item.processedBlob.type.split('/')[1] || 'jpg';
    const base = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${base}-processed.${ext === 'jpeg' ? 'jpg' : ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBgRemoved = (item: ImageItem) => {
    if (!item.bgRemovedBlob) return;
    const url = URL.createObjectURL(item.bgRemovedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.file.name.replace(/\.[^/.]+$/, '')}-no-bg.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSolidBgRemoved = (item: ImageItem) => {
    if (!item.solidBgRemovedBlob) return;
    const url = URL.createObjectURL(item.solidBgRemovedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.file.name.replace(/\.[^/.]+$/, '')}-solid-bg-removed.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="h-full"
                >
                  <ImageCard
                    item={item}
                    onRemove={removeItem}
                    onDownload={handleDownload}
                    onRemoveBackground={enableBgTools ? removeBackground : undefined}
                    onDownloadBgRemoved={enableBgTools ? handleDownloadBgRemoved : undefined}
                    onRemoveSolidBg={enableBgTools ? removeSolidBg : undefined}
                    onDownloadSolidBgRemoved={enableBgTools ? handleDownloadSolidBgRemoved : undefined}
                    solidBgOpts={enableBgTools ? solidBgOpts : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
