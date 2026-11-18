/**
 * Refined Web Audio API sound engine with selectable global UI sound profiles.
 * Uses smooth attack/decay envelopes and optional low-pass filtering so
 * every tap, flip, toggle, and quiz chime sounds crisp without clicks.
 */

export type UiSoundTheme =
  | 'soft-marimba'
  | 'crystal-glass'
  | 'warm-wood'
  | 'classic'
  | 'silent';

export interface UiSoundProfileInfo {
  id: UiSoundTheme;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  isDefault?: boolean;
  accentColor: string;
}

export const UI_SOUND_PROFILES: UiSoundProfileInfo[] = [
  {
    id: 'soft-marimba',
    nameBn: 'সফট মারিম্বা ও বাবল',
    nameEn: 'Soft Marimba',
    descriptionBn: 'মসৃণ, কান-আরামদায়ক ও মৃদু মারিম্বা টিউন (ট্যাপ, ফ্লিপ ও কুইজে আধুনিক বাবল সাউন্ড)।',
    isDefault: true,
    accentColor: '#10b981',
  },
  {
    id: 'crystal-glass',
    nameBn: 'ক্রিস্টাল গ্লাস ও চাইম',
    nameEn: 'Crystal Glass',
    descriptionBn: 'স্বচ্ছ বেল-চাইম ও ঝকঝকে ক্রিস্টাল পিং সাউন্ড (ফোকাসড প্র্যাকটিসের জন্য)।',
    isDefault: false,
    accentColor: '#0ea5e9',
  },
  {
    id: 'warm-wood',
    nameBn: 'উড ও ক্যালিম্বা',
    nameEn: 'Warm Wood & Kalimba',
    descriptionBn: 'প্রাকৃতিক কাঠের টোকা ও উষ্ণ ক্যালিম্বা থাম্ব-পিয়ানো সাউন্ড।',
    isDefault: false,
    accentColor: '#d97706',
  },
  {
    id: 'classic',
    nameBn: 'ক্লাসিক সিন্থ (রিফাইন্ড)',
    nameEn: 'Classic Refined',
    descriptionBn: 'আগের পরিচিত সাউন্ডের ক্লিন ও পপ-মুক্ত সংস্করণ।',
    isDefault: false,
    accentColor: '#8b5cf6',
  },
  {
    id: 'silent',
    nameBn: 'সাইলেন্ট UI মোড',
    nameEn: 'Silent UI',
    descriptionBn: 'ওয়েবসাইটের সব বাটন, ট্যাপ ও কুইজ সাউন্ড সম্পূর্ণ বন্ধ থাকবে (উচ্চারণ চালু থাকবে)।',
    isDefault: false,
    accentColor: '#64748b',
  },
];

const SOUND_STORAGE_KEY = 'bonolota_ui_sound_theme';
const VALID_SOUND_THEMES = new Set<string>(UI_SOUND_PROFILES.map((s) => s.id));

let audioCtx: AudioContext | null = null;
let lastTapAt = 0;

export function normalizeUiSoundTheme(theme: unknown): UiSoundTheme {
  if (typeof theme === 'string' && VALID_SOUND_THEMES.has(theme)) {
    return theme as UiSoundTheme;
  }
  return 'soft-marimba';
}

export function getCachedUiSoundTheme(): UiSoundTheme {
  if (typeof window === 'undefined') return 'soft-marimba';
  try {
    return normalizeUiSoundTheme(localStorage.getItem(SOUND_STORAGE_KEY));
  } catch {
    return 'soft-marimba';
  }
}

export function applyUiSoundTheme(theme: UiSoundTheme): void {
  const normalized = normalizeUiSoundTheme(theme);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_STORAGE_KEY, normalized);
      window.dispatchEvent(new CustomEvent('bonolota_sound_changed', { detail: normalized }));
    }
  } catch {
    // ignore storage errors
  }
}

function isUserSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('gre_bangla_settings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.soundEnabled !== false;
  } catch {
    return true;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface ToneOptions {
  freqStart: number;
  freqEnd?: number;
  delay?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  filterFreq?: number;
}

function playTone(ctx: AudioContext, baseTime: number, opts: ToneOptions): void {
  const start = baseTime + (opts.delay || 0);
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(opts.freqStart, start);
  if (opts.freqEnd && opts.freqEnd !== opts.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), start + opts.duration);
  }

  // Smooth fade-in to eliminate speaker click/pop
  const attack = Math.min(0.006, opts.duration * 0.2);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.linearRampToValueAtTime(opts.gain, start + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.filterFreq, start);
    osc.connect(filter);
    filter.connect(gainNode);
  } else {
    osc.connect(gainNode);
  }

  gainNode.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + opts.duration + 0.015);
}

export function playSoundTap(enabledOverride?: boolean, themeOverride?: UiSoundTheme): void {
  const enabled = enabledOverride !== undefined ? enabledOverride : isUserSoundEnabled();
  if (!enabled) return;

  const nowMs = Date.now();
  if (!themeOverride && nowMs - lastTapAt < 45) return;
  lastTapAt = nowMs;

  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      playTone(ctx, now, { freqStart: 540, freqEnd: 690, duration: 0.04, gain: 0.045, type: 'sine', filterFreq: 1800 });
    } else if (theme === 'crystal-glass') {
      playTone(ctx, now, { freqStart: 1244, freqEnd: 1175, duration: 0.038, gain: 0.032, type: 'sine' });
    } else if (theme === 'warm-wood') {
      playTone(ctx, now, { freqStart: 310, freqEnd: 185, duration: 0.035, gain: 0.055, type: 'triangle', filterFreq: 750 });
    } else if (theme === 'classic') {
      playTone(ctx, now, { freqStart: 620, freqEnd: 520, duration: 0.035, gain: 0.035, type: 'sine' });
    }
  } catch {
    // ignore autoplay restriction
  }
}

export function playSoundToggle(enabledOverride?: boolean, themeOverride?: UiSoundTheme): void {
  const enabled = enabledOverride !== undefined ? enabledOverride : isUserSoundEnabled();
  if (!enabled) return;

  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      playTone(ctx, now, { freqStart: 523.25, duration: 0.045, gain: 0.045, type: 'sine', filterFreq: 1900 });
      playTone(ctx, now, { freqStart: 783.99, delay: 0.032, duration: 0.055, gain: 0.04, type: 'sine', filterFreq: 2100 });
    } else if (theme === 'crystal-glass') {
      playTone(ctx, now, { freqStart: 987.77, duration: 0.045, gain: 0.03, type: 'sine' });
      playTone(ctx, now, { freqStart: 1479.98, delay: 0.035, duration: 0.065, gain: 0.028, type: 'sine' });
    } else if (theme === 'warm-wood') {
      playTone(ctx, now, { freqStart: 349.23, duration: 0.04, gain: 0.055, type: 'triangle', filterFreq: 850 });
      playTone(ctx, now, { freqStart: 523.25, delay: 0.035, duration: 0.05, gain: 0.048, type: 'triangle', filterFreq: 950 });
    } else if (theme === 'classic') {
      playTone(ctx, now, { freqStart: 587.33, duration: 0.04, gain: 0.04, type: 'sine' });
      playTone(ctx, now, { freqStart: 880, delay: 0.03, duration: 0.05, gain: 0.035, type: 'sine' });
    }
  } catch {
    // ignore
  }
}

export function playSoundFlip(enabled: boolean, themeOverride?: UiSoundTheme): void {
  if (!enabled) return;
  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      playTone(ctx, now, { freqStart: 330, freqEnd: 495, duration: 0.075, gain: 0.055, type: 'sine', filterFreq: 1600 });
    } else if (theme === 'crystal-glass') {
      playTone(ctx, now, { freqStart: 880, freqEnd: 1175, duration: 0.07, gain: 0.035, type: 'sine' });
    } else if (theme === 'warm-wood') {
      playTone(ctx, now, { freqStart: 250, freqEnd: 150, duration: 0.065, gain: 0.065, type: 'triangle', filterFreq: 700 });
    } else if (theme === 'classic') {
      playTone(ctx, now, { freqStart: 420, freqEnd: 240, duration: 0.07, gain: 0.065, type: 'sine' });
    }
  } catch {
    // ignore
  }
}

export function playSoundCorrect(enabled: boolean, themeOverride?: UiSoundTheme): void {
  if (!enabled) return;
  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      playTone(ctx, now, { freqStart: 523.25, duration: 0.14, gain: 0.085, type: 'sine', filterFreq: 2200 });
      playTone(ctx, now, { freqStart: 659.25, delay: 0.06, duration: 0.16, gain: 0.085, type: 'sine', filterFreq: 2400 });
      playTone(ctx, now, { freqStart: 783.99, delay: 0.12, duration: 0.24, gain: 0.09, type: 'sine', filterFreq: 2600 });
    } else if (theme === 'crystal-glass') {
      playTone(ctx, now, { freqStart: 659.25, duration: 0.22, gain: 0.06, type: 'sine' });
      playTone(ctx, now, { freqStart: 987.77, delay: 0.065, duration: 0.24, gain: 0.055, type: 'sine' });
      playTone(ctx, now, { freqStart: 1318.51, delay: 0.13, duration: 0.32, gain: 0.05, type: 'sine' });
    } else if (theme === 'warm-wood') {
      playTone(ctx, now, { freqStart: 392.0, duration: 0.13, gain: 0.09, type: 'triangle', filterFreq: 1050 });
      playTone(ctx, now, { freqStart: 493.88, delay: 0.065, duration: 0.15, gain: 0.085, type: 'triangle', filterFreq: 1150 });
      playTone(ctx, now, { freqStart: 587.33, delay: 0.13, duration: 0.22, gain: 0.085, type: 'sine', filterFreq: 1300 });
    } else if (theme === 'classic') {
      playTone(ctx, now, { freqStart: 523.25, freqEnd: 783.99, duration: 0.18, gain: 0.095, type: 'sine' });
      playTone(ctx, now, { freqStart: 659.25, freqEnd: 1046.5, delay: 0.08, duration: 0.25, gain: 0.095, type: 'sine' });
    }
  } catch {
    // ignore
  }
}

export function playSoundIncorrect(enabled: boolean, themeOverride?: UiSoundTheme): void {
  if (!enabled) return;
  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      playTone(ctx, now, { freqStart: 220, duration: 0.11, gain: 0.07, type: 'sine', filterFreq: 650 });
      playTone(ctx, now, { freqStart: 174.61, delay: 0.085, duration: 0.17, gain: 0.075, type: 'sine', filterFreq: 550 });
    } else if (theme === 'crystal-glass') {
      playTone(ctx, now, { freqStart: 349.23, freqEnd: 261.63, duration: 0.18, gain: 0.055, type: 'sine', filterFreq: 900 });
    } else if (theme === 'warm-wood') {
      playTone(ctx, now, { freqStart: 174.61, freqEnd: 130.81, duration: 0.14, gain: 0.09, type: 'triangle', filterFreq: 500 });
    } else if (theme === 'classic') {
      playTone(ctx, now, { freqStart: 220, freqEnd: 164.81, duration: 0.22, gain: 0.095, type: 'triangle', filterFreq: 850 });
    }
  } catch {
    // ignore
  }
}

export function playSoundCelebration(enabled: boolean, themeOverride?: UiSoundTheme): void {
  if (!enabled) return;
  const theme = themeOverride || getCachedUiSoundTheme();
  if (theme === 'silent') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (theme === 'soft-marimba') {
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      notes.forEach((freq, i) => {
        playTone(ctx, now, { freqStart: freq, delay: i * 0.075, duration: 0.26, gain: 0.08, type: 'sine', filterFreq: 2600 });
      });
    } else if (theme === 'crystal-glass') {
      const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
      notes.forEach((freq, i) => {
        playTone(ctx, now, { freqStart: freq, delay: i * 0.08, duration: 0.34, gain: 0.055, type: 'sine' });
      });
    } else if (theme === 'warm-wood') {
      const notes = [392.0, 493.88, 587.33, 739.99, 783.99];
      notes.forEach((freq, i) => {
        playTone(ctx, now, { freqStart: freq, delay: i * 0.08, duration: 0.24, gain: 0.085, type: 'triangle', filterFreq: 1350 });
      });
    } else if (theme === 'classic') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        playTone(ctx, now, { freqStart: freq, delay: i * 0.085, duration: 0.24, gain: 0.09, type: 'triangle', filterFreq: 2200 });
      });
    }
  } catch {
    // ignore
  }
}

export function previewUiSoundTheme(theme: UiSoundTheme): void {
  if (theme === 'silent') return;
  playSoundCorrect(true, theme);
}
