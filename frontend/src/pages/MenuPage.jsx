import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Wheat, Soup, Leaf, CupSoda, UtensilsCrossed, Flame, Cake, Sandwich, Apple, Wine, Cookie, Pizza, Star, Sun, Gift } from 'lucide-react';
import { defaultMenuData, defaultMenuCategories } from '../data/mock';
import Navbar from '../components/Navbar';
import { useSiteImages } from '../hooks/useSiteImages';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getMenu } from '../lib/db';

const isWednesday = () => new Date().getDay() === 3;

const ICON_MAP = {
  coffee: Coffee, wheat: Wheat, soup: Soup, leaf: Leaf,
  'cup-soda': CupSoda, 'utensils-crossed': UtensilsCrossed,
  flame: Flame, cake: Cake, sandwich: Sandwich, apple: Apple,
  wine: Wine, cookie: Cookie, pizza: Pizza, star: Star, sun: Sun, gift: Gift,
};
const DEFAULT_ICON_KEYS = {
  'Bakst': 'wheat', 'Varm mat': 'soup', 'Drikke': 'coffee', 'Spesielt': 'leaf',
  'Middag': 'utensils-crossed', 'Varmmat': 'soup', 'Varmdrikke': 'coffee', 'Kalddrikke': 'cup-soda',
};

// ── Colors ─────────────────────────────────────────────────────────────────
const PARCHMENT = '#F2E6D0';
const CREAM     = '#FDF8EE';
const CRIMSON   = '#8B1A1A';
const CAMO      = '#6B7355';   // olive-grey green for prices and active state
const COPPER    = '#D4A878';
const WALNUT    = '#2C1A0E';
const SIENNA    = '#7A5C3A';
const DIVIDER   = '#E4D0B0';

export default function MenuPage() {
  const [menuData, setMenuData]             = useState(defaultMenuData);
  const [categoryOrder, setCategoryOrder]   = useState(defaultMenuCategories);
  const [activeCategory, setActiveCategory] = useState(defaultMenuCategories[0] || null);
  const [catIconMap, setCatIconMap]         = useState({});
  const observerRef = useRef(null);
  const { img } = useSiteImages();

  useDocumentMeta(
    'Meny | Linderudkollen Sportsstue',
    'Se hele menyen hos Linderudkollen Sportsstue — hjemmelaget surdeig, varm mat, drikke og glutenfrie alternativer i Lillomarka.'
  );

  useEffect(() => {
    let cancelled = false;
    getMenu()
      .then(data => {
        if (cancelled) return;
        if (data?.items) setMenuData({ items: data.items, categories: data.categories || {} });
        const cats = data?.categoryList;
        if (Array.isArray(cats) && cats.length) {
          const names = cats.map(c => c.name);
          setCategoryOrder(names);
          setActiveCategory(names[0]);
          const icons = {};
          cats.forEach(c => { if (c.icon) icons[c.name] = c.icon; });
          setCatIconMap(icons);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const getCatIcon = (name, size = 'sm') => {
    const key = catIconMap[name] || DEFAULT_ICON_KEYS[name] || 'utensils-crossed';
    const Icon = ICON_MAP[key] || UtensilsCrossed;
    return <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
  };

  useEffect(() => {
    if (!categoryOrder.length) return;
    observerRef.current = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveCategory(e.target.dataset.category); }),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    categoryOrder.forEach(cat => {
      const el = document.getElementById(`cat-${cat}`);
      if (el) observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [categoryOrder, menuData]);

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    const el = document.getElementById(`cat-${cat}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sortedCategories = menuData
    ? Object.keys(menuData.categories).sort((a, b) => {
        const ai = categoryOrder.indexOf(a), bi = categoryOrder.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    : [];

  return (
    <div className="min-h-screen" style={{ background: PARCHMENT }}>
      <Navbar />

      {/* ── Banner ── */}
      <div className="relative h-48 md:h-64 overflow-hidden" style={{ background: WALNUT }}>
        {img('menu_hero', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80') && (
          <img
            src={img('menu_hero', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80')}
            alt="Linderudkollen meny"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, rgba(44,26,14,0.55), rgba(44,26,14,0.2) 55%, ${PARCHMENT})` }}/>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-16">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 10px rgba(44,26,14,0.8)' }}>
            Meny
          </h1>
          <p className="mt-1.5 text-sm md:text-base drop-shadow" style={{ color: 'rgba(253,248,238,0.85)' }}>
            Alt laget fra bunnen, på huset
          </p>
        </div>
      </div>

      {/* ── Mobile category tabs ── */}
      {sortedCategories.length > 0 && (
        <div className="md:hidden sticky top-16 z-30 overflow-x-auto shadow-sm"
          style={{ background: PARCHMENT, borderBottom: `1.5px solid ${COPPER}` }}>
          <div className="px-3 flex gap-2 py-2.5 min-w-max">
            {sortedCategories.map(cat => {
              const active = activeCategory === cat;
              const isMiddag = cat === 'Middag';
              return (
                <button key={cat} onClick={() => scrollToCategory(cat)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
                  style={
                    active
                      ? { background: CAMO, color: CREAM, border: `1.5px solid ${CAMO}` }
                      : { background: CREAM, color: WALNUT, border: `1.5px solid ${COPPER}` }
                  }>
                  <span style={{ color: active ? 'rgba(220,240,180,0.85)' : CRIMSON }}>
                    {getCatIcon(cat)}
                  </span>
                  {cat}
                  {isMiddag && isWednesday() && (
                    <span className="w-2 h-2 rounded-full ml-0.5" style={{ background: CAMO }}/>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 md:flex md:gap-0">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:block w-56 lg:w-64 flex-shrink-0">
          <div className="sticky top-20 py-8 pr-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: CRIMSON }}>
              Kategorier
            </p>

            <nav className="space-y-0.5">
              {sortedCategories.map(cat => {
                const isMiddag = cat === 'Middag';
                const wednesday = isWednesday();
                const active = activeCategory === cat;
                return (
                  <React.Fragment key={cat}>
                    {isMiddag && (
                      <div className="pt-3 pb-1">
                        <div className="h-px mb-3" style={{ background: COPPER }}/>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CRIMSON }}>
                          Onsdagskvelden
                        </p>
                      </div>
                    )}
                    <button onClick={() => scrollToCategory(cat)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                      style={
                        active
                          ? { background: CAMO, color: CREAM, boxShadow: '0 2px 8px rgba(107,128,52,0.25)' }
                          : { color: WALNUT }
                      }>
                      <span style={{ color: active ? 'rgba(220,240,180,0.85)' : CRIMSON }}>
                        {getCatIcon(cat, 'lg')}
                      </span>
                      <span className="flex-1">{cat}</span>
                      {isMiddag && (
                        wednesday
                          ? <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: CAMO, color: CREAM }}>I kveld!</span>
                          : <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: CREAM, color: CRIMSON, border: `1px solid ${COPPER}` }}>Ons</span>
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>

            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${COPPER}` }}>
              <p className="text-xs leading-relaxed italic" style={{ color: SIENNA }}>
                "Alt laget fra bunnen,<br/>på huset."
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 pt-6 pb-16 md:pt-10 md:pb-10 md:border-l md:pl-8 lg:pl-12"
          style={{ borderColor: COPPER }}>

          {/* Skeleton */}
          {!menuData && (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-6 animate-pulse rounded-lg w-32 mb-4"
                    style={{ background: `${COPPER}55` }}/>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: CREAM, border: `1.5px solid ${COPPER}` }}>
                    {[1, 2, 3].map(j => (
                      <div key={j} className="flex justify-between items-center px-5 py-4"
                        style={{ borderTop: j > 1 ? `1px solid ${DIVIDER}` : undefined }}>
                        <div className="space-y-2">
                          <div className="h-4 animate-pulse rounded w-40" style={{ background: `${COPPER}44` }}/>
                          <div className="h-3 animate-pulse rounded w-60" style={{ background: `${COPPER}33` }}/>
                        </div>
                        <div className="h-6 animate-pulse rounded-full w-16" style={{ background: `${COPPER}44` }}/>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Category sections ── */}
          {sortedCategories.map(category => {
            const items = (menuData?.categories[category] || []).filter(i => i.is_available);
            if (!items.length) return null;

            return (
              <section key={category} id={`cat-${category}`} data-category={category}
                className="mb-10 scroll-mt-32 md:scroll-mt-24">

                {/* Section header */}
                {category === 'Middag' ? (
                  <div className="mb-4 rounded-2xl overflow-hidden"
                    style={{ border: `2px solid ${CRIMSON}` }}>
                    <div className="px-6 py-5" style={{ background: CRIMSON, color: CREAM }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <UtensilsCrossed className="w-5 h-5" style={{ color: 'rgba(253,220,220,0.9)' }}/>
                            <h2 className="text-xl lg:text-2xl font-bold"
                              style={{ fontFamily: "'Playfair Display', serif" }}>
                              Onsdagskveldens middag
                            </h2>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(253,248,238,0.8)' }}>
                            Hver onsdag — gryter og supper laget fra bunnen av ferske råvarer
                          </p>
                        </div>
                        {isWednesday()
                          ? <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full"
                              style={{ background: CAMO, color: CREAM }}>Åpent i kveld!</span>
                          : <span className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
                              style={{ background: 'rgba(253,248,238,0.15)', color: CREAM, border: '1px solid rgba(253,248,238,0.3)' }}>
                              Kun onsdager
                            </span>
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <span style={{ color: CRIMSON }}>{getCatIcon(category, 'lg')}</span>
                    <h2 className="text-xl lg:text-2xl font-bold"
                      style={{ fontFamily: "'Playfair Display', serif", color: WALNUT }}>
                      {category}
                    </h2>
                    <div className="flex-1 h-px ml-2" style={{ background: COPPER }}/>
                  </div>
                )}

                {/* Items */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: CREAM, border: `1.5px solid ${COPPER}` }}>
                  <div className="md:grid md:grid-cols-2">
                    {items.map((item, idx) => (
                      <div key={item.id}
                        className="flex items-start justify-between gap-4 px-5 py-4"
                        style={{
                          borderTop: idx !== 0 ? `1px solid ${DIVIDER}` : undefined,
                          borderLeft: idx % 2 === 1 ? `1px solid ${DIVIDER}` : undefined,
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold" style={{ color: WALNUT }}>{item.name}</p>
                          {item.description && (
                            <p className="text-sm mt-0.5 leading-snug" style={{ color: SIENNA }}>
                              {item.description}
                            </p>
                          )}
                          {item.allergens?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.allergens.map(a => (
                                <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: '#FEF0F0', color: CRIMSON, border: '1px solid #F0B8B8' }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.price != null ? (
                          <span className="flex-shrink-0 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap"
                            style={{ background: CAMO, color: CREAM }}>
                            {item.price},-
                          </span>
                        ) : (
                          <span className="flex-shrink-0 text-sm italic" style={{ color: '#A0896A' }}>
                            Spør oss
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {/* ── Footer ── */}
          {menuData && sortedCategories.length > 0 && (
            <>
              <p className="text-center text-sm italic mt-4 mb-6" style={{ color: SIENNA }}>
                Alt laget fra bunnen — på huset
              </p>
              <div className="rounded-2xl p-5" style={{ background: CREAM, border: `1.5px solid ${COPPER}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: CRIMSON }}>Allergener</p>
                <p className="text-sm leading-relaxed" style={{ color: SIENNA }}>
                  Allergener er merket under hvert menypunkt. Har du spørsmål om ingredienser eller allergier,
                  er du alltid velkommen til å spørre oss — vi hjelper deg gjerne å finne noe som passer.
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
