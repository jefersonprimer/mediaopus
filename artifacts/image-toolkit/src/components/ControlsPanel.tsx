import React, { useState, useMemo } from 'react';
import { ProcessOptions } from '../lib/types';
import { useImageStore } from '../hooks/use-image-store';
import { useImageProcessing } from '../hooks/use-image-processing';
import { useBackgroundRemoval } from '../hooks/use-background-removal';
import { useAspectRatio } from '../hooks/use-aspect-ratio';
import {
  Settings2,
  Play,
  DownloadCloud,
  Trash2,
  Lock,
  Unlock,
  Eraser,
} from 'lucide-react';
import JSZip from 'jszip';

import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';

export function ControlsPanel() {
  const { items, clearItems, getProcessedItems, getBgRemovedItems } = useImageStore();
  const { processAll, isProcessing } = useImageProcessing();
  const { removeAllBackgrounds, isRemoving } = useBackgroundRemoval();

  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp'>('webp');
  const [removeMetadata, setRemoveMetadata] = useState(true);

  const {
    width,
    height,
    handleWidthChange,
    handleHeightChange,
    maintainRatio,
    setMaintainRatio,
  } = useAspectRatio(null, null);

  const hasItems = items.length > 0;
  const processedItems = getProcessedItems();
  const bgRemovedItems = getBgRemovedItems();
  const hasProcessedItems = processedItems.length > 0;
  const hasBgRemovedItems = bgRemovedItems.length > 0;
  const isBusy = isProcessing || isRemoving;

  const handleProcess = () => {
    const opts: ProcessOptions = {
      width: width || null,
      height: height || null,
      maintainAspectRatio: maintainRatio,
      quality,
      format,
      removeMetadata,
    };
    processAll(opts);
  };

  const handleDownloadZip = async (items: { blob: Blob; name: string }[], zipName: string) => {
    if (items.length === 0) return;
    const zip = new JSZip();
    items.forEach(({ blob, name }) => zip.file(name, blob));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${zipName}-${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOriginalSize = useMemo(
    () => items.reduce((acc, item) => acc + item.originalSize, 0),
    [items]
  );
  const totalProcessedSize = useMemo(
    () => items.reduce((acc, item) => acc + (item.processedSize || 0), 0),
    [items]
  );

  const savingsPercent =
    totalOriginalSize > 0 && totalProcessedSize > 0
      ? (((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100).toFixed(1)
      : null;

  const bgRemovedCount = items.filter((i) => i.bgRemovalStatus === 'done').length;
  const bgRemovingCount = items.filter((i) => i.bgRemovalStatus === 'processing').length;

  return (
    <Card className="flex flex-col h-full rounded-none md:rounded-xl border-t-0 md:border-t shadow-2xl bg-card">
      <CardHeader className="py-4 border-b border-border/50 sticky top-0 bg-card z-10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-primary" />
          Processing Controls
        </CardTitle>
        <CardDescription>Configure batch processing settings</CardDescription>
      </CardHeader>

      <ScrollArea className="flex-grow">
        <CardContent className="flex flex-col gap-6 py-6">

          {/* === Background Removal === */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">AI Background Removal</Label>
              {bgRemovedCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {bgRemovedCount}/{items.length} done
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Runs entirely in your browser using an AI model. The model downloads once and is cached. Output is always transparent PNG.
            </p>
            <Button
              variant="outline"
              className="w-full border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary hover:border-primary"
              onClick={removeAllBackgrounds}
              disabled={!hasItems || isBusy}
              data-testid="btn-remove-all-bg"
            >
              {isRemoving ? (
                <>
                  <Eraser className="w-4 h-4 mr-2 animate-pulse" />
                  Removing backgrounds{bgRemovingCount > 0 ? ` (${bgRemovingCount} active)` : ''}...
                </>
              ) : (
                <>
                  <Eraser className="w-4 h-4 mr-2" />
                  Remove All Backgrounds
                </>
              )}
            </Button>
            {hasBgRemovedItems && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleDownloadZip(bgRemovedItems, 'no-background')}
                data-testid="btn-download-bg-zip"
              >
                <DownloadCloud className="w-3.5 h-3.5 mr-2" />
                Download {bgRemovedItems.length} No-BG PNG{bgRemovedItems.length !== 1 ? 's' : ''} as ZIP
              </Button>
            )}
          </div>

          <Separator />

          {/* === Format Selection === */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Output Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(val: any) => setFormat(val)}
              className="flex items-center gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="webp" id="r-webp" />
                <Label htmlFor="r-webp" className="cursor-pointer">WEBP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="r-jpg" />
                <Label htmlFor="r-jpg" className="cursor-pointer">JPEG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="r-png" />
                <Label htmlFor="r-png" className="cursor-pointer">PNG</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* === Quality Slider === */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Quality</Label>
              <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                {quality}%
              </span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([val]) => setQuality(val)}
              max={100}
              step={1}
              disabled={format === 'png'}
              className={format === 'png' ? 'opacity-50' : ''}
              data-testid="quality-slider"
            />
            {format === 'png' && (
              <p className="text-xs text-muted-foreground">Quality setting ignored for PNG.</p>
            )}
          </div>

          <Separator />

          {/* === Dimensions === */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Resize (px)</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="maintain-ratio" className="text-xs text-muted-foreground cursor-pointer">
                  Maintain Ratio
                </Label>
                <Switch
                  id="maintain-ratio"
                  checked={maintainRatio}
                  onCheckedChange={setMaintainRatio}
                  disabled={true}
                  className="scale-75 data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={width || ''}
                  onChange={(e) => handleWidthChange(e.target.value ? Number(e.target.value) : null)}
                  className="font-mono text-sm"
                  min={1}
                />
              </div>
              <div className="flex items-center pt-5 text-muted-foreground">
                {maintainRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={height || ''}
                  onChange={(e) => handleHeightChange(e.target.value ? Number(e.target.value) : null)}
                  className="font-mono text-sm"
                  min={1}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Leave blank to keep original dimensions.
            </p>
          </div>

          <Separator />

          {/* === Metadata === */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Remove Metadata</Label>
                <p className="text-xs text-muted-foreground">Strips EXIF data (location, camera info)</p>
              </div>
              <Switch
                checked={removeMetadata}
                onCheckedChange={setRemoveMetadata}
                disabled={true}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Metadata removal is always enforced by the browser's Canvas API.
            </p>
          </div>

        </CardContent>
      </ScrollArea>

      {/* Action Footer */}
      <div className="p-4 border-t border-border/50 bg-muted/20 sticky bottom-0 z-10 flex flex-col gap-3">
        {savingsPercent && Number(savingsPercent) > 0 && (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-2.5 rounded-lg text-xs flex items-center justify-between font-medium">
            <span>Total Savings</span>
            <span className="text-sm">-{savingsPercent}%</span>
          </div>
        )}

        <Button
          className="w-full font-semibold shadow-sm h-11"
          onClick={handleProcess}
          disabled={!hasItems || isBusy}
          data-testid="btn-process-all"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Process {items.length > 0 ? items.length : ''} Images
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDownloadZip(processedItems, 'image-toolkit-export')}
            disabled={!hasProcessedItems || isBusy}
            data-testid="btn-download-zip"
          >
            <DownloadCloud className="w-4 h-4 mr-2" />
            ZIP
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={clearItems}
            disabled={!hasItems || isBusy}
            data-testid="btn-clear-all"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
}
