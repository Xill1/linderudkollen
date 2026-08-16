/**
 * Konverter PDF til transparent PNG via Chrome (puppeteer-core)
 * node logo-from-chrome.mjs
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Reinstaller canvas + sørg for puppeteer-core er der
console.log('Installerer avhengigheter...');
execSync('npm install canvas puppeteer-core --no-save --legacy-peer-deps', {
  cwd: __dirname,
  stdio: 'inherit'
});

const puppeteerPath = pathToFileURL(
  join(__dirname, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')
).href;
const { default: puppeteer } = await import(puppeteerPath);
const { createCanvas, loadImage } = await import('canvas');

const PDF_PATH = 'C:\\Users\\Bruker\\Downloads\\Макет печатки Лого (2).pdf';
const OUT_PATH = join(__dirname, 'frontend', 'public', 'logo.png');
const CHROME   = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Starter Chrome...');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
});

const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1100, deviceScaleFactor: 2 });

const pdfUrl = 'file:///' + PDF_PATH.replace(/\\/g, '/');
console.log('Åpner:', pdfUrl);

await page.goto(pdfUrl, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

// Finn PDF-visningsområdet og ta et presist screenshot
const screenshotBuf = await page.screenshot({ type: 'png', fullPage: true });
await browser.close();
console.log('Screenshot tatt:', screenshotBuf.length, 'bytes');

// Lagre raw
writeFileSync(join(__dirname, 'frontend', 'public', 'logo-raw.png'), screenshotBuf);

// Last inn og fjern hvit bakgrunn
const img = await loadImage(screenshotBuf);
const canvas = createCanvas(img.width, img.height);
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);

// Sjekk midtpunktet
const mid = ctx.getImageData(Math.floor(img.width/2), Math.floor(img.height/2), 1, 1).data;
console.log('Midtpiksel:', Array.from(mid));

const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const d = imgData.data;

let opaque = 0;
for (let i = 0; i < d.length; i += 4) {
  const r = d[i], g = d[i+1], b = d[i+2];
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  if (brightness > 252) {
    d[i+3] = 0;
  } else if (brightness > 235) {
    d[i+3] = Math.round(((252 - brightness) / 17) * 255);
  } else {
    opaque++;
  }
}
console.log('Opake piksler etter behandling:', opaque);

ctx.putImageData(imgData, 0, 0);
const buf = canvas.toBuffer('image/png');
writeFileSync(OUT_PATH, buf);
console.log(`✓ Logo lagret: ${OUT_PATH} (${Math.round(buf.length/1024)}KB)`);
