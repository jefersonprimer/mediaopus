import React from 'react';
import { ImageItem } from '../lib/types';
import { Download, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { motion } from 'framer-motion';

interface ResultsPreviewProps {
  items: ImageItem[];
  selectedItemId: string | null;
}

const CHECKERBOARD = {
  backgroundImage: 'repeating-conic-gradient(#cbcbcb 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
  backgroundColor: '#eeeeee',
};

// Dark mode checkerboard
const CHECKERBOARD_DARK = {
  backgroundImage: 'repeating-conic-gradient(#2a2a2a 0% 25%, transparent 0% 50%) 0 0 / 20px 20px',
  backgroundColor: '#1a1a1a',
};

export function ResultsPreview({ items, selectedItemId }: ResultsPreviewProps) {
  const processedItems = items.filter(
    (item) =>
      item.id === selectedItemId &&
      ((item.bgRemovalStatus === 'done' && item.bgRemovedUrl) ||
      (item.solidBgStatus === 'done' && item.solidBgRemovedUrl))
  );

  if (processedItems.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">Processed Result</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your background-removed image is ready for download.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {processedItems.map((item) => {
          const resultUrl = item.bgRemovedUrl || item.solidBgRemovedUrl;
          const resultBlob = item.bgRemovedBlob || item.solidBgRemovedBlob;
          const type = item.bgRemovedUrl ? 'AI' : 'Solid';
          
          if (!resultUrl) return null;

          const handleDownload = () => {
             if (!resultBlob) return;
             const url = URL.createObjectURL(resultBlob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `${item.file.name.replace(/\.[^/.]+$/, '')}-no-bg.png`;
             a.click();
             URL.revokeObjectURL(url);
          };

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-hidden border-2 border-primary/5 shadow-xl bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row h-full min-h-[300px]">
                    {/* Before/After Side by Side for Desktop, Stacked for Mobile */}
                    <div className="flex-1 flex flex-col">
                      <div className="relative flex-1 bg-muted/20 flex items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-border/50">
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm border border-border text-muted-foreground">Original</span>
                        </div>
                        <img 
                          src={item.previewUrl} 
                          alt="Original" 
                          className="max-w-full max-h-[250px] object-contain rounded-lg shadow-lg" 
                        />
                      </div>
                    </div>

                    <div className="flex-[1.5] flex flex-col">
                      <div className="relative flex-1 flex items-center justify-center p-6 bg-transparent overflow-hidden">
                        <div className="absolute inset-0 z-0 opacity-50 dark:hidden" style={CHECKERBOARD} />
                        <div className="absolute inset-0 z-0 hidden dark:block opacity-50" style={CHECKERBOARD_DARK} />
                        
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground shadow-sm">Result ({type})</span>
                        </div>
                        
                        <div className="absolute top-3 right-3 z-10">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 rounded-full shadow-md" 
                            onClick={() => window.open(resultUrl, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>

                        <img 
                          src={resultUrl} 
                          alt="Result" 
                          className="relative z-10 max-w-full max-h-[300px] object-contain drop-shadow-2xl" 
                        />
                      </div>

                      <div className="p-4 border-t border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[300px]" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Transparent PNG
                          </p>
                        </div>
                        <Button onClick={handleDownload} className="w-full sm:w-auto shadow-lg shadow-primary/20">
                          <Download className="w-4 h-4 mr-2" />
                          Download Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
