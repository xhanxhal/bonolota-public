export type SiteColorPalette = 'botanical' | 'sunset' | 'ocean' | 'royal' | 'rose' | 'sage';

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
  themeColor: string;
  swatches: [string, string, string, string];
}

export const SITE_PALETTES: SitePaletteInfo[] = [
  {
    id: 'botanical',
    nameBn: 'বোটানিক্যাল এমারেল্ড',
    nameEn: 'Botanical Emerald',
    descriptionBn: 'সতেজ সবুজ ও টিল গ্রেডিয়েন্টের প্রাকৃতিক বোটানিক্যাল কালার প্যালেট (ডিফল্ট)।',
    isDefault: true,
    previewBg: 'from-[#ffffff] via-[#f4fdf7] to-[#ddfae8]',
    previewBorder: 'border-[#a7f3d0]',
    previewText: 'text-[#064e3b]',
    previewAccent: 'bg-[#059669]',
    themeColor: '#064e3b',
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
    themeColor: '#78350f',
    swatches: ['#fffbf2', '#f59e0b', '#b45309', '#451a03'],
  },
  {
    id: 'ocean',
    nameBn: 'ওশান কোবাল্ট',
    nameEn: 'Ocean Cobalt',
    descriptionBn: 'সতেজ নীল সমুদ্র ও আকাশী স্লেট টোনের শান্ত ও পরিচ্ছন্ন রিডিং প্যালেট।',
    isDefault: false,
    previewBg: 'from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe]',
    previewBorder: 'border-[#bae6fd]',
    previewText: 'text-[#0c4a6e]',
    previewAccent: 'bg-[#0369a1]',
    themeColor: '#0c4a6e',
    swatches: ['#f0f9ff', '#0ea5e9', '#0369a1', '#0c4a6e'],
  },
  {
    id: 'royal',
    nameBn: 'রয়্যাল ভায়োলেট',
    nameEn: 'Royal Violet',
    descriptionBn: 'অ্যামেথিস্ট বেগুনি ও ল্যাভেন্ডারের আধুনিক আভিজাত্যপূর্ণ কালার প্যালেট।',
    isDefault: false,
    previewBg: 'from-[#ffffff] via-[#f5f3ff] to-[#ede9fe]',
    previewBorder: 'border-[#ddd6fe]',
    previewText: 'text-[#2e1065]',
    previewAccent: 'bg-[#6d28d9]',
    themeColor: '#2e1065',
    swatches: ['#f5f3ff', '#8b5cf6', '#6d28d9', '#2e1065'],
  },
  {
    id: 'rose',
    nameBn: 'ভেলভেট রোজ',
    nameEn: 'Velvet Rose',
    descriptionBn: 'কোমল গোলাপি-ব্লাশ ও গভীর ক্রিমসন রোজ রঙের উষ্ণ ও প্রাণবন্ত প্যালেট।',
    isDefault: false,
    previewBg: 'from-[#fffdfd] via-[#fff1f2] to-[#ffe4e6]',
    previewBorder: 'border-[#fecdd3]',
    previewText: 'text-[#4c0519]',
    previewAccent: 'bg-[#be123c]',
    themeColor: '#4c0519',
    swatches: ['#fff1f2', '#f43f5e', '#be123c', '#4c0519'],
  },
  {
    id: 'sage',
    nameBn: 'নর্ডিক সেজ',
    nameEn: 'Nordic Sage',
    descriptionBn: 'চোখে আরামদায়ক অলিভ-পাইন ও মিনিমাল আর্দি টোনের স্টাডি প্যালেট।',
    isDefault: false,
    previewBg: 'from-[#fcfdf9] via-[#f7fee7] to-[#ecfccb]',
    previewBorder: 'border-[#d9f99d]',
    previewText: 'text-[#1a2e05]',
    previewAccent: 'bg-[#3f6212]',
    themeColor: '#1a2e05',
    swatches: ['#f7fee7', '#84cc16', '#3f6212', '#1a2e05'],
  },
];

const VALID_PALETTE_IDS = new Set<string>(SITE_PALETTES.map((p) => p.id));
const PALETTE_STORAGE_KEY = 'bonolota_site_palette';

export function normalizeSitePalette(palette: unknown): SiteColorPalette {
  if (typeof palette === 'string' && VALID_PALETTE_IDS.has(palette)) {
    return palette as SiteColorPalette;
  }
  return 'botanical';
}

export function getPaletteInfo(palette: SiteColorPalette): SitePaletteInfo {
  return SITE_PALETTES.find((p) => p.id === palette) || SITE_PALETTES[0];
}

export function getCachedSitePalette(): SiteColorPalette {
  if (typeof window === 'undefined') return 'botanical';
  try {
    return normalizeSitePalette(localStorage.getItem(PALETTE_STORAGE_KEY));
  } catch {
    return 'botanical';
  }
}

export function applySitePalette(palette: SiteColorPalette): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeSitePalette(palette);
  const info = getPaletteInfo(normalized);

  document.documentElement.setAttribute('data-palette', normalized);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', info.themeColor);
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
