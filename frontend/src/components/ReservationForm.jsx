import React, { useState } from 'react';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const today = new Date().toISOString().split('T')[0];

const ReservationForm = () => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', date: '', time: '', guests: 2, message: '',
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
      setStatus('success');
      setForm({ name: '', phone: '', email: '', date: '', time: '', guests: 2, message: '' });
    } catch (err) {
      setError(err.message || 'Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reserver" data-testid="reservation-section" className="py-24 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-4">
            <CalendarDays className="w-12 h-12 text-amber-700" />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Reserver bord
          </h2>
          <div className="w-24 h-1 bg-amber-700 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bestill bord hos oss — vi bekrefter reservasjonen din så fort vi kan.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-xl border-none">
            {status === 'success' ? (
              <div data-testid="reservation-success" className="flex flex-col items-center py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Reservasjon mottatt!</h4>
                <p className="text-gray-600">Vi bekrefter snart via telefon eller e-post.</p>
                <Button
                  className="mt-6 bg-amber-700 hover:bg-amber-800 text-white"
                  onClick={() => setStatus(null)}
                >
                  Ny reservasjon
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
                    <input
                      data-testid="reservation-name"
                      type="text" required value={form.name} onChange={set('name')}
                      placeholder="Ditt navn"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input
                      data-testid="reservation-phone"
                      type="tel" required value={form.phone} onChange={set('phone')}
                      placeholder="944 78 021"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-post *</label>
                  <input
                    data-testid="reservation-email"
                    type="email" required value={form.email} onChange={set('email')}
                    placeholder="din@epost.no"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dato *</label>
                    <input
                      data-testid="reservation-date"
                      type="date" required value={form.date} onChange={set('date')} min={today}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Klokkeslett *</label>
                    <input
                      data-testid="reservation-time"
                      type="time" required value={form.time} onChange={set('time')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Antall gjester *</label>
                    <input
                      data-testid="reservation-guests"
                      type="number" required min={1} max={50} value={form.guests} onChange={set('guests')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spesielle ønsker <span className="text-gray-400 font-normal">(valgfritt)</span>
                  </label>
                  <textarea
                    data-testid="reservation-message"
                    rows={3} value={form.message} onChange={set('message')}
                    placeholder="Allergier, høysetebehov, jubileum o.l."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {error && (
                  <p data-testid="reservation-error" className="text-red-600 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  data-testid="reservation-submit"
                  disabled={loading}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 text-lg font-semibold"
                >
                  {loading ? 'Sender...' : 'Send reservasjon'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReservationForm;
