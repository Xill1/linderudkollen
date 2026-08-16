/**
 * Konverter PDF til transparent PNG via PDF.js i nettleseren (puppeteer)
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createServer } from 'http';
import { createCanvas } from 'canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = 'C:\\Users\\Bruker\\Downloads\\Макет печатки Лого (2).pdf';
const OUT_PATH = join(__dirname, 'frontend', 'public', 'logo.png');
const CHROME   = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Les PDF som base64
const pdfBase64 = readFileSync(PDF_PATH).toString('base64');
console.log(`PDF størrelse: ${Math.round(pdfBase64.length / 1024)}KB (base64)`);

// HTML-side som renderer PDF til canvas via PDF.js CDN
const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>body{margin:0;background:#fff;} canvas{display:block;}</style>
</head>
<body>
<canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const data = atob('${pdfBase64}');
const bytes = new Uint8Array(data.length);
for (let i=0; i<data.length; i++) bytes[i] = data.charCodeAt(i);

pdfjsLib.getDocument({data: bytes}).promise.then(async doc => {
  const page = await doc.getPage(1);
  const scale = 3;
  const vp = page.getViewport({ scale });
  const canvas = document.getElementById('c');
  canvas.width = vp.width;
  canvas.height = vp.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  window.__DONE__ = true;
  window.__W__ = canvas.width;
  window.__H__ = canvas.height;
  document.title = 'DONE';
}).catch(e => { window.__ERR__ = e.message; document.title = 'ERROR:' + e.message; });
</script>
</body>
</html>`;

// Skriv HTML til tmp
const tmpDir  = join(__dirname, 'tmp-logo');
mkdirSync(tmpDir, { recursive: true });
const htmlPath = join(tmpDir, 'render.html');
writeFileSync(htmlPath, html);

// Start enkel HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
await new Promise(r => server.listen(7788, r));
console.log('Lokal server på port 7788');

// Start puppeteer
const puppeteerUrl = pathToFileURL(
  join(__dirname, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')
).href;
const { default: puppeteer } = await import(puppeteerUrl);

console.log('Starter Chrome...');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

// Vent på nettverkstilgang (CDN)
await page.goto('http://localhost:7788/', { waitUntil: 'networkidle0', timeout: 60000 });

// Vent til PDF er rendret
console.log('Venter på PDF-rendering...');
await page.waitForFunction(() => window.__DONE__ === true || window.__ERR__, { timeout: 30000 });

const result = await page.evaluate(() => ({
  done: window.__DONE__,
  err: window.__ERR__,
  w: window.__W__,
  h: window.__H__,
  title: document.title,
}));
console.log('Render resultat:', result);

if (result.err) throw new Error('PDF.js feil: ' + result.err);

// Ta screenshot av hele canvas-elementet
const canvasEl = await page.$('#c');
const screenshotBuf = await canvasEl.screenshot({ type: 'png' });
await browser.close();
server.close();

console.log(`Screenshot tatt: ${Math.round(screenshotBuf.length/1024)}KB`);
writeFileSync(join(__dirname, 'frontend', 'public', 'logo-raw.png'), screenshotBuf);

// Fjern hvit bakgrunn med canvas
const img = createCanvas(result.w, result.h);
const ctx2 = img.getContext('2d');

// Bruk sharp-alternativ: behandle screenshotBuf direkte
const Jimp = null; // ikke tilgjengelig

// Last inn via createCanvas + raw PNG bytes
// Workaround: skriv til fil, les tilbake
const tmpPng = join(tmpDir, 'raw.png');
writeFileSync(tmpPng, screenshotBuf);

const { loadImage } = await import('canvas');
const loadedImg = await loadImage(tmpPng);
const canvas2 = createCanvas(loadedImg.width, loadedImg.height);
const ctx3 = canvas2.getContext('2d');
ctx3.drawImage(loadedImg, 0, 0);

const imgData = ctx3.getImageData(0, 0, canvas2.width, canvas2.height);
const d = imgData.data;
let opaqueCount = 0;

for (let i = 0; i < d.length; i += 4) {
  const r = d[i], g = d[i+1], b = d[i+2];
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  if (brightness > 252) {
    d[i+3] = 0;
  } else if (brightness > 235) {
    d[i+3] = Math.round(((252 - brightness) / 17) * 255);
  } else {
    opaqueCount++;
  }
}

console.log(`Opake piksler: ${opaqueCount} av ${d.length/4} (${Math.round(opaqueCount/(d.length/4)*100)}%)`);

ctx3.putImageData(imgData, 0, 0);
const buf = canvas2.toBuffer('image/png');
writeFileSync(OUT_PATH, buf);
console.log(`✓ Logo lagret: ${OUT_PATH} (${Math.round(buf.length/1024)}KB)`);
