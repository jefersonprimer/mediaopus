import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface AddImagesButtonProps {
  onUpload: (files: File[]) => void;
  className?: string;
  variant?: 'default' | 'grid';
}

export function AddImagesButton({ onUpload, className = '', variant = 'default' }: AddImagesButtonProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
  });

  if (variant === 'grid') {
    return (
      <div
        {...getRootProps()}
        className={`group relative flex flex-col bg-card rounded-xl border border-dashed border-border shadow-sm overflow-hidden transition-all duration-200 cursor-pointer hover:border-primary hover:bg-primary/5 hover:shadow-md ${className}`}
      >
        <input {...getInputProps()} />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-background border text-foreground flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isDragActive ? 'scale-110 ring-4 ring-primary/20' : ''}`}>
            <Plus className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Add images</p>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Click or drag
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      <Button
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-full bg-white text-black border-border hover:bg-white/90 hover:scale-105 transition-all shadow-md active:scale-95"
        title="Add more images"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
