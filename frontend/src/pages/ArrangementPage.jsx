import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cake, Heart, Baby, Users, Briefcase, Star,
  Utensils, Flame, Sun, MapPin, Phone, Mail,
  ArrowRight, ChevronRight, ChevronLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { siteInfo } from '../data/mock';
import { useSiteImages } from '../hooks/useSiteImages';
import { useSiteText } from '../hooks/useSiteText';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { getSlides } from '../lib/db';

const DEFAULT_SLIDES = [
  'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1920&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&q=80',
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1920&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
];

const eventTypes = [
  { icon: <Heart className="w-6 h-6" />,    title: 'Konfirmasjon',          desc: 'En stor dag fortjener de beste rammene. Vi hjelper deg lage en feiring konfirmanten sent vil glemme.' },
  { icon: <Cake className="w-6 h-6" />,     title: 'Bursdag',               desc: 'Feir dagen med nære og kjære i koselige omgivelser midt i Lillomarka.' },
  { icon: <Baby className="w-6 h-6" />,     title: 'Dåp',                   desc: 'Feir den nye livets ankomst med familie og venner i trygge og varme omgivelser.' },
  { icon: <Star className="w-6 h-6" />,     title: 'Jubileum',              desc: 'Marker en milepæl — 30, 50, 60 år — på en uforglemmelig og avslappet måte.' },
  { icon: <Users className="w-6 h-6" />,    title: 'Selskap & Sammenkomst', desc: 'Enten det er en liten familiesamling eller en større fest — vi tilpasser oss dere.' },
  { icon: <Briefcase className="w-6 h-6" />, title: 'Bedrift & Team',       desc: 'Kick-off, teamlunsj eller julebord? Gi kollegene et minne fra naturen.' },
];

const offers = [
  { icon: <Utensils className="w-4 h-4" />, text: 'Hjemmelaget mat tilpasset anledningen' },
  { icon: <Flame className="w-4 h-4" />,    text: 'Peiskos og varme omgivelser innendørs' },
  { icon: <Sun className="w-4 h-4" />,      text: 'Fint uteområde i sola for de fine dagene' },
  { icon: <MapPin className="w-4 h-4" />,   text: 'Lett tilgjengelig med stor parkeringsplass' },
  { icon: <Heart className="w-4 h-4" />,    text: 'Tilpasser oss ditt selskap og dine ønsker' },
  { icon: <Users className="w-4 h-4" />,    text: 'Perfekt for grupper av alle størrelser' },
];

const heroDefaults = {
  eyebrow: 'Linderudkollen Sportsstue',
  title: 'Feir det hos oss',
  subtitle: 'Konfirmasjon, bursdag, dåp, jubileum — vi er åpne for alt og hjelper deg lage en dag å huske.',
};
const eventsHeaderDefaults = {
  title: 'Passer for alle anledninger',
  subtitle: 'Vi er åpne for alle typer arrangement — stort som smått, formelt som uformelt.',
};
const offerDefaults = {
  title: 'Hva vi tilbyr',
  intro: 'På Linderudkollen Sportsstue får dere mer enn bare mat og lokaler — dere får en opplevelse i hjertet av Lillomarka. Vi tilpasser oss dere, og sørger for at alt føles spesielt.',
  badgeTitle: 'Gjenåpnet 2026',
  badgeSub: 'Ny kjøkken, nye minner',
};
const galleryDefaults = { title: 'Stemning og omgivelser' };
const contactDefaults = {
  title: 'La oss lage noe spesielt',
  desc: 'Har dere et arrangement i tankene? Ta kontakt — så finner vi ut av det sammen. Vi svarer raskt og hjelper gjerne med alt fra meny til praktiske detaljer.',
};

const gallerySlots = [
  { id: 'arrangement_galleri_1', alt: 'Hyggelig borddekning',   fallback: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
  { id: 'arrangement_galleri_2', alt: 'Festlig sammenkomst',    fallback: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80' },
  { id: 'arrangement_galleri_3', alt: 'Bursdagsfeiring',        fallback: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80' },
  { id: 'arrangement_galleri_4', alt: 'Hjemmelaget mat',        fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80' },
];

const INTERVAL_MS = 5000;

const ArrangementPage = () => {
  const navigate = useNavigate();
  const { img } = useSiteImages();
  const { t } = useSiteText();
  useDocumentMeta(
    'Arrangement | Linderudkollen Sportsstue',
    'Feir konfirmasjon, bursdag, dåp eller bedriftsfest hos Linderudkollen Sportsstue — hjemmelaget mat og peiskos midt i Lillomarka.'
  );
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getSlides()
      .then(data => {
        if (cancelled) return;
        const urls = (Array.isArray(data) ? data : []).map(s => s.url).filter(Boolean);
        if (urls.length > 0) {
          setSlides(urls);
          setCurrent(0);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const total = slides.length;

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % total);
    }, INTERVAL_MS);
  };

  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, [total]);

  const goTo = (idx) => {
    setCurrent((idx + total) % total);
    startAutoPlay();
  };

  const scrollToContact = () => {
    document.getElementById('arrangement-kontakt')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f0e8d8]">
      <Navbar />

      {/* ── Hero carousel ── */}
      <div className="relative h-[70vh] min-h-[520px] flex items-center justify-center overflow-hidden">

        {/* Slides */}
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

        {/* Left arrow */}
        <button
          onClick={() => goTo(current - 1)}
          aria-label="Forrige bilde"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/30 hover:bg-black/55 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => goTo(current + 1)}
          aria-label="Neste bilde"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/30 hover:bg-black/55 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p className="text-amber-200 text-sm font-semibold uppercase tracking-widest mb-4">
            {t('arr_hero_eyebrow', heroDefaults.eyebrow)}
          </p>
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            {t('arr_hero_title', heroDefaults.title)}
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            {t('arr_hero_subtitle', heroDefaults.subtitle)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg transition-all"
            >
              Ta kontakt <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-8 py-3.5 rounded-full backdrop-blur-sm border border-white/30 transition-all"
            >
              Tilbake til forsiden
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Bilde ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/45 w-2 hover:bg-white/70'}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-8 animate-bounce z-20 hidden md:block">
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Event types ── */}
      <section className="py-20 bg-[#f0e8d8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t('arr_events_title', eventsHeaderDefaults.title)}
            </h2>
            <div className="w-24 h-1 bg-amber-700 mx-auto mb-5" />
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              {t('arr_events_subtitle', eventsHeaderDefaults.subtitle)}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {eventTypes.map((e, i) => (
              <div
                key={i}
                className="bg-[#faf5ee] border border-[#d8ccb4] rounded-3xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#e8dcc8] text-amber-700 rounded-2xl flex items-center justify-center mb-5">
                  {e.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t(`arr_event_${i}_title`, e.title)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(`arr_event_${i}_desc`, e.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we offer + image ── */}
      <section className="py-20 bg-[#e8dcc8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h2
                className="text-4xl font-bold text-gray-900 mb-5"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t('arr_offer_title', offerDefaults.title)}
              </h2>
              <div className="w-16 h-1 bg-amber-700 mb-8" />
              <p className="text-gray-600 mb-8 leading-relaxed">
                {t('arr_offer_intro', offerDefaults.intro)}
              </p>
              <ul className="space-y-4 mb-10">
                {offers.map((o, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-[#faf5ee] border border-[#d8ccb4] text-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      {o.icon}
                    </div>
                    <span className="text-gray-700 font-medium">{t(`arr_offer_${i}`, o.text)}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={scrollToContact}
                className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-7 py-3.5 rounded-full shadow-md transition-all"
              >
                Spør oss <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              {img('arrangement_tilbyr', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80') && (
                <img
                  src={img('arrangement_tilbyr', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80')}
                  alt="Hyggelig interiør"
                  loading="lazy"
                  className="w-full h-[480px] object-cover rounded-3xl shadow-2xl"
                />
              )}
              <div className="absolute -bottom-5 -left-5 bg-[#faf5ee] rounded-2xl shadow-xl px-6 py-4 border border-[#d8ccb4]">
                <p className="text-amber-700 font-bold text-2xl">{t('arr_badge_title', offerDefaults.badgeTitle)}</p>
                <p className="text-gray-500 text-sm">{t('arr_badge_sub', offerDefaults.badgeSub)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="py-20 bg-[#f0e8d8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t('arr_gallery_title', galleryDefaults.title)}
            </h2>
            <div className="w-24 h-1 bg-amber-700 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallerySlots.map((slot, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border border-[#d8ccb4] shadow-sm ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              >
                {img(slot.id, slot.fallback) && (
                  <img
                    src={img(slot.id, slot.fallback)}
                    alt={slot.alt}
                    loading="lazy"
                    className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${i === 0 ? 'h-72 md:h-full' : 'h-48'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section id="arrangement-kontakt" className="py-24 bg-gradient-to-b from-amber-800 to-amber-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img
            src="/logo.png"
            alt="Linderudkollen"
            className="h-20 w-auto mx-auto mb-8 opacity-90"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('arr_contact_title', contactDefaults.title)}
          </h2>
          <p className="text-amber-200 text-lg mb-12 leading-relaxed max-w-xl mx-auto">
            {t('arr_contact_desc', contactDefaults.desc)}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <a
              href={`tel:${siteInfo.phoneRaw}`}
              className="flex items-center gap-4 p-5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl transition-colors text-left"
            >
              <div className="w-11 h-11 bg-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-0.5">Ring oss</p>
                <p className="text-white font-bold">{siteInfo.phone}</p>
              </div>
            </a>

            <a
              href={`mailto:${siteInfo.email}`}
              className="flex items-center gap-4 p-5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl transition-colors text-left"
            >
              <div className="w-11 h-11 bg-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-0.5">Send e-post</p>
                <p className="text-white font-bold break-all text-sm">{siteInfo.email}</p>
              </div>
            </a>
          </div>

          <p className="text-amber-300/60 text-sm mt-8">
            Bestyrere: <span className="text-amber-300">{siteInfo.owners}</span>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArrangementPage;
