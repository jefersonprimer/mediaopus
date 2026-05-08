import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssetGenerator } from '../hooks/use-asset-generator';
import { ASSET_DEFS, PLATFORM_LABELS, PLATFORM_COLORS, Platform } from '../lib/asset-definitions';
import { GeneratedAsset } from '../lib/generate-assets';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
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
} from 'lucide-react';

const PLATFORMS: Platform[] = ['expo', 'android', 'ios', 'pwa'];

const PLATFORM_ICONS: Record<Platform, string> = {
  expo: '⚡',
  android: '🤖',
  ios: '',
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
    togglePlatform,
    generate,
    downloadAsset,
    downloadAllZip,
  } = useAssetGenerator();

  const [showAppJson, setShowAppJson] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(135);

  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) setSourceFile(accepted[0]); },
    [setSourceFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

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

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-primary" />
            Mobile App Asset Generator
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Upload a single logo and generate all required icon sizes for Expo, Android, iOS, and PWA — entirely in your browser.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ── Left: Controls ───────────────────────── */}
          <div className="w-full lg:w-80 xl:w-[340px] shrink-0 flex flex-col gap-4">

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
                  {...getRootProps()}
                  className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden
                    ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                  `}
                  data-testid="asset-upload-zone"
                >
                  <input {...getInputProps()} />
                  {state.sourcePreview ? (
                    <div className="relative aspect-square w-full" style={CHECKERBOARD}>
                      <img
                        src={state.sourcePreview}
                        alt="Source"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm">
                        <p className="text-sm font-medium text-foreground">Click or drop to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Drop your logo here</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — transparent PNGs work best</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generation settings */}
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
                  <p className="text-[10px] text-muted-foreground">
                    How large the logo appears within each icon canvas.
                  </p>
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
                  <p className="text-[10px] text-muted-foreground">
                    0 = square, 50 = circle. iOS clips icons automatically so this mainly affects previews.
                  </p>
                </div>

                <Separator />

                {/* Background */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Background</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBg({ type: 'solid' })}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all
                        ${state.bg.type === 'solid' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                      data-testid="btn-bg-solid"
                    >
                      Solid
                    </button>
                    <button
                      onClick={() => setBg({ type: 'gradient', gradientEnd: state.bg.gradientEnd ?? '#8b5cf6' })}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all
                        ${state.bg.type === 'gradient' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                      data-testid="btn-bg-gradient"
                    >
                      Gradient
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground shrink-0">Color</Label>
                    <input
                      type="color"
                      value={state.bg.color}
                      onChange={(e) => setBg({ color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                      data-testid="input-bg-color"
                    />
                    <Input
                      value={state.bg.color}
                      onChange={(e) => setBg({ color: e.target.value })}
                      className="font-mono text-xs h-8 uppercase"
                      maxLength={7}
                    />
                  </div>

                  {state.bg.type === 'gradient' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0">End</Label>
                      <input
                        type="color"
                        value={state.bg.gradientEnd ?? '#8b5cf6'}
                        onChange={(e) => setBg({ gradientEnd: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 shrink-0"
                        data-testid="input-bg-gradient-end"
                      />
                      <Input
                        value={state.bg.gradientEnd ?? '#8b5cf6'}
                        onChange={(e) => setBg({ gradientEnd: e.target.value })}
                        className="font-mono text-xs h-8 uppercase"
                        maxLength={7}
                      />
                    </div>
                  )}

                  {state.bg.type === 'gradient' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Angle</Label>
                        <span className="text-xs font-mono text-muted-foreground">{gradientAngle}°</span>
                      </div>
                      <Slider
                        value={[gradientAngle]}
                        onValueChange={([v]) => { setGradientAngle(v); setBg({ gradientAngle: v }); }}
                        min={0}
                        max={360}
                        step={5}
                      />
                    </div>
                  )}

                  {/* Preview swatch */}
                  <div
                    className="h-10 w-full rounded-lg border border-border"
                    style={
                      state.bg.type === 'gradient' && state.bg.gradientEnd
                        ? { background: `linear-gradient(${gradientAngle}deg, ${state.bg.color}, ${state.bg.gradientEnd})` }
                        : { backgroundColor: state.bg.color }
                    }
                  />
                </div>

              </CardContent>
            </Card>

            {/* Generate button */}
            <Button
              className="w-full h-12 font-semibold text-base shadow-sm"
              onClick={generate}
              disabled={!state.sourceFile || state.isGenerating}
              data-testid="btn-generate-assets"
            >
              {state.isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating... {state.progress}%</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-2" />Generate {totalExpected} Assets</>
              )}
            </Button>

            {state.isGenerating && (
              <Progress value={state.progress} className="h-1.5" />
            )}

            {state.assets.length > 0 && (
              <Button
                variant="outline"
                className="w-full h-11 font-semibold"
                onClick={downloadAllZip}
                data-testid="btn-download-all-zip"
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                Download All as ZIP
              </Button>
            )}
          </div>

          {/* ── Right: Preview grid ───────────────────── */}
          <div className="flex-1 min-w-0">
            {state.assets.length === 0 && !state.isGenerating && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 rounded-2xl border border-dashed border-border/50 bg-muted/10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No assets yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Upload a logo and click Generate to create all your platform icons instantly.
                </p>
              </div>
            )}

            {state.isGenerating && state.assets.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
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
                  <div className="rounded-xl border border-border overflow-hidden">
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
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {def.width}×{def.height}
        </p>
      </div>
    </motion.div>
  );
}
