import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onUpload?: (files: File[]) => void;
  className?: string;
}

export function UploadZone({ onUpload, className = "" }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && onUpload) {
        onUpload(acceptedFiles);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`relative w-full rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer overflow-hidden ${
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/50"
      } ${className}`}
      data-testid="upload-zone"
    >
      <input {...getInputProps()} data-testid="upload-input" />

      <div className="flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-background/80 p-4 rounded-full shadow-sm mb-4"
        >
          {isDragActive ? (
            <UploadCloud className="w-8 h-8 text-primary" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </motion.div>

        <h3 className="text-lg font-semibold text-foreground mb-1">
          {isDragActive ? "Drop images here" : "Drag & drop images"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Supports PNG, JPG, and WEBP. You can also click to browse files.
        </p>
      </div>

      {/* Decorative background grid/pulse */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)",
              opacity: 0.05,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
