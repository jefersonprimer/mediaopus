import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetGenerator } from '../hooks/use-asset-generator';
import { ASSET_DEFS, PLATFORM_LABELS, Platform } from '../lib/asset-definitions';
import { GeneratedAsset } from '../lib/generate-assets';
import { Header } from '../components/Header';
import { UploadZone } from '../components/UploadZone';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Upload,
  Wand2,
  DownloadCloud,
  Download,
  Smartphone,
  CheckCircle2,
  Loader2,
  Layers,
  FileJson,
  ChevronDown,
  ChevronUp,
  Eraser,
  Trash2,
} from 'lucide-react';

const PLATFORMS: Platform[] = ['expo', 'android', 'ios', 'pwa'];

const PLATFORM_ICONS: Record<Platform, string> = {
  expo: '⚡',
  android: '🤖',
  ios: '🍎',
  pwa: '🌐',
};

const CHECKERBOARD = {
  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 12px 12px',
  backgroundColor: '#fff',
};

export default function AssetGenerator() {
  const {
    state,
    setSourceFile,
    setForegroundScale,
    setBg,
    setCornerRadius,
    setBgRemoveThreshold,
    setMonochromeColor,
    togglePlatform,
    generate,
    downloadAsset,
    downloadAllZip,
  } = useAssetGenerator();

  const [showAppJson, setShowAppJson] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(135);

  const handleUpload = useCallback(
    (files: File[]) => {
      if (files[0]) setSourceFile(files[0]);
    },
    [setSourceFile],
  );

  const assetsByPlatform = PLATFORMS.reduce<Record<Platform, GeneratedAsset[]>>(
    (acc, p) => {
      acc[p] = state.assets.filter((a) => a.def.platform === p);
      return acc;
    },
    { expo: [], android: [], ios: [], pwa: [] }
  );

  const totalExpected = ASSET_DEFS.filter((d) => state.enabledPlatforms.has(d.platform)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Header />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/30 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
              {!state.sourceFile && (
                <>
                  <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center justify-center gap-3">
                      <Smartphone className="w-10 h-10 text-primary" />
                      Mobile App Asset Generator
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Upload a single logo and generate all required icon sizes for Expo, Android, iOS, and PWA — entirely in your browser.
                    </p>
                  </div>

                  <UploadZone
                    onUpload={handleUpload}
                    className="py-12 border-2 border-dashed border-primary/20 bg-background/50 backdrop-blur-sm rounded-3xl hover:border-primary/40 transition-all shadow-inner"
                  />
                </>
              )}

              {state.sourceFile && (
                <div className="space-y-12">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black tracking-tight">
                            Your Workspace
                          </h2>
                          <p className="text-sm text-muted-foreground font-medium">
                            Generate assets for {state.enabledPlatforms.size} platforms
                          </p>
                        </div>
                      </div>

                      <div className="pb-12">
                        {state.assets.length === 0 && !state.isGenerating && (
                          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 rounded-2xl border border-dashed border-border/50 bg-background/50 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                              <Wand2 className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No assets yet</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                              Click Generate to create all your platform icons instantly.
                            </p>
                          </div>
                        )}

                        {state.isGenerating && state.assets.length === 0 && (
                          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-muted-foreground text-sm">Generating assets...</p>
                            <Progress value={state.progress} className="w-48 h-2" />
                          </div>
                        )}

                        <AnimatePresence>
                          {state.assets.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-8"
                            >
                              {/* app.json snippet */}
                              <div className="rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur-sm">
                                <button
                                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
                                  onClick={() => setShowAppJson((v) => !v)}
                                  data-testid="btn-toggle-app-json"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-primary" />
                                    app.json configuration snippet
                                  </div>
                                  {showAppJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {showAppJson && (
                                  <pre className="text-xs bg-muted/40 px-4 py-3 overflow-x-auto text-muted-foreground border-t border-border">
{`{
  "expo": {
    "icon": "./assets/expo/icon.png",
    "splash": { "image": "./assets/expo/splash-icon.png", "backgroundColor": "${state.bg.color}" },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/android/android-icon-foreground.png",
        "backgroundImage": "./assets/android/android-icon-background.png",
        "monochromeImage": "./assets/android/android-icon-monochrome.png"
      }
    },
    "ios": { "icon": "./assets/ios/ios-app-store-icon.png" },
    "web": { "favicon": "./assets/pwa/favicon-48x48.png" }
  }
}`}
                                  </pre>
                                )}
                              </div>

                              {/* Per-platform grids */}
                              {PLATFORMS.filter((p) => assetsByPlatform[p].length > 0).map((platform) => (
                                <motion.div
                                  key={platform}
                                  initial={{ opacity: 0, y: 16 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="space-y-4"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{PLATFORM_ICONS[platform]}</span>
                                    <h2 className="text-lg font-bold tracking-tight">{PLATFORM_LABELS[platform]}</h2>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {assetsByPlatform[platform].length} assets
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {assetsByPlatform[platform].map((asset) => (
                                      <AssetCard
                                        key={asset.def.id}
                                        asset={asset}
                                        onDownload={downloadAsset}
                                      />
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Controls Sidebar */}
          <AnimatePresence>
            {state.sourceFile && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-[360px] border-l bg-background flex flex-col shadow-2xl"
              >
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {/* Source upload */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        Source Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files?.[0]) handleUpload([files[0]]);
                          };
                          input.click();
                        }}
                        className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden border-border hover:border-primary/50 hover:bg-muted/30"
                        data-testid="asset-upload-zone"
                      >
                        {state.sourcePreview && (
                          <div className="relative aspect-square w-full" style={CHECKERBOARD}>
                            <img
                              src={state.sourcePreview}
                              alt="Source"
                              className="w-full h-full object-contain p-4"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm">
                              <p className="text-sm font-medium text-foreground">Click to replace</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Settings card and other controls from the original code */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Platform toggles */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platforms</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {PLATFORMS.map((p) => (
                            <button
                              key={p}
                              onClick={() => togglePlatform(p)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border transition-all
                                ${state.enabledPlatforms.has(p)
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                                }`}
                              data-testid={`toggle-platform-${p}`}
                            >
                              <span>{PLATFORM_ICONS[p]}</span>
                              <span>{p === 'pwa' ? 'PWA' : p.charAt(0).toUpperCase() + p.slice(1)}</span>
                              {state.enabledPlatforms.has(p) && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Foreground scale */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Logo Scale</Label>
                          <span className="text-xs font-mono text-muted-foreground">
                            {Math.round(state.foregroundScale * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[state.foregroundScale * 100]}
                          onValueChange={([v]) => setForegroundScale(v / 100)}
                          min={20}
                          max={100}
                          step={1}
                          data-testid="slider-fg-scale"
                        />
                      </div>

                      <Separator />

                      {/* Corner radius */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Corner Radius</Label>
                          <span className="text-xs font-mono text-muted-foreground">{state.cornerRadius}%</span>
                        </div>
                        <Slider
                          value={[state.cornerRadius]}
                          onValueChange={([v]) => setCornerRadius(v)}
                          min={0}
                          max={50}
                          step={1}
                          data-testid="slider-corner-radius"
                        />
                      </div>

                      <Separator />

                      {/* Foreground extraction */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Eraser className="w-4 h-4 text-primary" />
                          <Label className="text-sm font-semibold">Extraction</Label>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Threshold</Label>
                            <span className="text-xs font-mono text-muted-foreground">{state.bgRemoveThreshold}</span>
                          </div>
                          <Slider
                            value={[state.bgRemoveThreshold]}
                            onValueChange={([v]) => setBgRemoveThreshold(v)}
                            min={0}
                            max={120}
                            step={1}
                            data-testid="slider-bg-threshold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Monochrome</Label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setMonochromeColor('white')}
                              className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-all
                                ${state.monochromeColor === 'white' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                              data-testid="btn-mono-white"
                            >
                              White
                            </button>
                            <button
                              onClick={() => setMonochromeColor('black')}
                              className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-all
                                ${state.monochromeColor === 'black' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                              data-testid="btn-mono-black"
                            >
                              Black
                            </button>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Background */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">Background</Label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBg({ type: 'solid' })}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-all
                              ${state.bg.type === 'solid' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                            data-testid="btn-bg-solid"
                          >
                            Solid
                          </button>
                          <button
                            onClick={() => setBg({ type: 'gradient', gradientEnd: state.bg.gradientEnd ?? '#8b5cf6' })}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] font-medium border transition-all
                              ${state.bg.type === 'gradient' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                            data-testid="btn-bg-gradient"
                          >
                            Gradient
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={state.bg.color}
                            onChange={(e) => setBg({ color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border border-border bg-transparent p-0 shrink-0"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={state.bg.color}
                            onChange={(e) => setBg({ color: e.target.value })}
                            className="font-mono text-[10px] h-7 uppercase px-2"
                            maxLength={7}
                          />
                        </div>

                        {state.bg.type === 'gradient' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={state.bg.gradientEnd ?? '#8b5cf6'}
                              onChange={(e) => setBg({ gradientEnd: e.target.value })}
                              className="w-6 h-6 rounded cursor-pointer border border-border bg-transparent p-0 shrink-0"
                              data-testid="input-bg-gradient-end"
                            />
                            <Input
                              value={state.bg.gradientEnd ?? '#8b5cf6'}
                              onChange={(e) => setBg({ gradientEnd: e.target.value })}
                              className="font-mono text-[10px] h-7 uppercase px-2"
                              maxLength={7}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-auto space-y-3">
                    <Button
                      className="w-full h-11 font-semibold shadow-sm"
                      onClick={generate}
                      disabled={!state.sourceFile || state.isGenerating}
                      data-testid="btn-generate-assets"
                    >
                      {state.isGenerating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{state.progress}%</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />Generate {totalExpected}</>
                      )}
                    </Button>

                    {state.assets.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full h-11 font-semibold"
                        onClick={downloadAllZip}
                        data-testid="btn-download-all-zip"
                      >
                        <DownloadCloud className="w-4 h-4 mr-2" />
                        Download ZIP
                      </Button>
                    )}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function AssetCard({
  asset,
  onDownload,
}: {
  asset: GeneratedAsset;
  onDownload: (a: GeneratedAsset) => void;
}) {
  const { def, previewUrl } = asset;
  const isTransparent = !def.bgFill;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
      data-testid={`asset-card-${def.id}`}
    >
      <div
        className="relative aspect-square w-full flex items-center justify-center p-3 overflow-hidden"
        style={isTransparent ? CHECKERBOARD : { backgroundColor: 'hsl(var(--muted))' }}
      >
        <img
          src={previewUrl}
          alt={def.label}
          className="max-w-full max-h-full object-contain"
          style={{ imageRendering: def.width <= 32 ? 'pixelated' : 'auto' }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs shadow"
            onClick={() => onDownload(asset)}
            data-testid={`btn-download-asset-${def.id}`}
          >
            <Download className="w-3 h-3 mr-1.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="px-2.5 py-2 border-t border-border/50">
        <p className="text-xs font-semibold truncate text-foreground" title={def.label}>
          {def.label}
        </p>
        <div className="flex items-center justify-between mt-0.5 gap-1">
          <p className="text-[10px] text-muted-foreground">
            {def.width}×{def.height}
          </p>
          {def.removeBackground && (
            <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded font-medium">
              bg stripped
            </span>
          )}
          {def.monochrome && (
            <span className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1 py-0.5 rounded font-medium">
              mono
            </span>
          )}
          {def.noCornerRadius && (
            <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-medium">
              flat
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
