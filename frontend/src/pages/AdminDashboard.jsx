import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LayoutDashboard, Image, UtensilsCrossed,
  Clock, Users, LogOut, ArrowLeft, Menu, X, Upload, Trash2,
  Check, Plus, Pencil, Save, GripVertical, AlertCircle, Download,
  Coffee, Wheat, Soup, Leaf, CupSoda, Flame, Cake, Sandwich,
  Apple, Wine, Cookie, Pizza, Star, Sun, Gift, BookOpen, Eye, EyeOff,
  Calendar, Type, History
} from 'lucide-react';
import { invalidateSiteTextCache } from '../hooks/useSiteText';

const ICON_MAP = {
  coffee: Coffee, wheat: Wheat, soup: Soup, leaf: Leaf,
  'cup-soda': CupSoda, 'utensils-crossed': UtensilsCrossed,
  flame: Flame, cake: Cake, sandwich: Sandwich, apple: Apple,
  wine: Wine, cookie: Cookie, pizza: Pizza, star: Star, sun: Sun, gift: Gift,
};
const ICON_OPTIONS = [
  { key: 'coffee', label: 'Kaffe' }, { key: 'wheat', label: 'Bakst' },
  { key: 'soup', label: 'Suppe' }, { key: 'leaf', label: 'Grønt' },
  { key: 'cup-soda', label: 'Brus' }, { key: 'utensils-crossed', label: 'Bestikk' },
  { key: 'flame', label: 'Varm' }, { key: 'cake', label: 'Kake' },
  { key: 'sandwich', label: 'Brød' }, { key: 'apple', label: 'Frukt' },
  { key: 'wine', label: 'Vin' }, { key: 'cookie', label: 'Kjeks' },
  { key: 'pizza', label: 'Pizza' }, { key: 'star', label: 'Stjerne' },
  { key: 'sun', label: 'Sol' }, { key: 'gift', label: 'Gave' },
];
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

// ── Helpers ──
function api(path, opts = {}) {
  return fetch(`${API_URL}${path}`, { headers: { ...getHeaders(), 'Content-Type': 'application/json' }, credentials: 'include', ...opts });
}

// ── Reusable UI ──
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>;
}

function Badge({ children, color = 'gray' }) {
  const colors = {
    amber:  'bg-amber-100 text-amber-800',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-600',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>;
}

function DeleteButton({ onConfirm, small = false }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => { onConfirm(); setConfirming(false); }}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
        Bekreft sletting
      </button>
      <button onClick={() => setConfirming(false)}
        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors">
        Avbryt
      </button>
    </div>
  );
  return (
    <button onClick={() => setConfirming(true)}
      className={`${small ? 'p-1.5' : 'p-2'} text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors`}>
      <Trash2 className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </button>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 max-w-xs">{body}</p>
    </div>
  );
}

// ── SortableItem (drag handle) ──
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' }}
      className="flex items-center gap-2">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none p-1 flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ════════════════════════════════
// DASHBOARD TAB
// ════════════════════════════════
function DashboardTab({ onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'God morgen' : hour < 18 ? 'God ettermiddag' : 'God kveld';
  const dateStr = new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-400 capitalize">{dateStr}</p>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          {greeting} 👋
        </h2>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Snarveier</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'images',  icon: Image,          label: 'Bilder'         },
            { id: 'text',    icon: Type,            label: 'Tekst'          },
            { id: 'menu',    icon: UtensilsCrossed, label: 'Rediger meny'  },
            { id: 'hours',   icon: Clock,           label: 'Åpningstider'  },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => onNavigate(id)}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all text-center">
              <Icon className="w-6 h-6 text-amber-700" />
              <span className="text-sm font-medium text-gray-600 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════
// IMAGES TAB
// ════════════════════════════════
const IMAGE_SLOTS = [
  { id: 'hero_bakgrunn',        label: 'Forsidebakgrunn',            desc: 'Bakgrunnsbildet øverst på forsiden',                  fallback: 'https://images.unsplash.com/photo-1718470630607-d52f2ab3cba7?w=400&q=60' },
  { id: 'om_oss_bilde',         label: 'Om oss — bilde',             desc: 'Bildet ved siden av "Velkommen til Linderudkollen"',   fallback: 'https://images.unsplash.com/photo-1758116448135-e989799305da?w=400&q=60' },
  { id: 'menu_hero',            label: 'Meny — toppbilde',           desc: 'Bakgrunnsbildet øverst på menysiden',                 fallback: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=60' },
  { id: 'arrangement_hero',     label: 'Arrangement — toppbilde',    desc: 'Bakgrunnsbildet øverst på arrangement-siden',          fallback: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=60' },
  { id: 'arrangement_tilbyr',   label: 'Arrangement — hva vi tilbyr',desc: 'Bildet ved siden av tilbudslisten',                    fallback: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&q=60' },
  { id: 'arrangement_galleri_1',label: 'Arrangement — galleri 1',    desc: 'Første bilde, vises dobbelt stor',                    fallback: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60' },
  { id: 'arrangement_galleri_2',label: 'Arrangement — galleri 2',    desc: '',                                                    fallback: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=60' },
  { id: 'arrangement_galleri_3',label: 'Arrangement — galleri 3',    desc: '',                                                    fallback: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=60' },
  { id: 'arrangement_galleri_4',label: 'Arrangement — galleri 4',    desc: '',                                                    fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=60' },
];

function CropModal({ file, onConfirm, onCancel }) {
  const imgRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const getPos = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    setStartPos(pos);
    setDragging(true);
    setSelection({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    if (!dragging || !startPos) return;
    const pos = getPos(e);
    setSelection({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  };

  const onMouseUp = () => setDragging(false);

  const handleConfirm = () => {
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const canvas = document.createElement('canvas');

    const MAX_PX = 1920;

    let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;
    if (selection && selection.w > 10 && selection.h > 10) {
      srcX = selection.x * scaleX; srcY = selection.y * scaleY;
      srcW = selection.w * scaleX; srcH = selection.h * scaleY;
    }

    const ratio = Math.min(1, MAX_PX / Math.max(srcW, srcH));
    canvas.width  = Math.round(srcW * ratio);
    canvas.height = Math.round(srcH * ratio);
    canvas.getContext('2d').drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.82);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>Velg utsnitt</h3>
            <p className="text-sm text-gray-400 mt-0.5">Dra på bildet for å velge hva som skal vises. Hopp over for å bruke hele bildet.</p>
          </div>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 flex items-center justify-center bg-gray-50 min-h-0">
          <div
            className="relative select-none cursor-crosshair inline-block"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {imgUrl && (
              <img
                ref={imgRef}
                src={imgUrl}
                alt="Velg utsnitt"
                className="max-w-full block"
                style={{ maxHeight: '55vh' }}
                draggable={false}
              />
            )}
            {selection && selection.w > 5 && (
              <>
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                <div
                  className="absolute border-2 border-white pointer-events-none"
                  style={{
                    left: selection.x, top: selection.y,
                    width: selection.w, height: selection.h,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center gap-3">
          <p className="text-xs text-gray-400">
            {selection && selection.w > 10
              ? `Utsnett: ${Math.round(selection.w)} × ${Math.round(selection.h)} px`
              : 'Ingen markering — hele bildet lastes opp'}
          </p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Avbryt
            </button>
            <button onClick={handleConfirm} className="px-4 py-2 text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-xl transition-colors">
              {selection && selection.w > 10 ? 'Bruk dette utsnitt' : 'Last opp hele bildet'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImagesTab() {
  const [customImages, setCustomImages] = useState({});
  const [focusVals, setFocusVals] = useState({});
  const [uploading, setUploading] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const fileRefs = useRef({});

  const [slides, setSlides] = useState([]);
  const [slideUploading, setSlideUploading] = useState(false);
  const slideFileRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = () => {
    api('/api/site-images')
      .then(r => r.json())
      .then(data => {
        const imgMap = {};
        const fMap = {};
        (data.slots || []).forEach(s => {
          if (s.url) imgMap[s.id] = `${API_URL}${s.url}`;
          fMap[s.id] = { x: s.focus_x ?? 50, y: s.focus_y ?? 50 };
        });
        setCustomImages(imgMap);
        setFocusVals(fMap);
      })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const loadSlides = () => {
    api('/api/arrangement-slides')
      .then(r => r.json())
      .then(data => setSlides(Array.isArray(data) ? data.sort((a, b) => a.sort_order - b.sort_order) : []))
      .catch(() => {});
  };
  useEffect(() => { loadSlides(); }, []);

  const uploadSlide = async (file) => {
    setSlideUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/arrangement-slides/upload`, {
        method: 'POST', headers: getHeaders(), body: fd, credentials: 'include',
      });
      if (res.ok) { toast.success('Bilde lagt til i slideshowet'); loadSlides(); }
      else { const err = await res.json().catch(() => ({})); toast.error(err.detail || 'Opplasting feilet'); }
    } catch { toast.error('Nettverksfeil'); }
    setSlideUploading(false);
    if (slideFileRef.current) slideFileRef.current.value = '';
  };

  const deleteSlide = async (id) => {
    const res = await api(`/api/arrangement-slides/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Bilde fjernet fra slideshowet'); loadSlides(); }
    else toast.error('Noe gikk galt');
  };

  const uploadBlob = async (slotId, blob) => {
    setUploading(slotId);
    const fd = new FormData();
    fd.append('file', blob, 'image.jpg');
    try {
      const res = await fetch(`${API_URL}/api/site-images/${slotId}/upload`, {
        method: 'POST', headers: getHeaders(), body: fd, credentials: 'include',
      });
      if (res.ok) {
        toast.success('Bilde lastet opp');
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Opplasting feilet');
      }
    } catch { toast.error('Nettverksfeil'); }
    setUploading(null);
    setCropFile(null);
    const ref = fileRefs.current[slotId];
    if (ref) ref.value = '';
  };

  const saveFocus = async (slotId, x, y) => {
    setFocusVals(prev => ({ ...prev, [slotId]: { x, y } }));
    await api(`/api/site-images/${slotId}/focus`, {
      method: 'PUT',
      body: JSON.stringify({ focus_x: x, focus_y: y }),
    }).catch(() => {});
  };

  const reset = async (slotId) => {
    const res = await api(`/api/site-images/${slotId}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Tilbakestilt til standardbilde'); load(); }
    else toast.error('Noe gikk galt');
  };

  return (
    <div>
      {cropFile && (
        <CropModal
          file={cropFile.file}
          onConfirm={(blob) => uploadBlob(cropFile.slotId, blob)}
          onCancel={() => {
            setCropFile(null);
            const ref = fileRefs.current[cropFile.slotId];
            if (ref) ref.value = '';
          }}
        />
      )}

      <SectionHeader
        title="Bilder"
        description="Last opp egne bilder til nettsiden. Unsplash-bilder brukes som standard."
      />
      <div className="grid sm:grid-cols-2 gap-5">
        {IMAGE_SLOTS.map(slot => {
          const currentUrl = customImages[slot.id] || slot.fallback;
          const hasCustom = !!customImages[slot.id];
          const isUploading = uploading === slot.id;
          const fx = focusVals[slot.id]?.x ?? 50;
          const fy = focusVals[slot.id]?.y ?? 50;
          return (
            <Card key={slot.id} className="overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                <img
                  src={currentUrl}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `${fx}% ${fy}%` }}
                />
                {hasCustom && (
                  <span className="absolute top-2 left-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Eget bilde
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm mb-0.5">{slot.label}</p>
                {slot.desc
                  ? <p className="text-xs text-gray-400 mb-3">{slot.desc}</p>
                  : <div className="mb-3" />
                }
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={el => { fileRefs.current[slot.id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setCropFile({ file, slotId: slot.id });
                      }}
                    />
                    <span className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isUploading
                        ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                        : 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
                    }`}>
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Laster opp...' : 'Bytt bilde'}
                    </span>
                  </label>
                  {hasCustom && (
                    <button
                      onClick={() => reset(slot.id)}
                      className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
                    >
                      Tilbakestill
                    </button>
                  )}
                </div>

                {hasCustom && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Fokuspunkt</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16 shrink-0">Horisontalt</span>
                        <input
                          type="range" min="0" max="100" value={fx}
                          onChange={e => saveFocus(slot.id, Number(e.target.value), fy)}
                          className="flex-1 accent-amber-700"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{fx}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16 shrink-0">Vertikalt</span>
                        <input
                          type="range" min="0" max="100" value={fy}
                          onChange={e => saveFocus(slot.id, fx, Number(e.target.value))}
                          className="flex-1 accent-amber-700"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{fy}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-10">
        <SectionHeader
          title="Slideshow — Arrangement"
          description="Bildene som roterer i karusellen øverst på arrangement-siden. Dra for å endre rekkefølge."
        />
        {slides.length === 0 && (
          <p className="text-sm text-gray-400 mb-4">Ingen egne bilder lagt til — standardbilder vises på siden.</p>
        )}
        {slides.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragEnd={e => {
              const { active, over } = e;
              if (!over || active.id === over.id) return;
              const oldIndex = slides.findIndex(s => s.id === active.id);
              const newIndex = slides.findIndex(s => s.id === over.id);
              const reordered = arrayMove(slides, oldIndex, newIndex);
              setSlides(reordered);
              api('/api/arrangement-slides/reorder', {
                method: 'PUT',
                body: JSON.stringify({ items: reordered.map((s, i) => ({ id: s.id, sort_order: i + 1 })) }),
              }).catch(() => {});
            }}>
            <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {slides.map(slide => (
                  <SortableItem key={slide.id} id={slide.id}>
                    <Card className="overflow-hidden">
                      <div className="relative h-32 bg-gray-100">
                        <img src={`${API_URL}${slide.url}`} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => deleteSlide(slide.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 rounded-full shadow transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        <label className="inline-flex cursor-pointer">
          <input type="file" accept="image/*" className="hidden" ref={slideFileRef}
            onChange={(e) => { const file = e.target.files[0]; if (file) uploadSlide(file); }} />
          <span className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            slideUploading ? 'bg-amber-100 text-amber-700 cursor-not-allowed' : 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
          }`}>
            <Upload className="w-4 h-4" />
            {slideUploading ? 'Laster opp...' : 'Legg til bilde'}
          </span>
        </label>
      </div>
    </div>
  );
}

// ════════════════════════════════
// MENU TAB
// ════════════════════════════════
const ALLERGENS = ['Gluten','Melk','Egg','Fisk','Skalldyr','Nøtter','Peanøtter','Soya','Sesamfrø','Sennep','Selleri','Sulfitt','Lupin','Bløtdyr'];

function MenuTab() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [iconPickerOpen, setIconPickerOpen] = useState(null);
  const [form, setForm] = useState({ category: '', name: '', description: '', price: '', is_available: true, allergens: [] });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadItems = () => api('/api/menu').then(r => r.json()).then(d => d?.items && setItems(d.items)).catch(() => {});
  const loadCats = () => api('/api/menu/categories').then(r => r.json()).then(d => Array.isArray(d) && setCategories(d)).catch(() => {});
  useEffect(() => { loadItems(); loadCats(); }, []);

  const exportMenu = async () => {
    try {
      const r = await api('/api/menu/export');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meny-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Meny eksportert');
    } catch { toast.error('Eksport feilet'); }
  };

  const importMenu = async (file) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api('/api/menu/import', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Meny importert');
      loadItems(); loadCats();
    } catch { toast.error('Import feilet — sjekk at filen er gyldig JSON'); }
  };

  const catNames = categories.map(c => c.name);
  const resetForm = () => { setForm({ category: catNames[0] || '', name: '', description: '', price: '', is_available: true, allergens: [] }); setShowAdd(false); setEditingId(null); };

  const addItem = async (e) => {
    e.preventDefault();
    const maxOrder = items.filter(i => i.category === form.category).reduce((m, i) => Math.max(m, i.sort_order || 0), 0);
    await api('/api/menu', { method: 'POST', body: JSON.stringify({ ...form, price: form.price === '' ? null : Number(form.price), sort_order: maxOrder + 1 }) });
    toast.success('Vare lagt til');
    resetForm(); loadItems();
  };

  const updateItem = async (id) => {
    await api(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify({ ...form, price: form.price === '' ? null : Number(form.price) }) });
    toast.success('Vare oppdatert');
    resetForm(); loadItems();
  };

  const delItem = async (id) => {
    await api(`/api/menu/${id}`, { method: 'DELETE' });
    toast.success('Vare slettet');
    loadItems();
  };

  const addCat = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await api('/api/menu/categories', { method: 'POST', body: JSON.stringify({ name: newCatName.trim(), sort_order: categories.length + 1 }) });
    toast.success(`Kategori "${newCatName}" opprettet`);
    setNewCatName(''); loadCats();
  };

  const delCat = async (id, name) => {
    await api(`/api/menu/categories/${id}`, { method: 'DELETE' });
    toast.success(`Kategori "${name}" slettet`);
    loadCats();
  };

  const updateCatIcon = async (id, iconKey) => {
    await api(`/api/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify({ icon: iconKey }) });
    setIconPickerOpen(null);
    loadCats();
  };

  const reorderRequest = (url, reorder) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_URL}${url}`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
    xhr.withCredentials = true;
    xhr.send(JSON.stringify({ items: reorder }));
  };

  const grouped = {};
  items.forEach(i => { if (!grouped[i.category]) grouped[i.category] = []; grouped[i.category].push(i); });

  const FormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Kategori</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} data-testid="menu-form-category"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400">
            {catNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Pris (kr)</label>
          <input type="number" placeholder="f.eks. 79" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
            data-testid="menu-form-price"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Navn *</label>
        <input type="text" required placeholder="Varenavn" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          data-testid="menu-form-name"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Beskrivelse</label>
        <input type="text" placeholder="Kort beskrivelse (valgfritt)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          data-testid="menu-form-desc"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })}
          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
        <label htmlFor="avail" className="text-sm text-gray-700">Tilgjengelig på menyen</label>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Allergener</label>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map(a => {
            const checked = (form.allergens || []).includes(a);
            return (
              <button key={a} type="button"
                onClick={() => setForm({ ...form, allergens: checked ? form.allergens.filter(x => x !== a) : [...(form.allergens || []), a] })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${checked ? 'bg-red-100 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="Meny" description="Legg til, rediger og organiser menypunkter"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportMenu}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-blue-300 text-gray-600 text-sm font-medium rounded-xl transition-colors">
              <Download className="w-4 h-4" /> Eksporter
            </button>
            <label className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-green-300 text-gray-600 text-sm font-medium rounded-xl cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> Importer
              <input type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files[0]) importMenu(e.target.files[0]); e.target.value = ''; }} />
            </label>
            <button onClick={() => setShowCats(!showCats)} data-testid="category-manage-btn"
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:border-amber-300 text-gray-600 text-sm font-medium rounded-xl transition-colors">
              Kategorier
            </button>
            <button onClick={() => { setForm({ category: catNames[0] || '', name: '', description: '', price: '', is_available: true, allergens: [] }); setShowAdd(true); setEditingId(null); }}
              data-testid="menu-add-btn"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Legg til vare
            </button>
          </div>
        }
      />

      {showCats && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Kategorier <span className="text-xs text-gray-400 font-normal ml-1">Dra for å omorganisere</span></p>
            <button onClick={() => setShowCats(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragEnd={e => {
              const { active, over } = e;
              if (!over || active.id === over.id) return;
              const oi = categories.findIndex(c => c.id === active.id);
              const ni = categories.findIndex(c => c.id === over.id);
              const newCats = arrayMove(categories, oi, ni);
              setCategories(newCats);
              reorderRequest('/api/menu/categories/reorder', newCats.map((c, i) => ({ id: c.id, sort_order: i + 1 })));
            }}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 mb-4">
                {categories.map(cat => {
                  const CatIcon = ICON_MAP[cat.icon] || UtensilsCrossed;
                  return (
                    <SortableItem key={cat.id} id={cat.id}>
                      <div className="bg-gray-50 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIconPickerOpen(iconPickerOpen === cat.id ? null : cat.id)}
                              title="Endre ikon"
                              className={`p-1.5 rounded-lg border transition-colors ${iconPickerOpen === cat.id ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 hover:border-amber-300 text-amber-700'}`}
                            >
                              <CatIcon className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                          </div>
                          <DeleteButton onConfirm={() => delCat(cat.id, cat.name)} small />
                        </div>
                        {iconPickerOpen === cat.id && (
                          <div className="px-3 pb-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mt-2 mb-2">Velg ikon:</p>
                            <div className="grid grid-cols-8 gap-1">
                              {ICON_OPTIONS.map(({ key, label }) => {
                                const Ico = ICON_MAP[key];
                                return (
                                  <button key={key} onClick={() => updateCatIcon(cat.id, key)} title={label}
                                    className={`p-2 rounded-lg flex items-center justify-center transition-colors ${cat.icon === key ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-white border border-gray-200 hover:border-amber-300 text-gray-500 hover:text-amber-700'}`}>
                                    <Ico className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
          <form onSubmit={addCat} className="flex gap-2 pt-3 border-t border-gray-100">
            <input type="text" placeholder="Ny kategori" value={newCatName} onChange={e => setNewCatName(e.target.value)}
              data-testid="new-category-name" required
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
            <button type="submit" data-testid="add-category-btn"
              className="flex items-center gap-1 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Legg til
            </button>
          </form>
        </Card>
      )}

      {showAdd && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Ny vare</p>
            <button onClick={resetForm}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
          </div>
          <form onSubmit={addItem} className="space-y-4">
            <FormFields />
            <div className="flex gap-2 pt-1">
              <button type="submit" data-testid="menu-form-submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors">
                <Check className="w-4 h-4" /> Lagre vare
              </button>
              <button type="button" onClick={resetForm}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">
                Avbryt
              </button>
            </div>
          </form>
        </Card>
      )}

      {catNames.map(cat => {
        const catItems = (grouped[cat] || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        if (!catItems.length) return null;
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat}</p>
              {cat === 'Middag' && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Kun onsdager
                </span>
              )}
            </div>
            <Card className="overflow-hidden">
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragEnd={e => {
                  const { active, over } = e;
                  if (!over || active.id === over.id) return;
                  const oi = catItems.findIndex(i => i.id === active.id);
                  const ni = catItems.findIndex(i => i.id === over.id);
                  const reordered = arrayMove(catItems, oi, ni);
                  setItems(prev => {
                    const rest = prev.filter(i => i.category !== cat);
                    return [...rest, ...reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }))];
                  });
                  reorderRequest('/api/menu/reorder', reordered.map((item, i) => ({ id: item.id, sort_order: i + 1 })));
                }}>
                <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {catItems.map((item, idx) => (
                    <SortableItem key={item.id} id={item.id}>
                      <div className={`${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                        {editingId === item.id ? (
                          <div className="p-4 bg-amber-50/50">
                            <form onSubmit={e => { e.preventDefault(); updateItem(item.id); }} className="space-y-3">
                              <FormFields />
                              <div className="flex gap-2">
                                <button type="submit"
                                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors">
                                  <Check className="w-4 h-4" /> Lagre
                                </button>
                                <button type="button" onClick={resetForm}
                                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                                  Avbryt
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-4 px-4 py-3.5 ${!item.is_available ? 'opacity-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                                {!item.is_available && <Badge color="gray">Utilgjengelig</Badge>}
                              </div>
                              {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                            </div>
                            <span className="text-sm font-bold text-amber-800 whitespace-nowrap flex-shrink-0">
                              {item.price != null ? `${item.price},-` : '—'}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => { setEditingId(item.id); setShowAdd(false); setForm({ category: item.category, name: item.name, description: item.description || '', price: item.price != null ? String(item.price) : '', is_available: item.is_available, allergens: item.allergens || [] }); }}
                                className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <DeleteButton onConfirm={() => delItem(item.id)} small />
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </Card>
          </div>
        );
      })}

      {items.length === 0 && !showAdd && (
        <EmptyState icon={UtensilsCrossed} title="Ingen menypunkter ennå" body="Trykk 'Legg til vare' for å begynne å bygge menyen." />
      )}
    </div>
  );
}

// ════════════════════════════════
// OPENING HOURS TAB
// ════════════════════════════════
function OpeningHoursTab() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/opening-hours').then(r => r.json()).then(d => d?.schedule && setData(d)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    await api('/api/opening-hours', { method: 'PUT', body: JSON.stringify(data) });
    setSaving(false);
    toast.success('Åpningstider lagret');
  };

  if (!data) return <div className="py-12 text-center text-gray-400">Laster...</div>;

  return (
    <div>
      <SectionHeader title="Åpningstider" description="Oppdater åpningstider og merknader for nettsiden"
        action={
          <button onClick={save} disabled={saving} data-testid="save-hours-btn"
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Lagrer...' : 'Lagre'}
          </button>
        }
      />

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tidsplan</p>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Periode</label>
            <input type="text" value={data.period} onChange={e => setData({ ...data, period: e.target.value })}
              data-testid="hours-period-input"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="space-y-2">
            {data.schedule.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">{item.day}</span>
                <input type="text" value={item.hours}
                  onChange={e => {
                    const s = [...data.schedule];
                    s[i] = { ...s[i], hours: e.target.value, closed: e.target.value.toLowerCase() === 'stengt' };
                    setData({ ...data, schedule: s });
                  }}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-amber-400 ${
                    item.closed ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Merknader</p>
          <div className="space-y-2 mb-4">
            {data.notices.map((notice, i) => (
              <input key={i} type="text" value={notice}
                onChange={e => { const n = [...data.notices]; n[i] = e.target.value; setData({ ...data, notices: n }); }}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fotnote</label>
            <input type="text" value={data.footer_note} onChange={e => setData({ ...data, footer_note: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════
// USERS TAB
// ════════════════════════════════
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'admin' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', name: '', password: '' });
  const [editError, setEditError] = useState('');
  const { user: currentUser } = useAuth();

  const load = () => api('/api/users').then(r => r.json()).then(d => Array.isArray(d) && setUsers(d)).catch(() => {});
  useEffect(() => { load(); }, []);

  const addUser = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api('/api/users', { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || 'Kunne ikke opprette bruker');
        return;
      }
      toast.success(`Bruker "${form.username}" opprettet`);
      setForm({ username: '', password: '', name: '', role: 'admin' });
      setShowAdd(false);
      load();
    } catch {
      setError('Nettverksfeil — kunne ikke nå serveren');
    } finally {
      setSaving(false);
    }
  };

  const delUser = async (id) => {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    toast.success('Bruker slettet');
    load();
  };

  const startEditUser = (u) => {
    setEditingId(u.id);
    setEditForm({ username: u.username, name: u.name || '', password: '' });
    setEditError('');
    setShowAdd(false);
  };

  const saveEditUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      const body = { username: editForm.username, name: editForm.name };
      if (editForm.password) body.password = editForm.password;
      const res = await api(`/api/users/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setEditError(d.detail || 'Kunne ikke oppdatere bruker');
        return;
      }
      toast.success('Bruker oppdatert');
      setEditingId(null);
      load();
    } catch {
      setEditError('Nettverksfeil — kunne ikke nå serveren');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Brukere" description="Administrer hvem som har tilgang til admin-panelet"
        action={
          <button onClick={() => setShowAdd(!showAdd)} data-testid="add-user-btn"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Ny bruker
          </button>
        }
      />

      {showAdd && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Legg til bruker</p>
            <button onClick={() => { setShowAdd(false); setError(''); }}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
          </div>
          <form onSubmit={addUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Brukernavn *</label>
                <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  data-testid="new-user-username" placeholder="brukernavn"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Passord *</label>
                <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  data-testid="new-user-password" placeholder="Passord"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fullt navn</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  data-testid="new-user-name" placeholder="Fullt navn"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" data-testid="save-user-btn" disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                <Check className="w-4 h-4" /> {saving ? 'Oppretter...' : 'Opprett'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setError(''); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">Avbryt</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {users.map(u => {
          const isSelf = u.id === currentUser?.id;
          const isProtectedAdmin = u.username === 'admin';
          const canModify = !isProtectedAdmin || isSelf;
          const isEditing = editingId === u.id;

          if (isEditing) {
            return (
              <Card key={u.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-gray-900">Rediger bruker</p>
                  <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={saveEditUser} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Brukernavn *</label>
                      <input type="text" required value={editForm.username}
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nytt passord</label>
                      <input type="password" value={editForm.password} placeholder="La stå tom for å la passord være uendret"
                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fullt navn</label>
                      <input type="text" value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  {editError && <p className="text-red-600 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{editError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                      <Check className="w-4 h-4" /> {saving ? 'Lagrer...' : 'Lagre'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}
                      className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">Avbryt</button>
                  </div>
                </form>
              </Card>
            );
          }

          return (
            <Card key={u.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-800 font-bold">{(u.name || u.username || '?')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{u.username}</p>
                      <Badge color="amber">{u.role}</Badge>
                      {isSelf && <Badge color="green">deg</Badge>}
                    </div>
                    {u.name && <p className="text-xs text-gray-400">{u.name}</p>}
                  </div>
                </div>
                {canModify && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEditUser(u)}
                      className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!isSelf && <DeleteButton onConfirm={() => delUser(u.id)} />}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {users.length === 0 && <EmptyState icon={Users} title="Ingen brukere" body="Ingen brukere funnet." />}
      </div>
    </div>
  );
}

// ════════════════════════════════
// ACTIVITY LOG TAB (kun hovedadmin)
// ════════════════════════════════
function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api('/api/activity-log')
      .then(r => r.ok ? r.json() : [])
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const formatTime = (iso) => new Date(iso).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <SectionHeader
        title="Logg"
        description="Se hva andre brukere har endret på nettsiden"
      />
      {loading && <p className="text-sm text-gray-400">Laster...</p>}
      {!loading && logs.length === 0 && (
        <EmptyState icon={Clock} title="Ingen aktivitet ennå" body="Endringer andre brukere gjør på nettsiden vises her." />
      )}
      {!loading && logs.length > 0 && (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-800 font-bold text-xs">{(log.name || log.username || '?')[0].toUpperCase()}</span>
                </div>
                <p className="text-sm text-gray-900 min-w-0 truncate">
                  <span className="font-semibold">{log.name || log.username}</span>{' '}
                  {log.action}
                  {log.target && <span className="text-gray-500"> — {log.target}</span>}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{formatTime(log.created_at)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════
// TEXT TAB
// ════════════════════════════════
const TEXT_DEFAULTS = {
  hero_subheading:  'Sportsstue i hjertet av Lillomarka',
  hero_description: 'Hjemmelaget surdeig, peiskos og frisk skogsluft — velkommen inn!',
  about_title:  'Velkommen til Linderudkollen',
  about_p0: 'Linderudkollen Sportsstue ligger sørvest i Lillomarka, og er et sentralt utgangspunkt for turer i området. Stedet har en lang historie — Linderudkollen var en av de siste stølene i Akersdalen, og driften ble lagt ned omkring 1930.',
  about_p1: 'På selveste Valentinsdagen 2026 gjenåpnet sportsstuen med nye bestyrere: Martina og Fritz. De møttes i sin tid på Ullevålseter — hun som ansatt, han som gjest — og deler en felles kjærlighet til marka og god, hjemmelaget mat.',
  about_p2: 'Stua er nyoppgradert med storkjøkken, nye kaffemaskiner og nyrestaurerte møbler. Enten du kommer til fots, på ski, sykkel eller med barnevogn — dørene står åpne for alle.',
  about_feat_0_title: 'Surdeigsbakst',   about_feat_0_desc: 'Hjertet på kjøkkenet — påsmurt brød eller ta med hjem',
  about_feat_1_title: 'Gjenåpnet 2026',  about_feat_1_desc: 'Nyoppgradert stue med nytt storkjøkken og interiør',
  about_feat_2_title: 'Plass til alle',  about_feat_2_desc: 'Familier, turgjengere, barnevogner — alle er velkomne',
  about_feat_3_title: 'Lillomarka',      about_feat_3_desc: 'Lett tilgjengelig med stor parkeringsplass hele året',
  act_title:    'Aktiviteter & Fasiliteter',
  act_subtitle: 'Mer enn bare en kafé',
  act_0_title: 'Peiskos',               act_0_desc: 'Sett deg godt til rette foran peisen med en kopp kakao',
  act_1_title: 'Strikkekafé',           act_1_desc: 'Bli med på strikkekafé i hyggelige omgivelser',
  act_2_title: 'Skogskontor',           act_2_desc: 'Jobb hjemmefra — eller rettere sagt, fra skogen!',
  act_3_title: 'Familievennlig',        act_3_desc: 'Barnekrok og barsel-sone — vi tar godt imot de minste og nybakte foreldre',
  act_4_title: 'Glutenfrie alternativer', act_4_desc: 'Vi tilbyr glutenfrie alternativer på mye av menyen — spør oss gjerne!',
  act_5_title: 'Uteområde',             act_5_desc: 'Hent maten inne og nyt den i sola på våre fine uteområder — perfekt etter en tur i marka',
  contact_phone:     '944 78 021',
  contact_phone_raw: '94478021',
  contact_email:     'mmercellova@gmail.com',
  contact_facebook:  'https://www.facebook.com/profile.php?id=100057194900966',
  arr_hero_eyebrow: 'Linderudkollen Sportsstue',
  arr_hero_title:   'Feir det hos oss',
  arr_hero_subtitle: 'Konfirmasjon, bursdag, dåp, jubileum — vi er åpne for alt og hjelper deg lage en dag å huske.',
  arr_events_title:    'Passer for alle anledninger',
  arr_events_subtitle: 'Vi er åpne for alle typer arrangement — stort som smått, formelt som uformelt.',
  arr_event_0_title: 'Konfirmasjon',          arr_event_0_desc: 'En stor dag fortjener de beste rammene. Vi hjelper deg lage en feiring konfirmanten sent vil glemme.',
  arr_event_1_title: 'Bursdag',               arr_event_1_desc: 'Feir dagen med nære og kjære i koselige omgivelser midt i Lillomarka.',
  arr_event_2_title: 'Dåp',                   arr_event_2_desc: 'Feir den nye livets ankomst med familie og venner i trygge og varme omgivelser.',
  arr_event_3_title: 'Jubileum',              arr_event_3_desc: 'Marker en milepæl — 30, 50, 60 år — på en uforglemmelig og avslappet måte.',
  arr_event_4_title: 'Selskap & Sammenkomst', arr_event_4_desc: 'Enten det er en liten familiesamling eller en større fest — vi tilpasser oss dere.',
  arr_event_5_title: 'Bedrift & Team',        arr_event_5_desc: 'Kick-off, teamlunsj eller julebord? Gi kollegene et minne fra naturen.',
  arr_offer_title: 'Hva vi tilbyr',
  arr_offer_intro: 'På Linderudkollen Sportsstue får dere mer enn bare mat og lokaler — dere får en opplevelse i hjertet av Lillomarka. Vi tilpasser oss dere, og sørger for at alt føles spesielt.',
  arr_offer_0: 'Hjemmelaget mat tilpasset anledningen',
  arr_offer_1: 'Peiskos og varme omgivelser innendørs',
  arr_offer_2: 'Fint uteområde i sola for de fine dagene',
  arr_offer_3: 'Lett tilgjengelig med stor parkeringsplass',
  arr_offer_4: 'Tilpasser oss ditt selskap og dine ønsker',
  arr_offer_5: 'Perfekt for grupper av alle størrelser',
  arr_badge_title: 'Gjenåpnet 2026',
  arr_badge_sub:   'Ny kjøkken, nye minner',
  arr_gallery_title: 'Stemning og omgivelser',
  arr_contact_title: 'La oss lage noe spesielt',
  arr_contact_desc:  'Har dere et arrangement i tankene? Ta kontakt — så finner vi ut av det sammen. Vi svarer raskt og hjelper gjerne med alt fra meny til praktiske detaljer.',
};

function TextTab() {
  const [texts, setTexts] = useState({ ...TEXT_DEFAULTS });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/site-text')
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data && Object.keys(data).length) setTexts(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  const set = (key, value) => setTexts(prev => ({ ...prev, [key]: value }));

  const saveAll = async () => {
    setSaving(true);
    try {
      const r = await api('/api/site-text', { method: 'PUT', body: JSON.stringify({ texts }) });
      if (r.ok) { invalidateSiteTextCache(); toast.success('Tekster lagret'); }
      else toast.error('Lagring feilet');
    } catch { toast.error('Nettverksfeil'); }
    setSaving(false);
  };

  const Field = ({ label, textKey, multiline = false, rows = 3 }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea value={texts[textKey] ?? ''} onChange={e => set(textKey, e.target.value)} rows={rows}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400 resize-y" />
      ) : (
        <input type="text" value={texts[textKey] ?? ''} onChange={e => set(textKey, e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-400" />
      )}
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Tekst"
        description="Rediger all tekst som vises på nettsiden — lagres og vises umiddelbart"
        action={
          <button onClick={saveAll} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            <Save className="w-4 h-4" />
            {saving ? 'Lagrer...' : 'Lagre alt'}
          </button>
        }
      />

      <div className="space-y-5">
        {/* Forsiden */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Forsiden</p>
          <div className="space-y-3">
            <Field label="Undertittel (under logoet)" textKey="hero_subheading" />
            <Field label="Beskrivelse" textKey="hero_description" />
          </div>
        </Card>

        {/* Om oss */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Om oss</p>
          <div className="space-y-3">
            <Field label="Overskrift" textKey="about_title" />
            <Field label="Avsnitt 1" textKey="about_p0" multiline rows={4} />
            <Field label="Avsnitt 2" textKey="about_p1" multiline rows={4} />
            <Field label="Avsnitt 3" textKey="about_p2" multiline rows={4} />
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-400 mb-3">Høydepunktkort (4 stk)</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <Field label={`Kort ${i + 1} — tittel`} textKey={`about_feat_${i}_title`} />
                    <Field label="Tekst" textKey={`about_feat_${i}_desc`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Aktiviteter */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Aktiviteter & Fasiliteter</p>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Overskrift" textKey="act_title" />
              <Field label="Undertittel" textKey="act_subtitle" />
            </div>
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-400 mb-3">Aktivitetskort (6 stk)</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <Field label={`Kort ${i + 1} — tittel`} textKey={`act_${i}_title`} />
                    <Field label="Tekst" textKey={`act_${i}_desc`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Kontaktinfo */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Kontaktinfo</p>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Telefon (visning, f.eks. 944 78 021)" textKey="contact_phone" />
              <Field label="Telefon (ring-lenke, kun siffer, f.eks. 94478021)" textKey="contact_phone_raw" />
            </div>
            <Field label="E-postadresse" textKey="contact_email" />
            <Field label="Facebook-lenke" textKey="contact_facebook" />
          </div>
        </Card>

        {/* Arrangement */}
        <Card className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Arrangement</p>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Hero</p>
            <Field label="Liten tekst over tittel" textKey="arr_hero_eyebrow" />
            <Field label="Tittel" textKey="arr_hero_title" />
            <Field label="Undertekst" textKey="arr_hero_subtitle" multiline />

            <div className="pt-2">
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <Field label="Overskrift — anledninger" textKey="arr_events_title" />
                <Field label="Undertittel — anledninger" textKey="arr_events_subtitle" />
              </div>
              <p className="text-xs font-semibold text-gray-400 mb-3">Arrangementtyper (6 stk)</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <Field label={`Kort ${i + 1} — tittel`} textKey={`arr_event_${i}_title`} />
                    <Field label="Tekst" textKey={`arr_event_${i}_desc`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Field label="Overskrift — hva vi tilbyr" textKey="arr_offer_title" />
              <div className="pt-2">
                <Field label="Innledning" textKey="arr_offer_intro" multiline />
              </div>
              <p className="text-xs font-semibold text-gray-400 mb-3 mt-3">Tilbudspunkter (6 stk)</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <Field key={i} label={`Punkt ${i + 1}`} textKey={`arr_offer_${i}`} />
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pt-3">
                <Field label="Badge — tittel (f.eks. «Gjenåpnet 2026»)" textKey="arr_badge_title" />
                <Field label="Badge — undertekst" textKey="arr_badge_sub" />
              </div>
            </div>

            <div className="pt-2">
              <Field label="Overskrift — galleri" textKey="arr_gallery_title" />
            </div>

            <div className="pt-2">
              <Field label="Overskrift — kontakt-CTA" textKey="arr_contact_title" />
              <div className="pt-2">
                <Field label="Beskrivelse — kontakt-CTA" textKey="arr_contact_desc" multiline />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════
// SIDEBAR
// ════════════════════════════════
function Sidebar({ tab, setTab, user, logout, navigate, mobileOpen, setMobileOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Oversikt',    Icon: LayoutDashboard },
    { id: 'menu',      label: 'Meny',        Icon: UtensilsCrossed },
    { id: 'blog',      label: 'Blogg',       Icon: BookOpen        },
    { id: 'images',    label: 'Bilder',      Icon: Image           },
    { id: 'text',      label: 'Tekst',       Icon: Type            },
    { id: 'hours',     label: 'Åpningstider',Icon: Clock           },
    { id: 'users',     label: 'Brukere',     Icon: Users           },
    ...(user?.username === 'admin' ? [{ id: 'log', label: 'Logg', Icon: History }] : []),
  ];

  const SidebarContent = ({ onSelect }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <img
          src="/logo.png"
          alt="Linderudkollen Sportsstue"
          className="h-10 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span className="text-amber-400/60 text-[10px] font-bold uppercase tracking-widest self-end pb-1">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, Icon, badge }) => (
          <button key={id} data-testid={`admin-tab-${id}`} onClick={() => onSelect(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:bg-white/8 hover:text-white/80'
            }`}>
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {badge > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User + actions */}
      <div className="px-4 py-4 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{(user?.name || user?.username || 'A')[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name || user?.username}</p>
            <p className="text-white/40 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 text-sm transition-colors mb-1">
          <ArrowLeft className="w-4 h-4" /> Til nettsiden
        </button>
        <button onClick={async () => { await logout(); navigate('/admin/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Logg ut
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[240px] bg-amber-950 z-30">
        <SidebarContent onSelect={setTab} />
      </aside>

      {/* Mobile sidebar portal */}
      {mobileOpen && createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[240px] bg-amber-950 flex flex-col">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onSelect={(id) => { setTab(id); setMobileOpen(false); }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ════════════════════════════════
// BLOG TAB
// ════════════════════════════════
const BLOG_CATEGORIES = ['Nyheter', 'Galleri', 'Om oss', 'Samarbeid'];
const BLOG_CAT_COLORS = {
  Nyheter:    'bg-amber-100 text-amber-800',
  Galleri:    'bg-blue-50 text-blue-700',
  'Om oss':   'bg-green-50 text-green-700',
  Samarbeid:  'bg-rose-50 text-rose-700',
};

function BlogTab() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null); // null | 'new' | post object
  const [form, setForm]         = useState({ title: '', body: '', is_published: false, category: 'Nyheter' });
  const [saving, setSaving]     = useState(false);
  const [imgFile, setImgFile]   = useState(null);
  const imgRef = useRef(null);

  const load = () => {
    setLoading(true);
    api('/api/blog?include_drafts=true')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const startNew = () => {
    setForm({ title: '', body: '', is_published: false, category: 'Nyheter' });
    setImgFile(null);
    setEditing('new');
  };

  const startEdit = (post) => {
    setForm({ title: post.title, body: post.body, is_published: post.is_published, category: post.category || 'Nyheter' });
    setImgFile(null);
    setEditing(post);
  };

  const uploadImage = async (postId) => {
    if (!imgFile) return;
    const fd = new FormData();
    fd.append('file', imgFile);
    await fetch(`${API_URL}/api/blog/${postId}/image`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: fd,
    });
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error('Tittel mangler'); return; }
    setSaving(true);
    try {
      let postId;
      if (editing === 'new') {
        const r = await api('/api/blog', { method: 'POST', body: JSON.stringify(form) });
        if (!r.ok) throw new Error();
        const created = await r.json();
        postId = created.id;
      } else {
        const r = await api(`/api/blog/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        if (!r.ok) throw new Error();
        postId = editing.id;
      }
      await uploadImage(postId);
      toast.success(editing === 'new' ? 'Innlegg opprettet' : 'Innlegg oppdatert');
      setEditing(null);
      load();
    } catch {
      toast.error('Noe gikk galt');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post) => {
    await api(`/api/blog/${post.id}`, { method: 'PUT', body: JSON.stringify({ is_published: !post.is_published }) });
    load();
  };

  const deletePost = async (postId) => {
    await api(`/api/blog/${postId}`, { method: 'DELETE' });
    toast.success('Innlegg slettet');
    load();
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });

  // Build preview image URL: local file > existing upload > none
  const previewImgUrl = imgFile
    ? URL.createObjectURL(imgFile)
    : (editing !== 'new' && editing?.image_url ? `${API_URL}${editing.image_url}` : null);

  const previewBody = form.body
    ? (form.body.length > 300 ? form.body.slice(0, 300).trimEnd() + '…' : form.body)
    : 'Teksten din vises her…';

  if (editing !== null) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {editing === 'new' ? 'Nytt innlegg' : 'Rediger innlegg'}
          </h2>
        </div>

        <div className="grid xl:grid-cols-2 gap-6 items-start">
          {/* Form */}
          <Card className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tittel</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Overskrift på innlegget"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tekst</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Skriv innholdet her…"
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bilde (valgfritt)</label>
              <input ref={imgRef} type="file" accept="image/*" className="hidden"
                onChange={e => setImgFile(e.target.files[0] || null)} />
              <div className="flex items-center gap-3">
                <button onClick={() => imgRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  <Upload className="w-4 h-4" /> Velg bilde
                </button>
                {imgFile && <span className="text-sm text-gray-500 truncate max-w-[180px]">{imgFile.name}</span>}
                {!imgFile && editing !== 'new' && editing?.image_url && (
                  <span className="text-sm text-green-600">Bilde allerede lastet opp</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                {BLOG_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_published ? 'bg-amber-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_published ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {form.is_published ? 'Publisert (synlig på siden)' : 'Utkast (ikke synlig)'}
              </span>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                <Save className="w-4 h-4" /> {saving ? 'Lagrer…' : 'Lagre'}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
                Avbryt
              </button>
            </div>
          </Card>

          {/* Live preview */}
          <div className="xl:sticky xl:top-20">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Forhåndsvisning</p>
            <div className="bg-[#f0e8d8] rounded-2xl p-4">
              <article className="bg-[#faf5ee] border border-[#d8ccb4] rounded-3xl overflow-hidden shadow-sm">
                {previewImgUrl ? (
                  <img src={previewImgUrl} alt="" className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                    <img src="/logo.png" alt="" className="h-10 w-auto opacity-25"
                      style={{ filter: 'brightness(0) invert(1)' }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="flex items-center gap-1 text-amber-700 text-xs font-semibold uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {form.is_published && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">Siste nytt</span>
                    )}
                    {form.category && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border border-transparent ${BLOG_CAT_COLORS[form.category] || 'bg-gray-100 text-gray-600'}`}>
                        {form.category}
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-lg font-bold text-gray-900 mb-2 leading-snug"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {form.title || <span className="text-gray-300 italic font-normal">Overskrift…</span>}
                  </h3>
                  <div className="w-8 h-0.5 bg-amber-700 mb-3" />
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${form.body ? 'text-gray-600' : 'text-gray-300 italic'}`}>
                    {previewBody}
                  </p>
                  {!form.is_published && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">
                      <EyeOff className="w-3 h-3" /> Utkast — ikke synlig på siden
                    </div>
                  )}
                </div>
              </article>
              <p className="text-xs text-gray-400 mt-3 text-center">Slik ser innlegget ut på blogg-siden</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Blogg & nyheter"
        description="Legg ut oppdateringer, bilder og nyheter fra sportsstua"
        action={
          <button onClick={startNew}
            className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Nytt innlegg
          </button>
        }
      />

      {loading && <div className="text-center py-12 text-gray-400">Laster…</div>}

      {!loading && posts.length === 0 && (
        <EmptyState icon={BookOpen} title="Ingen innlegg ennå" body="Klikk 'Nytt innlegg' for å komme i gang." />
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className="p-4 flex items-start gap-4">
              {post.image_url && (
                <img
                  src={`${API_URL}${post.image_url}`}
                  alt=""
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 leading-snug">{post.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {post.category && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BLOG_CAT_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                          {post.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge color={post.is_published ? 'green' : 'gray'}>
                    {post.is_published ? 'Publisert' : 'Utkast'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{post.body}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button title={post.is_published ? 'Gjør til utkast' : 'Publiser'}
                  onClick={() => togglePublish(post)}
                  className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                  {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(post)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <DeleteButton onConfirm={() => deletePost(post.id)} small />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════
// MAIN
// ════════════════════════════════
const tabLabels = {
  dashboard: 'Oversikt', images: 'Bilder', menu: 'Meny',
  hours: 'Åpningstider', users: 'Brukere', blog: 'Blogg', text: 'Tekst', log: 'Logg',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabComponents = {
    dashboard: <DashboardTab onNavigate={setTab} />,
    images:    <ImagesTab />,
    menu:      <MenuTab />,
    hours:     <OpeningHoursTab />,
    users:     <UsersTab />,
    blog:      <BlogTab />,
    text:      <TextTab />,
    log:       <ActivityLogTab />,
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <Sidebar
        tab={tab} setTab={setTab}
        user={user} logout={logout} navigate={navigate}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
      />

      {/* Content area */}
      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 h-16 flex items-center px-5 gap-4">
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
              {tabLabels[tab]}
            </p>
          </div>
          <div />
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 max-w-5xl w-full mx-auto">
          {tabComponents[tab]}
        </main>
      </div>
    </div>
  );
}
