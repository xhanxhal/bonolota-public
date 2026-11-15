export type SiteColorPalette = 'botanical' | 'sunset';

export interface SitePaletteInfo {
  id: SiteColorPalette;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  isDefault?: boolean;
  previewBg: string;
  previewBorder: string;
  previewText: string;
  previewAccent: string;
  swatches: [string, string, string, string];
}

export const SITE_PALETTES: SitePaletteInfo[] = [
  {
    id: 'botanical',
    nameBn: 'বোটানিক্যাল এমারেল্ড',
    nameEn: 'Botanical Emerald',
    descriptionBn: 'সতেজ সবুজ ও টিল গ্রেডিয়েন্টের প্রাকৃতিক বোটানিক্যাল কালার প্যালেট (বর্তমান ওয়েবসাইট)।',
    isDefault: true,
    previewBg: 'from-[#ffffff] via-[#f4fdf7] to-[#ddfae8]',
    previewBorder: 'border-[#a7f3d0]',
    previewText: 'text-[#064e3b]',
    previewAccent: 'bg-[#059669]',
    swatches: ['#ecfdf5', '#10b981', '#059669', '#064e3b'],
  },
  {
    id: 'sunset',
    nameBn: 'গোল্ডেন সানসেট',
    nameEn: 'Golden Sunset',
    descriptionBn: 'সোনালি অ্যাম্বার ও উষ্ণ ক্রিম রঙের এলিগ্যান্ট গোল্ডেন কালার প্যালেট।',
    isDefault: false,
    previewBg: 'from-[#fffdfa] via-[#fef6ec] to-[#fde5c8]',
    previewBorder: 'border-[#fde68a]',
    previewText: 'text-[#451a03]',
    previewAccent: 'bg-[#b45309]',
    swatches: ['#fffbf2', '#f59e0b', '#b45309', '#451a03'],
  },
];

const PALETTE_STORAGE_KEY = 'bonolota_site_palette';

export function getCachedSitePalette(): SiteColorPalette {
  if (typeof window === 'undefined') return 'botanical';
  try {
    const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
    return saved === 'sunset' ? 'sunset' : 'botanical';
  } catch {
    return 'botanical';
  }
}

export function applySitePalette(palette: SiteColorPalette): void {
  if (typeof document === 'undefined') return;
  const normalized: SiteColorPalette = palette === 'sunset' ? 'sunset' : 'botanical';

  document.documentElement.setAttribute('data-palette', normalized);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', normalized === 'sunset' ? '#78350f' : '#064e3b');
  }

  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, normalized);
  } catch {
    // ignore storage errors
  }

  try {
    window.dispatchEvent(new CustomEvent('bonolota_palette_changed', { detail: normalized }));
  } catch {
    // ignore
  }
}
