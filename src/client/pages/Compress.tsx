import React from "react";
import { Header } from "../components/Header";
import { UploadZone } from "../components/UploadZone";
import { ImageGrid } from "../components/ImageGrid";
import { ControlsPanel } from "../components/ControlsPanel";
import { useImageStore } from "../hooks/use-image-store";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Compress() {
  const { items, addItems, clearItems, selectedItemId } = useImageStore();

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <Header />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/30 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
                >
                  <Zap className="w-3 h-3" />
                  Local Processing
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Image Compression
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Optimize your images with professional-grade controls. All processing happens 100% locally in your browser.
                </p>
              </div>

              <div className="space-y-12">
                <UploadZone
                  onUpload={addItems}
                  className="py-12 border-2 border-dashed border-primary/20 bg-background/50 backdrop-blur-sm rounded-3xl hover:border-primary/40 transition-all shadow-inner"
                />

                <AnimatePresence>
                  {items.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="space-y-6"
                    >
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

                      <div className="pb-12">
                        <ImageGrid
                          items={items}
                          enableBgTools={false}
                          onAdd={addItems}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-[360px] border-l bg-background flex flex-col shadow-2xl"
              >
                <div className="flex-1 overflow-y-auto">
                  <ControlsPanel mode="compress" />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
