import { AssetDef } from './asset-definitions';

export interface BgConfig {
  type: 'solid' | 'gradient';
  color: string;           // hex
  gradientEnd?: string;    // hex, used when type = 'gradient'
  gradientAngle?: number;  // degrees (0 = top→bottom)
}

export interface GenerateOptions {
  foregroundScale: number; // 0.1–1.0
  bg: BgConfig;
  cornerRadius: number;    // 0–50 (percent of smallest dimension)
}

export interface GeneratedAsset {
  def: AssetDef;
  blob: Blob;
  previewUrl: string;
}

function hexToRgba(hex: string, alpha = 1): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BgConfig
): CanvasGradient | string {
  if (cfg.type === 'gradient' && cfg.gradientEnd) {
    const angle = ((cfg.gradientAngle ?? 135) * Math.PI) / 180;
    const x1 = w / 2 - (Math.cos(angle) * w) / 2;
    const y1 = h / 2 - (Math.sin(angle) * h) / 2;
    const x2 = w / 2 + (Math.cos(angle) * w) / 2;
    const y2 = h / 2 + (Math.sin(angle) * h) / 2;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, cfg.color);
    g.addColorStop(1, cfg.gradientEnd);
    return g;
  }
  return cfg.color;
}

function applyRoundedClip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  radiusPct: number
) {
  if (radiusPct <= 0) return;
  const r = Math.min(w, h) * (radiusPct / 100);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.clip();
}

function toMonochrome(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 0) {
      // Make fully white where alpha > 0, preserve alpha
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/png'
    );
  });
}

export async function generateAsset(
  img: HTMLImageElement,
  def: AssetDef,
  opts: GenerateOptions
): Promise<GeneratedAsset> {
  const { width: W, height: H } = def;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: def.monochrome })!;

  // Apply rounded clip if needed
  applyRoundedClip(ctx, W, H, opts.cornerRadius);

  // Background fill
  if (def.bgFill) {
    ctx.fillStyle = makeGradient(ctx, W, H, opts.bg);
    ctx.fillRect(0, 0, W, H);
  }

  // Logo / foreground
  if (def.foregroundScale > 0) {
    const effectiveScale = def.foregroundScale * opts.foregroundScale;
    const availW = W * effectiveScale;
    const availH = H * effectiveScale;

    // Fit logo inside available box preserving aspect ratio
    const srcRatio = img.naturalWidth / img.naturalHeight;
    let dw: number, dh: number;
    if (srcRatio >= 1) {
      dw = availW;
      dh = availW / srcRatio;
    } else {
      dh = availH;
      dw = availH * srcRatio;
    }

    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Monochrome post-process
  if (def.monochrome) {
    toMonochrome(ctx, W, H);
  }

  const blob = await canvasToBlob(canvas);
  const previewUrl = URL.createObjectURL(blob);

  return { def, blob, previewUrl };
}

export async function generateAllAssets(
  file: File,
  defs: AssetDef[],
  opts: GenerateOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<GeneratedAsset[]> {
  const img = await loadImage(file);
  const results: GeneratedAsset[] = [];

  for (let i = 0; i < defs.length; i++) {
    const asset = await generateAsset(img, defs[i], opts);
    results.push(asset);
    onProgress?.(i + 1, defs.length);
  }

  return results;
}
