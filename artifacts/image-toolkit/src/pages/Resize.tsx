import React from "react";
import { Header } from "../components/Header";
import { UploadZone } from "../components/UploadZone";
import { ImageGrid } from "../components/ImageGrid";
import { ControlsPanel } from "../components/ControlsPanel";
import { useImageStore } from "../hooks/use-image-store";
import { motion } from "framer-motion";

export default function Resize() {
  const { items, addItems } = useImageStore();

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full max-w-7xl mx-auto">
          {/* Left Column: Main content (Upload + Grid) */}
          <div className="flex-1 flex flex-col gap-6 lg:gap-8 min-w-0">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Browser-native image processing
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                Resize, compress, and convert images entirely locally. No
                uploads. Fast, private, and secure.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <UploadZone onUpload={addItems} className="py-6" />
            </motion.div>

            {items.length > 0 && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Workspace ({items.length})
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    Drag to reorder
                  </span>
                </div>
                <ImageGrid items={items} enableBgTools={false} />
              </div>
            )}

            {items.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[30vh] text-center p-8 rounded-2xl border border-dashed border-border/50 bg-muted/10 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <span className="text-2xl font-serif italic text-muted-foreground">
                    It
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-1">
                  Your workspace is empty
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Upload some images to start compressing, resizing, and
                  converting them right here in your browser.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Controls Panel */}
          <div className="w-full lg:w-80 xl:w-[340px] shrink-0 h-fit lg:sticky lg:top-24 mt-8 lg:mt-0">
            <ControlsPanel mode="processor" />
          </div>
        </div>
      </main>
    </div>
  );
}
