import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageItem } from '../lib/types';
import { X, GripVertical, CheckCircle2, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface ImageCardProps {
  item: ImageItem;
  onRemove: (id: string) => void;
  onDownload?: (item: ImageItem) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ImageCard({ item, onRemove, onDownload }: ImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const getSavings = () => {
    if (!item.processedSize) return null;
    const diff = item.originalSize - item.processedSize;
    const percent = ((diff / item.originalSize) * 100).toFixed(0);
    const isSmaller = diff > 0;
    
    return {
      diff,
      percent,
      isSmaller,
      text: isSmaller ? `-${percent}%` : `+${Math.abs(Number(percent))}%`
    };
  };

  const savings = getSavings();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-200 ${
        isDragging ? 'shadow-xl ring-2 ring-primary border-transparent scale-[1.02]' : 'hover:shadow-md'
      }`}
      data-testid={`image-card-${item.id}`}
    >
      {/* Drag handle & Actions overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          data-testid={`btn-remove-${item.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Image Preview */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
        <img
          src={item.previewUrl}
          alt={item.file.name}
          className="object-contain w-full h-full"
        />
        
        {/* Status Overlays */}
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <Progress value={undefined} className="w-1/2 h-2" />
          </div>
        )}
        
        {item.status === 'done' && (
          <div className="absolute inset-0 bg-success/10 pointer-events-none" />
        )}
        
        {item.status === 'error' && (
          <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none">
            <AlertCircle className="h-10 w-10 text-destructive opacity-50" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-2 flex-grow">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium truncate text-foreground" title={item.file.name}>
            {item.file.name}
          </p>
          {item.status === 'done' && (
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.originalWidth} × {item.originalHeight}</span>
            <span>{formatBytes(item.originalSize)}</span>
          </div>

          {item.status === 'done' && item.processedSize && (
            <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
              <span className="text-xs font-semibold text-foreground">
                {formatBytes(item.processedSize)}
              </span>
              {savings && (
                <Badge
                  variant={savings.isSmaller ? "default" : "destructive"}
                  className={`text-[10px] h-5 px-1.5 ${savings.isSmaller ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                >
                  {savings.text}
                </Badge>
              )}
            </div>
          )}

          {item.status === 'done' && item.processedBlob && onDownload && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 h-8 text-xs"
              onClick={() => onDownload(item)}
              data-testid={`btn-download-${item.id}`}
            >
              <Download className="w-3 h-3 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
