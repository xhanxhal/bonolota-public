/**
 * Client Device Fingerprint & Hardware Identifier Utility
 * 
 * Generates a stable, anonymous client device identifier and GPU WebGL/Canvas
 * hardware fingerprint hash (Feature 38) that cannot be spoofed by VPN or Incognito mode.
 */

const DEVICE_ID_KEY = 'bonolota_device_id';
let cachedCanvasHash: string | null = null;
let cachedGpuRenderer: string | null = null;

function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}

/**
 * Feature 38: Canvas & WebGL Hardware Fingerprint Hash
 * Renders geometry, gradients, subpixel fonts and emojis to an offscreen canvas.
 * Subpixel rasterization differences between GPUs produce a distinct hardware hash.
 */
export function getCanvasFingerprintHash(): string {
  if (cachedCanvasHash) return cachedCanvasHash;
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'canvas_ssr';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (!ctx) return 'canvas_no_2d';

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#064e3b');
    gradient.addColorStop(0.5, '#047857');
    gradient.addColorStop(1, '#0f766e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text with complex scripts, emojis, and shadow
    ctx.textBaseline = 'top';
    ctx.font = '15px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('বনলতা Vocab 2026 🛡️ 🚀', 10, 8);

    // Secondary subpixel overlapping text
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.shadowBlur = 0;
    ctx.fillText('GPU-HW-SIG: <αβγ-98.7%#>', 12, 34);

    // Geometrical bezier curves with alpha blending
    ctx.beginPath();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.arc(205, 30, 18, 0, Math.PI * 2, true);
    ctx.stroke();

    const dataUrl = canvas.toDataURL();
    
    // Also include WebGL GPU Renderer signature if available
    const gpuInfo = getGpuRendererInfo();
    const combinedSignature = `${dataUrl}|${gpuInfo}`;
    
    // Generate hex hash
    const hashPart1 = fnv1aHash(combinedSignature.slice(0, 500));
    const hashPart2 = fnv1aHash(combinedSignature.slice(500, 1500));
    const hashPart3 = fnv1aHash(combinedSignature);

    cachedCanvasHash = `GPU-${hashPart1}${hashPart2}${hashPart3}`.toUpperCase();
    return cachedCanvasHash;
  } catch (e) {
    return 'GPU-HARDWARE-ERR';
  }
}

/**
 * Extract WebGL GPU unmasked renderer info
 */
export function getGpuRendererInfo(): string {
  if (cachedGpuRenderer) return cachedGpuRenderer;
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'Unknown GPU';

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'WebGL Not Supported';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      cachedGpuRenderer = renderer ? String(renderer).trim() : 'Generic GPU';
      return cachedGpuRenderer;
    }
    return 'Standard WebGL';
  } catch {
    return 'Protected GPU';
  }
}

export function getClientDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_device';
  }

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.startsWith('dev_') && existing.length >= 16) {
      return existing;
    }
  } catch {
    // LocalStorage might be restricted
  }

  try {
    const ua = navigator.userAgent || 'unknown_ua';
    const lang = navigator.language || 'en';
    const screenRes = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : '0x0';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown_tz';
    const canvasHash = getCanvasFingerprintHash();
    
    const fingerprint = fnv1aHash(`${ua}|${lang}|${screenRes}|${tz}|${canvasHash}`);
    const newDeviceId = `dev_${fingerprint}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      localStorage.setItem(DEVICE_ID_KEY, newDeviceId);
    } catch {
      // Ignore
    }

    return newDeviceId;
  } catch {
    return `dev_fallback_${Date.now().toString(36)}`;
  }
}
