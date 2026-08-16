/**
 * Konverterer logo PDF til transparent PNG
 * Kjøres én gang: node convert-logo.js
 */
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const PDF_PATH = 'C:\\Users\\Bruker\\Downloads\\Макет печатки Лого.pdf';
const OUT_PATH = path.join(__dirname, 'frontend', 'public', 'logo.png');

async function main() {
  // Install required packages
  console.log('Installerer avhengigheter...');
  try {
    execSync('npm install canvas pdfjs-dist --no-save', {
      cwd: __dirname,
      stdio: 'inherit'
    });
  } catch (e) {
    console.log('npm install feilet, prøver neste fremgangsmåte...');
  }

  try {
    const { createCanvas } = require('canvas');
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    console.log('Leser PDF...');
    const data = new Uint8Array(fs.readFileSync(PDF_PATH));
    const doc  = await pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
    const page = await doc.getPage(1);

    const scale    = 3; // høy oppløsning
    const viewport = page.getViewport({ scale });
    const canvas   = createCanvas(viewport.width, viewport.height);
    const ctx      = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Fjern hvit bakgrunn
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      // Gjør lyse piksler transparente
      const brightness = (r + g + b) / 3;
      if (brightness > 240) {
        d[i+3] = 0;
      } else if (brightness > 200) {
        d[i+3] = Math.round(((240 - brightness) / 40) * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(OUT_PATH, buf);
    console.log(`✓ Logo lagret: ${OUT_PATH} (${Math.round(buf.length/1024)}KB)`);
  } catch (err) {
    console.error('canvas/pdfjs feilet:', err.message);
    console.log('Prøver alternativ metode (ren kopi)...');

    // Fallback: kopier PDF og bruk CSS blend mode
    const pdfOut = path.join(__dirname, 'frontend', 'public', 'logo.pdf');
    fs.copyFileSync(PDF_PATH, pdfOut);
    console.log('PDF kopiert til public/ — bruker CSS mix-blend-mode som fallback');
    fs.writeFileSync(OUT_PATH.replace('logo.png','logo-fallback.txt'),
      'Konvertering feilet. Bruk CSS: img { mix-blend-mode: multiply; }\n');
  }
}

main().catch(console.error);
