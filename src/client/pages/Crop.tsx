import React, { useState, useCallback, useMemo } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Header } from "../components/Header";
import { UploadZone } from "../components/UploadZone";
import { useImageStore } from "../hooks/use-image-store";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Separator } from "../components/ui/separator";
import {
  RotateCcw,
  RotateCw,
  Maximize,
  Download,
  Check,
  Crop as CropIcon,
  Trash2,
  ChevronLeft,
  Settings2,
  Image as ImageIcon,
  Smartphone,
  Info,
  Eraser,
  Copy,
} from "lucide-react";
import { getCroppedImg } from "../lib/crop-image";
import { ScrollArea } from "../components/ui/scroll-area";
import { useToast } from "../hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Switch } from "../components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { useBackgroundRemoval } from "../hooks/use-background-removal";

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
  { group: "Social Media", items: [
    { label: "Insta Post", value: 1, desc: "1080x1080" },
    { label: "Insta Story", value: 9/16, desc: "1080x1920" },
    { label: "YouTube Thumb", value: 16/9, desc: "1280x720" },
    { label: "TikTok Cover", value: 9/16, desc: "1080x1920" },
    { label: "Twitter Header", value: 3/1, desc: "1500x500" },
  ]},
  { group: "Mobile & Apps", items: [
    { label: "App Icon", value: 1, desc: "1024x1024", safeArea: true },
    { label: "iOS Splash", value: 9/19.5, desc: "iPhone 15" },
    { label: "Android Icon", value: 1, desc: "Adaptive", safeArea: true },
  ]},
];

export default function Crop() {
  const { items, addItems, removeItem, clearItems, updateItem } = useImageStore();
  const { toast } = useToast();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/webp');
  const [quality, setQuality] = useState(90);
  const [showSafeArea, setShowSafeArea] = useState(false);

  const { removeBackground, isRemoving: isAiRemoving } = useBackgroundRemoval();

  const selectedItem = useMemo(() => 
    items.find(i => i.id === selectedId) || null
  , [items, selectedId]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedArea);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
        quality / 100
      );
      
      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        updateItem(selectedItem.id, {
          previewUrl: url,
          status: 'done',
          processedBlob: croppedBlob,
          processedSize: croppedBlob.size,
        });
        toast({
          title: "Image Cropped",
          description: "Your image has been updated with the crop.",
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
        if (item.id === selectedId) continue;
        
        // Calculate pixel crop based on percentages
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
          quality / 100
        );

        if (croppedBlob) {
          const url = URL.createObjectURL(croppedBlob);
          updateItem(item.id, {
            previewUrl: url,
            status: 'done',
            processedBlob: croppedBlob,
            processedSize: croppedBlob.size,
          });
          count++;
        }
      }
      
      toast({
        title: "Batch Crop Complete",
        description: `Applied crop to ${count} other images.`,
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
        quality / 100
      );
      
      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        const link = document.createElement('a');
        const ext = format.split('/')[1];
        link.download = `cropped-${selectedItem.file.name.split('.')[0]}.${ext === 'jpeg' ? 'jpg' : ext}`;
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

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      
      if (e.key === 'r' || e.key === 'R') {
        setRotation(r => (r + 90) % 360);
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleCrop();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, handleCrop]);

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-[calc(100vh-12rem)] max-w-7xl mx-auto">
          
          {/* Main Area */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {selectedId ? "Interactive Cropper" : "Precise Image Cropping"}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {selectedId 
                    ? `Editing: ${selectedItem?.file.name}`
                    : "Upload images and crop them to perfect dimensions locally."}
                </p>
              </div>
              {selectedId && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Info className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>R: Rotate | Ctrl+Enter: Apply</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedId(null)}
                    className="hidden md:flex"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Workspace
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 relative bg-muted/20 rounded-2xl border border-dashed border-border/50 overflow-hidden flex flex-col min-h-[400px]">
              {!selectedId ? (
                <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                  <UploadZone 
                    onUpload={(files) => {
                      addItems(files);
                    }} 
                    className="py-12" 
                  />
                  
                  {items.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-background cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <img 
                            src={item.previewUrl} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <CropIcon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div key={selectedId} className="flex-1 relative w-full h-full min-h-[500px] bg-black/5">
                  {selectedItem ? (
                    <div className="absolute inset-0">
                      <Cropper
                        image={selectedItem.previewUrl}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                      />
                      
                      {/* Safe Area Overlays */}
                      {showSafeArea && aspect === 1 && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                           <div className="w-[80%] h-[80%] border-2 border-dashed border-white/50 rounded-full" />
                           <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] border border-white/30 rounded-2xl" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Image not found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {selectedId && (
              <div className="flex items-center gap-2 mt-2 md:hidden">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedId(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCrop} disabled={isProcessing}>
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Controls Column */}
          <div className="w-full lg:w-80 xl:w-[340px] shrink-0 h-full flex flex-col gap-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="py-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Crop Settings
                </CardTitle>
                <CardDescription>
                  Adjust dimensions and orientation
                </CardDescription>
              </CardHeader>
              
              <ScrollArea className="flex-1">
                <CardContent className="p-4 space-y-6">
                  {/* Actions */}
                  {selectedId && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Integrations</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-violet-500 hover:text-violet-600 hover:bg-violet-50 border-dashed"
                        onClick={() => selectedItem && removeBackground(selectedItem)}
                        disabled={isAiRemoving || isProcessing}
                      >
                        <Eraser className={`w-4 h-4 mr-2 ${isAiRemoving ? 'animate-pulse' : ''}`} />
                        Remove Background (AI)
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* Aspect Ratios */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Aspect Ratio</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_RATIOS.map((r) => (
                        <Button
                          key={r.label}
                          variant={aspect === r.value ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-8"
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

                  {/* Presets */}
                  {PRESETS.map((group) => (
                    <div key={group.group} className="space-y-3">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        {group.group}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map((p) => (
                          <Button
                            key={p.label}
                            variant={aspect === p.value ? "secondary" : "ghost"}
                            className="justify-start h-auto py-2 px-3 text-left border border-border/40"
                            onClick={() => {
                              setAspect(p.value);
                              if (p.safeArea) setShowSafeArea(true);
                              else setShowSafeArea(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{p.label}</span>
                              <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">Safe Area Guides</Label>
                        <p className="text-[10px] text-muted-foreground">Show mobile icon boundaries</p>
                      </div>
                      <Switch
                        checked={showSafeArea}
                        onCheckedChange={setShowSafeArea}
                        disabled={aspect !== 1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Export Settings */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">Export Format</Label>
                    <RadioGroup
                      value={format}
                      onValueChange={(val: any) => setFormat(val)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {[
                        { label: 'WebP', value: 'image/webp' },
                        { label: 'PNG', value: 'image/png' },
                        { label: 'JPEG', value: 'image/jpeg' },
                      ].map((f) => (
                        <div key={f.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={f.value} id={`f-${f.label}`} />
                          <Label htmlFor={`f-${f.label}`} className="text-xs">{f.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Quality</Label>
                        <span className="text-xs font-mono">{quality}%</span>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={([v]) => setQuality(v)}
                        min={10}
                        max={100}
                        step={1}
                        disabled={format === 'image/png'}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Zoom & Rotation */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Zoom</Label>
                        <span className="text-xs font-mono">{zoom.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[zoom]}
                        onValueChange={([v]) => setZoom(v)}
                        min={1}
                        max={3}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Rotation</Label>
                        <span className="text-xs font-mono">{rotation}°</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Slider
                          className="flex-1"
                          value={[rotation]}
                          onValueChange={([v]) => setRotation(v)}
                          min={0}
                          max={360}
                          step={1}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/10 space-y-2">
                <Button 
                  className="w-full h-11 font-bold" 
                  disabled={!selectedId || isProcessing}
                  onClick={handleCrop}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply & Save Crop
                </Button>
                
                {items.length > 1 && selectedId && (
                   <Button 
                   variant="secondary"
                   className="w-full" 
                   disabled={isProcessing}
                   onClick={handleBatchApply}
                 >
                   <Copy className="w-4 h-4 mr-2" />
                   Apply to All Images
                 </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-10" 
                    disabled={!selectedId || isProcessing}
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                    onClick={() => {
                      if (selectedId) {
                        removeItem(selectedId);
                        setSelectedId(null);
                      } else {
                        clearItems();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {selectedId ? "Delete" : "Clear All"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
