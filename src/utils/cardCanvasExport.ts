import { VocabWord } from '../data/types';

export type CardTheme = 'emerald' | 'midnight' | 'sunset' | 'indigo' | 'botanical';

interface ThemePalette {
  bgGradient: [string, string, string];
  borderColor: string;
  wordColor: string;
  pronunColor: string;
  meaningBg: string;
  meaningBorder: string;
  meaningText: string;
  labelColor: string;
  exampleBg: string;
  exampleBorder: string;
  exampleEnColor: string;
  exampleBnColor: string;
  tagBg: string;
  tagBorder: string;
  tagText: string;
  leafColor: string;
  footerTextColor: string;
  footerBrandColor: string;
  dividerColor: string;
}

const PALETTES: Record<CardTheme, ThemePalette> = {
  emerald: {
    bgGradient: ['#ffffff', '#f0fdf4', '#dcfce7'],
    borderColor: '#a7f3d0',
    wordColor: '#064e3b',
    pronunColor: '#047857',
    meaningBg: '#ffffff',
    meaningBorder: '#6ee7b7',
    meaningText: '#065f46',
    labelColor: '#047857',
    exampleBg: 'rgba(6, 78, 59, 0.04)',
    exampleBorder: 'rgba(6, 78, 59, 0.10)',
    exampleEnColor: '#1e293b',
    exampleBnColor: '#334155',
    tagBg: '#ecfdf5',
    tagBorder: '#a7f3d0',
    tagText: '#047857',
    leafColor: 'rgba(5, 150, 105, 0.16)',
    footerTextColor: '#475569',
    footerBrandColor: '#059669',
    dividerColor: 'rgba(0, 0, 0, 0.08)',
  },
  botanical: {
    bgGradient: ['#f8faf8', '#edf7f2', '#daf1e2'],
    borderColor: '#86efac',
    wordColor: '#064e3b',
    pronunColor: '#047857',
    meaningBg: '#ffffff',
    meaningBorder: '#a7f3d0',
    meaningText: '#064e3b',
    labelColor: '#047857',
    exampleBg: 'rgba(4, 120, 87, 0.04)',
    exampleBorder: 'rgba(4, 120, 87, 0.10)',
    exampleEnColor: '#1e293b',
    exampleBnColor: '#334155',
    tagBg: '#ddf5e6',
    tagBorder: '#86efac',
    tagText: '#065f46',
    leafColor: 'rgba(4, 120, 87, 0.18)',
    footerTextColor: '#475569',
    footerBrandColor: '#047857',
    dividerColor: 'rgba(0, 0, 0, 0.08)',
  },
  midnight: {
    bgGradient: ['#030e09', '#062016', '#02120c'],
    borderColor: '#065f46',
    wordColor: '#ffffff',
    pronunColor: '#6ee7b7',
    meaningBg: 'rgba(6, 78, 59, 0.45)',
    meaningBorder: '#059669',
    meaningText: '#6ee7b7',
    labelColor: '#34d399',
    exampleBg: 'rgba(255, 255, 255, 0.04)',
    exampleBorder: 'rgba(255, 255, 255, 0.10)',
    exampleEnColor: '#f1f5f9',
    exampleBnColor: '#cbd5e1',
    tagBg: 'rgba(6, 78, 59, 0.6)',
    tagBorder: '#047857',
    tagText: '#a7f3d0',
    leafColor: 'rgba(52, 211, 153, 0.18)',
    footerTextColor: '#94a3b8',
    footerBrandColor: '#34d399',
    dividerColor: 'rgba(255, 255, 255, 0.10)',
  },
  sunset: {
    bgGradient: ['#fffdfa', '#fef3c7', '#fed7aa'],
    borderColor: '#fcd34d',
    wordColor: '#78350f',
    pronunColor: '#92400e',
    meaningBg: '#ffffff',
    meaningBorder: '#fde68a',
    meaningText: '#92400e',
    labelColor: '#b45309',
    exampleBg: 'rgba(180, 83, 9, 0.04)',
    exampleBorder: 'rgba(180, 83, 9, 0.10)',
    exampleEnColor: '#292524',
    exampleBnColor: '#44403c',
    tagBg: '#fef3c7',
    tagBorder: '#fcd34d',
    tagText: '#92400e',
    leafColor: 'rgba(217, 119, 6, 0.16)',
    footerTextColor: '#57534e',
    footerBrandColor: '#b45309',
    dividerColor: 'rgba(0, 0, 0, 0.08)',
  },
  indigo: {
    bgGradient: ['#050d18', '#0a1d2e', '#071818'],
    borderColor: '#0d9488',
    wordColor: '#ffffff',
    pronunColor: '#5eead4',
    meaningBg: 'rgba(13, 148, 136, 0.35)',
    meaningBorder: '#14b8a6',
    meaningText: '#5eead4',
    labelColor: '#2dd4bf',
    exampleBg: 'rgba(255, 255, 255, 0.04)',
    exampleBorder: 'rgba(255, 255, 255, 0.10)',
    exampleEnColor: '#f1f5f9',
    exampleBnColor: '#cbd5e1',
    tagBg: 'rgba(13, 148, 136, 0.4)',
    tagBorder: '#0d9488',
    tagText: '#99f6e4',
    leafColor: 'rgba(20, 184, 166, 0.18)',
    footerTextColor: '#94a3b8',
    footerBrandColor: '#2dd4bf',
    dividerColor: 'rgba(255, 255, 255, 0.10)',
  },
};

/**
 * Wraps text into lines that fit within maxWidth
 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws a rounded rectangle helper
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill = true,
  stroke = true
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Draws elegant botanical leaves in corner
 */
function drawCornerLeaves(
  ctx: CanvasRenderingContext2D,
  corner: 'top-right' | 'bottom-left',
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  if (corner === 'top-right') {
    ctx.translate(w - 20, 20);
    // Main Vine
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-50, 40, -100, 110);
    ctx.stroke();

    // Leaflets
    const leaflets = [
      { x: -15, y: 15, rx: 12, ry: 7, angle: -0.4 },
      { x: -35, y: 32, rx: 14, ry: 8, angle: 0.6 },
      { x: -55, y: 52, rx: 13, ry: 8, angle: -0.5 },
      { x: -75, y: 78, rx: 12, ry: 7, angle: 0.5 },
      { x: -95, y: 105, rx: 11, ry: 6, angle: -0.3 },
    ];
    for (const l of leaflets) {
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, l.rx, l.ry, l.angle, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.translate(20, h - 20);
    // Main Fern Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(45, -45, 105, -100);
    ctx.stroke();

    // Leaflets
    const leaflets = [
      { x: 18, y: -18, rx: 13, ry: 7, angle: -0.6 },
      { x: 38, y: -38, rx: 14, ry: 8, angle: 0.4 },
      { x: 58, y: -58, rx: 13, ry: 7, angle: -0.5 },
      { x: 78, y: -78, rx: 12, ry: 7, angle: 0.5 },
      { x: 98, y: -96, rx: 10, ry: 6, angle: -0.3 },
    ];
    for (const l of leaflets) {
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, l.rx, l.ry, l.angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Generates a high-resolution, pixel-perfect JPEG image of the card using HTML5 Canvas
 */
export async function generateCardJpeg(
  word: VocabWord,
  theme: CardTheme = 'emerald'
): Promise<string> {
  // Ensure all Google Fonts are loaded into document before canvas rendering
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load("400 14px 'Hind Siliguri'"),
        document.fonts.load("500 14px 'Hind Siliguri'"),
        document.fonts.load("bold 23px 'Hind Siliguri'"),
        document.fonts.load("italic 500 15px 'Plus Jakarta Sans'"),
        document.fonts.load("bold 16px 'Plus Jakarta Sans'"),
        document.fonts.load("900 42px 'Plus Jakarta Sans'"),
        document.fonts.load("500 15px 'JetBrains Mono'"),
      ]);
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  const p = PALETTES[theme] || PALETTES.emerald;
  const canvasW = 620;
  const scale = 2; // Retina 2x scale for 1240px width output

  // Setup test canvas for measuring wrapped lines accurately
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d')!;
  testCtx.direction = 'ltr';

  // Use maxWidth 420 for comfortable padding inside the 548px example box (prevents overflow on mobile)
  testCtx.font = "italic 500 15px 'Plus Jakarta Sans', sans-serif";
  const enLines = word.examples[0]
    ? wrapLines(testCtx, `"${word.examples[0].english}"`, 420)
    : [];

  testCtx.font = "500 14px 'Hind Siliguri', sans-serif";
  const bnLines = word.examples[0]?.bangla
    ? wrapLines(testCtx, word.examples[0].bangla, 420)
    : [];

  // 1. Measure middle content components exactly
  const wordBlockH = 44 + 8 + 18; // Word (44px) + Gap (8px) + Pronunciation (18px) = 70px
  const meaningBoxH = 78;
  const exampleBoxH = word.examples[0]
    ? Math.max(68, (enLines.length * 22) + (bnLines.length > 0 ? (bnLines.length * 22) + 8 : 0) + 24)
    : 0;
  const synonymsH = word.synonyms.length > 0 ? 28 : 0;

  // Internal comfortable gaps between middle items
  const gapWordToMeaning = 20;
  const gapMeaningToExample = word.examples[0] ? 18 : 0;
  const gapExampleToSynonyms = word.synonyms.length > 0 ? 18 : 0;

  const totalMiddleH =
    wordBlockH +
    gapWordToMeaning +
    meaningBoxH +
    gapMeaningToExample +
    exampleBoxH +
    gapExampleToSynonyms +
    synonymsH;

  // 2. Header and Footer fixed dimensions
  const headerY = 40;
  const headerH = 42;
  const headerDividerY = headerY + headerH + 14; // Y = 96
  const footerAreaH = 64; // Distance from footer divider to canvas bottom

  // 3. Calculate ideal canvas height: give balanced ~36px top & bottom margin around middle content
  const idealMiddleAreaH = totalMiddleH + 72; // 36px top + 36px bottom
  const targetCanvasH = headerDividerY + idealMiddleAreaH + footerAreaH;
  // Ensure a well-proportioned card ratio (minimum 580px)
  const canvasH = Math.max(580, Math.round(targetCanvasH));

  // Footer divider line position
  const footerDividerY = canvasH - footerAreaH;

  // Available vertical space strictly between header divider and footer divider
  const availableMiddleH = footerDividerY - headerDividerY;

  // MATHEMATICAL VERTICAL CENTERING:
  // middleOffsetY ensures exact equal space between (headerDivider -> word) and (synonyms -> footerDivider)
  const middleOffsetY = Math.round((availableMiddleH - totalMiddleH) / 2);

  // Setup High-DPI Canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasW * scale;
  canvas.height = canvasH * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // 1. Draw Card Background (Fill full canvas)
  const gradient = ctx.createLinearGradient(0, 0, canvasW, canvasH);
  gradient.addColorStop(0, p.bgGradient[0]);
  gradient.addColorStop(0.5, p.bgGradient[1]);
  gradient.addColorStop(1, p.bgGradient[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw smooth inner border
  ctx.strokeStyle = p.borderColor;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 12, 12, canvasW - 24, canvasH - 24, 24, false, true);

  // 2. Draw Subtle Dot Pattern
  ctx.save();
  ctx.fillStyle = p.leafColor;
  for (let x = 32; x < canvasW - 32; x += 22) {
    for (let y = 32; y < canvasH - 32; y += 22) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 3. Draw Corner Botanical Leaves
  drawCornerLeaves(ctx, 'top-right', canvasW, canvasH, p.leafColor);
  drawCornerLeaves(ctx, 'bottom-left', canvasW, canvasH, p.leafColor);

  // 4. Draw Header
  // Header Emblem Logo
  try {
    const emblemImg = new Image();
    emblemImg.crossOrigin = 'anonymous';
    emblemImg.src = '/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png';
    await new Promise((resolve) => {
      emblemImg.onload = resolve;
      emblemImg.onerror = resolve;
    });
    if (emblemImg.complete && emblemImg.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = p.dividerColor;
      ctx.lineWidth = 1;
      drawRoundRect(ctx, 36, headerY, 40, 40, 10, true, true);
      ctx.drawImage(emblemImg, 39, headerY + 3, 34, 34);
      ctx.restore();
    }
  } catch {
    // Ignore emblem failure
  }

  // Header Titles
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = p.wordColor;
  ctx.font = "800 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText('Bonolota Vocabulary', 86, headerY + 18);

  ctx.fillStyle = p.footerTextColor;
  ctx.font = "500 13px 'Hind Siliguri', sans-serif";
  ctx.fillText(`শব্দ ভাণ্ডার · Unit ${word.unitId}`, 86, headerY + 36);
  ctx.restore();

  // Header Part of Speech Badge
  ctx.save();
  ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
  const posText = `🌿 ${word.partOfSpeech.toUpperCase()}`;
  const posWidth = ctx.measureText(posText).width + 24;
  const posHeight = 28;
  const posX = canvasW - 36 - posWidth;
  const posY = headerY + 6;

  ctx.fillStyle = p.tagBg;
  ctx.strokeStyle = p.tagBorder;
  ctx.lineWidth = 1;
  drawRoundRect(ctx, posX, posY, posWidth, posHeight, 14, true, true);

  ctx.fillStyle = p.tagText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(posText, posX + posWidth / 2, posY + 18);
  ctx.restore();

  // Header Divider
  ctx.save();
  ctx.strokeStyle = p.dividerColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, headerDividerY);
  ctx.lineTo(canvasW - 36, headerDividerY);
  ctx.stroke();
  ctx.restore();

  // 5. Middle Body: The Vocabulary Showcase - Mathematically Centered!
  let currentY = headerDividerY + middleOffsetY;

  // Main English Word (Hero)
  ctx.save();
  ctx.direction = 'ltr';
  ctx.fillStyle = p.wordColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Dynamic font sizing for long words
  let wordFontSize = 42;
  ctx.font = `900 ${wordFontSize}px 'Plus Jakarta Sans', sans-serif`;
  let wordW = ctx.measureText(word.word).width;
  while (wordW > canvasW - 80 && wordFontSize > 26) {
    wordFontSize -= 2;
    ctx.font = `900 ${wordFontSize}px 'Plus Jakarta Sans', sans-serif`;
    wordW = ctx.measureText(word.word).width;
  }
  ctx.fillText(word.word, (canvasW - wordW) / 2, currentY);
  ctx.restore();

  currentY += 44 + 8;

  // Phonetic Pronunciation
  ctx.save();
  ctx.direction = 'ltr';
  ctx.fillStyle = p.pronunColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = "500 15px 'JetBrains Mono', monospace";
  const pronunW = ctx.measureText(word.pronunciation).width;
  ctx.fillText(word.pronunciation, (canvasW - pronunW) / 2, currentY);
  ctx.restore();

  currentY += 18 + gapWordToMeaning;

  // Primary Bangla Meaning Card
  const meaningBoxW = canvasW - 72;
  const meaningBoxX = 36;
  ctx.save();
  ctx.fillStyle = p.meaningBg;
  ctx.strokeStyle = p.meaningBorder;
  ctx.lineWidth = 1;
  drawRoundRect(ctx, meaningBoxX, currentY, meaningBoxW, meaningBoxH, 18, true, true);

  // Label: বাংলা অর্থ
  ctx.direction = 'ltr';
  ctx.fillStyle = p.labelColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
  const labelW = ctx.measureText('বাংলা অর্থ').width;
  ctx.fillText('বাংলা অর্থ', (canvasW - labelW) / 2, currentY + 14);

  // Text: Meaning with dynamic scaling
  let meaningFontSize = 23;
  ctx.font = `bold ${meaningFontSize}px 'Hind Siliguri', sans-serif`;
  let meaningW = ctx.measureText(word.banglaMeaning).width;
  while (meaningW > canvasW - 100 && meaningFontSize > 16) {
    meaningFontSize -= 1;
    ctx.font = `bold ${meaningFontSize}px 'Hind Siliguri', sans-serif`;
    meaningW = ctx.measureText(word.banglaMeaning).width;
  }
  ctx.fillStyle = p.meaningText;
  ctx.fillText(word.banglaMeaning, (canvasW - meaningW) / 2, currentY + 36);
  ctx.restore();

  currentY += meaningBoxH + gapMeaningToExample;

  // Example Sentence
  if (word.examples[0]) {
    const exBoxW = canvasW - 72;
    const exBoxX = 36;
    ctx.save();
    ctx.fillStyle = p.exampleBg;
    ctx.strokeStyle = p.exampleBorder;
    ctx.lineWidth = 1;
    drawRoundRect(ctx, exBoxX, currentY, exBoxW, exampleBoxH, 14, true, true);

    ctx.direction = 'ltr';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    let textY = currentY + 16;

    // English Example
    ctx.fillStyle = p.exampleEnColor;
    ctx.font = "italic 500 15px 'Plus Jakarta Sans', sans-serif";
    for (const line of enLines) {
      const lineW = ctx.measureText(line).width;
      const lineX = (canvasW - lineW) / 2;
      ctx.fillText(line, lineX, textY);
      textY += 22;
    }

    // Bengali Example
    if (bnLines.length > 0) {
      textY += 6;
      ctx.fillStyle = p.exampleBnColor;
      ctx.font = "500 14px 'Hind Siliguri', sans-serif";
      for (const line of bnLines) {
        const lineW = ctx.measureText(line).width;
        const lineX = (canvasW - lineW) / 2;
        ctx.fillText(line, lineX, textY);
        textY += 22;
      }
    }
    ctx.restore();
    currentY += exampleBoxH + gapExampleToSynonyms;
  }

  // Synonyms
  if (word.synonyms.length > 0) {
    ctx.save();
    ctx.direction = 'ltr';
    ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
    const synLabel = 'SYNONYMS:';
    const syns = word.synonyms.slice(0, 4);

    // Measure total width to center
    const labelW = ctx.measureText(synLabel).width + 12;
    ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
    const tagWidths = syns.map((s) => ctx.measureText(s).width + 20);
    const totalW = labelW + tagWidths.reduce((a, b) => a + b + 8, 0) - 8;

    let startX = (canvasW - totalW) / 2;

    // Draw Label
    ctx.fillStyle = p.footerTextColor;
    ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(synLabel, startX, currentY + 13);
    startX += labelW;

    // Draw Pills
    ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
    for (let i = 0; i < syns.length; i++) {
      const pillW = tagWidths[i];
      const pillH = 26;
      ctx.fillStyle = p.tagBg;
      ctx.strokeStyle = p.tagBorder;
      ctx.lineWidth = 1;
      drawRoundRect(ctx, startX, currentY, pillW, pillH, 8, true, true);

      ctx.fillStyle = p.tagText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const pillTextW = ctx.measureText(syns[i]).width;
      ctx.fillText(syns[i], startX + (pillW - pillTextW) / 2, currentY + 13);
      startX += pillW + 8;
    }
    ctx.restore();
  }

  // 6. Footer (Pinned to footerDividerY and canvas bottom)
  // Footer Divider Line
  ctx.save();
  ctx.strokeStyle = p.dividerColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, footerDividerY);
  ctx.lineTo(canvasW - 36, footerDividerY);
  ctx.stroke();
  ctx.restore();

  const footerTextY = footerDividerY + 28;

  // Footer Left: bonolota.online
  ctx.save();
  ctx.direction = 'ltr';
  ctx.fillStyle = p.footerBrandColor;
  ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('bonolota.online', 36, footerTextY);

  // Footer Right: Made with ❤️ by Chanchal
  ctx.fillStyle = p.footerTextColor;
  ctx.font = "bold 13px 'Hind Siliguri', sans-serif";
  const rightText = 'Made with ❤️ by Chanchal';
  const rightW = ctx.measureText(rightText).width;
  ctx.textAlign = 'left';
  ctx.fillText(rightText, canvasW - 36 - rightW, footerTextY);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}
