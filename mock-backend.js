/**
 * Enkel Node.js mock-backend for lokal utvikling.
 * Kjøres med: node mock-backend.js
 * Lytter på port 8001, matcher REACT_APP_BACKEND_URL=http://localhost:8001
 *
 * Admin-innlogging: brukernavn=admin, passord=admin
 * Data lagres kun i minnet — slettes ved restart.
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 8001;
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const TOKEN_SECRET = 'dev-mock-secret-not-for-production';

// ── In-memory state ──
let galleryItems = [];
let siteImages = {}; // slotId -> { content_type }
const DEFINED_SLOTS = [
  'hero_bakgrunn', 'om_oss_bilde',
  'arrangement_hero', 'arrangement_tilbyr',
  'arrangement_galleri_1', 'arrangement_galleri_2',
  'arrangement_galleri_3', 'arrangement_galleri_4',
];
let menuItems = [
  { id: 'ex-1',  category: 'Bakst',    name: 'Surdeigbrød, påsmurt',     description: 'Hjemmelaget surdeig med smør og pålegg',    price: 79,   is_available: true, sort_order: 1 },
  { id: 'ex-2',  category: 'Bakst',    name: 'Surdeigbrød, ta med hjem', description: 'Helt brød til å ta med',                   price: 89,   is_available: true, sort_order: 2 },
  { id: 'ex-3',  category: 'Bakst',    name: 'Kanelsnurr',               description: 'Klassisk nybakt kanelsnurr',               price: 49,   is_available: true, sort_order: 3 },
  { id: 'ex-4',  category: 'Bakst',    name: 'Vaffel m/ syltetøy',       description: 'Norsk vaffel med syltetøy og rømme',       price: 59,   is_available: true, sort_order: 4 },
  { id: 'ex-5',  category: 'Varm mat', name: 'Dagens kraftsuppe',        description: 'Varm, næringsrik suppe laget fra bunnen',  price: 119,  is_available: true, sort_order: 1 },
  { id: 'ex-6',  category: 'Drikke',   name: 'Kaffe',                    description: 'Nybrygget filterkaffe',                    price: 39,   is_available: true, sort_order: 1 },
  { id: 'ex-7',  category: 'Drikke',   name: 'Kakao',                    description: 'Varm kakao med krem',                      price: 49,   is_available: true, sort_order: 2 },
  { id: 'ex-8',  category: 'Drikke',   name: 'Te',                       description: 'Utvalg av te-sorter',                      price: 39,   is_available: true, sort_order: 3 },
  { id: 'ex-9',  category: 'Drikke',   name: 'Fruktsmoothie',            description: 'Frisk smoothie med sesongens frukter',     price: 69,   is_available: true, sort_order: 4 },
  { id: 'ex-10', category: 'Spesielt', name: 'Glutenfritt alternativ',   description: 'Spør oss om dagens glutenfrie tilbud',     price: null, is_available: true, sort_order: 1 },
];
let menuCategories = [
  { id: 'cat-1', name: 'Bakst',    sort_order: 1, is_deleted: false },
  { id: 'cat-2', name: 'Varm mat', sort_order: 2, is_deleted: false },
  { id: 'cat-3', name: 'Drikke',   sort_order: 3, is_deleted: false },
  { id: 'cat-4', name: 'Spesielt', sort_order: 4, is_deleted: false },
];
let blogPosts = [
  { id: 'b-1', title: 'Sommeråpent fra juni', body: 'Vi har nå sommeråpent med utvidede tider hele uka.', image_url: null, is_published: true, category: 'Nyheter',   created_at: '2026-06-20T10:00:00Z', updated_at: '2026-06-20T10:00:00Z' },
  { id: 'b-2', title: 'Nye bilder fra stua',   body: 'Se de nyeste bildene fra vår nyoppgraderte sportsstue.',  image_url: null, is_published: true, category: 'Galleri',    created_at: '2026-06-15T10:00:00Z', updated_at: '2026-06-15T10:00:00Z' },
  { id: 'b-3', title: 'Møt Martina og Fritz',  body: 'Bli bedre kjent med oss som driver Linderudkollen.',      image_url: null, is_published: true, category: 'Om oss',     created_at: '2026-06-10T10:00:00Z', updated_at: '2026-06-10T10:00:00Z' },
  { id: 'b-4', title: 'Nytt samarbeid med Skiforeningen', body: 'Vi samarbeider nå med Skiforeningen om vinterarrangementer.', image_url: null, is_published: true, category: 'Samarbeid', created_at: '2026-06-05T10:00:00Z', updated_at: '2026-06-05T10:00:00Z' },
  { id: 'b-5', title: 'Påskeåpent', body: 'Vi holder åpent gjennom hele påsken med ekstra bakst.', image_url: null, is_published: true, category: 'Nyheter', created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-01T10:00:00Z' },
];
let users = [
  { id: '1', username: ADMIN_USERNAME, name: 'Admin', role: 'admin', created_at: new Date().toISOString() },
];
let siteTextStore = {};
let activityLog = [];
function logActivity(action, target = '') {
  activityLog.unshift({ id: crypto.randomUUID(), username: ADMIN_USERNAME, name: 'Admin', action, target, created_at: new Date().toISOString() });
}
const SLIDE_FALLBACKS = [
  'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=70',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=70',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&q=70',
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200&q=70',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=70',
];
let arrangementSlides = [];
let openingHours = {
  id: 'current',
  period: '16.02.2026 — 21.06.2026',
  schedule: [
    { day: 'Mandag',  hours: 'Stengt',         closed: true  },
    { day: 'Tirsdag', hours: '10:00 — 20:00',  closed: false },
    { day: 'Onsdag',  hours: '10:00 — 20:00',  closed: false },
    { day: 'Torsdag', hours: '10:00 — 20:00',  closed: false },
    { day: 'Fredag',  hours: '10:00 — 20:00',  closed: false },
    { day: 'Lørdag',  hours: '10:00 — 16:00',  closed: false },
    { day: 'Søndag',  hours: '10:00 — 16:00',  closed: false },
  ],
  notices: [
    'For oppdaterte åpningstider, sjekk vår Facebook-side',
    'Kveldsåpent tirsdag til fredag med utvidede tider',
    'Helårsvei med stor parkeringsplass',
  ],
  footer_note: 'Sjekk Facebook for eventuelle endringer i åpningstider',
};

// ── Token helpers (enkel HMAC, ikke JWT) ──
function makeToken(username) {
  const payload = JSON.stringify({ username, exp: Date.now() + 3600000 });
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + sig;
}
function verifyToken(token) {
  try {
    const [b64, sig] = token.split('.');
    const payload = Buffer.from(b64, 'base64').toString();
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

// ── CORS + JSON helpers ──
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
function getToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = req.headers['cookie'] || '';
  const m = cookies.match(/access_token=([^;]+)/);
  return m ? m[1] : null;
}
function requireAuth(req, res) {
  const token = getToken(req);
  if (!token) { json(res, 401, { detail: 'Not authenticated' }); return null; }
  const data = verifyToken(token);
  if (!data) { json(res, 401, { detail: 'Invalid token' }); return null; }
  return data;
}
function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

// ── Router ──
const server = http.createServer(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url.split('?')[0];
  const method = req.method;

  // Auth
  if (method === 'POST' && url === '/api/auth/login') {
    const body = await readBody(req);
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      const token = makeToken(ADMIN_USERNAME);
      res.setHeader('Set-Cookie', `access_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
      return json(res, 200, { id: '1', username: ADMIN_USERNAME, name: 'Admin', role: 'admin', token });
    }
    return json(res, 401, { detail: 'Ugyldig brukernavn eller passord' });
  }

  if (method === 'POST' && url === '/api/auth/logout') {
    res.setHeader('Set-Cookie', 'access_token=; Path=/; Max-Age=0');
    return json(res, 200, { message: 'Logget ut' });
  }

  if (method === 'GET' && url === '/api/auth/me') {
    const auth = requireAuth(req, res); if (!auth) return;
    return json(res, 200, { id: '1', username: ADMIN_USERNAME, name: 'Admin', role: 'admin' });
  }

  // Menu
  if (method === 'GET' && url === '/api/menu') {
    const items = menuItems.filter(i => !i.is_deleted).sort((a, b) => a.sort_order - b.sort_order);
    const categories = {};
    items.forEach(i => { if (!categories[i.category]) categories[i.category] = []; categories[i.category].push(i); });
    return json(res, 200, { items, categories });
  }
  if (method === 'GET' && url === '/api/menu/categories') {
    return json(res, 200, menuCategories.filter(c => !c.is_deleted).sort((a, b) => a.sort_order - b.sort_order));
  }
  if (method === 'POST' && url === '/api/menu') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    const item = { id: crypto.randomUUID(), ...body, is_deleted: false, created_at: new Date().toISOString() };
    menuItems.push(item);
    logActivity('La til meny-vare', item.name);
    return json(res, 200, item);
  }
  if (method === 'PUT' && url.startsWith('/api/menu/reorder')) {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    (body.items || []).forEach(({ id, sort_order }) => { const i = menuItems.find(x => x.id === id); if (i) i.sort_order = sort_order; });
    return json(res, 200, { message: 'Omorganisert' });
  }
  if (method === 'PUT' && url.startsWith('/api/menu/categories/reorder')) {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    (body.items || []).forEach(({ id, sort_order }) => { const c = menuCategories.find(x => x.id === id); if (c) c.sort_order = sort_order; });
    return json(res, 200, { message: 'Omorganisert' });
  }
  if (method === 'POST' && url === '/api/menu/categories') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    const cat = { id: crypto.randomUUID(), ...body, is_deleted: false, created_at: new Date().toISOString() };
    menuCategories.push(cat);
    logActivity('La til kategori', cat.name);
    return json(res, 200, cat);
  }
  const menuCatMatch = url.match(/^\/api\/menu\/categories\/(.+)$/);
  if (menuCatMatch) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = menuCatMatch[1];
    if (method === 'DELETE') { const c = menuCategories.find(x => x.id === id); if (c) c.is_deleted = true; logActivity('Slettet kategori', c?.name || id); return json(res, 200, { message: 'Slettet' }); }
    if (method === 'PUT') { const body = await readBody(req); const c = menuCategories.find(x => x.id === id); if (c) Object.assign(c, body); logActivity('Oppdaterte kategori', c?.name || id); return json(res, 200, { message: 'Oppdatert' }); }
  }
  if (method === 'GET' && url === '/api/menu/export') {
    const auth = requireAuth(req, res); if (!auth) return;
    const payload = { categories: menuCategories.filter(c => !c.is_deleted), items: menuItems.filter(i => !i.is_deleted), exported_at: new Date().toISOString() };
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename=meny-backup.json' });
    return res.end(JSON.stringify(payload));
  }
  if (method === 'POST' && url === '/api/menu/import') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    menuCategories.forEach(c => c.is_deleted = true);
    menuItems.forEach(i => i.is_deleted = true);
    (body.categories || []).forEach((c, idx) => { c.is_deleted = false; c.id = c.id || String(Date.now() + idx); menuCategories.push(c); });
    (body.items || []).forEach((i, idx) => { i.is_deleted = false; i.id = i.id || String(Date.now() + 1000 + idx); menuItems.push(i); });
    return json(res, 200, { message: `Import fullført: ${body.categories?.length || 0} kategorier, ${body.items?.length || 0} varer` });
  }
  const menuItemMatch = url.match(/^\/api\/menu\/([^/]+)$/);
  if (menuItemMatch && !url.includes('categories') && !url.includes('reorder') && !url.includes('export') && !url.includes('import')) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = menuItemMatch[1];
    if (method === 'PUT') { const body = await readBody(req); const i = menuItems.find(x => x.id === id); if (i) Object.assign(i, body); logActivity('Oppdaterte meny-vare', i?.name || id); return json(res, 200, { message: 'Oppdatert' }); }
    if (method === 'DELETE') { const i = menuItems.find(x => x.id === id); if (i) i.is_deleted = true; logActivity('Slettet meny-vare', i?.name || id); return json(res, 200, { message: 'Slettet' }); }
  }

  // Gallery
  if (method === 'GET' && url === '/api/gallery') {
    return json(res, 200, galleryItems.filter(i => !i.is_deleted));
  }
  if (method === 'DELETE' && url.match(/^\/api\/gallery\/(.+)$/)) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = url.split('/').pop();
    const i = galleryItems.find(x => x.id === id); if (i) i.is_deleted = true;
    return json(res, 200, { message: 'Slettet' });
  }

  // Site images
  if (method === 'GET' && url === '/api/site-images') {
    const slots = DEFINED_SLOTS.map(id => ({
      id,
      url: siteImages[id] ? `/api/site-images/${id}/image` : null,
      focus_x: siteImages[id]?.focus_x ?? 50,
      focus_y: siteImages[id]?.focus_y ?? 50,
    }));
    return json(res, 200, { slots });
  }
  const siteImageFocusMatch = url.match(/^\/api\/site-images\/([^/]+)\/focus$/);
  if (method === 'PUT' && siteImageFocusMatch) {
    const auth = requireAuth(req, res); if (!auth) return;
    const slot = siteImageFocusMatch[1];
    if (!DEFINED_SLOTS.includes(slot)) return json(res, 400, { detail: 'Ukjent bildeslot' });
    const body = await readBody(req);
    if (!siteImages[slot]) siteImages[slot] = {};
    siteImages[slot].focus_x = body.focus_x ?? 50;
    siteImages[slot].focus_y = body.focus_y ?? 50;
    return json(res, 200, { message: 'Fokus oppdatert' });
  }
  const siteImageUpload = url.match(/^\/api\/site-images\/([^/]+)\/upload$/);
  if (method === 'POST' && siteImageUpload) {
    const auth = requireAuth(req, res); if (!auth) return;
    const slot = siteImageUpload[1];
    if (!DEFINED_SLOTS.includes(slot)) return json(res, 400, { detail: 'Ukjent bildeslot' });
    req.on('data', () => {});
    req.on('end', () => {
      siteImages[slot] = { content_type: 'image/jpeg' };
      json(res, 200, { message: 'Bilde lastet opp (mock — ikke lagret lokalt)' });
    });
    return;
  }
  const siteImageServe = url.match(/^\/api\/site-images\/([^/]+)\/image$/);
  if (method === 'GET' && siteImageServe) {
    return json(res, 404, { detail: 'Ingen tilpasset bilde (mock)' });
  }
  const siteImageDelete = url.match(/^\/api\/site-images\/([^/]+)$/);
  if (method === 'DELETE' && siteImageDelete) {
    const auth = requireAuth(req, res); if (!auth) return;
    const slot = siteImageDelete[1];
    delete siteImages[slot];
    return json(res, 200, { message: 'Tilbakestilt' });
  }

  // Blog
  if (method === 'GET' && url === '/api/blog') {
    const sorted = [...blogPosts].filter(p => p.is_published).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return json(res, 200, sorted);
  }
  if (method === 'POST' && url === '/api/blog') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    const now = new Date().toISOString();
    const post = { id: crypto.randomUUID(), title: body.title, body: body.body, image_url: null, is_published: !!body.is_published, category: body.category || 'Nyheter', created_at: now, updated_at: now };
    blogPosts.unshift(post);
    logActivity('La til blogginnlegg', post.title);
    return json(res, 200, post);
  }
  const blogItemMatch = url.match(/^\/api\/blog\/([^/]+)$/);
  if (blogItemMatch) {
    const id = blogItemMatch[1];
    if (method === 'GET') {
      const post = blogPosts.find(p => p.id === id && p.is_published);
      if (!post) return json(res, 404, { detail: 'Innlegg ikke funnet' });
      return json(res, 200, post);
    }
    if (method === 'PUT') {
      const auth = requireAuth(req, res); if (!auth) return;
      const body = await readBody(req);
      const post = blogPosts.find(p => p.id === id);
      if (!post) return json(res, 404, { detail: 'Innlegg ikke funnet' });
      Object.assign(post, body, { updated_at: new Date().toISOString() });
      logActivity('Oppdaterte blogginnlegg', post.title);
      return json(res, 200, post);
    }
    if (method === 'DELETE') {
      const auth = requireAuth(req, res); if (!auth) return;
      const deleted = blogPosts.find(p => p.id === id);
      blogPosts = blogPosts.filter(p => p.id !== id);
      logActivity('Slettet blogginnlegg', deleted?.title || id);
      return json(res, 200, { message: 'Slettet' });
    }
  }

  // Site text
  if (method === 'GET' && url === '/api/site-text') {
    return json(res, 200, siteTextStore);
  }
  if (method === 'PUT' && url === '/api/site-text') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    Object.assign(siteTextStore, body.texts || body);
    logActivity('Oppdaterte tekster');
    return json(res, 200, { message: 'Tekster oppdatert' });
  }

  // Opening hours
  if (method === 'GET' && url === '/api/opening-hours') {
    return json(res, 200, openingHours);
  }
  if (method === 'PUT' && url === '/api/opening-hours') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    openingHours = { id: 'current', ...body };
    logActivity('Oppdaterte åpningstider');
    return json(res, 200, { message: 'Oppdatert' });
  }

  // Activity log (kun hovedadmin)
  if (method === 'GET' && url === '/api/activity-log') {
    const auth = requireAuth(req, res); if (!auth) return;
    return json(res, 200, activityLog);
  }

  // Arrangement slideshow
  if (method === 'GET' && url === '/api/arrangement-slides') {
    const sorted = [...arrangementSlides].sort((a, b) => a.sort_order - b.sort_order);
    return json(res, 200, sorted.map(s => ({ id: s.id, url: `/api/arrangement-slides/${s.id}/image`, sort_order: s.sort_order })));
  }
  if (method === 'POST' && url === '/api/arrangement-slides/upload') {
    const auth = requireAuth(req, res); if (!auth) return;
    req.on('data', () => {});
    req.on('end', () => {
      const id = crypto.randomUUID();
      const nextOrder = arrangementSlides.length ? Math.max(...arrangementSlides.map(s => s.sort_order)) + 1 : 1;
      const fallback = SLIDE_FALLBACKS[arrangementSlides.length % SLIDE_FALLBACKS.length];
      arrangementSlides.push({ id, sort_order: nextOrder, fallback });
      logActivity('La til slideshow-bilde (arrangement)', id);
      json(res, 200, { id, url: `/api/arrangement-slides/${id}/image`, sort_order: nextOrder });
    });
    return;
  }
  if (method === 'PUT' && url === '/api/arrangement-slides/reorder') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    (body.items || []).forEach(({ id, sort_order }) => { const s = arrangementSlides.find(x => x.id === id); if (s) s.sort_order = sort_order; });
    logActivity('Omorganiserte slideshow (arrangement)');
    return json(res, 200, { message: 'Omorganisert' });
  }
  const slideImageMatch = url.match(/^\/api\/arrangement-slides\/([^/]+)\/image$/);
  if (method === 'GET' && slideImageMatch) {
    const slide = arrangementSlides.find(s => s.id === slideImageMatch[1]);
    if (!slide) return json(res, 404, { detail: 'Bilde ikke funnet' });
    res.writeHead(302, { Location: slide.fallback });
    return res.end();
  }
  const slideDeleteMatch = url.match(/^\/api\/arrangement-slides\/([^/]+)$/);
  if (method === 'DELETE' && slideDeleteMatch) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = slideDeleteMatch[1];
    const before = arrangementSlides.length;
    arrangementSlides = arrangementSlides.filter(s => s.id !== id);
    if (arrangementSlides.length === before) return json(res, 404, { detail: 'Bilde ikke funnet' });
    logActivity('Slettet slideshow-bilde (arrangement)', id);
    return json(res, 200, { message: 'Bilde slettet' });
  }

  // Users (mock — i minnet)
  if (method === 'GET' && url === '/api/users') {
    const auth = requireAuth(req, res); if (!auth) return;
    return json(res, 200, users);
  }
  if (method === 'POST' && url === '/api/users') {
    const auth = requireAuth(req, res); if (!auth) return;
    const body = await readBody(req);
    if (!body.username || !body.password) return json(res, 400, { detail: 'Brukernavn og passord er påkrevd' });
    const username = String(body.username).toLowerCase().trim();
    if (users.some(u => u.username === username)) return json(res, 400, { detail: 'Brukernavn er allerede i bruk' });
    const newUser = { id: crypto.randomUUID(), username, name: body.name || '', role: body.role || 'admin', created_at: new Date().toISOString() };
    users.push(newUser);
    logActivity('La til bruker', username);
    return json(res, 200, newUser);
  }
  if (method === 'PATCH' && url.match(/^\/api\/users\/(.+)$/)) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = url.match(/^\/api\/users\/(.+)$/)[1];
    const target = users.find(u => u.id === id);
    if (!target) return json(res, 404, { detail: 'Bruker ikke funnet' });
    const isSelf = id === '1'; // mock session is always the seeded admin (id '1')
    if (target.username === ADMIN_USERNAME && !isSelf) {
      return json(res, 403, { detail: 'Admin-brukeren kan kun endres av seg selv' });
    }
    const body = await readBody(req);
    if (body.username) {
      const username = String(body.username).toLowerCase().trim();
      if (users.some(u => u.username === username && u.id !== id)) return json(res, 400, { detail: 'Brukernavn er allerede i bruk' });
      target.username = username;
    }
    if (body.name !== undefined) target.name = body.name;
    logActivity('Oppdaterte bruker', target.username);
    return json(res, 200, target);
  }
  if (method === 'DELETE' && url.match(/^\/api\/users\/(.+)$/)) {
    const auth = requireAuth(req, res); if (!auth) return;
    const id = url.match(/^\/api\/users\/(.+)$/)[1];
    if (id === '1') return json(res, 400, { detail: 'Du kan ikke slette deg selv' });
    const target = users.find(u => u.id === id);
    if (!target) return json(res, 404, { detail: 'Bruker ikke funnet' });
    if (target.username === ADMIN_USERNAME) return json(res, 403, { detail: 'Admin-brukeren kan ikke slettes' });
    users = users.filter(u => u.id !== id);
    logActivity('Slettet bruker', target.username);
    return json(res, 200, { message: 'Bruker slettet' });
  }

  // Root
  if (url === '/api/' || url === '/api') {
    return json(res, 200, { message: 'Linderudkollen mock API (dev only)' });
  }

  json(res, 404, { detail: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n🌲 Linderudkollen mock-backend kjører på http://localhost:${PORT}`);
  console.log(`   Admin: brukernavn=admin  passord=admin`);
  console.log(`   NB: Data lagres kun i minnet og slettes ved restart.\n`);
});
