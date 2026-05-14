import { Router, type IRouter } from "express";
import multer from "multer";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import potrace from "potrace";
// @ts-ignore
import bmp from "bmp-js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
  },
});

const router: IRouter = Router();

/**
 * High-res square used to derive all ICO layers (Lanczos downscale → clean 16×16 / 32×32).
 * Rounded-square silhouette + centered logo on transparent (no content inset, no solid plate).
 */
const FAVICON_MASTER_PX = 512;

/**
 * UI roundness 0–100: 0 = sharp, nearly full-bleed square mask; higher values add corner rounding
 * and a slight inset so the silhouette reads at small sizes. Default tuned for a balanced icon look.
 */
const DEFAULT_FAVICON_ROUNDNESS = 62;

function isImageMime(mimeType: string | undefined): boolean {
  return Boolean(mimeType && mimeType.startsWith("image/"));
}

/** Centered square mask: half-edge length and SVG corner radius (straight sides when rx=0). */
interface RoundedSquareParams {
  half: number;
  cornerRadius: number;
}

function parseRoundness(body: Record<string, unknown> | undefined): number {
  const raw = Number(body?.roundness);
  if (!Number.isFinite(raw)) return DEFAULT_FAVICON_ROUNDNESS;
  return Math.max(0, Math.min(100, raw));
}

/**
 * Maps slider 0–100: at 0, sharp corners and ~full-canvas mask; corner radius grows with the slider
 * and the mask insets slightly so curves stay visible at 512px (sides stay straight, not superellipse).
 */
function roundnessToRoundedSquare(roundness: number): RoundedSquareParams {
  const r = Math.max(0, Math.min(100, roundness));
  const canvas = FAVICON_MASTER_PX;
  // At 0%: nearly full-bleed square (sharp corners) — no wide transparent "frame".
  // As roundness increases, the mask insets slightly so rounded corners read clearly on-canvas.
  const maxScale = 0.995;
  const minScale = 0.88;
  const semiAxisScale = maxScale - (r / 100) * (maxScale - minScale);
  const half = (canvas / 2) * semiAxisScale;
  const t = r / 100;
  const rawRx = t * half * 0.9;
  const cornerRadius = Math.max(0, Math.min(rawRx, half - 0.25));
  return { half, cornerRadius };
}

function roundedSquareMaskSvg(canvas: number, shape: RoundedSquareParams): Buffer {
  const cx = canvas / 2;
  const cy = canvas / 2;
  const { half, cornerRadius: rx } = shape;
  const x = cx - half;
  const y = cy - half;
  const w = half * 2;
  const h = half * 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">` +
      `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${w.toFixed(3)}" height="${h.toFixed(3)}" rx="${rx.toFixed(3)}" ry="${rx.toFixed(3)}" fill="white"/>` +
      `</svg>`,
  );
}

async function roundedSquareMaskPng(canvas: number, shape: RoundedSquareParams): Promise<Buffer> {
  const svg = roundedSquareMaskSvg(canvas, shape);
  return sharp(svg).png().toBuffer();
}

/**
 * Transparent outside mask; logo `contain` + centered on transparent; clipped to rounded square.
 */
async function buildFaviconReadyMaster(
  input: Buffer,
  shape: RoundedSquareParams,
): Promise<Buffer> {
  const canvas = FAVICON_MASTER_PX;

  const logoPng = await sharp(input)
    .resize(canvas, canvas, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const meta = await sharp(logoPng).metadata();
  const lw = meta.width ?? canvas;
  const lh = meta.height ?? canvas;
  const left = Math.round((canvas - lw) / 2);
  const top = Math.round((canvas - lh) / 2);

  const base = await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  const composited = await sharp(base)
    .composite([{ input: logoPng, left, top, blend: "over" }])
    .png()
    .toBuffer();

  const maskPng = await roundedSquareMaskPng(canvas, shape);

  return sharp(composited)
    .composite([{ input: maskPng, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function icoLayerFromMaster(master: Buffer, px: number): Promise<Buffer> {
  return sharp(master)
    .resize(px, px, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

function runTrace(
  input: Buffer,
  options: potrace.PotraceOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.trace(input, options, (err, svg) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(svg);
    });
  });
}

router.post("/convert/ico", upload.single("file"), async (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile?.buffer || !isImageMime(uploadedFile.mimetype)) {
    res.status(400).json({ message: "Send one image file as multipart field 'file'." });
    return;
  }

  const roundness = parseRoundness(req.body as Record<string, unknown>);
  const shape = roundnessToRoundedSquare(roundness);
  const master = await buildFaviconReadyMaster(uploadedFile.buffer, shape);
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map((size) => icoLayerFromMaster(master, size)));

  const icoBuffer = await pngToIco(images);

  res.setHeader("Content-Type", "image/x-icon");
  res.setHeader("Content-Disposition", "attachment; filename=favicon.ico");
  res.send(icoBuffer);
});

/** Same styling as ICO layers: square PNG master (512×512) for design handoff or custom packing. */
router.post("/convert/favicon-master", upload.single("file"), async (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile?.buffer || !isImageMime(uploadedFile.mimetype)) {
    res.status(400).json({ message: "Send one image file as multipart field 'file'." });
    return;
  }

  const roundness = parseRoundness(req.body as Record<string, unknown>);
  const shape = roundnessToRoundedSquare(roundness);
  const master = await buildFaviconReadyMaster(uploadedFile.buffer, shape);

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", "attachment; filename=favicon-master.png");
  res.send(master);
});

router.post("/convert/svg", upload.single("file"), async (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile?.buffer || !isImageMime(uploadedFile.mimetype)) {
    res.status(400).json({ message: "Send one image file as multipart field 'file'." });
    return;
  }

  const thresholdValue = Number(req.body?.threshold);
  const smoothnessValue = Number(req.body?.smoothness);
  const mode = typeof req.body?.mode === "string" ? req.body.mode : "icon";

  const threshold = Number.isFinite(thresholdValue)
    ? Math.max(0, Math.min(255, thresholdValue))
    : 180;
  const smoothness = Number.isFinite(smoothnessValue)
    ? Math.max(0, Math.min(1, smoothnessValue))
    : 0.2;

  const modeToTurdSize: Record<string, number> = {
    logo: 2,
    icon: 8,
    detail: 24,
  };
  const turdSize = modeToTurdSize[mode] ?? modeToTurdSize.icon;

  const normalizedInput = await sharp(uploadedFile.buffer)
    .ensureAlpha()
    .png()
    .toBuffer();

  const svg = await runTrace(normalizedInput, {
    color: "black",
    background: "transparent",
    threshold,
    turdSize,
    optTolerance: smoothness,
  });

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=vectorized.svg");
  res.send(svg);
});

router.post("/convert/to/:format", upload.single("file"), async (req, res) => {
  const uploadedFile = req.file;
  const targetFormat = (req.params.format as string)?.toLowerCase();

  if (!uploadedFile?.buffer || !isImageMime(uploadedFile.mimetype)) {
    res.status(400).json({ message: "Send one image file as multipart field 'file'." });
    return;
  }

  try {
    const roundness = req.body?.roundness ? parseRoundness(req.body as Record<string, unknown>) : null;
    let pipeline: sharp.Sharp;

    if (roundness !== null) {
      const shape = roundnessToRoundedSquare(roundness);
      const master = await buildFaviconReadyMaster(uploadedFile.buffer, shape);
      pipeline = sharp(master);
    } else {
      pipeline = sharp(uploadedFile.buffer);
    }

    let contentType = "image/png";
    let extension = targetFormat;

    switch (targetFormat) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({ quality: 90 });
        contentType = "image/jpeg";
        extension = "jpg";
        break;
      case "png":
        pipeline = pipeline.png();
        contentType = "image/png";
        break;
      case "webp":
        pipeline = pipeline.webp({ quality: 80 });
        contentType = "image/webp";
        break;
      case "gif":
        pipeline = pipeline.gif();
        contentType = "image/gif";
        break;
      case "bmp": {
        const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const bmpData = {
          data,
          width: info.width,
          height: info.height,
        };
        const bmpBuffer = bmp.encode(bmpData).data;
        res.setHeader("Content-Type", "image/bmp");
        res.setHeader("Content-Disposition", "attachment; filename=converted.bmp");
        res.send(bmpBuffer);
        return;
      }
      default:
        res.status(400).json({ message: `Format ${targetFormat} not supported.` });
        return;
    }

    const output = await pipeline.toBuffer();
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=converted.${extension}`);
    res.send(output);
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ message: "Failed to convert image." });
  }
});

export default router;
