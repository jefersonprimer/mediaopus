export type SvgMode = "logo" | "icon" | "detail";

export interface SvgExportOptions {
  mode: SvgMode;
  threshold: number;
  smoothness: number;
}

export interface ComplexityResult {
  isComplex: boolean;
  uniqueColors: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

function toApiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

async function requestBinaryExport(
  path: string,
  sourceFile: File,
  extraFields?: Record<string, string>,
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", sourceFile);
  Object.entries(extraFields ?? {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(toApiUrl(path), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Export failed with status ${response.status}`);
  }

  return response.blob();
}

/** Matches server default squircle look (roundness slider midpoint). */
export const DEFAULT_FAVICON_ROUNDNESS = 62;

export interface FaviconExportOptions {
  /** 0 = squarer silhouette, 100 = softer squircle (default 62). */
  roundness?: number;
}

function roundnessField(opts?: FaviconExportOptions): Record<string, string> {
  if (opts?.roundness === undefined) return {};
  const r = opts.roundness;
  return { roundness: String(Math.max(0, Math.min(100, r))) };
}

export async function exportIco(
  sourceFile: File,
  opts?: FaviconExportOptions,
): Promise<Blob> {
  const fields = opts ? roundnessField(opts) : roundnessField({ roundness: DEFAULT_FAVICON_ROUNDNESS });
  return requestBinaryExport("/api/convert/ico", sourceFile, fields);
}

/** 512×512 rounded, padded favicon-ready PNG (same look as ICO layers, best for previews / handoff). */
export async function exportFaviconMasterPng(
  sourceFile: File,
  opts?: FaviconExportOptions,
): Promise<Blob> {
  const fields = opts ? roundnessField(opts) : roundnessField({ roundness: DEFAULT_FAVICON_ROUNDNESS });
  return requestBinaryExport(
    "/api/convert/favicon-master",
    sourceFile,
    fields,
  );
}

export async function exportSvg(
  sourceFile: File,
  opts: SvgExportOptions,
): Promise<Blob> {
  return requestBinaryExport("/api/convert/svg", sourceFile, {
    mode: opts.mode,
    threshold: String(opts.threshold),
    smoothness: String(opts.smoothness),
  });
}

export type ExportFormat = "jpg" | "png" | "webp" | "gif" | "bmp";

export async function exportGeneric(
  sourceFile: File,
  format: ExportFormat,
  opts?: FaviconExportOptions,
): Promise<Blob> {
  return requestBinaryExport(
    `/api/convert/to/${format}`,
    sourceFile,
    roundnessField(opts),
  );
}

export async function analyzeImageComplexity(sourceFile: File): Promise<ComplexityResult> {
  const imageBitmap = await createImageBitmap(sourceFile);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    imageBitmap.close();
    return { isComplex: false, uniqueColors: 0 };
  }

  const sampleSize = 128;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  ctx.drawImage(imageBitmap, 0, 0, sampleSize, sampleSize);
  imageBitmap.close();

  const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const colors = new Set<number>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 20) continue;
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    colors.add((r << 10) | (g << 5) | b);
  }

  const uniqueColors = colors.size;
  return {
    uniqueColors,
    isComplex: uniqueColors > 1800,
  };
}
