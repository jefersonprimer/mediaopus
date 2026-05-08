# Image Toolkit

A browser-native image processing tool — resize, compress, and convert images entirely client-side. No uploads, no backend, fully private and fast.

## Run & Operate

- `pnpm --filter @workspace/image-toolkit run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui
- Image processing: pica (resize), Canvas API (compress/convert), JSZip (ZIP export)
- Drag-and-drop: react-dropzone (upload), @dnd-kit (reorder)
- State: Zustand
- Theming: next-themes (dark/light mode)
- Animations: framer-motion

## Where things live

- `artifacts/image-toolkit/src/` — frontend source
  - `src/pages/Home.tsx` — main single-page layout
  - `src/components/UploadZone.tsx` — drag-and-drop upload area
  - `src/components/ImageGrid.tsx` — image card grid with DnD reordering
  - `src/components/ControlsPanel.tsx` — processing options sidebar
  - `src/hooks/use-image-store.ts` — Zustand store for image state
  - `src/hooks/use-image-processing.ts` — pica + Canvas API processing logic

## Architecture decisions

- Fully client-side: all processing uses Canvas API + pica, no server needed
- Metadata removal is automatic — Canvas toBlob() strips EXIF data on export
- Zustand used for simple, flat global state (image list + processing options)
- pica used for high-quality Lanczos resizing instead of canvas drawImage scaling
- JSZip bundles all processed images into a downloadable archive

## Product

Users can drag-and-drop multiple images, configure resize dimensions (with aspect ratio lock), compression quality (0–100%), and output format (WEBP/JPG/PNG). Processing runs in batch via pica + Canvas API. Images can be downloaded individually or all at once as a ZIP. Dark mode supported with system preference detection.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Zustand must be added to `artifacts/image-toolkit` dependencies (not root)
- All image processing libraries (pica, jszip, react-dropzone, @dnd-kit) are in artifact-level devDependencies
- No backend or DATABASE_URL needed — this is a fully static frontend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
