import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  exportIco,
  exportSvg,
  exportFaviconMasterPng,
  analyzeImageComplexity,
  SvgMode,
  DEFAULT_FAVICON_ROUNDNESS,
} from '../lib/export-formats';
import { useToast } from '../hooks/use-toast';
import {
  Upload,
  Loader2,
  FileType2,
  FileImage,
  AlertTriangle,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';

const CHECKERBOARD = {
  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 12px 12px',
  backgroundColor: '#fff',
};

export default function Convert() {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [faviconRoundness, setFaviconRoundness] = useState(DEFAULT_FAVICON_ROUNDNESS);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);
  const [faviconPreviewLoading, setFaviconPreviewLoading] = useState(false);
  const faviconPreviewRef = useRef<string | null>(null);

  const [isExportingIco, setIsExportingIco] = useState(false);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [isExportingMasterPng, setIsExportingMasterPng] = useState(false);
  const [svgMode, setSvgMode] = useState<SvgMode>('icon');
  const [svgThreshold, setSvgThreshold] = useState(180);
  const [svgSmoothness, setSvgSmoothness] = useState(20);
  const [svgComplexity, setSvgComplexity] = useState<{ isComplex: boolean; uniqueColors: number } | null>(
    null,
  );

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    setSourceFile(file);
    setSourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    try {
      setSvgComplexity(await analyzeImageComplexity(file));
    } catch {
      setSvgComplexity(null);
    }
  }, []);

  useEffect(() => {
    faviconPreviewRef.current = faviconPreviewUrl;
  }, [faviconPreviewUrl]);

  useEffect(() => {
    if (!sourceFile) {
      setFaviconPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const id = window.setTimeout(() => {
      setFaviconPreviewLoading(true);
      exportFaviconMasterPng(sourceFile, { roundness: faviconRoundness })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setFaviconPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        })
        .catch((err) => {
          console.error(err);
          setFaviconPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        })
        .finally(() => setFaviconPreviewLoading(false));
    }, 380);

    return () => window.clearTimeout(id);
  }, [sourceFile, faviconRoundness]);

  useEffect(
    () => () => {
      const u = faviconPreviewRef.current;
      if (u) URL.revokeObjectURL(u);
    },
    [],
  );

  const saveBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportIco = useCallback(async () => {
    if (!sourceFile) return;
    setIsExportingIco(true);
    try {
      const blob = await exportIco(sourceFile, { roundness: faviconRoundness });
      saveBlob(blob, 'favicon.ico');
      toast({ title: 'ICO export ready', description: 'Your favicon.ico was downloaded.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'ICO export failed',
        description: 'Could not create ICO. Is the API running?',
        variant: 'destructive',
      });
    } finally {
      setIsExportingIco(false);
    }
  }, [sourceFile, faviconRoundness, saveBlob, toast]);

  const handleExportMasterPng = useCallback(async () => {
    if (!sourceFile) return;
    setIsExportingMasterPng(true);
    try {
      const blob = await exportFaviconMasterPng(sourceFile, { roundness: faviconRoundness });
      saveBlob(blob, 'favicon-master.png');
      toast({
        title: 'PNG master ready',
        description: '512×512 — same squircle settings as the preview.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'PNG export failed',
        description: 'Could not create favicon master.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingMasterPng(false);
    }
  }, [sourceFile, faviconRoundness, saveBlob, toast]);

  const handleExportSvg = useCallback(async () => {
    if (!sourceFile || svgComplexity?.isComplex) return;
    setIsExportingSvg(true);
    try {
      const blob = await exportSvg(sourceFile, {
        mode: svgMode,
        threshold: svgThreshold,
        smoothness: svgSmoothness / 100,
      });
      saveBlob(blob, 'vectorized.svg');
      toast({ title: 'SVG export ready', description: 'Your vectorized SVG was downloaded.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'SVG export failed', description: 'Could not vectorize this image.', variant: 'destructive' });
    } finally {
      setIsExportingSvg(false);
    }
  }, [sourceFile, svgComplexity, svgMode, svgThreshold, svgSmoothness, saveBlob, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-primary" />
            Favicon &amp; export
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Build favicon-ready squircles, ICO, PNG master, and SVG traces. Adjust roundness and compare
            to your original before downloading.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Source image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden max-w-xl mx-auto
                  ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                data-testid="convert-upload-zone"
              >
                <input {...getInputProps()} />
                {sourcePreview ? (
                  <div className="relative aspect-square w-full max-h-72" style={CHECKERBOARD}>
                    <img src={sourcePreview} alt="Source" className="w-full h-full object-contain p-6" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm">
                      <p className="text-sm font-medium">Click or drop to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop your logo here</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary" />
                Compare &amp; tune
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground">Squircle / corner roundness</Label>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {faviconRoundness}
                    {faviconRoundness === DEFAULT_FAVICON_ROUNDNESS ? (
                      <span className="text-primary ml-1 font-sans">· default</span>
                    ) : null}
                  </span>
                </div>
                <Slider
                  value={[faviconRoundness]}
                  onValueChange={([v]) => setFaviconRoundness(v)}
                  min={0}
                  max={100}
                  step={1}
                  data-testid="slider-favicon-roundness"
                  disabled={!sourceFile}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Square</span>
                  <span>Soft squircle</span>
                </div>
              </div>

              {!sourceFile ? (
                <p className="text-sm text-muted-foreground text-center py-6">Upload an image to see the comparison.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</span>
                        <span className="text-[10px] text-muted-foreground">Unmodified file</span>
                      </div>
                      <div
                        className="relative aspect-square w-full max-w-[220px] mx-auto rounded-xl border border-border overflow-hidden shadow-sm"
                        style={CHECKERBOARD}
                      >
                        <img src={sourcePreview ?? ''} alt="" className="w-full h-full object-contain p-4" />
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col items-center justify-center text-muted-foreground py-8">
                      <ArrowRight className="w-6 h-6 shrink-0" />
                      <span className="text-[10px] mt-2 text-center max-w-[5rem] leading-tight">Slider reshapes this side only</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Converted</span>
                        <span className="text-[10px] text-muted-foreground">ICO / PNG use this</span>
                      </div>
                      <div
                        className="relative aspect-square w-full max-w-[220px] mx-auto rounded-xl border border-primary/30 overflow-hidden shadow-sm bg-muted/30"
                        style={CHECKERBOARD}
                      >
                        {faviconPreviewUrl ? (
                          <img
                            src={faviconPreviewUrl}
                            alt="Converted favicon preview"
                            className="w-full h-full object-contain p-2"
                          />
                        ) : null}
                        {faviconPreviewLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center max-w-[240px] mx-auto leading-snug">
                        Adds light plate, padding, squircle clip, and Lanczos resize for small sizes. Only this column reacts to roundness.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-3 space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tab pixel preview (output only)
                    </span>
                    <div className="flex items-end justify-center gap-8">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-8 h-8 rounded border border-border overflow-hidden"
                          style={CHECKERBOARD}
                        >
                          {faviconPreviewUrl ? (
                            <img
                              src={faviconPreviewUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : null}
                        </div>
                        <span className="text-[9px] text-muted-foreground">32×32</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded border border-border overflow-hidden"
                          style={CHECKERBOARD}
                        >
                          {faviconPreviewUrl ? (
                            <img
                              src={faviconPreviewUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : null}
                        </div>
                        <span className="text-[9px] text-muted-foreground">16×16</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileType2 className="w-4 h-4 text-primary" />
                Download
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="text-xs h-11"
                  onClick={handleExportIco}
                  disabled={!sourceFile || isExportingIco}
                  title="favicon.ico (multi-size)"
                >
                  <FileType2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  {isExportingIco ? '…' : 'favicon.ico'}
                </Button>
                <Button
                  variant="outline"
                  className="text-xs h-11"
                  onClick={handleExportMasterPng}
                  disabled={!sourceFile || isExportingMasterPng}
                  title="512×512 PNG master"
                >
                  <FileImage className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  {isExportingMasterPng ? '…' : 'PNG 512'}
                </Button>
                <Button
                  variant="outline"
                  className="text-xs h-11"
                  onClick={handleExportSvg}
                  disabled={!sourceFile || isExportingSvg || Boolean(svgComplexity?.isComplex)}
                  title="Potrace SVG"
                >
                  <FileType2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  {isExportingSvg ? '…' : 'SVG trace'}
                </Button>
              </div>

              {svgComplexity?.isComplex && (
                <div className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>SVG works best for simple logos (~{svgComplexity.uniqueColors} colors detected).</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SVG trace settings</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['logo', 'icon', 'detail'] as SvgMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSvgMode(mode)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-medium border transition-all ${
                        svgMode === mode
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {mode === 'logo' ? 'Logo' : mode === 'icon' ? 'Icon' : 'High detail'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">Threshold</Label>
                      <span className="text-xs font-mono">{svgThreshold}</span>
                    </div>
                    <Slider value={[svgThreshold]} onValueChange={([v]) => setSvgThreshold(v)} min={0} max={255} step={1} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <Label className="text-xs text-muted-foreground">Smoothness</Label>
                      <span className="text-xs font-mono">{svgSmoothness}%</span>
                    </div>
                    <Slider
                      value={[svgSmoothness]}
                      onValueChange={([v]) => setSvgSmoothness(v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
