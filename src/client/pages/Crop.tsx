import React, { useState, useCallback, useMemo, useEffect } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Header } from "../components/Header";
import { UploadZone } from "../components/UploadZone";
import { AddImagesButton } from "../components/AddImagesButton";
import { useImageStore } from "../hooks/use-image-store";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Separator } from "../components/ui/separator";
import {
  RotateCcw,
  RotateCw,
  Download,
  Check,
  Crop as CropIcon,
  Trash2,
  ChevronLeft,
  Settings2,
  Eraser,
  Copy,
  Plus,
  Maximize2,
  Minimize2,
  RefreshCcw,
} from "lucide-react";
import { getCroppedImg } from "../lib/crop-image";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { useToast } from "../hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Switch } from "../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../components/ui/tooltip";
import { useBackgroundRemoval } from "../hooks/use-background-removal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "../lib/utils";

const ASPECT_RATIOS = [
  { label: "Original", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:3", value: 2 / 3 },
];

const PRESETS = [
  {
    group: "Social Media",
    items: [
      { label: "Insta Post", value: 1, desc: "1080x1080" },
      { label: "Insta Story", value: 9 / 16, desc: "1080x1920" },
      { label: "YouTube Thumb", value: 16 / 9, desc: "1280x720" },
      { label: "Twitter Header", value: 3 / 1, desc: "1500x500" },
    ],
  },
  {
    group: "App Assets",
    items: [
      { label: "App Icon", value: 1, desc: "1024x1024", safeArea: true },
      { label: "Mobile Splash", value: 9 / 19.5, desc: "iPhone/Android" },
    ],
  },
];

export default function Crop() {
  const { items, addItems, removeItem, clearItems, updateItem, selectedItemId, setSelectedItemId } =
    useImageStore();
  const { toast } = useToast();

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [format, setFormat] = useState<
    "image/jpeg" | "image/png" | "image/webp"
  >("image/webp");
  const [quality, setQuality] = useState(90);
  const [showSafeArea, setShowSafeArea] = useState(false);

  const { removeBackground, isRemoving: isAiRemoving } = useBackgroundRemoval();

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) || null,
    [items, selectedItemId],
  );

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedArea);
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCrop = async () => {
    if (!selectedItem || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedItem.previewUrl,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        format,
        quality / 100,
      );

      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        updateItem(selectedItem.id, {
          previewUrl: url,
          status: "done",
          processedBlob: croppedBlob,
          processedSize: croppedBlob.size,
        });
        toast({
          title: "Image Cropped",
          description: "Your image has been updated successfully.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to crop image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApply = async () => {
    if (!croppedArea || items.length < 2) return;

    setIsProcessing(true);
    let count = 0;
    try {
      for (const item of items) {
        if (item.id === selectedItemId) continue;

        const pixels = {
          x: (croppedArea.x * item.originalWidth) / 100,
          y: (croppedArea.y * item.originalHeight) / 100,
          width: (croppedArea.width * item.originalWidth) / 100,
          height: (croppedArea.height * item.originalHeight) / 100,
        };

        const croppedBlob = await getCroppedImg(
          item.previewUrl,
          pixels,
          rotation,
          { horizontal: false, vertical: false },
          format,
          quality / 100,
        );

        if (croppedBlob) {
          const url = URL.createObjectURL(croppedBlob);
          updateItem(item.id, {
            previewUrl: url,
            status: "done",
            processedBlob: croppedBlob,
            processedSize: croppedBlob.size,
          });
          count++;
        }
      }

      toast({
        title: "Batch Crop Complete",
        description: `Applied current settings to ${count} other images.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Batch Error",
        description: "Failed to apply crop to some images.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedItem || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(
        selectedItem.previewUrl,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        format,
        quality / 100,
      );

      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        const link = document.createElement("a");
        const ext = format.split("/")[1];
        link.download = `cropped-${selectedItem.file.name.split(".")[0]}.${ext === "jpeg" ? "jpg" : ext}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetControls = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItemId) return;

      if (e.key === "r" || e.key === "R") {
        setRotation((r) => (r + 90) % 360);
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleCrop();
      }
      if (e.key === "Escape") {
        setSelectedItemId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, handleCrop]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col text-foreground">
        <Header />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/30 relative">
              <AnimatePresence mode="wait">
                {!selectedItemId ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-6 overflow-y-auto"
                  >
                    <div className="max-w-6xl mx-auto w-full space-y-8 py-8 md:py-12">
                      <div className="text-center space-y-3">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
                        >
                          <CropIcon className="w-3 h-3" />
                          Local Processing
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Precise Image Cropping
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                          Professional-grade tools to crop, rotate, and resize your images right in your browser.
                        </p>
                      </div>

                      <UploadZone
                        onUpload={addItems}
                        className="py-12 border-2 border-dashed border-primary/20 bg-background/50 backdrop-blur-sm rounded-3xl hover:border-primary/40 transition-all shadow-inner"
                      />

                      {items.length > 0 && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b pb-4">
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black tracking-tight">Your Workspace</h2>
                              <p className="text-sm text-muted-foreground font-medium">
                                {items.length} {items.length === 1 ? 'image' : 'images'} added
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={clearItems} 
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Clear All
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                            <AddImagesButton
                              onUpload={addItems}
                              variant="grid"
                              className="aspect-square rounded-2xl shadow-sm border-2 border-dashed"
                            />
                            {items.map((item) => (
                              <motion.div
                                key={item.id}
                                layoutId={item.id}
                                className="group relative aspect-square rounded-2xl overflow-hidden border-2 bg-background cursor-pointer hover:ring-4 hover:ring-primary/20 hover:border-primary transition-all shadow-sm"
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                <img
                                  src={item.previewUrl}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                    <CropIcon className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    {item.originalWidth}x{item.originalHeight}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col min-h-0 relative"
                  >
                    {/* Top Bar */}
                    <div className="h-14 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedItemId(null)}
                          className="rounded-full"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate max-w-[200px]">
                            {selectedItem?.file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {selectedItem?.originalWidth} × {selectedItem?.originalHeight}px
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:flex"
                          onClick={handleDownload}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCrop}
                          disabled={isProcessing}
                          className="font-bold shadow-lg shadow-primary/20"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Apply Changes
                        </Button>
                      </div>
                    </div>

                    {/* Cropper Container */}
                    <div className="flex-1 relative bg-black/5 dark:bg-black/40">
                      <div className="absolute inset-4 md:inset-8">
                        <Cropper
                          image={selectedItem?.previewUrl || ""}
                          crop={crop}
                          zoom={zoom}
                          rotation={rotation}
                          aspect={aspect}
                          onCropChange={setCrop}
                          onRotationChange={setRotation}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                          classes={{
                            containerClassName: "rounded-lg shadow-2xl",
                          }}
                        />

                        {/* Safe Area Overlays */}
                        {showSafeArea && aspect === 1 && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                            <div className="w-[80%] h-[80%] border-2 border-dashed border-white/50 rounded-full" />
                            <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] border border-white/30 rounded-2xl" />
                          </div>
                        )}
                      </div>

                      {/* Floating Toolbar */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-background/90 backdrop-blur-xl border rounded-full shadow-2xl z-20">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}>
                              <Minimize2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Zoom Out</TooltipContent>
                        </Tooltip>

                        <div className="w-24 px-2">
                          <Slider
                            value={[zoom]}
                            onValueChange={([v]) => setZoom(v)}
                            min={1}
                            max={3}
                            step={0.1}
                          />
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}>
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Zoom In</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-border mx-1" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setRotation(r => (r - 90 + 360) % 360)}>
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Rotate Left</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setRotation(r => (r + 90) % 360)}>
                              <RotateCw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Rotate Right</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-border mx-1" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={resetControls}>
                              <RefreshCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reset Transform</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Thumbnails Strip */}
                    {items.length > 0 && (
                      <div className="h-24 border-t bg-background/50 backdrop-blur-md px-4 py-3 flex items-center">
                        <ScrollArea className="w-full whitespace-nowrap">
                          <div className="flex items-center gap-3 px-1 h-16">
                            <AddImagesButton
                              onUpload={addItems}
                              className="shrink-0"
                            />
                            <div className="w-px h-10 bg-border mx-1 shrink-0" />
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className={cn(
                                  "relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 group shadow-sm",
                                  selectedItemId === item.id
                                    ? "border-primary ring-4 ring-primary/10 scale-105"
                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-primary/30"
                                )}
                              >
                                <img
                                  src={item.previewUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {selectedItemId === item.id && (
                                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-primary drop-shadow-sm" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar Controls */}
            <AnimatePresence>
              {selectedItemId && (
                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full lg:w-[360px] border-l bg-background flex flex-col shadow-2xl"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">Crop Settings</h2>
                    </div>
                  </div>

                <Tabs defaultValue="aspect" className="flex-1 flex flex-col min-h-0">
                  <TabsList className="mx-4 mt-4 grid grid-cols-3">
                    <TabsTrigger value="aspect">Ratio</TabsTrigger>
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                  </TabsList>

                  <ScrollArea className="flex-1 px-4">
                    <div className="py-4 space-y-6">
                      <TabsContent value="aspect" className="m-0 space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Standard Ratios</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {ASPECT_RATIOS.map((r) => (
                              <Button
                                key={r.label}
                                variant={aspect === r.value ? "default" : "outline"}
                                size="sm"
                                className="text-xs h-9 rounded-xl"
                                onClick={() => {
                                  setAspect(r.value);
                                  setShowSafeArea(false);
                                }}
                              >
                                {r.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-semibold">Safe Area Guides</Label>
                              <p className="text-[10px] text-muted-foreground">For circular/rounded icons</p>
                            </div>
                            <Switch
                              checked={showSafeArea}
                              onCheckedChange={setShowSafeArea}
                              disabled={aspect !== 1}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Enhancement</Label>
                          <Button
                            variant="outline"
                            className="w-full h-11 justify-start text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 border-indigo-200/50 rounded-xl"
                            onClick={() => selectedItem && removeBackground(selectedItem)}
                            disabled={isAiRemoving || isProcessing || !selectedItemId}
                          >
                            <Eraser className={cn("w-4 h-4 mr-2", isAiRemoving && "animate-spin")} />
                            {isAiRemoving ? "Processing..." : "Remove Background"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="presets" className="m-0 space-y-6">
                        {PRESETS.map((group) => (
                          <div key={group.group} className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              {group.group}
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                              {group.items.map((p) => (
                                <Button
                                  key={p.label}
                                  variant={aspect === p.value ? "secondary" : "outline"}
                                  className="h-auto py-3 px-4 justify-between border-muted-foreground/10 rounded-xl group hover:border-primary/30 transition-all"
                                  onClick={() => {
                                    setAspect(p.value);
                                    if (p.safeArea) setShowSafeArea(true);
                                    else setShowSafeArea(false);
                                  }}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold">{p.label}</span>
                                    <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                                  </div>
                                  <div className={cn(
                                    "w-8 h-8 rounded border-2 transition-colors",
                                    aspect === p.value ? "border-primary bg-primary/10" : "border-muted group-hover:border-primary/20"
                                  )} style={{ aspectRatio: p.value }} />
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="export" className="m-0 space-y-6">
                        <div className="space-y-4">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Format</Label>
                          <RadioGroup
                            value={format}
                            onValueChange={(val: any) => setFormat(val)}
                            className="grid grid-cols-1 gap-2"
                          >
                            {[
                              { label: "WebP (Recommended)", value: "image/webp", desc: "Best quality to size ratio" },
                              { label: "PNG", value: "image/png", desc: "Lossless, supports transparency" },
                              { label: "JPEG", value: "image/jpeg", desc: "Universal compatibility" },
                            ].map((f) => (
                              <div
                                key={f.value}
                                className={cn(
                                  "flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                  format === f.value ? "bg-primary/5 border-primary" : "hover:border-primary/20"
                                )}
                                onClick={() => setFormat(f.value as any)}
                              >
                                <RadioGroupItem value={f.value} id={`f-${f.label}`} className="mt-1" />
                                <div className="space-y-0.5">
                                  <Label htmlFor={`f-${f.label}`} className="text-sm font-bold block cursor-pointer">
                                    {f.label}
                                  </Label>
                                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>

                        {format !== "image/png" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">Quality</Label>
                              <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">{quality}%</span>
                            </div>
                            <Slider
                              value={[quality]}
                              onValueChange={([v]) => setQuality(v)}
                              min={10}
                              max={100}
                              step={1}
                            />
                          </div>
                        )}
                      </TabsContent>
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t bg-muted/20 space-y-2">
                    {items.length > 1 && (
                      <Button
                        variant="secondary"
                        className="w-full h-11 rounded-xl"
                        disabled={isProcessing || !selectedItemId}
                        onClick={handleBatchApply}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Apply to All
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-destructive rounded-xl"
                      onClick={() => {
                        if (selectedItemId) {
                          removeItem(selectedItemId);
                        } else {
                          clearItems();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {selectedItemId ? "Delete Current" : "Clear All"}
                    </Button>
                  </div>
                </Tabs>
              </motion.aside>
            )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
