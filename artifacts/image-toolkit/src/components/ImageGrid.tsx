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
import { Empty } from './ui/empty';
import { ImageIcon } from 'lucide-react';

interface ImageGridProps {
  items: ImageItem[];
}

export function ImageGrid({ items }: ImageGridProps) {
  const { reorderItems, removeItem } = useImageStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    
    // Construct filename
    const ext = item.processedBlob.type.split('/')[1] || 'jpg';
    const nameWithoutExt = item.file.name.replace(/\.[^/.]+$/, "");
    a.download = `${nameWithoutExt}-processed.${ext === 'jpeg' ? 'jpg' : ext}`;
    
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
