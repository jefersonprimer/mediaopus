export interface SolidBgColor {
  r: number;
  g: number;
  b: number;
}

export interface RemoveSolidBgOptions {
  targetColor: SolidBgColor;
  threshold: number; // 0–100
  smoothEdges: boolean;
}

export const PRESET_WHITE: SolidBgColor = { r: 255, g: 255, b: 255 };
export const PRESET_BLACK: SolidBgColor = { r: 0, g: 0, b: 0 };

export function hexToRgb(hex: string): SolidBgColor {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r: isNaN(r) ? 255 : r, g: isNaN(g) ? 255 : g, b: isNaN(b) ? 255 : b };
}

export function rgbToHex({ r, g, b }: SolidBgColor): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export async function removeSolidBackground(
  file: File,
  opts: RemoveSolidBgOptions
): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });
  URL.revokeObjectURL(url);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const { r: tr, g: tg, b: tb } = opts.targetColor;
  // Map 0–100 threshold to a meaningful color distance (max Euclidean ~441)
  const maxDist = 441.67;
  const thresholdDist = (opts.threshold / 100) * maxDist;
  const edgeFraction = 0.25; // Portion of range considered "edge" for smooth falloff

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue; // Already transparent

    const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);

    if (dist <= thresholdDist) {
      if (opts.smoothEdges && dist > thresholdDist * (1 - edgeFraction)) {
        // Smooth anti-aliased falloff near the boundary
        const edgeStart = thresholdDist * (1 - edgeFraction);
        const t = (dist - edgeStart) / (thresholdDist - edgeStart);
        data[i + 3] = Math.round(t * 255);
      } else {
        data[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png'
    );
  });
}
