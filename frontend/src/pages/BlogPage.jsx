import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Newspaper, Image as ImageIcon, Users, Handshake, LayoutList, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const FOLD = 500;

const CATEGORIES = [
  { label: 'Alle',      icon: LayoutList, iconColor: '#8B7355' },
  { label: 'Nyheter',   icon: Newspaper,  iconColor: '#8B1A1A' },
  { label: 'Galleri',   icon: ImageIcon,  iconColor: '#1A5C8B' },
  { label: 'Om oss',    icon: Users,      iconColor: '#2D5016' },
  { label: 'Samarbeid', icon: Handshake,  iconColor: '#7A2D5C' },
];

const CAT_BADGE = {
  Nyheter:    'bg-red-50 text-red-800 border-red-200',
  Galleri:    'bg-blue-50 text-blue-700 border-blue-200',
  'Om oss':   'bg-green-50 text-green-700 border-green-200',
  Samarbeid:  'bg-purple-50 text-purple-700 border-purple-200',
};

function CategoryBadge({ label }) {
  if (!label || !CAT_BADGE[label]) return null;
  const CatIcon = CATEGORIES.find(c => c.label === label)?.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${CAT_BADGE[label]}`}>
      {CatIcon && <CatIcon className="w-3 h-3" />}
      {label}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function PostCard({ post, featured = false, onOpen }) {
  const long = post.body && post.body.length > FOLD;
  const bodyText = long ? post.body.slice(0, FOLD).trimEnd() + '…' : post.body;
  const hasImage = !!post.image_url;

  if (featured) {
    return (
      <article onClick={() => onOpen(post)}
        className="bg-[#faf5ee] border border-[#d8ccb4] rounded-3xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow">
        {hasImage && (
          <img src={`${API_URL}${post.image_url}`} alt={post.title}
            className="w-full h-72 md:h-80 object-cover" />
        )}
        {!hasImage && (
          <div className="w-full h-36 bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
            <img src="/logo.png" alt="" className="h-14 w-auto opacity-30"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.created_at)}
            </span>
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">Siste nytt</span>
            {post.category && <CategoryBadge label={post.category} />}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {post.title}
          </h2>
          <div className="w-10 h-1 bg-amber-700 mb-5" />
          <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">{bodyText}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-amber-700 font-semibold text-sm hover:text-amber-800 transition-colors">
            <ChevronDown className="w-4 h-4" /> Les hele innlegget
          </span>
        </div>
      </article>
    );
  }

  return (
    <article onClick={() => onOpen(post)}
      className="bg-[#faf5ee] border border-[#d8ccb4] rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      {hasImage && (
        <img src={`${API_URL}${post.image_url}`} alt={post.title}
          className="w-full h-48 object-cover" />
      )}
      {!hasImage && (
        <div className="w-full h-20 bg-gradient-to-br from-[#e8dcc8] to-[#d8ccb4] flex items-center justify-center">
          <img src="/logo.png" alt="" className="h-9 w-auto opacity-20" style={{ filter: 'brightness(0)' }} />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="w-3 h-3" />
            {formatDate(post.created_at)}
          </span>
          {post.category && <CategoryBadge label={post.category} />}
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {post.title}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{bodyText}</p>
        {long && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-amber-700 font-semibold text-sm hover:text-amber-800 transition-colors">
            <ChevronDown className="w-4 h-4" /> Les mer
          </span>
        )}
      </div>
    </article>
  );
}

function PostModal({ post, onClose }) {
  useEffect(() => {
    if (!post) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [post, onClose]);

  if (!post) return null;
  const hasImage = !!post.image_url;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 sm:py-14"
      onClick={onClose}>
      <article onClick={e => e.stopPropagation()}
        className="bg-[#faf5ee] border border-[#d8ccb4] rounded-3xl overflow-hidden shadow-xl w-full max-w-2xl relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow transition-colors">
          <X className="w-5 h-5" />
        </button>
        {hasImage ? (
          <img src={`${API_URL}${post.image_url}`} alt={post.title}
            className="w-full h-56 sm:h-80 object-cover" />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
            <img src="/logo.png" alt="" className="h-12 w-auto opacity-30"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
        )}
        <div className="p-6 md:p-9">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.created_at)}
            </span>
            {post.category && <CategoryBadge label={post.category} />}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {post.title}
          </h2>
          <div className="w-10 h-1 bg-amber-700 mb-5" />
          <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">{post.body}</p>
        </div>
      </article>
    </div>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [openPost, setOpenPost] = useState(null);

  useDocumentMeta(
    'Nyheter & oppdateringer | Linderudkollen Sportsstue',
    'Siste nytt, bilder og oppdateringer fra Linderudkollen Sportsstue i Lillomarka.'
  );

  useEffect(() => {
    fetch(`${API_URL}/api/blog`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Filter all posts by the active category, then pin the newest match on top
  const filtered = activeCategory === 'Alle'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  const latestPost = filtered[0] ?? null;
  const filteredRest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-[#f0e8d8]">
      <Navbar />

      {/* Banner */}
      <div className="relative h-48 md:h-60 overflow-hidden bg-[#e8dcc8]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-[#f0e8d8]" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            Nyheter & oppdateringer
          </h1>
          <p className="text-white/80 mt-1.5 text-sm md:text-base drop-shadow">Fra Linderudkollen Sportsstue</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* ── Category module buttons ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
          {CATEGORIES.map(({ label, icon: Icon, iconColor }) => {
            const isActive = activeCategory === label;
            return (
              <button key={label} onClick={() => setActiveCategory(label)}
                className={`flex flex-col items-center justify-center gap-2.5 py-5 px-2 rounded-2xl border-2 transition-all select-none ${
                  isActive
                    ? 'bg-[#deeaf6] shadow-md'
                    : 'bg-[#eaf3fb] border-[#bdd4e8] hover:bg-[#deeaf6] hover:border-[#9bbdd6] hover:shadow-sm'
                }`}
                style={isActive ? { borderColor: '#7aaecf', boxShadow: '0 4px 14px rgba(100,160,210,0.25)' } : {}}>
                <Icon
                  className="w-7 h-7 transition-colors"
                  style={{ color: isActive ? iconColor : '#b0a090' }}
                />
                <span className={`text-xs font-semibold text-center leading-tight transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-[#faf5ee] rounded-3xl border border-[#d8ccb4] overflow-hidden animate-pulse">
            <div className="h-56 bg-[#e8dcc8]" />
            <div className="p-7 space-y-4">
              <div className="h-3 bg-[#e8dcc8] rounded w-32" />
              <div className="h-7 bg-[#e8dcc8] rounded w-2/3" />
              <div className="h-3 bg-[#e8dcc8] rounded w-full" />
              <div className="h-3 bg-[#e8dcc8] rounded w-3/4" />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#e8dcc8] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-amber-700" />
            </div>
            <p className="text-gray-500 text-lg">Ingen innlegg ennå — kom tilbake snart!</p>
          </div>
        )}

        {/* No posts at all in this category */}
        {!loading && posts.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-base">
              Ingen innlegg i «{activeCategory}» ennå.{' '}
              <button onClick={() => setActiveCategory('Alle')}
                className="text-amber-700 font-semibold underline underline-offset-2">
                Vis alle
              </button>
            </p>
          </div>
        )}

        {/* ── Newest matching post ── */}
        {!loading && latestPost && (
          <>
            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {activeCategory === 'Alle' ? 'Siste innlegg' : `Nyeste i «${activeCategory}»`}
              </span>
              <div className="flex-1 h-px bg-[#d8ccb4]" />
            </div>
            <div className="mb-8">
              <PostCard post={latestPost} featured onOpen={setOpenPost} />
            </div>
          </>
        )}

        {/* ── Remaining matching posts ── */}
        {!loading && filteredRest.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#d8ccb4]" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                {activeCategory === 'Alle' ? 'Tidligere innlegg' : `Flere i «${activeCategory}»`}
              </span>
              <div className="flex-1 h-px bg-[#d8ccb4]" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {filteredRest.map(post => <PostCard key={post.id} post={post} onOpen={setOpenPost} />)}
            </div>
          </>
        )}
      </div>

      <Footer />
      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
    </div>
  );
}
