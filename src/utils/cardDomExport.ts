import { toJpeg } from 'html-to-image';

export interface CardExportResult {
  dataUrl: string;
  blob: Blob | null;
}

export interface CardExportOptions {
  quality?: number;
  pixelRatio?: number;
  width?: number;
  backgroundColor?: string;
}

export const FIXED_CARD_EXPORT_WIDTH = 540;
export const FIXED_CARD_EXPORT_PIXEL_RATIO = 2;
export const DEFAULT_CARD_JPEG_QUALITY = 0.95;

async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.allSettled([
      document.fonts.load("400 16px 'Hind Siliguri'"),
      document.fonts.load("600 16px 'Hind Siliguri'"),
      document.fonts.load("700 24px 'Hind Siliguri'"),
      document.fonts.load("500 16px 'Plus Jakarta Sans'"),
      document.fonts.load("800 44px 'Plus Jakarta Sans'"),
      document.fonts.load("500 14px 'JetBrains Mono'"),
    ]);
    await document.fonts.ready;
  } catch {
    // Ignore font loading errors
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (imgs.length === 0) return;

  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            if (typeof img.decode === 'function') {
              img.decode().then(() => resolve()).catch(() => resolve());
            } else {
              resolve();
            }
          };

          if (img.complete) {
            finish();
            return;
          }

          const timer = setTimeout(resolve, 3000);
          img.addEventListener(
            'load',
            () => {
              clearTimeout(timer);
              finish();
            },
            { once: true }
          );
          img.addEventListener(
            'error',
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
        })
    )
  );
}

/**
 * Exports an HTML card DOM element to a high-resolution, device-independent JPEG image.
 * Always renders at a fixed layout width and fixed pixelRatio regardless of screen
 * resolution, viewport width, browser zoom, or window.devicePixelRatio.
 */
export async function exportCardElementToJpeg(
  element: HTMLElement,
  options?: CardExportOptions
): Promise<CardExportResult> {
  const quality = options?.quality ?? DEFAULT_CARD_JPEG_QUALITY;
  const pixelRatio = options?.pixelRatio ?? FIXED_CARD_EXPORT_PIXEL_RATIO;
  const width = options?.width ?? FIXED_CARD_EXPORT_WIDTH;
  const backgroundColor = options?.backgroundColor ?? '#ffffff';

  await Promise.all([waitForFonts(), waitForImages(element)]);

  let targetNode: HTMLElement = element;
  let stagingHost: HTMLDivElement | null = null;

  try {
    // If the passed element's layout width differs from the fixed export width
    // (e.g., a responsive on-screen node on mobile), clone it into an off-screen
    // fixed-width container so it reflows cleanly at the exact target width.
    if (Math.abs(element.offsetWidth - width) > 2) {
      stagingHost = document.createElement('div');
      stagingHost.setAttribute('aria-hidden', 'true');
      stagingHost.style.position = 'fixed';
      stagingHost.style.left = '-10000px';
      stagingHost.style.top = '0';
      stagingHost.style.width = `${width}px`;
      stagingHost.style.pointerEvents = 'none';
      stagingHost.style.margin = '0';
      stagingHost.style.padding = '0';
      stagingHost.style.zIndex = '-1';

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = `${width}px`;
      clone.style.maxWidth = 'none';
      clone.style.minWidth = `${width}px`;
      clone.style.height = 'auto';
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.boxSizing = 'border-box';

      stagingHost.appendChild(clone);
      document.body.appendChild(stagingHost);
      await waitForImages(clone);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      targetNode = clone;
    }

    const height = Math.max(targetNode.offsetHeight, targetNode.scrollHeight);

    const exportConfig = {
      quality,
      pixelRatio,
      width,
      height,
      backgroundColor,
      cacheBust: true,
      style: {
        position: 'relative',
        left: 'auto',
        top: 'auto',
        margin: '0',
        marginTop: '0',
        marginRight: '0',
        marginBottom: '0',
        marginLeft: '0',
        transform: 'none',
        boxSizing: 'border-box',
        boxShadow: 'none',
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: 'none',
      },
    };

    // Pre-prime WebKit foreignObject font cache
    try {
      await toJpeg(targetNode, {
        ...exportConfig,
        quality: 0.7,
        pixelRatio: 1,
      });
    } catch {
      // Ignore pre-prime attempt
    }

    // Generate crisp fixed-resolution JPEG snapshot
    const dataUrl = await toJpeg(targetNode, exportConfig);

    // Convert to Blob for download and Web Share API
    let blob: Blob | null = null;
    try {
      const res = await fetch(dataUrl);
      blob = await res.blob();
    } catch {
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
  } finally {
    if (stagingHost && stagingHost.parentNode) {
      stagingHost.parentNode.removeChild(stagingHost);
    }
  }
}
