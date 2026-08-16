/**
 * Konverterer logo PDF til transparent PNG (ESM versjon)
 * node convert-logo2.mjs
 */
import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PDF_PATH = 'C:\\Users\\Bruker\\Downloads\\Макет печатки Лого.pdf';
const OUT_PATH = join(__dirname, 'frontend', 'public', 'logo.png');

// Dynamic import for ESM pdfjs
const pdfjsLib = await import('./node_modules/pdfjs-dist/legacy/build/pdf.mjs');

console.log('Leser PDF...');
const data = new Uint8Array(readFileSync(PDF_PATH));
const loadingTask = pdfjsLib.getDocument({
  data,
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
  verbosity: 0,
});

const doc  = await loadingTask.promise;
const page = await doc.getPage(1);

const scale    = 4; // høy oppløsning for skarp logo
const viewport = page.getViewport({ scale });
const canvas   = createCanvas(viewport.width, viewport.height);
const ctx      = canvas.getContext('2d');

// Hvit bakgrunn før rendering
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

await page.render({
  canvasContext: ctx,
  viewport,
}).promise;

console.log(`Canvas størrelse: ${canvas.width}x${canvas.height}`);

// Fjern hvit bakgrunn — gjør lyse piksler transparente
const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const d = imgData.data;
for (let i = 0; i < d.length; i += 4) {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  if (brightness > 245) {
    d[i + 3] = 0;  // fullt transparent
  } else if (brightness > 220) {
    // Gradvis fade
    d[i + 3] = Math.round(((245 - brightness) / 25) * 255);
  }
}
ctx.putImageData(imgData, 0, 0);

const buf = canvas.toBuffer('image/png');
writeFileSync(OUT_PATH, buf);
console.log(`✓ Logo lagret: ${OUT_PATH} (${Math.round(buf.length / 1024)}KB)`);
