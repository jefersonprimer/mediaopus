import React, { useState, useEffect, useMemo } from 'react';
import { ProcessOptions } from '../lib/types';
import { useImageStore } from '../hooks/use-image-store';
import { useImageProcessing } from '../hooks/use-image-processing';
import { useAspectRatio } from '../hooks/use-aspect-ratio';
import { 
  Settings2, 
  Play, 
  DownloadCloud, 
  Trash2,
  Image as ImageIcon,
  Lock,
  Unlock,
  ChevronDown
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

export function ControlsPanel() {
  const { items, clearItems, getProcessedItems } = useImageStore();
  const { processAll, isProcessing } = useImageProcessing();
  
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp'>('webp');
  const [removeMetadata, setRemoveMetadata] = useState(true);

  // For batch processing, we might not have a single aspect ratio.
  // We'll leave width/height empty by default, meaning "keep original".
  const {
    width,
    height,
    handleWidthChange,
    handleHeightChange,
    maintainRatio,
    setMaintainRatio
  } = useAspectRatio(null, null);

  const hasItems = items.length > 0;
  const processedItems = getProcessedItems();
  const hasProcessedItems = processedItems.length > 0;

  const handleProcess = () => {
    const opts: ProcessOptions = {
      width: width || null,
      height: height || null,
      maintainAspectRatio: maintainRatio,
      quality,
      format,
      removeMetadata
    };
    processAll(opts);
  };

  const handleDownloadZip = async () => {
    if (processedItems.length === 0) return;
    
    const zip = new JSZip();
    processedItems.forEach(({ blob, name }) => zip.file(name, blob));
    const content = await zip.generateAsync({ type: 'blob' });
    
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-toolkit-export-${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOriginalSize = useMemo(() => items.reduce((acc, item) => acc + item.originalSize, 0), [items]);
  const totalProcessedSize = useMemo(() => items.reduce((acc, item) => acc + (item.processedSize || 0), 0), [items]);
  
  const savingsPercent = totalOriginalSize > 0 && totalProcessedSize > 0
    ? (((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100).toFixed(1)
    : null;

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
          {/* Format Selection */}
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

          {/* Quality Slider */}
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
              disabled={format === 'png'} // PNG is lossless in canvas
              className={format === 'png' ? 'opacity-50' : ''}
              data-testid="quality-slider"
            />
            {format === 'png' && (
              <p className="text-xs text-muted-foreground">Quality setting ignored for PNG.</p>
            )}
          </div>

          <Separator />

          {/* Dimensions */}
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
                  disabled={true} // Hard to do cleanly for batch with different ratios, keep disabled or simple
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
              Leave blank to keep original dimensions. Maintaining ratio in batch mode syncs inputs based on the first image if set.
            </p>
          </div>

          <Separator />

          {/* Advanced */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Remove Metadata</Label>
                <p className="text-xs text-muted-foreground">Strips EXIF data (location, camera info)</p>
              </div>
              <Switch
                checked={removeMetadata}
                onCheckedChange={setRemoveMetadata}
                disabled={true} // Canvas toBlob always strips metadata in this implementation
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
          disabled={!hasItems || isProcessing}
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
            onClick={handleDownloadZip}
            disabled={!hasProcessedItems || isProcessing}
            data-testid="btn-download-zip"
          >
            <DownloadCloud className="w-4 h-4 mr-2" />
            ZIP
          </Button>
          
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={clearItems}
            disabled={!hasItems || isProcessing}
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
