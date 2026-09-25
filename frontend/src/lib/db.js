// Datalag mot Supabase. Alle komponenter og sider går via disse funksjonene,
// aldri direkte mot `supabase` for data. Feil kastes som Error med norsk melding.
import { supabase, STORAGE_BUCKET, publicUrl } from './supabase';

export { publicUrl };

export const AUTH_EMAIL_DOMAIN = 'linderudkollen.local';

export const IMAGE_SLOTS = [
  'hero_bakgrunn', 'om_oss_bilde', 'menu_hero',
  'arrangement_hero', 'arrangement_tilbyr',
  'arrangement_galleri_1', 'arrangement_galleri_2', 'arrangement_galleri_3', 'arrangement_galleri_4',
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fail(error, fallback) {
  const msg = error?.message || fallback || 'Noe gikk galt';
  const err = new Error(msg);
  err.cause = error;
  throw err;
}

function unwrap({ data, error }, fallback) {
  if (error) fail(error, fallback);
  return data;
}

function extOf(file) {
  const fromName = (file?.name || '').split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName) && fromName !== file?.name?.toLowerCase()) return fromName === 'jpeg' ? 'jpg' : fromName;
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[file?.type] || 'jpg';
}

function validateImage(file, { allowGif = true } = {}) {
  const type = file?.type || 'image/jpeg';
  if (!IMAGE_TYPES.includes(type) || (!allowGif && type === 'image/gif')) {
    throw new Error(allowGif ? 'Kun bilder (JPEG, PNG, WebP, GIF) er tillatt' : 'Kun bilder (JPEG, PNG, WebP) er tillatt');
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('Maks filstørrelse er 10 MB');
}

async function uploadObject(path, file, contentType) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: contentType || file.type || 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) fail(error, 'Opplasting feilet');
  return path;
}

async function removeObjects(paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(list).catch(() => {});
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export function usernameToEmail(username) {
  return `${String(username).trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export async function getCurrentProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.from('profiles').select('id, username, name, role, is_owner').eq('id', session.user.id).maybeSingle();
  if (error || !data) return null;
  return data;
}

// Kaster Error med message 'WRONG_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR'
export async function signIn(username, password) {
  let res;
  try {
    res = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  } catch {
    throw new Error('NETWORK_ERROR');
  }
  if (res.error) {
    const status = res.error.status;
    if (status === 400 || status === 401 || status === 422) throw new Error('WRONG_CREDENTIALS');
    if (res.error.message?.toLowerCase().includes('fetch')) throw new Error('NETWORK_ERROR');
    throw new Error('SERVER_ERROR');
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('SERVER_ERROR');
  }
  return profile;
}

export async function signOut() {
  await supabase.auth.signOut().catch(() => {});
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => callback(event));
  return () => subscription.unsubscribe();
}

// ─────────────────────────────────────────────
// Meny
// ─────────────────────────────────────────────
export async function getMenuCategories() {
  const data = unwrap(await supabase.from('menu_categories').select('id, name, sort_order, icon').order('sort_order').order('name'), 'Kunne ikke hente kategorier');
  return data || [];
}

// Returnerer varer med både category_id og category (navn), sortert etter kategori og sort_order.
export async function getMenuItems() {
  const data = unwrap(
    await supabase.from('menu_items')
      .select('id, category_id, name, description, price, is_available, sort_order, allergens, created_at, updated_at, menu_categories!inner(name, sort_order)')
      .order('sort_order'),
    'Kunne ikke hente menyen'
  );
  return (data || [])
    .map(({ menu_categories: cat, ...item }) => ({ ...item, price: item.price == null ? null : Number(item.price), category: cat.name, _catOrder: cat.sort_order }))
    .sort((a, b) => (a._catOrder - b._catOrder) || (a.sort_order - b.sort_order) || a.name.localeCompare(b.name, 'nb'))
    .map(({ _catOrder, ...item }) => item);
}

// Samme form som det gamle API-et: { items, categories: { [kategorinavn]: [varer] } }
export async function getMenu() {
  const [items, cats] = await Promise.all([getMenuItems(), getMenuCategories()]);
  const categories = {};
  cats.forEach(c => { categories[c.name] = []; });
  items.forEach(i => { (categories[i.category] ||= []).push(i); });
  Object.keys(categories).forEach(k => { if (!categories[k].length) delete categories[k]; });
  return { items, categories, categoryList: cats };
}

export async function createMenuItem({ category_id, name, description = '', price = null, is_available = true, allergens = [], sort_order }) {
  const row = { category_id, name: name.trim(), description, price, is_available, allergens };
  if (sort_order != null) row.sort_order = sort_order;
  return unwrap(await supabase.from('menu_items').insert(row).select().single(), 'Kunne ikke legge til varen');
}

export async function updateMenuItem(id, patch) {
  const allowed = ['category_id', 'name', 'description', 'price', 'is_available', 'allergens', 'sort_order'];
  const row = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
  if (typeof row.name === 'string') row.name = row.name.trim();
  unwrap(await supabase.from('menu_items').update(row).eq('id', id), 'Kunne ikke oppdatere varen');
}

export async function deleteMenuItem(id) {
  unwrap(await supabase.from('menu_items').update({ is_deleted: true }).eq('id', id), 'Kunne ikke slette varen');
}

export async function reorderMenuItems(items) {
  unwrap(await supabase.rpc('reorder_rows', { p_table: 'menu_items', p_items: items }), 'Kunne ikke lagre rekkefølgen');
}

export async function createMenuCategory({ name, sort_order }) {
  const row = { name: name.trim() };
  if (sort_order != null) row.sort_order = sort_order;
  return unwrap(await supabase.from('menu_categories').insert(row).select().single(), 'Kunne ikke opprette kategorien');
}

export async function updateMenuCategory(id, patch) {
  const allowed = ['name', 'sort_order', 'icon'];
  const row = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
  if (typeof row.name === 'string') row.name = row.name.trim();
  unwrap(await supabase.from('menu_categories').update(row).eq('id', id), 'Kunne ikke oppdatere kategorien');
}

// Feiler med norsk melding hvis kategorien fortsatt har varer.
export async function deleteMenuCategory(id) {
  unwrap(await supabase.from('menu_categories').update({ is_deleted: true }).eq('id', id), 'Kunne ikke slette kategorien');
}

export async function reorderMenuCategories(items) {
  unwrap(await supabase.rpc('reorder_rows', { p_table: 'menu_categories', p_items: items }), 'Kunne ikke lagre rekkefølgen');
}

export async function exportMenu() {
  const [categories, items] = await Promise.all([getMenuCategories(), getMenuItems()]);
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    categories,
    items: items.map(({ category, ...i }) => i),
  };
}

// Tar en fil fra exportMenu(). Erstatter hele menyen i én transaksjon.
export async function importMenu(payload) {
  if (!payload || !Array.isArray(payload.categories) || !Array.isArray(payload.items)) {
    throw new Error('Filen må inneholde «categories» og «items»');
  }
  return unwrap(await supabase.rpc('import_menu', { p_categories: payload.categories, p_items: payload.items }), 'Import feilet');
}

// ─────────────────────────────────────────────
// Åpningstider
// ─────────────────────────────────────────────
export async function getOpeningHours() {
  const data = unwrap(await supabase.from('opening_hours').select('period, schedule, notices, footer_note, updated_at').eq('id', 'current').maybeSingle(), 'Kunne ikke hente åpningstider');
  return data;
}

export async function saveOpeningHours({ period, schedule, notices, footer_note }) {
  unwrap(await supabase.from('opening_hours').update({ period, schedule, notices, footer_note }).eq('id', 'current'), 'Kunne ikke lagre åpningstider');
}

// ─────────────────────────────────────────────
// Tekster
// ─────────────────────────────────────────────
export async function getSiteText() {
  const data = unwrap(await supabase.from('site_text').select('key, value'), 'Kunne ikke hente tekster');
  return Object.fromEntries((data || []).map(r => [r.key, r.value]));
}

export async function saveSiteText(map) {
  const rows = Object.entries(map).map(([key, value]) => ({ key, value: value ?? '' }));
  unwrap(await supabase.from('site_text').upsert(rows, { onConflict: 'key' }), 'Kunne ikke lagre tekster');
}

// ─────────────────────────────────────────────
// Bilder (faste plasser på nettsiden)
// ─────────────────────────────────────────────
export async function getSiteImages() {
  const data = unwrap(await supabase.from('site_images').select('slot, storage_path, focus_x, focus_y'), 'Kunne ikke hente bilder');
  const bySlot = Object.fromEntries((data || []).map(r => [r.slot, r]));
  return {
    slots: IMAGE_SLOTS.map(slot => {
      const r = bySlot[slot] || {};
      return { id: slot, url: publicUrl(r.storage_path), path: r.storage_path || null, focus_x: r.focus_x ?? 50, focus_y: r.focus_y ?? 50 };
    }),
  };
}

export async function uploadSiteImage(slot, file) {
  if (!IMAGE_SLOTS.includes(slot)) throw new Error('Ukjent bildeplass');
  validateImage(file);
  const { data: current } = await supabase.from('site_images').select('storage_path').eq('slot', slot).maybeSingle();
  const path = `site/${slot}-${crypto.randomUUID()}.${extOf(file)}`;
  await uploadObject(path, file);
  const { error } = await supabase.from('site_images').update({ storage_path: path }).eq('slot', slot);
  if (error) { await removeObjects([path]); fail(error, 'Kunne ikke lagre bildet'); }
  await removeObjects([current?.storage_path]);
  return publicUrl(path);
}

export async function setSiteImageFocus(slot, focus_x, focus_y) {
  unwrap(await supabase.from('site_images').update({ focus_x: Math.round(focus_x), focus_y: Math.round(focus_y) }).eq('slot', slot), 'Kunne ikke lagre fokuspunkt');
}

export async function resetSiteImage(slot) {
  const { data: current } = await supabase.from('site_images').select('storage_path').eq('slot', slot).maybeSingle();
  unwrap(await supabase.from('site_images').update({ storage_path: null, focus_x: 50, focus_y: 50 }).eq('slot', slot), 'Kunne ikke tilbakestille bildet');
  await removeObjects([current?.storage_path]);
}

// ─────────────────────────────────────────────
// Slideshow (arrangement)
// ─────────────────────────────────────────────
export async function getSlides() {
  const data = unwrap(await supabase.from('arrangement_slides').select('id, storage_path, sort_order').order('sort_order'), 'Kunne ikke hente slideshow');
  return (data || []).map(s => ({ id: s.id, url: publicUrl(s.storage_path), path: s.storage_path, sort_order: s.sort_order }));
}

export async function uploadSlide(file) {
  validateImage(file);
  const path = `slides/${crypto.randomUUID()}.${extOf(file)}`;
  await uploadObject(path, file);
  const { data, error } = await supabase.from('arrangement_slides').insert({ storage_path: path }).select('id, storage_path, sort_order').single();
  if (error) { await removeObjects([path]); fail(error, 'Kunne ikke lagre bildet'); }
  return { id: data.id, url: publicUrl(data.storage_path), path: data.storage_path, sort_order: data.sort_order };
}

export async function deleteSlide(id) {
  const { data: row } = await supabase.from('arrangement_slides').select('storage_path').eq('id', id).maybeSingle();
  unwrap(await supabase.from('arrangement_slides').delete().eq('id', id), 'Kunne ikke slette bildet');
  await removeObjects([row?.storage_path]);
}

export async function reorderSlides(items) {
  unwrap(await supabase.rpc('reorder_rows', { p_table: 'arrangement_slides', p_items: items }), 'Kunne ikke lagre rekkefølgen');
}

// ─────────────────────────────────────────────
// Blogg
// ─────────────────────────────────────────────
function mapPost(p) {
  return { ...p, image_url: publicUrl(p.image_path) };
}

// Utkast kommer bare med når innlogget admin spør (RLS filtrerer for alle andre).
export async function getPosts() {
  const data = unwrap(
    await supabase.from('blog_posts').select('id, title, body, image_path, is_published, category, created_at, updated_at').order('created_at', { ascending: false }),
    'Kunne ikke hente innlegg'
  );
  return (data || []).map(mapPost);
}

export async function createPost({ title, body = '', is_published = false, category = 'Nyheter' }) {
  const data = unwrap(await supabase.from('blog_posts').insert({ title: title.trim(), body, is_published, category }).select().single(), 'Kunne ikke opprette innlegget');
  return mapPost(data);
}

export async function updatePost(id, patch) {
  const allowed = ['title', 'body', 'is_published', 'category'];
  const row = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
  if (typeof row.title === 'string') row.title = row.title.trim();
  unwrap(await supabase.from('blog_posts').update(row).eq('id', id), 'Kunne ikke oppdatere innlegget');
}

export async function uploadPostImage(postId, file) {
  validateImage(file, { allowGif: false });
  const { data: current } = await supabase.from('blog_posts').select('image_path').eq('id', postId).maybeSingle();
  const path = `blog/${postId}-${crypto.randomUUID()}.${extOf(file)}`;
  await uploadObject(path, file);
  const { error } = await supabase.from('blog_posts').update({ image_path: path }).eq('id', postId);
  if (error) { await removeObjects([path]); fail(error, 'Kunne ikke lagre bildet'); }
  await removeObjects([current?.image_path]);
  return publicUrl(path);
}

export async function deletePost(id) {
  const { data: row } = await supabase.from('blog_posts').select('image_path').eq('id', id).maybeSingle();
  unwrap(await supabase.from('blog_posts').delete().eq('id', id), 'Kunne ikke slette innlegget');
  await removeObjects([row?.image_path]);
}

// ─────────────────────────────────────────────
// Brukere (via Edge Function, krever service-rolle på serversiden)
// ─────────────────────────────────────────────
export async function listUsers() {
  const data = unwrap(await supabase.from('profiles').select('id, username, name, role, is_owner, created_at').order('created_at'), 'Kunne ikke hente brukere');
  return data || [];
}

async function adminUsers(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    let message = 'Noe gikk galt';
    try { message = (await error.context.json())?.error || message; } catch { /* ignore */ }
    if (error.name === 'FunctionsFetchError') message = 'Nettverksfeil — kunne ikke nå serveren';
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const createUser = ({ username, password, name }) => adminUsers({ action: 'create', username, password, name });
export const updateUser = (id, { username, name, password }) => adminUsers({ action: 'update', id, username, name, password: password || undefined });
export const deleteUser = (id) => adminUsers({ action: 'delete', id });

// ─────────────────────────────────────────────
// Logg (kun hovedadmin)
// ─────────────────────────────────────────────
export async function getActivityLog() {
  const { data, error } = await supabase.from('activity_log').select('id, username, name, action, target, created_at').order('created_at', { ascending: false }).limit(300);
  if (error) return [];
  return data || [];
}
