import { useState, useCallback, useRef } from 'react';
import { AssetDef, ASSET_DEFS, Platform } from '../lib/asset-definitions';
import { generateAllAssets, GeneratedAsset, GenerateOptions, BgConfig } from '../lib/generate-assets';
import { useToast } from './use-toast';
import JSZip from 'jszip';

export interface AssetGeneratorState {
  sourceFile: File | null;
  sourcePreview: string | null;
  assets: GeneratedAsset[];
  isGenerating: boolean;
  progress: number; // 0-100
  enabledPlatforms: Set<Platform>;
  foregroundScale: number;
  bg: BgConfig;
  cornerRadius: number;
}

export function useAssetGenerator() {
  const { toast } = useToast();
  const prevUrls = useRef<string[]>([]);

  const [state, setState] = useState<AssetGeneratorState>({
    sourceFile: null,
    sourcePreview: null,
    assets: [],
    isGenerating: false,
    progress: 0,
    enabledPlatforms: new Set(['expo', 'android', 'ios', 'pwa'] as Platform[]),
    foregroundScale: 0.8,
    bg: { type: 'solid', color: '#6366f1' },
    cornerRadius: 22,
  });

  const setSourceFile = useCallback((file: File) => {
    if (state.sourcePreview) URL.revokeObjectURL(state.sourcePreview);
    const previewUrl = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      sourceFile: file,
      sourcePreview: previewUrl,
      assets: [],
      progress: 0,
    }));
  }, [state.sourcePreview]);

  const setForegroundScale = useCallback((v: number) =>
    setState((s) => ({ ...s, foregroundScale: v })), []);

  const setBg = useCallback((bg: Partial<BgConfig>) =>
    setState((s) => ({ ...s, bg: { ...s.bg, ...bg } })), []);

  const setCornerRadius = useCallback((v: number) =>
    setState((s) => ({ ...s, cornerRadius: v })), []);

  const togglePlatform = useCallback((p: Platform) =>
    setState((s) => {
      const next = new Set(s.enabledPlatforms);
      if (next.has(p)) { if (next.size > 1) next.delete(p); }
      else next.add(p);
      return { ...s, enabledPlatforms: next };
    }), []);

  const generate = useCallback(async () => {
    if (!state.sourceFile) return;

    // Clean up previous preview URLs
    prevUrls.current.forEach((u) => URL.revokeObjectURL(u));
    prevUrls.current = [];

    const defs = ASSET_DEFS.filter((d) => state.enabledPlatforms.has(d.platform));

    setState((s) => ({ ...s, isGenerating: true, assets: [], progress: 0 }));

    try {
      const opts: GenerateOptions = {
        foregroundScale: state.foregroundScale,
        bg: state.bg,
        cornerRadius: state.cornerRadius,
      };

      const assets = await generateAllAssets(
        state.sourceFile,
        defs,
        opts,
        (completed, total) => {
          setState((s) => ({ ...s, progress: Math.round((completed / total) * 100) }));
        }
      );

      prevUrls.current = assets.map((a) => a.previewUrl);
      setState((s) => ({ ...s, assets, isGenerating: false, progress: 100 }));
    } catch (err) {
      console.error('Asset generation failed:', err);
      setState((s) => ({ ...s, isGenerating: false }));
      toast({ title: 'Generation Failed', description: 'Could not generate assets. Please try again.', variant: 'destructive' });
    }
  }, [state.sourceFile, state.foregroundScale, state.bg, state.cornerRadius, state.enabledPlatforms, toast]);

  const downloadAsset = useCallback((asset: GeneratedAsset) => {
    const url = URL.createObjectURL(asset.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.def.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadAllZip = useCallback(async () => {
    if (!state.assets.length) return;
    const zip = new JSZip();

    // Group by platform folder
    state.assets.forEach(({ def, blob }) => {
      zip.folder(def.platform)!.file(def.filename, blob);
    });

    // Add app.json snippet
    const appJson = buildExpoAppJson(state.bg.color);
    zip.file('app.json.example', appJson);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-assets-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.assets, state.bg.color]);

  return {
    state,
    setSourceFile,
    setForegroundScale,
    setBg,
    setCornerRadius,
    togglePlatform,
    generate,
    downloadAsset,
    downloadAllZip,
  };
}

function buildExpoAppJson(bgColor: string): string {
  return JSON.stringify({
    expo: {
      name: 'your-app',
      slug: 'your-app',
      icon: './assets/expo/icon.png',
      splash: {
        image: './assets/expo/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: bgColor,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/android/android-icon-foreground.png',
          backgroundImage: './assets/android/android-icon-background.png',
          monochromeImage: './assets/android/android-icon-monochrome.png',
        },
      },
      ios: {
        icon: './assets/ios/ios-app-store-icon.png',
      },
      web: {
        favicon: './assets/pwa/favicon-48x48.png',
      },
    },
  }, null, 2);
}
