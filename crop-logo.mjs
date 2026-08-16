/**
 * Beskjær logo.png tett rundt innholdet (fjern usynlig kantluft)
 */
import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC  = join(__dirname, 'frontend', 'public', 'logo.png');
const DEST = join(__dirname, 'frontend', 'public', 'logo.png');
const DEST_RAW = join(__dirname, 'frontend', 'public', 'logo-raw.png');

const { loadImage } = await import('canvas');
const img = await loadImage(SRC);

const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);

const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

// Finn bounding box av alt som ikke er fullt transparent
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const alpha = data[(y * width + x) * 4 + 3];
    if (alpha > 10) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

// Legg til litt padding (2%)
const pad = Math.round(width * 0.02);
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

console.log(`Original: ${width}x${height}`);
console.log(`Innhold:  ${minX},${minY} → ${maxX},${maxY}`);
console.log(`Etter beskjæring: ${cropW}x${cropH}`);

// Tegn beskjært versjon
const out = createCanvas(cropW, cropH);
const octx = out.getContext('2d');
octx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

const buf = out.toBuffer('image/png');
writeFileSync(DEST, buf);
console.log(`✓ Lagret: ${DEST} (${Math.round(buf.length / 1024)}KB)`);
