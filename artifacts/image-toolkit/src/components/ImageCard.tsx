import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageItem } from '../lib/types';
import {
  X,
  GripVertical,
  CheckCircle2,
  Download,
  AlertCircle,
  Loader2,
  Eraser,
  Layers,
  Scissors,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RemoveSolidBgOptions, PRESET_WHITE, PRESET_BLACK } from '../lib/remove-solid-bg';

interface ImageCardProps {
  item: ImageItem;
  onRemove: (id: string) => void;
  onDownload?: (item: ImageItem) => void;
  onRemoveBackground?: (item: ImageItem) => void;
  onDownloadBgRemoved?: (item: ImageItem) => void;
  onRemoveSolidBg?: (item: ImageItem, opts: RemoveSolidBgOptions) => void;
  onDownloadSolidBgRemoved?: (item: ImageItem) => void;
  solidBgOpts?: RemoveSolidBgOptions;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type PreviewMode = 'original' | 'ai-bg' | 'solid-bg';

const CHECKERBOARD = {
  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 16px 16px',
  backgroundColor: '#fff',
};

export function ImageCard({
  item,
  onRemove,
  onDownload,
  onRemoveBackground,
  onDownloadBgRemoved,
  onRemoveSolidBg,
  onDownloadSolidBgRemoved,
  solidBgOpts,
}: ImageCardProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('original');

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
      isSmaller,
      text: isSmaller ? `-${percent}%` : `+${Math.abs(Number(percent))}%`,
    };
  };

  const savings = getSavings();
  const hasAiBgRemoved = item.bgRemovalStatus === 'done' && item.bgRemovedUrl;
  const hasSolidBgRemoved = item.solidBgStatus === 'done' && item.solidBgRemovedUrl;
  const aiBgRemoving = item.bgRemovalStatus === 'processing';
  const solidBgRemoving = item.solidBgStatus === 'processing';
  const isBusy = item.status === 'processing' || aiBgRemoving || solidBgRemoving;

  const hasAlternateView = hasAiBgRemoved || hasSolidBgRemoved;

  const previewUrl =
    previewMode === 'ai-bg' && hasAiBgRemoved
      ? item.bgRemovedUrl!
      : previewMode === 'solid-bg' && hasSolidBgRemoved
      ? item.solidBgRemovedUrl!
      : item.previewUrl;

  const useCheckerboard =
    (previewMode === 'ai-bg' && hasAiBgRemoved) ||
    (previewMode === 'solid-bg' && hasSolidBgRemoved);

  // Cycle through available preview modes
  const cyclePreview = () => {
    const modes: PreviewMode[] = ['original'];
    if (hasAiBgRemoved) modes.push('ai-bg');
    if (hasSolidBgRemoved) modes.push('solid-bg');
    const current = modes.indexOf(previewMode);
    setPreviewMode(modes[(current + 1) % modes.length]);
  };

  const previewLabel =
    previewMode === 'ai-bg'
      ? 'AI No BG'
      : previewMode === 'solid-bg'
      ? 'Solid No BG'
      : 'Original';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-200 ${
        isDragging
          ? 'shadow-xl ring-2 ring-primary border-transparent scale-[1.02]'
          : 'hover:shadow-md'
      }`}
      data-testid={`image-card-${item.id}`}
    >
      {/* Top-right: Remove button */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          data-testid={`btn-remove-${item.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Top-left: Drag handle */}
      <div
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Preview cycle button */}
      {hasAlternateView && (
        <button
          className="absolute top-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] font-medium text-foreground flex items-center gap-1 whitespace-nowrap"
          onClick={cyclePreview}
          data-testid={`btn-cycle-preview-${item.id}`}
        >
          <Layers className="h-3 w-3" />
          {previewLabel}
        </button>
      )}

      {/* Image preview area */}
      <div
        className="relative aspect-square w-full overflow-hidden flex items-center justify-center"
        style={useCheckerboard ? CHECKERBOARD : { backgroundColor: 'hsl(var(--muted))' }}
      >
        <img
          src={previewUrl}
          alt={item.file.name}
          className="object-contain w-full h-full"
        />

        {/* Busy overlay */}
        {isBusy && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">
              {aiBgRemoving
                ? 'Removing AI background...'
                : solidBgRemoving
                ? 'Removing solid background...'
                : 'Processing...'}
            </p>
            <Progress value={undefined} className="w-1/2 h-1.5" />
          </div>
        )}

        {item.status === 'done' && !isBusy && (
          <div className="absolute inset-0 bg-success/10 pointer-events-none" />
        )}

        {item.status === 'error' && (
          <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none">
            <AlertCircle className="h-10 w-10 text-destructive opacity-50" />
          </div>
        )}

        {/* Status badges */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {item.bgRemovalStatus === 'error' && (
            <Badge variant="destructive" className="text-[10px]">AI BG failed</Badge>
          )}
          {item.solidBgStatus === 'error' && (
            <Badge variant="destructive" className="text-[10px]">Solid BG failed</Badge>
          )}
        </div>
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

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.originalWidth} × {item.originalHeight}</span>
            <span>{formatBytes(item.originalSize)}</span>
          </div>

          {item.status === 'done' && item.processedSize && (
            <div className="flex items-center justify-between pt-1.5 border-t border-border mt-0.5">
              <span className="text-xs font-semibold">{formatBytes(item.processedSize)}</span>
              {savings && (
                <Badge
                  variant={savings.isSmaller ? 'default' : 'destructive'}
                  className={`text-[10px] h-5 px-1.5 ${savings.isSmaller ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}`}
                >
                  {savings.text}
                </Badge>
              )}
            </div>
          )}

          {/* Download processed */}
          {item.status === 'done' && item.processedBlob && onDownload && (
            <Button variant="outline" size="sm" className="w-full h-8 text-xs"
              onClick={() => onDownload(item)} data-testid={`btn-download-${item.id}`}>
              <Download className="w-3 h-3 mr-1.5" />
              Download
            </Button>
          )}

          {/* AI background removal */}
          {onRemoveBackground && item.bgRemovalStatus !== 'done' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs border-dashed hover:border-solid hover:bg-violet-500/5 hover:text-violet-600 hover:border-violet-400"
              onClick={() => onRemoveBackground(item)}
              disabled={isBusy}
              data-testid={`btn-remove-bg-${item.id}`}
            >
              {aiBgRemoving ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Removing...</>
              ) : (
                <><Eraser className="w-3 h-3 mr-1.5" />Remove BG (AI)</>
              )}
            </Button>
          )}

          {hasAiBgRemoved && onDownloadBgRemoved && (
            <Button variant="secondary" size="sm" className="w-full h-8 text-xs"
              onClick={() => onDownloadBgRemoved(item)} data-testid={`btn-download-no-bg-${item.id}`}>
              <Download className="w-3 h-3 mr-1.5" />
              PNG — AI no BG
            </Button>
          )}

          {/* Solid BG removal quick actions */}
          {onRemoveSolidBg && solidBgOpts && item.solidBgStatus !== 'done' && (
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[60px] h-8 text-[10px] border-dashed hover:border-solid hover:bg-amber-500/5 hover:text-amber-600 hover:border-amber-400 px-1"
                onClick={() => onRemoveSolidBg(item, { ...solidBgOpts, targetColor: PRESET_WHITE })}
                disabled={isBusy}
                data-testid={`btn-remove-solid-white-${item.id}`}
                title="Remove white background"
              >
                {solidBgRemoving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <><Scissors className="w-3 h-3 mr-1" />White</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-[60px] h-8 text-[10px] border-dashed hover:border-solid hover:bg-amber-500/5 hover:text-amber-600 hover:border-amber-400 px-1"
                onClick={() => onRemoveSolidBg(item, { ...solidBgOpts, targetColor: PRESET_BLACK })}
                disabled={isBusy}
                data-testid={`btn-remove-solid-black-${item.id}`}
                title="Remove black background"
              >
                <><Scissors className="w-3 h-3 mr-1" />Black</>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] border-dashed hover:border-solid hover:bg-amber-500/5 hover:text-amber-600 hover:border-amber-400 px-2"
                onClick={() => onRemoveSolidBg(item, solidBgOpts)}
                disabled={isBusy}
                data-testid={`btn-remove-solid-custom-${item.id}`}
                title="Remove custom color background"
              >
                <div
                  className="w-3.5 h-3.5 rounded-sm border border-border shadow-inner"
                  style={{ backgroundColor: `rgb(${solidBgOpts.targetColor.r},${solidBgOpts.targetColor.g},${solidBgOpts.targetColor.b})` }}
                />
              </Button>
            </div>
          )}

          {hasSolidBgRemoved && onDownloadSolidBgRemoved && (
            <Button variant="secondary" size="sm" className="w-full h-8 text-xs"
              onClick={() => onDownloadSolidBgRemoved(item)} data-testid={`btn-download-solid-no-bg-${item.id}`}>
              <Download className="w-3 h-3 mr-1.5" />
              PNG — solid no BG
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
