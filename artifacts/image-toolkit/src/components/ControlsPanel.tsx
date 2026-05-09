import React, { useMemo } from 'react';
import { useState } from 'react';
import { ProcessOptions } from '../lib/types';
import { useImageStore } from '../hooks/use-image-store';
import { useImageProcessing } from '../hooks/use-image-processing';
import { useBackgroundRemoval } from '../hooks/use-background-removal';
import { useSolidBgRemoval } from '../hooks/use-solid-bg-removal';
import { useSolidBgOpts } from '../hooks/use-solid-bg-opts';
import { useAspectRatio } from '../hooks/use-aspect-ratio';
import { hexToRgb, rgbToHex, PRESET_WHITE, PRESET_BLACK } from '../lib/remove-solid-bg';
import {
  Settings2,
  Play,
  DownloadCloud,
  Trash2,
  Lock,
  Unlock,
  Eraser,
  Scissors,
  ChevronDown,
  ChevronUp,
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

type ControlsPanelMode = 'processor' | 'removebg';

interface ControlsPanelProps {
  mode?: ControlsPanelMode;
}

export function ControlsPanel({ mode = 'processor' }: ControlsPanelProps) {
  const { items, clearItems, getProcessedItems, getBgRemovedItems, getSolidBgRemovedItems } =
    useImageStore();
  const { processAll, isProcessing } = useImageProcessing();
  const { removeAllBackgrounds, isRemoving: isAiRemoving } = useBackgroundRemoval();
  const { removeAllSolidBg, isRemoving: isSolidRemoving } = useSolidBgRemoval();
  const { opts: solidBgOpts, setOpts: setSolidBgOpts } = useSolidBgOpts();

  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp'>('webp');
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [showSolidBgSection, setShowSolidBgSection] = useState(true);
  const [showAiBgSection, setShowAiBgSection] = useState(false);

  // Local hex string state for the color picker (synced to store)
  const [solidBgHex, setSolidBgHexLocal] = useState(rgbToHex(solidBgOpts.targetColor));

  const handleHexChange = (hex: string) => {
    setSolidBgHexLocal(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setSolidBgOpts({ targetColor: hexToRgb(hex) });
    }
  };

  const { width, height, handleWidthChange, handleHeightChange, maintainRatio, setMaintainRatio } =
    useAspectRatio(null, null);

  const hasItems = items.length > 0;
  const processedItems = getProcessedItems();
  const bgRemovedItems = getBgRemovedItems();
  const solidBgRemovedItems = getSolidBgRemovedItems();
  const isBusy = isProcessing || isAiRemoving || isSolidRemoving;

  const totalOriginalSize = useMemo(() => items.reduce((a, i) => a + i.originalSize, 0), [items]);
  const totalProcessedSize = useMemo(
    () => items.reduce((a, i) => a + (i.processedSize || 0), 0),
    [items]
  );
  const savingsPercent =
    totalOriginalSize > 0 && totalProcessedSize > 0
      ? (((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100).toFixed(1)
      : null;

  const solidBgDoneCount = items.filter((i) => i.solidBgStatus === 'done').length;
  const aiBgDoneCount = items.filter((i) => i.bgRemovalStatus === 'done').length;
  const showBgTools = mode === 'removebg';
  const showProcessorTools = mode === 'processor';

  const handleDownloadZip = async (
    zipItems: { blob: Blob; name: string }[],
    zipName: string
  ) => {
    if (!zipItems.length) return;
    const zip = new JSZip();
    zipItems.forEach(({ blob, name }) => zip.file(name, blob));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${zipName}-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <CardContent className="flex flex-col gap-0 py-0">

          {/* ── Solid BG Removal ─────────────────────── */}
          {showBgTools && <div className="py-5 px-1 flex flex-col gap-3">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowSolidBgSection((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-500" />
                <Label className="text-sm font-semibold cursor-pointer text-foreground">
                  Solid Background Removal
                </Label>
                {solidBgDoneCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {solidBgDoneCount}/{items.length}
                  </Badge>
                )}
              </div>
              {showSolidBgSection ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showSolidBgSection && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Instant pixel-level removal for logos, icons, and flat graphics. No AI needed.
                </p>

                {/* Quick presets */}
                <div className="flex gap-2">
                  <Button
                    variant={rgbToHex(solidBgOpts.targetColor) === rgbToHex(PRESET_WHITE) ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => { setSolidBgHexLocal('#ffffff'); setSolidBgOpts({ targetColor: PRESET_WHITE }); }}
                    data-testid="btn-preset-white"
                  >
                    <div className="w-3 h-3 rounded-sm border border-current/30 mr-1.5 bg-white" />
                    White
                  </Button>
                  <Button
                    variant={rgbToHex(solidBgOpts.targetColor) === rgbToHex(PRESET_BLACK) ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => { setSolidBgHexLocal('#000000'); setSolidBgOpts({ targetColor: PRESET_BLACK }); }}
                    data-testid="btn-preset-black"
                  >
                    <div className="w-3 h-3 rounded-sm border border-current/30 mr-1.5 bg-black" />
                    Black
                  </Button>
                </div>

                {/* Color picker */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">Target Color</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={solidBgHex}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                      data-testid="input-solid-bg-color"
                    />
                    <Input
                      value={solidBgHex}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="font-mono text-xs h-8 uppercase"
                      maxLength={7}
                      data-testid="input-solid-bg-hex"
                    />
                  </div>
                </div>

                {/* Threshold slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Sensitivity</Label>
                    <span className="text-xs font-mono text-muted-foreground">
                      {solidBgOpts.threshold}%
                    </span>
                  </div>
                  <Slider
                    value={[solidBgOpts.threshold]}
                    onValueChange={([v]) => setSolidBgOpts({ threshold: v })}
                    min={1}
                    max={80}
                    step={1}
                    data-testid="slider-solid-bg-threshold"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Higher = removes more color variation. Lower = more precise.
                  </p>
                </div>

                {/* Smooth edges */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Smooth Edges</Label>
                    <p className="text-[10px] text-muted-foreground">Anti-aliased border fade</p>
                  </div>
                  <Switch
                    checked={solidBgOpts.smoothEdges}
                    onCheckedChange={(v) => setSolidBgOpts({ smoothEdges: v })}
                    className="scale-75 data-[state=checked]:bg-amber-500"
                    data-testid="switch-smooth-edges"
                  />
                </div>

                {/* Batch action */}
                <Button
                  variant="outline"
                  className="w-full border-dashed hover:border-solid hover:bg-amber-500/5 hover:text-amber-600 hover:border-amber-400"
                  onClick={() => removeAllSolidBg(solidBgOpts)}
                  disabled={!hasItems || isBusy}
                  data-testid="btn-remove-all-solid-bg"
                >
                  {isSolidRemoving ? (
                    <><Scissors className="w-4 h-4 mr-2 animate-pulse" />Processing...</>
                  ) : (
                    <><Scissors className="w-4 h-4 mr-2" />Remove All Solid Backgrounds</>
                  )}
                </Button>

                {solidBgRemovedItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDownloadZip(solidBgRemovedItems, 'solid-bg-removed')}
                    data-testid="btn-download-solid-bg-zip"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 mr-2" />
                    Download {solidBgRemovedItems.length} PNG{solidBgRemovedItems.length !== 1 ? 's' : ''} as ZIP
                  </Button>
                )}
              </div>
            )}
          </div>}

          {showBgTools && <Separator />}

          {/* ── AI BG Removal ───────────────────────── */}
          {showBgTools && <div className="py-5 px-1 flex flex-col gap-3">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowAiBgSection((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Eraser className="w-4 h-4 text-violet-500" />
                <Label className="text-sm font-semibold cursor-pointer text-foreground">
                  AI Background Removal
                </Label>
                {aiBgDoneCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {aiBgDoneCount}/{items.length}
                  </Badge>
                )}
              </div>
              {showAiBgSection ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showAiBgSection && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Uses an on-device AI model for complex images — people, animals, detailed subjects. Model downloads once and is cached.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-dashed hover:border-solid hover:bg-violet-500/5 hover:text-violet-600 hover:border-violet-400"
                  onClick={removeAllBackgrounds}
                  disabled={!hasItems || isBusy}
                  data-testid="btn-remove-all-bg"
                >
                  {isAiRemoving ? (
                    <><Eraser className="w-4 h-4 mr-2 animate-pulse" />Processing...</>
                  ) : (
                    <><Eraser className="w-4 h-4 mr-2" />Remove All Backgrounds (AI)</>
                  )}
                </Button>

                {bgRemovedItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDownloadZip(bgRemovedItems, 'ai-no-background')}
                    data-testid="btn-download-bg-zip"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 mr-2" />
                    Download {bgRemovedItems.length} AI PNG{bgRemovedItems.length !== 1 ? 's' : ''} as ZIP
                  </Button>
                )}
              </div>
            )}
          </div>}

          {showProcessorTools && <Separator />}

          {/* ── Output Format ───────────────────────── */}
          {showProcessorTools && <div className="py-5 px-1 space-y-3">
            <Label className="text-sm font-semibold text-foreground">Output Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(val: any) => setFormat(val)}
              className="flex items-center gap-3"
            >
              {(['webp', 'jpg', 'png'] as const).map((f) => (
                <div key={f} className="flex items-center space-x-2">
                  <RadioGroupItem value={f} id={`r-${f}`} />
                  <Label htmlFor={`r-${f}`} className="cursor-pointer text-xs uppercase">
                    {f === 'jpg' ? 'JPEG' : f.toUpperCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>}

          {showProcessorTools && <Separator />}

          {/* ── Quality ─────────────────────────────── */}
          {showProcessorTools && <div className="py-5 px-1 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Quality</Label>
              <span className="text-sm font-mono text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              max={100}
              step={1}
              disabled={format === 'png'}
              className={format === 'png' ? 'opacity-50' : ''}
              data-testid="quality-slider"
            />
            {format === 'png' && (
              <p className="text-xs text-muted-foreground">Quality setting ignored for PNG (lossless).</p>
            )}
          </div>}

          {showProcessorTools && <Separator />}

          {/* ── Resize ──────────────────────────────── */}
          {showProcessorTools && <div className="py-5 px-1 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Resize (px)</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="maintain-ratio" className="text-xs text-muted-foreground cursor-pointer">
                  Maintain Ratio
                </Label>
                <Switch
                  id="maintain-ratio"
                  checked={maintainRatio}
                  onCheckedChange={setMaintainRatio}
                  disabled
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
            <p className="text-[10px] text-muted-foreground">Leave blank to keep original dimensions.</p>
          </div>}

          {showProcessorTools && <Separator />}

          {/* ── Metadata ────────────────────────────── */}
          {showProcessorTools && <div className="py-5 px-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Remove Metadata</Label>
                <p className="text-xs text-muted-foreground">Strips EXIF data (location, camera info)</p>
              </div>
              <Switch
                checked={removeMetadata}
                onCheckedChange={setRemoveMetadata}
                disabled
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Always enforced by the browser's Canvas API.
            </p>
          </div>}

        </CardContent>
      </ScrollArea>

      {/* ── Footer ──────────────────────────────────── */}
      <div className="p-4 border-t border-border/50 bg-muted/20 sticky bottom-0 z-10 flex flex-col gap-3">
        {showProcessorTools && savingsPercent && Number(savingsPercent) > 0 && (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-2.5 rounded-lg text-xs flex items-center justify-between font-medium">
            <span>Total Savings</span>
            <span className="text-sm">-{savingsPercent}%</span>
          </div>
        )}

        {showProcessorTools && (
          <Button
            className="w-full font-semibold shadow-sm h-11"
            onClick={() =>
              processAll({
                width: width || null,
                height: height || null,
                maintainAspectRatio: maintainRatio,
                quality,
                format,
                removeMetadata,
              })
            }
            disabled={!hasItems || isBusy}
            data-testid="btn-process-all"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <><Play className="w-4 h-4 mr-2 fill-current" />Process {items.length > 0 ? items.length : ''} Images</>
            )}
          </Button>
        )}

        <div className={`grid gap-2 ${showProcessorTools ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showProcessorTools && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleDownloadZip(processedItems, 'image-toolkit-export')}
              disabled={!processedItems.length || isBusy}
              data-testid="btn-download-zip"
            >
              <DownloadCloud className="w-4 h-4 mr-2" />
              ZIP
            </Button>
          )}
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
