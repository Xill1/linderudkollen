import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, User, CheckCircle, Phone, Mail, MapPin, Clock, TreePine } from 'lucide-react';
import { siteInfo } from '../data/mock';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const today = new Date().toISOString().split('T')[0];

function FieldRow({ label, children, last }) {
  return (
    <div className={`px-4 py-3.5 ${!last ? 'border-b border-gray-100' : ''}`}>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ReservationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    date: '', time: '', guests: 2, message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const adjustGuests = (d) => setForm(f => ({ ...f, guests: Math.max(1, Math.min(50, f.guests + d)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, guests: Number(form.guests) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Noe gikk galt');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Success ── */
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reservasjon mottatt!
          </h2>
          <p className="text-gray-500 mb-2">Vi bekrefter snart via telefon eller e-post.</p>
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-2 inline-block mt-1 mb-7">
            {form.date} · kl. {form.time} · {form.guests} gjest{form.guests !== 1 ? 'er' : ''}
          </p>
          <button onClick={() => navigate('/')}
            className="block w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3.5 rounded-2xl transition-colors">
            Tilbake til forsiden
          </button>
          <button onClick={() => { setSuccess(false); setForm({ name:'', phone:'', email:'', date:'', time:'', guests:2, message:'' }); }}
            className="mt-3 block w-full text-gray-400 text-sm hover:text-gray-600 py-2 transition-colors">
            Ny reservasjon
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-amber-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <img src="/logo.png" alt="Linderudkollen Sportsstue" className="h-9 w-auto" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-500">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-widest">Reserver bord</span>
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 md:py-12 md:grid md:grid-cols-5 md:gap-12 lg:gap-16">

        {/* ── LEFT: Form ── */}
        <form id="reservation-form" onSubmit={handleSubmit} className="md:col-span-3">

          {/* Page title — desktop */}
          <div className="hidden md:block mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Reserver bord
            </h1>
            <p className="text-gray-500">Vi bekrefter reservasjonen din så fort vi kan.</p>
          </div>

          {/* Mobile title */}
          <div className="md:hidden mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              <CalendarDays className="w-6 h-6 text-amber-700" /> Reserver bord
            </h1>
          </div>

          <div className="space-y-5">
            {/* Tidspunkt */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                <CalendarDays className="w-3.5 h-3.5" /> Tidspunkt
              </h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <FieldRow label="Dato *">
                  <input type="date" required value={form.date} onChange={set('date')} min={today}
                    className="w-full text-gray-900 text-base bg-transparent border-0 p-0 focus:ring-0 focus:outline-none" />
                </FieldRow>
                <div className="flex">
                  <div className="flex-1 px-4 py-3.5 border-r border-gray-100">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Klokkeslett *
                    </label>
                    <input type="time" required value={form.time} onChange={set('time')}
                      className="w-full text-gray-900 text-base bg-transparent border-0 p-0 focus:ring-0 focus:outline-none" />
                  </div>
                  <div className="flex-1 px-4 py-3.5">
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      <Users className="w-3 h-3" /> Gjester *
                    </label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => adjustGuests(-1)}
                        className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 text-lg font-bold flex items-center justify-center hover:bg-amber-200 transition-colors select-none">−</button>
                      <span className="text-lg font-bold text-gray-900 w-5 text-center tabular-nums">{form.guests}</span>
                      <button type="button" onClick={() => adjustGuests(1)}
                        className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 text-lg font-bold flex items-center justify-center hover:bg-amber-200 transition-colors select-none">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Kontaktinfo */}
            <section>
              <h2 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                <User className="w-3.5 h-3.5" /> Dine opplysninger
              </h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <FieldRow label="Navn *">
                  <input type="text" required value={form.name} onChange={set('name')} placeholder="Ditt fulle navn"
                    className="w-full text-gray-900 text-base bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300" />
                </FieldRow>
                <FieldRow label="Telefon *">
                  <input type="tel" required value={form.phone} onChange={set('phone')} placeholder="900 00 000"
                    className="w-full text-gray-900 text-base bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300" />
                </FieldRow>
                <FieldRow label="E-post *" last>
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="din@epost.no"
                    className="w-full text-gray-900 text-base bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300" />
                </FieldRow>
              </div>
            </section>

            {/* Ønsker */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Spesielle ønsker
              </h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <textarea rows={3} value={form.message} onChange={set('message')}
                  placeholder="Allergier, høysetebehov, jubileum o.l. (valgfritt)"
                  className="w-full px-4 py-3.5 text-gray-900 text-base bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-300 resize-none" />
              </div>
            </section>

            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            {/* Desktop submit — inline */}
            <button type="submit" disabled={loading}
              className="hidden md:block w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors shadow-md">
              {loading ? 'Sender...' : 'Send reservasjon'}
            </button>
          </div>
        </form>

        {/* ── RIGHT: Info card (desktop only) ── */}
        <aside className="hidden md:block md:col-span-2">
          <div className="sticky top-24 space-y-4">

            {/* Amber info card */}
            <div className="bg-gradient-to-br from-amber-800 to-amber-900 rounded-3xl p-7 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/logo.png"
                  alt="Linderudkollen Sportsstue"
                  className="h-12 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                <div>
                  <p className="font-bold text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {siteInfo.fullName}
                  </p>
                  <p className="text-amber-300 text-sm">Lillomarka, Oslo</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <a href={`tel:${siteInfo.phoneRaw}`} className="text-sm hover:text-amber-200 transition-colors">
                    {siteInfo.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <a href={`mailto:${siteInfo.email}`} className="text-sm hover:text-amber-200 transition-colors break-all">
                    {siteInfo.email}
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-100">{siteInfo.address.line1}<br />{siteInfo.address.line2}</span>
                </div>
              </div>
            </div>

            {/* Opening hours */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Åpningstider
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { day: 'Mandag', hours: 'Stengt', closed: true },
                  { day: 'Tirsdag – Fredag', hours: '10:00 – 20:00' },
                  { day: 'Lørdag – Søndag', hours: '10:00 – 16:00' },
                ].map(({ day, hours, closed }) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-gray-600">{day}</span>
                    <span className={`font-medium ${closed ? 'text-red-400' : 'text-gray-900'}`}>{hours}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">Sjekk Facebook for eventuelle endringer</p>
            </div>

            {/* Note */}
            <p className="text-sm text-gray-400 text-center px-2">
              Vi bekrefter reservasjonen din via telefon eller e-post så snart som mulig.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky submit */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-30">
        <button
          type="submit"
          form="reservation-form"
          disabled={loading}
          className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-amber-200/50"
        >
          {loading ? 'Sender...' : 'Send reservasjon'}
        </button>
      </div>
    </div>
  );
}
