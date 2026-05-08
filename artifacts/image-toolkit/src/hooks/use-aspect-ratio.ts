import { useState, useEffect, useRef } from 'react';

export function useAspectRatio(initialWidth: number | null, initialHeight: number | null) {
  const [width, setWidth] = useState<number | null>(initialWidth);
  const [height, setHeight] = useState<number | null>(initialHeight);
  const [maintainRatio, setMaintainRatio] = useState(true);
  
  const ratioRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialWidth && initialHeight && !ratioRef.current) {
      ratioRef.current = initialWidth / initialHeight;
    }
  }, [initialWidth, initialHeight]);

  const handleWidthChange = (newWidth: number | null) => {
    setWidth(newWidth);
    if (maintainRatio && newWidth && ratioRef.current) {
      setHeight(Math.round(newWidth / ratioRef.current));
    }
  };

  const handleHeightChange = (newHeight: number | null) => {
    setHeight(newHeight);
    if (maintainRatio && newHeight && ratioRef.current) {
      setWidth(Math.round(newHeight * ratioRef.current));
    }
  };

  const reset = (w: number, h: number) => {
    ratioRef.current = w / h;
    setWidth(w);
    setHeight(h);
  };

  return {
    width,
    height,
    handleWidthChange,
    handleHeightChange,
    maintainRatio,
    setMaintainRatio,
    reset,
  };
}
