import React, { useState } from 'react';
import { Phone, Facebook, MapPin, Lock } from 'lucide-react';
import OpeningHours from '../components/OpeningHours';
import { siteInfo } from '../data/mock';
import { unlockSite } from '../lib/preview';

export default function ComingSoon() {
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (unlockSite(code)) { window.location.reload(); return; }
    setWrong(true);
    setCode('');
  };

  return (
    <div className="min-h-screen bg-[#f0e8d8] text-gray-900">
      <header className="relative overflow-hidden bg-amber-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/hero.jpg')" }} />
        <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
          <img src="/logo.png" alt="Linderudkollen Sportsstue" className="h-32 md:h-40 w-auto mx-auto mb-6 drop-shadow-2xl" style={{ filter: 'brightness(0) invert(1)' }} />
          <p className="text-amber-200 text-sm font-semibold uppercase tracking-[0.2em] mb-3">Sportsstue i Lillomarka</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif", textWrap: 'balance' }}>
            Nettsiden er snart ferdig
          </h1>
          <p className="text-lg text-amber-50/90 max-w-xl mx-auto leading-relaxed">
            I mellomtiden finner du åpningstidene våre her. Velkommen innom for hjemmelaget surdeig, kraftsuppe og peiskos!
          </p>
        </div>
      </header>

      <OpeningHours />

      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6 grid sm:grid-cols-3 gap-6 text-center">
          <a href={`tel:${siteInfo.phoneRaw}`} className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-amber-100 hover:border-amber-300 transition-colors">
            <Phone className="w-6 h-6 text-amber-700" />
            <span className="text-sm font-semibold text-gray-500">Ring oss</span>
            <span className="font-semibold">{siteInfo.phone}</span>
          </a>
          <a href={siteInfo.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-amber-100 hover:border-amber-300 transition-colors">
            <Facebook className="w-6 h-6 text-amber-700" />
            <span className="text-sm font-semibold text-gray-500">Følg oss</span>
            <span className="font-semibold">Facebook</span>
          </a>
          <div className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-amber-100">
            <MapPin className="w-6 h-6 text-amber-700" />
            <span className="text-sm font-semibold text-gray-500">Finn oss</span>
            <span className="font-semibold">Linderudkollen, Lillomarka</span>
            <span className="text-xs text-gray-400">Helårsvei og stor parkeringsplass</span>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-gray-500">
        <p className="mb-6">© {new Date().getFullYear()} Linderudkollen Sportsstue</p>
        <form onSubmit={submit} className="inline-flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-gray-300" />
          <input
            id="preview-code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => { setCode(e.target.value); setWrong(false); }}
            placeholder="Forhåndsvisning"
            aria-label="Kode for forhåndsvisning"
            className={`w-36 px-3 py-1.5 rounded-lg border text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 ${wrong ? 'border-red-300' : 'border-gray-200'}`}
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-xs font-semibold text-gray-600">Åpne</button>
        </form>
        {wrong && <p className="text-xs text-red-500 mt-2">Feil kode</p>}
      </footer>
    </div>
  );
}
