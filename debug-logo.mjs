/**
 * Debug: render PDF uten bakgrunnsfjernelse for å se hva som er der
 */
import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = 'C:\\Users\\Bruker\\Downloads\\Макет печатки Лого.pdf';
const OUT_RAW  = join(__dirname, 'frontend', 'public', 'logo-raw.png');
const OUT_TRANSP = join(__dirname, 'frontend', 'public', 'logo.png');

const pdfjsLib = await import('./node_modules/pdfjs-dist/legacy/build/pdf.mjs');

const data = new Uint8Array(readFileSync(PDF_PATH));
const doc  = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true, verbosity: 0 }).promise;

console.log(`PDF har ${doc.numPages} side(r)`);
const page = await doc.getPage(1);
const vp   = page.getViewport({ scale: 1 });
console.log(`Side 1 dimensjon: ${vp.width}x${vp.height}`);

const scale  = 4;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx    = canvas.getContext('2d');

// Hvit bakgrunn
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

await page.render({ canvasContext: ctx, viewport }).promise;

// Sjekk hva vi fikk
const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const d = imgData.data;

let stats = { white: 0, light: 0, medium: 0, dark: 0 };
let samplePixels = [];

for (let i = 0; i < d.length; i += 4) {
  const brightness = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114);
  if (brightness > 250) stats.white++;
  else if (brightness > 200) stats.light++;
  else if (brightness > 128) stats.medium++;
  else stats.dark++;
}

const total = d.length / 4;
console.log('Piksel-fordeling (av', total, 'totalt):');
console.log('  Hvit (>250):', stats.white, '=', Math.round(stats.white/total*100)+'%');
console.log('  Lys (200-250):', stats.light, '=', Math.round(stats.light/total*100)+'%');
console.log('  Middels (128-200):', stats.medium, '=', Math.round(stats.medium/total*100)+'%');
console.log('  Mørk (<128):', stats.dark, '=', Math.round(stats.dark/total*100)+'%');

// Lagre RAW (hvit bakgrunn, ingen redigering)
writeFileSync(OUT_RAW, canvas.toBuffer('image/png'));
console.log('RAW lagret:', OUT_RAW);

// Nå lag transparent versjon med lavere terskel
const imgData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
const d2 = imgData2.data;

for (let i = 0; i < d2.length; i += 4) {
  const r = d2[i], g = d2[i+1], b = d2[i+2];
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  if (brightness > 250) {
    d2[i+3] = 0;      // Helt hvit → transparent
  } else if (brightness > 230) {
    d2[i+3] = Math.round(((250 - brightness) / 20) * 255);
  }
  // Alt annet forblir synlig
}

ctx.putImageData(imgData2, 0, 0);
const buf2 = canvas.toBuffer('image/png');
writeFileSync(OUT_TRANSP, buf2);
console.log('Transparent versjon lagret:', OUT_TRANSP, `(${Math.round(buf2.length/1024)}KB)`);
