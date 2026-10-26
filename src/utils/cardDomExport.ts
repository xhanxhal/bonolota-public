import { toJpeg } from 'html-to-image';

export interface CardExportResult {
  dataUrl: string;
  blob: Blob | null;
}

/**
 * Exports an HTML card DOM element directly to a high-resolution JPEG image
 * using browser's native DOM layout engine (preserves 100% of Bengali fonts, 
 * CSS text-wrapping, SVG leaves, borders, shadows, and natural padding).
 */
export async function exportCardElementToJpeg(
  element: HTMLElement,
  options?: {
    quality?: number;
    pixelRatio?: number;
  }
): Promise<CardExportResult> {
  const quality = options?.quality ?? 0.95;
  // Use minimum 2.5x retina scaling for crystal-clear HD output
  const pixelRatio = options?.pixelRatio ?? (typeof window !== 'undefined' && window.devicePixelRatio > 2.5 ? window.devicePixelRatio : 2.5);

  // Ensure fonts are ready before snapshot
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  // Pre-prime Safari WebKit foreignObject font cache
  try {
    await toJpeg(element, {
      quality: 0.7,
      pixelRatio: 1,
      cacheBust: true,
    });
  } catch {
    // Ignore pre-prime attempt
  }

  // Generate crisp high-DPI JPEG snapshot
  const dataUrl = await toJpeg(element, {
    quality,
    pixelRatio,
    cacheBust: true,
  });

  // Convert to Blob for mobile download and native Web Share API
  let blob: Blob | null = null;
  try {
    const res = await fetch(dataUrl);
    blob = await res.blob();
  } catch {
    // Fallback if fetch fails
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    blob = new Blob([ab], { type: mimeString });
  }

  return { dataUrl, blob };
}
