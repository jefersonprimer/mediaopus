import { AssetDef } from './asset-definitions';

export interface BgConfig {
  type: 'solid' | 'gradient';
  color: string;
  gradientEnd?: string;
  gradientAngle?: number;
}

export interface GenerateOptions {
  foregroundScale: number;        // 0.1–1.0
  bg: BgConfig;
  cornerRadius: number;           // 0–50 (percent of smallest dimension)
  bgRemoveThreshold: number;      // 0–100: euclidean distance to consider "background"
  monochromeColor: 'white' | 'black';
}

export interface GeneratedAsset {
  def: AssetDef;
  blob: Blob;
  previewUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Sample corner pixels to detect the dominant background colour.
 * Falls back to white if all corners are fully transparent.
 */
function detectBgColor(
  data: Uint8ClampedArray,
  w: number,
  h: number
): [number, number, number] {
  const stride = 4;
  const corners = [
    0,                            // top-left
    (w - 1) * stride,             // top-right
    (h - 1) * w * stride,        // bottom-left
    ((h - 1) * w + (w - 1)) * stride, // bottom-right
  ];
  let r = 0, g = 0, b = 0, count = 0;
  for (const idx of corners) {
    if (data[idx + 3] > 128) {
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return [255, 255, 255];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

/**
 * Remove a solid/near-solid background from an image drawn on a canvas.
 * Samples corners to auto-detect the background colour then zeroes out
 * pixels within `threshold` Euclidean distance, with a soft fade zone.
 */
function removeSolidBackground(
  srcCanvas: HTMLCanvasElement,
  threshold: number          // 0–255 euclidean distance
): HTMLCanvasElement {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const ctx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const [bgR, bgG, bgB] = detectBgColor(data, w, h);
  const softZone = Math.max(threshold * 0.4, 8); // fade region width

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= threshold) {
      data[i + 3] = 0;
    } else if (dist <= threshold + softZone) {
      const ratio = (dist - threshold) / softZone;
      data[i + 3] = Math.round(data[i + 3] * ratio);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return srcCanvas;
}

/**
 * Convert all non-transparent pixels to a single solid colour while
 * preserving the existing alpha channel (including anti-aliased edges).
 */
function applyMonochrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: 'white' | 'black'
) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const [tr, tg, tb] = color === 'white' ? [255, 255, 255] : [0, 0, 0];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = tr;
      data[i + 1] = tg;
      data[i + 2] = tb;
      // alpha kept as-is — anti-aliased edges stay smooth
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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

/**
 * Draw the source image onto a full-resolution offscreen canvas,
 * optionally strip its background, and return the resulting canvas.
 * This preprocessed canvas is then used as the draw source.
 */
function preprocessSource(
  img: HTMLImageElement,
  doRemoveBg: boolean,
  threshold: number
): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth;
  tmp.height = img.naturalHeight;
  const tCtx = tmp.getContext('2d', { willReadFrequently: doRemoveBg })!;
  tCtx.drawImage(img, 0, 0);
  if (doRemoveBg) {
    removeSolidBackground(tmp, threshold);
  }
  return tmp;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateAsset(
  img: HTMLImageElement,
  def: AssetDef,
  opts: GenerateOptions
): Promise<GeneratedAsset> {
  const { width: W, height: H } = def;

  // Pre-process source: strip background if this asset type needs it
  const srcCanvas = preprocessSource(img, def.removeBackground === true, opts.bgRemoveThreshold);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: !!(def.monochrome) })!;

  // Rounded clip — skipped for noCornerRadius assets (android bg layer)
  if (!def.noCornerRadius) {
    applyRoundedClip(ctx, W, H, opts.cornerRadius);
  }

  // Background fill
  if (def.bgFill) {
    ctx.fillStyle = makeGradient(ctx, W, H, opts.bg);
    ctx.fillRect(0, 0, W, H);
  }

  // Foreground logo
  if (def.foregroundScale > 0) {
    const effectiveScale = def.foregroundScale * opts.foregroundScale;
    const availW = W * effectiveScale;
    const availH = H * effectiveScale;

    const srcRatio = srcCanvas.width / srcCanvas.height;
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

    ctx.drawImage(srcCanvas, dx, dy, dw, dh);
  }

  // Monochrome post-process — preserves alpha, changes colour only
  if (def.monochrome) {
    applyMonochrome(ctx, W, H, opts.monochromeColor);
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
  const img = await loadImageFromFile(file);
  const results: GeneratedAsset[] = [];

  for (let i = 0; i < defs.length; i++) {
    const asset = await generateAsset(img, defs[i], opts);
    results.push(asset);
    onProgress?.(i + 1, defs.length);
  }

  return results;
}
