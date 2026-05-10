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
 * Squircle silhouette + solid plate + centered logo (Anthropic-style balance).
 */
const FAVICON_MASTER_PX = 512;

/** Equal inset around the mark (~7% each side — logo never kisses the squircle). */
const FAVICON_PAD_PCT = 0.07;

/**
 * UI roundness 0–100: lower = squarer silhouette, higher = softer squircle.
 * Default 62 matches the previous fixed look (~n 3.85, ~scale 0.97).
 */
const DEFAULT_FAVICON_ROUNDNESS = 62;

/** Light neutral plate for contrast on dark browser chrome (outside squircle stays transparent). */
const PLATE_RGB = { r: 250, g: 250, b: 252 } as const;

function isImageMime(mimeType: string | undefined): boolean {
  return Boolean(mimeType && mimeType.startsWith("image/"));
}

interface SquircleParams {
  n: number;
  semiAxisScale: number;
}

function parseRoundness(body: Record<string, unknown> | undefined): number {
  const raw = Number(body?.roundness);
  if (!Number.isFinite(raw)) return DEFAULT_FAVICON_ROUNDNESS;
  return Math.max(0, Math.min(100, raw));
}

/** Maps slider 0–100 to superellipse geometry (tuned so 62 ≈ former defaults). */
function roundnessToSquircle(roundness: number): SquircleParams {
  const r = Math.max(0, Math.min(100, roundness));
  const n = Math.min(5.2, Math.max(3.05, 5.0 - (r / 100) * 1.85));
  const semiAxisScale = Math.min(0.995, Math.max(0.88, 0.88 + (r / 100) * 0.145));
  return { n, semiAxisScale };
}

/** Closed superellipse path (|x/a|^n + |y/b|^n = 1), smooth for SVG rasterization. */
function squirclePathD(canvasSize: number, n: number, semiAxisScale: number): string {
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const a = (canvasSize / 2) * semiAxisScale;
  const b = (canvasSize / 2) * semiAxisScale;
  const segments = 140;
  const parts: string[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const px = cx + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const py = cy + b * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    parts.push(`${i === 0 ? "M" : "L"}${px.toFixed(3)} ${py.toFixed(3)}`);
  }
  return `${parts.join(" ")} Z`;
}

async function rasterSquirclePlate(
  canvas: number,
  shape: SquircleParams,
): Promise<Buffer> {
  const pathD = squirclePathD(canvas, shape.n, shape.semiAxisScale);
  const { r, g, b } = PLATE_RGB;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">` +
      `<path d="${pathD}" fill="rgb(${r},${g},${b})"/>` +
      `</svg>`,
  );
  return sharp(svg).png().toBuffer();
}

async function squircleMaskPng(canvas: number, shape: SquircleParams): Promise<Buffer> {
  const pathD = squirclePathD(canvas, shape.n, shape.semiAxisScale);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">` +
      `<path d="${pathD}" fill="white"/>` +
      `</svg>`,
  );
  return sharp(svg).png().toBuffer();
}

/**
 * Transparent outside squircle; solid plate inside; logo `contain` + centered; clipped to squircle.
 */
async function buildFaviconReadyMaster(
  input: Buffer,
  shape: SquircleParams,
): Promise<Buffer> {
  const canvas = FAVICON_MASTER_PX;
  const pad = Math.round(canvas * FAVICON_PAD_PCT);
  const inner = Math.max(1, canvas - 2 * pad);

  const logoPng = await sharp(input)
    .resize(inner, inner, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const meta = await sharp(logoPng).metadata();
  const lw = meta.width ?? inner;
  const lh = meta.height ?? inner;
  const left = Math.round((canvas - lw) / 2);
  const top = Math.round((canvas - lh) / 2);

  const plate = await rasterSquirclePlate(canvas, shape);

  const composited = await sharp(plate)
    .composite([{ input: logoPng, left, top, blend: "over" }])
    .png()
    .toBuffer();

  const maskPng = await squircleMaskPng(canvas, shape);

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
  const shape = roundnessToSquircle(roundness);
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
  const shape = roundnessToSquircle(roundness);
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
      const shape = roundnessToSquircle(roundness);
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
