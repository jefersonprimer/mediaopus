import React, { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  exportIco,
  exportSvg,
  exportFaviconMasterPng,
  exportGeneric,
  analyzeImageComplexity,
  SvgMode,
  ExportFormat,
  DEFAULT_FAVICON_ROUNDNESS,
} from "../lib/export-formats";
import { useToast } from "../hooks/use-toast";
import {
  Upload,
  Loader2,
  FileType2,
  FileImage,
  AlertTriangle,
  ArrowRight,
  ImageIcon,
  RefreshCcw,
  Settings2,
  Download,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";
import { UploadZone } from "@/components/UploadZone";

const CHECKERBOARD = {
  backgroundImage:
    "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 12px 12px",
  backgroundColor: "#fff",
};

export default function Convert() {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [faviconRoundness, setFaviconRoundness] = useState(
    DEFAULT_FAVICON_ROUNDNESS,
  );
  const [applySquircle, setApplySquircle] = useState(true);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(
    null,
  );
  const [faviconPreviewLoading, setFaviconPreviewLoading] = useState(false);
  const faviconPreviewRef = useRef<string | null>(null);

  const [isExportingIco, setIsExportingIco] = useState(false);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [isExportingMasterPng, setIsExportingMasterPng] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null,
  );
  const [svgMode, setSvgMode] = useState<SvgMode>("icon");
  const [svgThreshold, setSvgThreshold] = useState(180);
  const [svgSmoothness, setSvgSmoothness] = useState(20);
  const [svgComplexity, setSvgComplexity] = useState<{
    isComplex: boolean;
    uniqueColors: number;
  } | null>(null);

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
    const a = document.createElement("a");
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
      saveBlob(blob, "favicon.ico");
      toast({
        title: "ICO export ready",
        description: "Your favicon.ico was downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "ICO export failed",
        description: "Could not create ICO.",
        variant: "destructive",
      });
    } finally {
      setIsExportingIco(false);
    }
  }, [sourceFile, faviconRoundness, saveBlob, toast]);

  const handleExportMasterPng = useCallback(async () => {
    if (!sourceFile) return;
    setIsExportingMasterPng(true);
    try {
      const blob = await exportFaviconMasterPng(sourceFile, {
        roundness: faviconRoundness,
      });
      saveBlob(blob, "favicon-master.png");
      toast({
        title: "PNG master ready",
        description: "512×512 master PNG downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "PNG export failed",
        description: "Could not create favicon master.",
        variant: "destructive",
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
      saveBlob(blob, "vectorized.svg");
      toast({
        title: "SVG export ready",
        description: "Your vectorized SVG was downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "SVG export failed",
        description: "Could not vectorize this image.",
        variant: "destructive",
      });
    } finally {
      setIsExportingSvg(false);
    }
  }, [
    sourceFile,
    svgComplexity,
    svgMode,
    svgThreshold,
    svgSmoothness,
    saveBlob,
    toast,
  ]);

  const handleExportGeneric = useCallback(
    async (format: ExportFormat) => {
      if (!sourceFile) return;
      setExportingFormat(format);
      try {
        const options = applySquircle
          ? { roundness: faviconRoundness }
          : undefined;
        const blob = await exportGeneric(sourceFile, format, options);
        saveBlob(blob, `converted.${format}`);
        toast({
          title: `${format.toUpperCase()} export ready`,
          description: `Your image was converted to ${format.toUpperCase()}.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Export failed",
          description: `Could not create ${format.toUpperCase()}.`,
          variant: "destructive",
        });
      } finally {
        setExportingFormat(null);
      }
    },
    [sourceFile, faviconRoundness, applySquircle, saveBlob, toast],
  );

  const clearWorkspace = () => {
    setSourceFile(null);
    setSourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFaviconPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSvgComplexity(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <Header />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/30 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
              {!sourceFile && (
                <>
                  <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Image Converter
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                      Build favicon-ready squircles, ICO, PNG master, and SVG
                      traces. 100% private and browser-native.
                    </p>
                  </div>

                  <UploadZone
                    onUpload={onDrop}
                    className="py-12 border-2 border-dashed border-primary/20 bg-background/50 backdrop-blur-sm rounded-3xl hover:border-primary/40 transition-all shadow-inner"
                  />
                </>
              )}

              <div className="space-y-12">
                <AnimatePresence>
                  {sourceFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="space-y-10"
                    >
                      {/* Compare & Tune Card */}
                      <div className="rounded-3xl border bg-background/50 backdrop-blur-sm p-6 md:p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight">
                              Compare & Tune
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium">
                              Adjust squircle roundness and compare results
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearWorkspace}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Workspace
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                          <div className="space-y-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">
                                Original
                              </span>
                            </div>
                            <div
                              className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl border-2 overflow-hidden shadow-xl"
                              style={CHECKERBOARD}
                            >
                              <img
                                src={sourcePreview ?? ""}
                                alt=""
                                className="w-full h-full object-contain p-6"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold">
                              {sourceFile.name}
                            </p>
                          </div>

                          <div className="hidden md:flex flex-col items-center justify-center text-primary/40">
                            <ArrowRight className="w-8 h-8" />
                          </div>

                          <div className="space-y-3 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded">
                                Converted
                              </span>
                            </div>
                            <div
                              className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl border-2 border-primary/30 overflow-hidden shadow-xl bg-background"
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
                                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-primary font-bold">
                              SQUIRCLE PREVIEW
                            </p>
                          </div>
                        </div>

                        {/* Pixel Previews */}
                        <div className="rounded-2xl border bg-muted/20 p-4 space-y-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <RefreshCcw className="w-3 h-3" />
                            Tab Pixel Previews
                          </span>
                          <div className="flex items-end justify-center gap-12">
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="w-10 h-10 rounded border-2 overflow-hidden shadow-sm"
                                style={CHECKERBOARD}
                              >
                                {faviconPreviewUrl ? (
                                  <img
                                    src={faviconPreviewUrl}
                                    alt=""
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : null}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                32×32
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border-2 overflow-hidden shadow-sm"
                                style={CHECKERBOARD}
                              >
                                {faviconPreviewUrl ? (
                                  <img
                                    src={faviconPreviewUrl}
                                    alt=""
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: "pixelated" }}
                                  />
                                ) : null}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                16×16
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <AnimatePresence>
            {sourceFile && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-[360px] border-l bg-background flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">Export Settings</h2>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-4">
                  <div className="py-6 space-y-8">
                    {/* Tuning */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Squircle Roundness
                        </Label>
                        <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">
                          {faviconRoundness}%
                        </span>
                      </div>
                      <Slider
                        value={[faviconRoundness]}
                        onValueChange={([v]) => setFaviconRoundness(v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>Square</span>
                        <span>Soft</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Quick Exports */}
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Primary Assets
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          className="h-12 justify-start rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5 group"
                          onClick={handleExportIco}
                          disabled={isExportingIco}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            {isExportingIco ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileType2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold">
                              Download ICO
                            </span>
                            <span className="text-[10px] text-muted-foreground text-left">
                              Multi-size favicon.ico
                            </span>
                          </div>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 justify-start rounded-xl border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 group"
                          onClick={handleExportMasterPng}
                          disabled={isExportingMasterPng}
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform text-indigo-600">
                            {isExportingMasterPng ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileImage className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold">
                              PNG Master
                            </span>
                            <span className="text-[10px] text-muted-foreground text-left">
                              512×512 Squircle PNG
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Standard Formats */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Standard Formats
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-bold">
                            SQUIRCLE
                          </span>
                          <Switch
                            checked={applySquircle}
                            onCheckedChange={setApplySquircle}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          ["jpg", "png", "webp", "gif", "bmp"] as ExportFormat[]
                        ).map((format) => (
                          <Button
                            key={format}
                            variant="outline"
                            className="text-[10px] h-9 font-bold uppercase rounded-lg"
                            onClick={() => handleExportGeneric(format)}
                            disabled={exportingFormat !== null}
                          >
                            {exportingFormat === format ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              format
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* SVG Trace */}
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        SVG Vector Trace
                      </Label>

                      {svgComplexity?.isComplex && (
                        <div className="text-[10px] rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 flex items-start gap-2 leading-tight font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Best for simple logos ({svgComplexity.uniqueColors}{" "}
                            colors detected).
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        {(["logo", "icon", "detail"] as SvgMode[]).map(
                          (mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSvgMode(mode)}
                              className={cn(
                                "rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase border transition-all",
                                svgMode === mode
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40",
                              )}
                            >
                              {mode === "logo"
                                ? "Logo"
                                : mode === "icon"
                                  ? "Icon"
                                  : "Detail"}
                            </button>
                          ),
                        )}
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Threshold
                            </Label>
                            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 rounded">
                              {svgThreshold}
                            </span>
                          </div>
                          <Slider
                            value={[svgThreshold]}
                            onValueChange={([v]) => setSvgThreshold(v)}
                            min={0}
                            max={255}
                            step={1}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Smoothness
                            </Label>
                            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 rounded">
                              {svgSmoothness}%
                            </span>
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

                      <Button
                        className="w-full h-11 font-bold rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleExportSvg}
                        disabled={
                          isExportingSvg || Boolean(svgComplexity?.isComplex)
                        }
                      >
                        {isExportingSvg ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Tracing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download SVG
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
