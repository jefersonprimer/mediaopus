export type Platform = 'expo' | 'android' | 'ios' | 'pwa';

export interface AssetDef {
  id: string;
  platform: Platform;
  label: string;
  filename: string;
  width: number;
  height: number;
  bgFill: boolean;       // whether to paint a background
  foregroundScale: number; // multiplier relative to the panel foregroundScale (1 = use it directly)
  monochrome?: boolean;
  description: string;
}

export const ASSET_DEFS: AssetDef[] = [
  // ── Expo ──────────────────────────────────────────
  {
    id: 'expo-icon',
    platform: 'expo',
    label: 'App Icon',
    filename: 'icon.png',
    width: 1024,
    height: 1024,
    bgFill: true,
    foregroundScale: 1,
    description: '1024×1024 — used by Expo as the base icon',
  },
  {
    id: 'expo-adaptive',
    platform: 'expo',
    label: 'Adaptive Icon',
    filename: 'adaptive-icon.png',
    width: 1024,
    height: 1024,
    bgFill: false,
    foregroundScale: 0.6,
    description: '1024×1024 transparent — foreground layer for adaptive icons',
  },
  {
    id: 'expo-splash',
    platform: 'expo',
    label: 'Splash Icon',
    filename: 'splash-icon.png',
    width: 1024,
    height: 1024,
    bgFill: false,
    foregroundScale: 0.5,
    description: '1024×1024 transparent — centered logo for splash screen',
  },

  // ── Android ───────────────────────────────────────
  {
    id: 'android-foreground',
    platform: 'android',
    label: 'Foreground Layer',
    filename: 'android-icon-foreground.png',
    width: 512,
    height: 512,
    bgFill: false,
    foregroundScale: 0.66,
    description: '512×512 transparent — adaptive icon foreground',
  },
  {
    id: 'android-background',
    platform: 'android',
    label: 'Background Layer',
    filename: 'android-icon-background.png',
    width: 512,
    height: 512,
    bgFill: true,
    foregroundScale: 0,      // bg only — no logo
    description: '512×512 — solid/gradient background for adaptive icon',
  },
  {
    id: 'android-monochrome',
    platform: 'android',
    label: 'Monochrome Icon',
    filename: 'android-icon-monochrome.png',
    width: 432,
    height: 432,
    bgFill: false,
    foregroundScale: 0.7,
    monochrome: true,
    description: '432×432 transparent — Android 13+ themed icon',
  },
  {
    id: 'android-notification',
    platform: 'android',
    label: 'Notification Icon',
    filename: 'notification-icon.png',
    width: 96,
    height: 96,
    bgFill: false,
    foregroundScale: 0.7,
    monochrome: true,
    description: '96×96 white monochrome — notification icon',
  },
  {
    id: 'android-play-store',
    platform: 'android',
    label: 'Play Store Icon',
    filename: 'play-store-icon.png',
    width: 512,
    height: 512,
    bgFill: true,
    foregroundScale: 1,
    description: '512×512 — Google Play Store listing icon',
  },

  // ── iOS ───────────────────────────────────────────
  {
    id: 'ios-app-store',
    platform: 'ios',
    label: 'App Store Icon',
    filename: 'ios-app-store-icon.png',
    width: 1024,
    height: 1024,
    bgFill: true,
    foregroundScale: 1,
    description: '1024×1024 — App Store Connect listing icon',
  },
  {
    id: 'ios-touch',
    platform: 'ios',
    label: 'Apple Touch Icon',
    filename: 'apple-touch-icon.png',
    width: 180,
    height: 180,
    bgFill: true,
    foregroundScale: 1,
    description: '180×180 — home screen icon for iOS Safari',
  },
  {
    id: 'ios-ipad',
    platform: 'ios',
    label: 'iPad Icon',
    filename: 'ios-ipad-icon.png',
    width: 167,
    height: 167,
    bgFill: true,
    foregroundScale: 1,
    description: '167×167 — iPad Pro home screen icon',
  },

  // ── PWA / Web ─────────────────────────────────────
  {
    id: 'pwa-512',
    platform: 'pwa',
    label: 'PWA Icon 512',
    filename: 'icon-512.png',
    width: 512,
    height: 512,
    bgFill: true,
    foregroundScale: 1,
    description: '512×512 — maskable PWA icon',
  },
  {
    id: 'pwa-192',
    platform: 'pwa',
    label: 'PWA Icon 192',
    filename: 'icon-192.png',
    width: 192,
    height: 192,
    bgFill: true,
    foregroundScale: 1,
    description: '192×192 — standard PWA manifest icon',
  },
  {
    id: 'favicon-48',
    platform: 'pwa',
    label: 'Favicon 48',
    filename: 'favicon-48x48.png',
    width: 48,
    height: 48,
    bgFill: true,
    foregroundScale: 1,
    description: '48×48 — browser tab favicon',
  },
  {
    id: 'favicon-32',
    platform: 'pwa',
    label: 'Favicon 32',
    filename: 'favicon-32x32.png',
    width: 32,
    height: 32,
    bgFill: true,
    foregroundScale: 1,
    description: '32×32 — standard favicon',
  },
  {
    id: 'favicon-16',
    platform: 'pwa',
    label: 'Favicon 16',
    filename: 'favicon-16x16.png',
    width: 16,
    height: 16,
    bgFill: true,
    foregroundScale: 1,
    description: '16×16 — small favicon',
  },
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  expo: 'Expo / React Native',
  android: 'Android',
  ios: 'iOS',
  pwa: 'PWA / Web',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  expo: 'text-blue-500',
  android: 'text-green-500',
  ios: 'text-gray-400',
  pwa: 'text-violet-500',
};
